import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Professional flow (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let adminToken: string;

  const unique = () => `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
  const uniqueRegistrationNumber = () => String(Math.floor(Math.random() * 900_000_000) + 100_000_000);

  async function registerAndLogin(role?: 'USER' | 'HEALTH_PROFESSIONAL') {
    const email = `e2e_${unique()}@test.com`;
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ name: 'E2E User', email, password: 'senha123', ...(role && { role }) })
      .expect(201);
    return { token: res.body.accessToken as string, userId: res.body.user.id as string, email };
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
    await app.init();
    prisma = app.get(PrismaService);

    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'rafael.lima@hics.org.br', password: 'senha123' })
      .expect(200);
    adminToken = adminLogin.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects ADMIN at public registration', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ name: 'Nope', email: `e2e_${unique()}@test.com`, password: 'senha123', role: 'ADMIN' })
      .expect(400);
  });

  it('blocks content creation for an unverified professional', async () => {
    const { token } = await registerAndLogin('HEALTH_PROFESSIONAL');
    const res = await request(app.getHttpServer())
      .post('/api/v1/submissions')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'VIDEO', action: 'SAVE_DRAFT', payload: { title: 'x' } })
      .expect(403);
    expect(res.body.code).toBe('PROFESSIONAL_NOT_VERIFIED');
  });

  it('blocks USER and HEALTH_PROFESSIONAL from /admin/*', async () => {
    const user = await registerAndLogin('USER');
    const professional = await registerAndLogin('HEALTH_PROFESSIONAL');

    await request(app.getHttpServer())
      .get('/api/v1/admin/credentials')
      .set('Authorization', `Bearer ${user.token}`)
      .expect(403);

    await request(app.getHttpServer())
      .get('/api/v1/admin/credentials')
      .set('Authorization', `Bearer ${professional.token}`)
      .expect(403);
  });

  it('runs the full credential verification flow end to end', async () => {
    const { token } = await registerAndLogin('HEALTH_PROFESSIONAL');
    const registrationNumber = uniqueRegistrationNumber();

    await request(app.getHttpServer())
      .put('/api/v1/professionals/me/credential')
      .set('Authorization', `Bearer ${token}`)
      .send({ council: 'CRM', registrationNumber, uf: 'SP' })
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/v1/professionals/me/credential/document')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('fake-pdf-content'), { filename: 'doc.pdf', contentType: 'application/pdf' })
      .expect(201);

    const submitted = await request(app.getHttpServer())
      .post('/api/v1/professionals/me/credential/submit')
      .set('Authorization', `Bearer ${token}`)
      .expect(201);
    expect(submitted.body.status).toBe('PENDING');

    // Editing while PENDING is not allowed.
    await request(app.getHttpServer())
      .put('/api/v1/professionals/me/credential')
      .set('Authorization', `Bearer ${token}`)
      .send({ council: 'CRM', registrationNumber, uf: 'SP' })
      .expect(409);

    const pending = await request(app.getHttpServer())
      .get('/api/v1/admin/credentials?status=PENDING')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const profile = pending.body.find((p: { registrationNumber: string }) => p.registrationNumber === registrationNumber);
    expect(profile).toBeDefined();

    await request(app.getHttpServer())
      .post(`/api/v1/admin/credentials/${profile.id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);

    // Double-approving the same credential must not succeed twice.
    await request(app.getHttpServer())
      .post(`/api/v1/admin/credentials/${profile.id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(409);

    // The access token is stale until next login — fresh login picks up APPROVED.
    const relogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: (await prisma.user.findFirstOrThrow({ where: { professionalProfile: { id: profile.id } } })).email, password: 'senha123' })
      .expect(200);
    const payload = JSON.parse(Buffer.from(relogin.body.accessToken.split('.')[1], 'base64url').toString());
    expect(payload.credentialStatus).toBe('APPROVED');
  });

  it('rejects incomplete submissions with 422 and the expected missing labels', async () => {
    const { token } = await approvedProfessional();

    const res = await request(app.getHttpServer())
      .post('/api/v1/submissions')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'VIDEO', action: 'SUBMIT', payload: { title: 'Vídeo incompleto' } })
      .expect(422);

    expect(res.body.code).toBe('SUBMISSION_INVALID');
    expect(res.body.missing).toEqual(
      expect.arrayContaining(['Selecione uma categoria válida.', 'Informe um link de vídeo válido.', 'Informe a duração no formato mm:ss.', 'Selecione uma fonte oficial.']),
    );
  });

  it('saves an incomplete draft without validating completeness', async () => {
    const { token } = await approvedProfessional();

    const res = await request(app.getHttpServer())
      .post('/api/v1/submissions')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'VIDEO', action: 'SAVE_DRAFT', payload: {} })
      .expect(201);

    expect(res.body.status).toBe('DRAFT');
    expect(res.body.title).toBe('Sem título');
  });

  it('approves a full submission, materializes it, and keeps it out of public routes until then', async () => {
    const { token, userId } = await approvedProfessional();

    const title = `Luxação de dedo ${unique()}`;
    const created = await request(app.getHttpServer())
      .post('/api/v1/submissions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'EMERGENCY',
        action: 'SUBMIT',
        payload: {
          title,
          categorySlug: 'traumas',
          severity: 'MEDIUM',
          steps: ['Imobilize o dedo.', 'Aplique gelo.', 'Procure atendimento médico.'],
          dontDo: ['Tentar recolocar a articulação no lugar'],
          sourceLabel: 'Cruz Vermelha',
        },
      })
      .expect(201);
    const submissionId = created.body.id;

    // Not visible publicly while still in review.
    const searchBefore = await request(app.getHttpServer()).get(`/api/v1/search?q=${encodeURIComponent(title)}`).expect(200);
    expect(searchBefore.body.procedures).toHaveLength(0);

    await request(app.getHttpServer())
      .post(`/api/v1/admin/submissions/${submissionId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(409); // checklist not filled yet -> CHECKLIST_INCOMPLETE

    await request(app.getHttpServer())
      .patch(`/api/v1/admin/submissions/${submissionId}/checklist`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ matchesSource: true, safeForLaypeople: true, clearLanguage: true, notDuplicate: true })
      .expect(200);

    const approved = await request(app.getHttpServer())
      .post(`/api/v1/admin/submissions/${submissionId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);
    expect(approved.body.status).toBe('PUBLISHED');

    const procedure = await prisma.emergencyProcedure.findUnique({
      where: { id: approved.body.publishedEntityId },
      include: { steps: true },
    });
    expect(procedure?.origin).toBe('PROFESSIONAL');
    expect(procedure?.authorId).toBe(userId);
    expect(procedure?.steps).toHaveLength(3);

    const searchAfter = await request(app.getHttpServer()).get(`/api/v1/search?q=${encodeURIComponent(title)}`).expect(200);
    expect(searchAfter.body.procedures).toHaveLength(1);
    expect(searchAfter.body.procedures[0].id).toBe(approved.body.publishedEntityId);
  });

  it('requests changes with a note and surfaces it on the author listing, but 400s with no note', async () => {
    const { token } = await approvedProfessional();

    const created = await request(app.getHttpServer())
      .post('/api/v1/submissions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'VIDEO',
        action: 'SUBMIT',
        payload: { title: 'Vídeo teste', categorySlug: 'traumas', youtubeVideo: 'dQw4w9WgXcQ', duration: '3:30', sourceLabel: 'AHA 2020' },
      })
      .expect(201);
    const submissionId = created.body.id;

    await request(app.getHttpServer())
      .post(`/api/v1/admin/submissions/${submissionId}/request-changes`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reasons: ['Mídia inadequada'], note: '' })
      .expect(400);

    await request(app.getHttpServer())
      .post(`/api/v1/admin/submissions/${submissionId}/request-changes`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reasons: ['Mídia inadequada'], note: 'Troque por um vídeo oficial.' })
      .expect(201);

    const mine = await request(app.getHttpServer())
      .get('/api/v1/submissions/mine')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const item = mine.body.items.find((i: { id: string }) => i.id === submissionId);
    expect(item.status).toBe('CHANGES_REQUESTED');
    expect(item.reviewNote).toContain('Troque por um vídeo oficial.');
  });

  it('preview does not materialize public content or persist quiz progress', async () => {
    const { token, userId } = await approvedProfessional();

    const created = await request(app.getHttpServer())
      .post('/api/v1/submissions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'TRACK',
        action: 'SUBMIT',
        payload: {
          title: `Trilha preview ${unique()}`,
          categorySlug: 'traumas',
          estimatedMinutes: 5,
          cards: [{ title: 'Card', text: 'Texto do card' }],
          questions: [{ statement: 'Pergunta?', options: ['A', 'B', 'C', 'D'], correctIndex: 1, explanation: 'Porque sim.' }],
          sourceLabel: 'AHA 2020',
        },
      })
      .expect(201);
    const submissionId = created.body.id;

    const preview = await request(app.getHttpServer())
      .get(`/api/v1/admin/submissions/${submissionId}/preview`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(preview.body.isPreview).toBe(true);

    const quiz = await request(app.getHttpServer())
      .post(`/api/v1/admin/submissions/${submissionId}/preview/submit-quiz`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ answers: [{ questionIndex: 0, optionIndex: 1 }] })
      .expect(201);
    expect(quiz.body.passed).toBe(true);

    const tracksCountBefore = await prisma.trainingTrack.count({ where: { submissionId } });
    expect(tracksCountBefore).toBe(0);

    const progress = await prisma.userTrainingProgress.findMany({ where: { userId } });
    expect(progress).toHaveLength(0);
  });

  it('lets only one of two concurrent approvals win', async () => {
    const { token } = await approvedProfessional();

    const created = await request(app.getHttpServer())
      .post('/api/v1/submissions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'VIDEO',
        action: 'SUBMIT',
        payload: { title: 'Concorrência', categorySlug: 'traumas', youtubeVideo: 'dQw4w9WgXcQ', duration: '2:00', sourceLabel: 'AHA 2020' },
      })
      .expect(201);
    const submissionId = created.body.id;

    await request(app.getHttpServer())
      .patch(`/api/v1/admin/submissions/${submissionId}/checklist`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ matchesSource: true, safeForLaypeople: true, clearLanguage: true, notDuplicate: true })
      .expect(200);

    const [first, second] = await Promise.all([
      request(app.getHttpServer()).post(`/api/v1/admin/submissions/${submissionId}/approve`).set('Authorization', `Bearer ${adminToken}`),
      request(app.getHttpServer()).post(`/api/v1/admin/submissions/${submissionId}/approve`).set('Authorization', `Bearer ${adminToken}`),
    ]);

    const statuses = [first.status, second.status].sort();
    expect(statuses).toEqual([201, 409]);
  });

  /** Registers a HEALTH_PROFESSIONAL and pushes their credential straight to APPROVED via the admin API, returning a fresh (post-approval) token. */
  async function approvedProfessional() {
    const { token, email } = await registerAndLogin('HEALTH_PROFESSIONAL');

    await request(app.getHttpServer())
      .put('/api/v1/professionals/me/credential')
      .set('Authorization', `Bearer ${token}`)
      .send({ council: 'CRM', registrationNumber: uniqueRegistrationNumber(), uf: 'SP' })
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/v1/professionals/me/credential/document')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('fake-pdf-content'), { filename: 'doc.pdf', contentType: 'application/pdf' })
      .expect(201);

    await request(app.getHttpServer()).post('/api/v1/professionals/me/credential/submit').set('Authorization', `Bearer ${token}`).expect(201);

    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    const profile = await prisma.professionalProfile.findUniqueOrThrow({ where: { userId: user.id } });

    await request(app.getHttpServer())
      .post(`/api/v1/admin/credentials/${profile.id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);

    const relogin = await request(app.getHttpServer()).post('/api/v1/auth/login').send({ email, password: 'senha123' }).expect(200);
    return { token: relogin.body.accessToken as string, userId: user.id };
  }
});
