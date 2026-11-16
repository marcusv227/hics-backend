import { ContentOrigin, ContentType, CredentialStatus, PrismaClient, ProfessionalCouncil, Role, SubmissionStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const chokingCategory = await prisma.category.upsert({
    where: { slug: 'engasgo' },
    update: {},
    create: {
      name: 'Engasgo',
      slug: 'engasgo',
      description: 'Obstrução de vias aéreas por corpo estranho.',
      iconUrl: 'https://cdn.hics.app/icons/choking.svg',
    },
  });

  const cardiacCategory = await prisma.category.upsert({
    where: { slug: 'parada-cardiorrespiratoria' },
    update: {},
    create: {
      name: 'Parada Cardiorrespiratória',
      slug: 'parada-cardiorrespiratoria',
      description: 'Reconhecimento e resposta à PCR, incluindo RCP.',
      iconUrl: 'https://cdn.hics.app/icons/cpr.svg',
    },
  });

  const burnsCategory = await prisma.category.upsert({
    where: { slug: 'queimaduras' },
    update: {},
    create: {
      name: 'Queimaduras',
      slug: 'queimaduras',
      description: 'Queimaduras térmicas de 1º e 2º grau.',
      iconUrl: 'https://cdn.hics.app/icons/burns.svg',
    },
  });

  const traumaCategory = await prisma.category.upsert({
    where: { slug: 'traumas' },
    update: {},
    create: {
      name: 'Traumas',
      slug: 'traumas',
      description: 'Fraturas, cortes e ferimentos.',
      iconUrl: 'https://cdn.hics.app/icons/trauma.svg',
    },
  });

  const seizureCategory = await prisma.category.upsert({
    where: { slug: 'convulsao' },
    update: {},
    create: {
      id: 'f450b391-6fc2-4754-b799-2aaac592f383',
      name: 'Convulsão',
      slug: 'convulsao',
      description: 'Crises convulsivas e cuidados durante e após o episódio.',
      iconUrl: 'https://cdn.hics.app/icons/seizure.svg',
    },
  });

  const strokeCategory = await prisma.category.upsert({
    where: { slug: 'avc' },
    update: {},
    create: {
      id: '37f24974-1be6-4bde-8f7e-3755d49fe683',
      name: 'AVC',
      slug: 'avc',
      description: 'Reconhecimento precoce e conduta diante de um Acidente Vascular Cerebral.',
      iconUrl: 'https://cdn.hics.app/icons/stroke.svg',
    },
  });

  const drowningCategory = await prisma.category.upsert({
    where: { slug: 'afogamento' },
    update: {},
    create: {
      id: 'b7873b4b-a352-4668-a739-9c7b7d1c2251',
      name: 'Afogamento',
      slug: 'afogamento',
      description: 'Resgate e suporte respiratório em vítimas de afogamento.',
      iconUrl: 'https://cdn.hics.app/icons/drowning.svg',
    },
  });

  const bleedingCategory = await prisma.category.upsert({
    where: { slug: 'hemorragias' },
    update: {},
    create: {
      id: '3bdf398b-3f2c-4d69-8af7-306c326ad68c',
      name: 'Hemorragias',
      slug: 'hemorragias',
      description: 'Controle de sangramentos externos graves.',
      iconUrl: 'https://cdn.hics.app/icons/bleeding.svg',
    },
  });

  await seedHeimlichAdult(chokingCategory.id);
  await seedHeimlichInfant(chokingCategory.id);
  await seedCpr(cardiacCategory.id);
  await seedCprChild(cardiacCategory.id);
  await seedCprInfant(cardiacCategory.id);
  await seedBurns(burnsCategory.id);
  await seedSeizure(seizureCategory.id);
  await seedStroke(strokeCategory.id);
  await seedDrowning(drowningCategory.id);
  await seedBleeding(bleedingCategory.id);
  await seedFracture(traumaCategory.id);

  await seedCprTrack(cardiacCategory.id);
  await seedEmergenciasTrack();

  await seedVideos({
    chokingCategoryId: chokingCategory.id,
    cardiacCategoryId: cardiacCategory.id,
    burnsCategoryId: burnsCategory.id,
    traumaCategoryId: traumaCategory.id,
    seizureCategoryId: seizureCategory.id,
    strokeCategoryId: strokeCategory.id,
    drowningCategoryId: drowningCategory.id,
    bleedingCategoryId: bleedingCategory.id,
  });

  await seedProfessionalFlow();

  console.log('Seed concluído com sucesso.');
}

async function seedHeimlichAdult(categoryId: string) {
  const procedure = await prisma.emergencyProcedure.upsert({
    where: { id: 'c8ddddb1-0039-4770-ac97-828887f057bd' },
    update: {},
    create: {
      id: 'c8ddddb1-0039-4770-ac97-828887f057bd',
      categoryId,
      title: 'Manobra de Heimlich em adultos',
      summary: 'Desobstrução de vias aéreas por corpo estranho em adultos conscientes.',
      coverImageUrl: '/static/images/procedures/heimlich-adulto.svg',
      severityLevel: 'HIGH',
      sourceReference: 'American Heart Association — Guidelines 2020',
      isOfflineAvailable: true,
    },
  });

  const steps = [
    {
      stepNumber: 1,
      title: 'Reconheça os sinais de engasgo',
      imageUrl: '/static/images/steps/reconhecer-engasgo.svg',
      instruction:
        'Observe se a pessoa leva as mãos ao pescoço, não consegue tossir, falar ou respirar. Pergunte: "Você está engasgado?"',
      warningText: null,
    },
    {
      stepNumber: 2,
      title: 'Posicione-se atrás da vítima',
      imageUrl: '/static/images/steps/posicionar-atras.svg',
      instruction:
        'Fique atrás da pessoa, incline-a levemente para frente e posicione um pé entre as pernas dela para dar estabilidade.',
      warningText: null,
    },
    {
      stepNumber: 3,
      title: 'Aplique as compressões abdominais',
      imageUrl: '/static/images/steps/compressao-abdominal.svg',
      instruction:
        'Feche uma mão em punho e posicione-a logo acima do umbigo. Segure o punho com a outra mão e faça compressões rápidas para dentro e para cima.',
      warningText: 'Nunca aplique a manobra em gestantes ou obesos na região abdominal — direcione ao tórax.',
    },
    {
      stepNumber: 4,
      title: 'Repita até a desobstrução',
      imageUrl: '/static/images/steps/compressao-abdominal.svg',
      instruction:
        'Continue as compressões até que o objeto seja expelido ou a vítima perca a consciência.',
      warningText: null,
    },
    {
      stepNumber: 5,
      title: 'Se a vítima perder a consciência',
      imageUrl: '/static/images/steps/vitima-inconsciente.svg',
      instruction:
        'Deite a vítima no chão com cuidado, acione o SAMU (192) e inicie a RCP imediatamente.',
      warningText: 'Ligue para o 192 assim que possível, mesmo enquanto presta o socorro.',
    },
  ];

  for (const step of steps) {
    await prisma.procedureStep.upsert({
      where: { procedureId_stepNumber: { procedureId: procedure.id, stepNumber: step.stepNumber } },
      update: {},
      create: { procedureId: procedure.id, ...step },
    });
  }
}

async function seedHeimlichInfant(categoryId: string) {
  const procedure = await prisma.emergencyProcedure.upsert({
    where: { id: '3891a794-7398-4c42-9f42-3e438ede7509' },
    update: {},
    create: {
      id: '3891a794-7398-4c42-9f42-3e438ede7509',
      categoryId,
      title: 'Desobstrução de vias aéreas em bebês (menores de 1 ano)',
      summary: 'Técnica de tapotagem e compressões torácicas para engasgo em bebês.',
      coverImageUrl: '/static/images/procedures/heimlich-bebe.svg',
      severityLevel: 'HIGH',
      sourceReference: 'American Heart Association — Guidelines 2020',
      isOfflineAvailable: true,
    },
  });

  const steps = [
    {
      stepNumber: 1,
      title: 'Confirme o engasgo',
      imageUrl: '/static/images/steps/confirmar-engasgo-bebe.svg',
      instruction:
        'Observe tosse fraca, choro fraco ou ausente, dificuldade para respirar ou coloração azulada dos lábios.',
      warningText: null,
    },
    {
      stepNumber: 2,
      title: 'Posicione o bebê de bruços',
      imageUrl: '/static/images/steps/posicionar-bebe-bruco.svg',
      instruction:
        'Apoie o bebê no seu antebraço, de bruços, com a cabeça mais baixa que o tronco, sustentando o queixo com os dedos.',
      warningText: null,
    },
    {
      stepNumber: 3,
      title: 'Aplique 5 tapotagens nas costas',
      imageUrl: '/static/images/steps/tapotagem-costas.svg',
      instruction:
        'Com a base da mão, aplique 5 golpes firmes entre as escápulas do bebê.',
      warningText: null,
    },
    {
      stepNumber: 4,
      title: 'Vire o bebê e aplique 5 compressões torácicas',
      imageUrl: '/static/images/steps/dois-dedos-torax-bebe.svg',
      instruction:
        'Vire o bebê de barriga para cima sobre o outro antebraço e aplique 5 compressões no centro do tórax com dois dedos.',
      warningText: 'Nunca faça compressões abdominais em bebês.',
    },
    {
      stepNumber: 5,
      title: 'Repita e acione o SAMU',
      imageUrl: '/static/images/steps/chamar-samu.svg',
      instruction:
        'Alterne tapotagens e compressões até a desobstrução. Acione o 192 imediatamente se o bebê perder a consciência.',
      warningText: 'Se o bebê perder a consciência, inicie RCP pediátrica e ligue para o 192.',
    },
  ];

  for (const step of steps) {
    await prisma.procedureStep.upsert({
      where: { procedureId_stepNumber: { procedureId: procedure.id, stepNumber: step.stepNumber } },
      update: {},
      create: { procedureId: procedure.id, ...step },
    });
  }
}

async function seedCprChild(categoryId: string) {
  const procedure = await prisma.emergencyProcedure.upsert({
    where: { id: '63e85dc0-6d11-47d4-a785-dd17054ea4e5' },
    update: {},
    create: {
      id: '63e85dc0-6d11-47d4-a785-dd17054ea4e5',
      categoryId,
      title: 'Ressuscitação Cardiopulmonar (RCP) em crianças',
      summary: 'Compressões torácicas adaptadas para crianças de 1 a 8 anos em parada cardiorrespiratória.',
      coverImageUrl: '/static/images/procedures/rcp-crianca.svg',
      severityLevel: 'CRITICAL',
      sourceReference: 'American Heart Association — Guidelines 2020 / Hospital Sírio-Libanês',
      isOfflineAvailable: true,
    },
  });

  const steps = [
    {
      stepNumber: 1,
      title: 'Verifique a responsividade',
      imageUrl: '/static/images/steps/verificar-responsividade.svg',
      instruction:
        'Chame a criança e toque os ombros. Se não houver resposta e a respiração for ausente ou anormal, presuma PCR.',
      warningText: null,
    },
    {
      stepNumber: 2,
      title: 'Acione o SAMU (192)',
      imageUrl: '/static/images/steps/chamar-samu.svg',
      instruction:
        'Peça para alguém ligar para o 192. Se estiver sozinho, ligue você mesmo em viva-voz antes de iniciar a RCP.',
      warningText: null,
    },
    {
      stepNumber: 3,
      title: 'Posicione a(s) mão(s) no centro do tórax',
      imageUrl: '/static/images/steps/compressao-toracica-crianca.svg',
      instruction:
        'Em crianças pequenas, uma mão pode ser suficiente; em crianças maiores, use as duas mãos como em adultos.',
      warningText: null,
    },
    {
      stepNumber: 4,
      title: 'Realize compressões torácicas',
      imageUrl: '/static/images/steps/compressao-toracica-crianca.svg',
      instruction:
        'Comprima o tórax a uma profundidade de aproximadamente 5 cm (cerca de 1/3 do diâmetro do tórax), numa frequência de 100 a 120 compressões por minuto.',
      warningText: 'Não comprima com a mesma força usada em adultos — adapte a profundidade ao tamanho da criança.',
    },
    {
      stepNumber: 5,
      title: 'Faça ventilações de resgate',
      imageUrl: '/static/images/steps/ventilacao-resgate.svg',
      instruction:
        'Após 30 compressões, faça 2 ventilações boca a boca, se treinado. Se não souber ventilar, continue apenas com compressões ininterruptas.',
      warningText: null,
    },
    {
      stepNumber: 6,
      title: 'Continue até a chegada do socorro',
      imageUrl: '/static/images/steps/continuar-socorro.svg',
      instruction:
        'Mantenha os ciclos de 30 compressões e 2 ventilações até a chegada da equipe de emergência ou a criança apresentar sinais de vida.',
      warningText: null,
    },
  ];

  for (const step of steps) {
    await prisma.procedureStep.upsert({
      where: { procedureId_stepNumber: { procedureId: procedure.id, stepNumber: step.stepNumber } },
      update: {},
      create: { procedureId: procedure.id, ...step },
    });
  }
}

async function seedCprInfant(categoryId: string) {
  const procedure = await prisma.emergencyProcedure.upsert({
    where: { id: '6b9e811c-1171-4968-b1a2-c095e3d76649' },
    update: {},
    create: {
      id: '6b9e811c-1171-4968-b1a2-c095e3d76649',
      categoryId,
      title: 'Ressuscitação Cardiopulmonar (RCP) em bebês',
      summary: 'Compressões torácicas com dois dedos para bebês menores de 1 ano em parada cardiorrespiratória.',
      coverImageUrl: '/static/images/procedures/rcp-bebe.svg',
      severityLevel: 'CRITICAL',
      sourceReference: 'American Heart Association — Guidelines 2020 / Hospital Sírio-Libanês',
      isOfflineAvailable: true,
    },
  });

  const steps = [
    {
      stepNumber: 1,
      title: 'Verifique a responsividade',
      imageUrl: '/static/images/steps/verificar-responsividade.svg',
      instruction:
        'Estimule a planta do pé do bebê. Se não houver resposta e a respiração for ausente ou anormal, presuma PCR.',
      warningText: null,
    },
    {
      stepNumber: 2,
      title: 'Acione o SAMU (192)',
      imageUrl: '/static/images/steps/chamar-samu.svg',
      instruction: 'Peça para alguém ligar para o 192, ou ligue você mesmo em viva-voz antes de iniciar a RCP.',
      warningText: null,
    },
    {
      stepNumber: 3,
      title: 'Posicione dois dedos no centro do tórax',
      imageUrl: '/static/images/steps/dois-dedos-torax-bebe.svg',
      instruction: 'Use dois dedos logo abaixo da linha imaginária entre os mamilos.',
      warningText: null,
    },
    {
      stepNumber: 4,
      title: 'Realize compressões torácicas',
      imageUrl: '/static/images/steps/dois-dedos-torax-bebe.svg',
      instruction:
        'Comprima o tórax a uma profundidade de aproximadamente 4 cm (cerca de 1/3 do diâmetro do tórax), numa frequência de 100 a 120 compressões por minuto.',
      warningText: 'Nunca use a força aplicada em adultos — bebês exigem compressões suaves e precisas.',
    },
    {
      stepNumber: 5,
      title: 'Faça ventilações de resgate',
      imageUrl: '/static/images/steps/ventilacao-resgate.svg',
      instruction:
        'Após 30 compressões, faça 2 ventilações suaves cobrindo a boca e o nariz do bebê com sua boca, se treinado.',
      warningText: null,
    },
    {
      stepNumber: 6,
      title: 'Continue até a chegada do socorro',
      imageUrl: '/static/images/steps/continuar-socorro.svg',
      instruction: 'Mantenha os ciclos até a chegada da equipe de emergência ou o bebê apresentar sinais de vida.',
      warningText: null,
    },
  ];

  for (const step of steps) {
    await prisma.procedureStep.upsert({
      where: { procedureId_stepNumber: { procedureId: procedure.id, stepNumber: step.stepNumber } },
      update: {},
      create: { procedureId: procedure.id, ...step },
    });
  }
}

async function seedSeizure(categoryId: string) {
  const procedure = await prisma.emergencyProcedure.upsert({
    where: { id: 'c81d256c-dd1f-4ae4-8e3a-03e571522dbd' },
    update: {},
    create: {
      id: 'c81d256c-dd1f-4ae4-8e3a-03e571522dbd',
      categoryId,
      title: 'Crise convulsiva',
      summary: 'Cuidados durante e após uma crise convulsiva.',
      coverImageUrl: '/static/images/procedures/convulsao.svg',
      severityLevel: 'HIGH',
      sourceReference: 'Hospital Israelita Albert Einstein — Primeiros Socorros',
      isOfflineAvailable: true,
    },
  });

  const steps = [
    {
      stepNumber: 1,
      title: 'Proteja a pessoa',
      imageUrl: '/static/images/steps/proteger-convulsao.svg',
      instruction:
        'Afaste objetos próximos que possam causar machucados e, se possível, coloque algo macio sob a cabeça da pessoa.',
      warningText: null,
    },
    {
      stepNumber: 2,
      title: 'Não contenha os movimentos',
      imageUrl: '/static/images/steps/nao-conter.svg',
      instruction: 'Não tente impedir os movimentos do corpo nem segurar a pessoa com força durante a crise.',
      warningText: 'Nunca coloque objetos ou os dedos na boca da pessoa — risco de lesão ou obstrução das vias aéreas.',
    },
    {
      stepNumber: 3,
      title: 'Marque o tempo da crise',
      imageUrl: '/static/images/steps/timer.svg',
      instruction: 'A maioria das crises convulsivas dura menos de 2 minutos. Observe o relógio quando ela começar.',
      warningText: null,
    },
    {
      stepNumber: 4,
      title: 'Após a crise, lateralize a cabeça',
      imageUrl: '/static/images/steps/posicao-recuperacao.svg',
      instruction:
        'Coloque a pessoa de lado (posição de recuperação) para evitar engasgo com saliva ou vômito enquanto ela recobra a consciência.',
      warningText: null,
    },
    {
      stepNumber: 5,
      title: 'Acione o SAMU (192) quando necessário',
      imageUrl: '/static/images/steps/chamar-samu.svg',
      instruction:
        'Ligue para o 192 se a crise durar mais de 5 minutos, se repetir sem recuperação da consciência entre elas, se for a primeira crise da pessoa, ou se houver gravidez, diabetes ou lesão associada.',
      warningText: null,
    },
  ];

  for (const step of steps) {
    await prisma.procedureStep.upsert({
      where: { procedureId_stepNumber: { procedureId: procedure.id, stepNumber: step.stepNumber } },
      update: {},
      create: { procedureId: procedure.id, ...step },
    });
  }
}

async function seedStroke(categoryId: string) {
  const procedure = await prisma.emergencyProcedure.upsert({
    where: { id: 'e96bdd29-6136-444f-b6ad-5c8ff0fcfd3e' },
    update: {},
    create: {
      id: 'e96bdd29-6136-444f-b6ad-5c8ff0fcfd3e',
      categoryId,
      title: 'Acidente Vascular Cerebral (AVC)',
      summary: 'Reconhecimento precoce dos sinais de AVC pelo teste SAMU e conduta até o socorro.',
      coverImageUrl: '/static/images/procedures/avc.svg',
      severityLevel: 'CRITICAL',
      sourceReference: 'Ministério da Saúde / Sociedade Brasileira de AVC — Protocolo SAMU',
      isOfflineAvailable: true,
    },
  });

  const steps = [
    {
      stepNumber: 1,
      title: 'S — Sorriso',
      imageUrl: '/static/images/steps/avc-sorriso.svg',
      instruction: 'Peça para a pessoa sorrir. Observe se um dos lados do rosto fica torto ou caído.',
      warningText: null,
    },
    {
      stepNumber: 2,
      title: 'A — Abraço',
      imageUrl: '/static/images/steps/avc-abraco.svg',
      instruction: 'Peça para a pessoa levantar os dois braços. Se um deles cair, há perda de força — sinal de alerta.',
      warningText: null,
    },
    {
      stepNumber: 3,
      title: 'M — Música ou Mensagem',
      imageUrl: '/static/images/steps/avc-mensagem.svg',
      instruction: 'Peça para a pessoa repetir uma frase simples. Observe se a fala está enrolada, lenta ou incompreensível.',
      warningText: null,
    },
    {
      stepNumber: 4,
      title: 'U — Urgência',
      imageUrl: '/static/images/steps/chamar-samu.svg',
      instruction: 'Se qualquer um dos sinais acima aparecer, ligue imediatamente para o SAMU (192).',
      warningText: 'Anote o horário exato em que os sinais começaram — essa informação é essencial para o tratamento no hospital.',
    },
    {
      stepNumber: 5,
      title: 'Não dê comida, água ou medicamentos',
      imageUrl: '/static/images/steps/nao-alimentar.svg',
      instruction:
        'A pessoa pode ter dificuldade para engolir. Mantenha-a calma e deitada com a cabeça levemente elevada, monitorando a respiração até a chegada do socorro.',
      warningText: null,
    },
  ];

  for (const step of steps) {
    await prisma.procedureStep.upsert({
      where: { procedureId_stepNumber: { procedureId: procedure.id, stepNumber: step.stepNumber } },
      update: {},
      create: { procedureId: procedure.id, ...step },
    });
  }
}

async function seedDrowning(categoryId: string) {
  const procedure = await prisma.emergencyProcedure.upsert({
    where: { id: '0f040e21-6316-4314-9423-0729ea82bff2' },
    update: {},
    create: {
      id: '0f040e21-6316-4314-9423-0729ea82bff2',
      categoryId,
      title: 'Afogamento',
      summary: 'Resgate seguro e suporte respiratório para vítimas de afogamento.',
      coverImageUrl: '/static/images/procedures/afogamento.svg',
      severityLevel: 'CRITICAL',
      sourceReference: 'Hospital Israelita Albert Einstein — Primeiros Socorros',
      isOfflineAvailable: true,
    },
  });

  const steps = [
    {
      stepNumber: 1,
      title: 'Garanta sua própria segurança',
      imageUrl: '/static/images/steps/seguranca-proprio.svg',
      instruction:
        'Só entre na água para resgatar se estiver treinado e com equipamento adequado. Peça ajuda de um salva-vidas sempre que houver.',
      warningText: null,
    },
    {
      stepNumber: 2,
      title: 'Retire a vítima da água e avalie',
      imageUrl: '/static/images/steps/resgate-agua.svg',
      instruction: 'Em local seguro, verifique a resposta e a respiração da vítima o quanto antes.',
      warningText: null,
    },
    {
      stepNumber: 3,
      title: 'Acione o SAMU (192)',
      imageUrl: '/static/images/steps/chamar-samu.svg',
      instruction: 'Ligue imediatamente para o 192 ou peça para alguém ligar.',
      warningText: null,
    },
    {
      stepNumber: 4,
      title: 'Inicie a RCP com ventilações primeiro, se necessário',
      imageUrl: '/static/images/steps/ventilacao-resgate.svg',
      instruction:
        'Se a vítima não respirar, inicie a RCP com 5 ventilações de resgate antes de começar as compressões torácicas.',
      warningText: 'No afogamento, a prioridade inicial é oxigenar — por isso a RCP começa com ventilações, diferente da parada cardíaca comum.',
    },
    {
      stepNumber: 5,
      title: 'Posição de recuperação, se respirar',
      imageUrl: '/static/images/steps/posicao-recuperacao.svg',
      instruction:
        'Se a vítima respirar mas estiver inconsciente, posicione-a de lado (decúbito lateral) e aguarde o socorro.',
      warningText: null,
    },
  ];

  for (const step of steps) {
    await prisma.procedureStep.upsert({
      where: { procedureId_stepNumber: { procedureId: procedure.id, stepNumber: step.stepNumber } },
      update: {},
      create: { procedureId: procedure.id, ...step },
    });
  }
}

async function seedBleeding(categoryId: string) {
  const procedure = await prisma.emergencyProcedure.upsert({
    where: { id: 'cf594784-5df2-429e-ab08-aa9b9b5c2d7a' },
    update: {},
    create: {
      id: 'cf594784-5df2-429e-ab08-aa9b9b5c2d7a',
      categoryId,
      title: 'Hemorragia externa grave',
      summary: 'Controle de sangramentos externos intensos até a chegada do socorro.',
      coverImageUrl: '/static/images/procedures/hemorragia-externa.svg',
      severityLevel: 'HIGH',
      sourceReference: 'Instituto Brasileiro de APH (IBRAPH) — Controle de Hemorragias',
      isOfflineAvailable: true,
    },
  });

  const steps = [
    {
      stepNumber: 1,
      title: 'Proteja-se',
      imageUrl: '/static/images/steps/proteger-se.svg',
      instruction: 'Use luvas ou um pano/saco plástico entre suas mãos e o sangue da vítima, se possível.',
      warningText: null,
    },
    {
      stepNumber: 2,
      title: 'Aplique pressão direta',
      imageUrl: '/static/images/steps/pressao-direta.svg',
      instruction: 'Use um pano limpo ou gaze diretamente sobre o local do sangramento, com firmeza.',
      warningText: null,
    },
    {
      stepNumber: 3,
      title: 'Eleve o membro afetado',
      imageUrl: '/static/images/steps/elevar-membro.svg',
      instruction: 'Se não houver suspeita de fratura, eleve o local do sangramento acima do nível do coração.',
      warningText: 'Nunca remova objetos encravados no local do sangramento — pressione em volta do objeto, não sobre ele.',
    },
    {
      stepNumber: 4,
      title: 'Mantenha e reforce a pressão',
      imageUrl: '/static/images/steps/pressao-direta.svg',
      instruction: 'Se o sangramento não parar, não retire o pano já aplicado — apenas sobreponha outro pano por cima.',
      warningText: null,
    },
    {
      stepNumber: 5,
      title: 'Torniquete apenas em último caso',
      imageUrl: '/static/images/steps/torniquete.svg',
      instruction:
        'Use um torniquete somente em hemorragias graves de membros que não param com pressão direta, e anote o horário exato de aplicação.',
      warningText: null,
    },
    {
      stepNumber: 6,
      title: 'Acione o SAMU (192)',
      imageUrl: '/static/images/steps/chamar-samu.svg',
      instruction: 'Ligue para o 192 em qualquer sangramento intenso ou que não para.',
      warningText: null,
    },
  ];

  for (const step of steps) {
    await prisma.procedureStep.upsert({
      where: { procedureId_stepNumber: { procedureId: procedure.id, stepNumber: step.stepNumber } },
      update: {},
      create: { procedureId: procedure.id, ...step },
    });
  }
}

async function seedFracture(categoryId: string) {
  const procedure = await prisma.emergencyProcedure.upsert({
    where: { id: '6a921429-671e-40ce-bcaa-4fba12670625' },
    update: {},
    create: {
      id: '6a921429-671e-40ce-bcaa-4fba12670625',
      categoryId,
      title: 'Fratura exposta',
      summary: 'Cuidados com fraturas em que o osso perfura a pele, até a chegada do socorro.',
      coverImageUrl: '/static/images/procedures/fratura-exposta.svg',
      severityLevel: 'HIGH',
      sourceReference: 'Doutor Ajuda — Primeiros Socorros',
      isOfflineAvailable: true,
    },
  });

  const steps = [
    {
      stepNumber: 1,
      title: 'Não movimente o membro afetado',
      imageUrl: '/static/images/steps/nao-movimentar.svg',
      instruction: 'Evitar qualquer movimento reduz o risco de lesões maiores em nervos e vasos sanguíneos próximos.',
      warningText: null,
    },
    {
      stepNumber: 2,
      title: 'Não tente recolocar o osso no lugar',
      imageUrl: '/static/images/steps/nao-recolocar-osso.svg',
      instruction: 'Isso deve ser feito apenas por profissionais de saúde no hospital.',
      warningText: 'Nunca tente empurrar o osso de volta para dentro da pele.',
    },
    {
      stepNumber: 3,
      title: 'Cubra o local com um pano limpo',
      imageUrl: '/static/images/steps/cobrir-ferida.svg',
      instruction: 'Proteja a ferida sem pressionar o osso exposto, para reduzir o risco de infecção.',
      warningText: null,
    },
    {
      stepNumber: 4,
      title: 'Imobilize a região ao redor',
      imageUrl: '/static/images/steps/imobilizar-membro.svg',
      instruction:
        'Use talas improvisadas (jornais, tábuas, revistas) fixadas com panos ao redor da área, sem tentar alinhar o membro.',
      warningText: null,
    },
    {
      stepNumber: 5,
      title: 'Controle o sangramento, se houver',
      imageUrl: '/static/images/steps/pressao-direta.svg',
      instruction: 'Aplique pressão ao redor da área exposta, nunca diretamente sobre o osso.',
      warningText: null,
    },
    {
      stepNumber: 6,
      title: 'Acione o SAMU (192) e monitore sinais de choque',
      imageUrl: '/static/images/steps/chamar-samu.svg',
      instruction:
        'Ligue para o 192 e observe palidez, pele fria e úmida ou confusão mental enquanto aguarda o socorro.',
      warningText: null,
    },
  ];

  for (const step of steps) {
    await prisma.procedureStep.upsert({
      where: { procedureId_stepNumber: { procedureId: procedure.id, stepNumber: step.stepNumber } },
      update: {},
      create: { procedureId: procedure.id, ...step },
    });
  }
}

async function seedCpr(categoryId: string) {
  const procedure = await prisma.emergencyProcedure.upsert({
    where: { id: '2c08beb5-86a7-4ce1-b182-3145756ad162' },
    update: {},
    create: {
      id: '2c08beb5-86a7-4ce1-b182-3145756ad162',
      categoryId,
      title: 'Ressuscitação Cardiopulmonar (RCP) em adultos',
      summary: 'Compressões torácicas para vítimas de parada cardiorrespiratória.',
      coverImageUrl: '/static/images/procedures/rcp-adulto.svg',
      severityLevel: 'CRITICAL',
      sourceReference: 'American Heart Association — Guidelines 2020',
      isOfflineAvailable: true,
    },
  });

  const steps = [
    {
      stepNumber: 1,
      title: 'Verifique a responsividade',
      imageUrl: '/static/images/steps/verificar-responsividade.svg',
      instruction:
        'Chame a vítima e toque os ombros. Se não houver resposta e a respiração for ausente ou anormal, presuma PCR.',
      warningText: null,
    },
    {
      stepNumber: 2,
      title: 'Acione o SAMU (192)',
      imageUrl: '/static/images/steps/chamar-samu.svg',
      instruction:
        'Peça para alguém ligar para o 192 e trazer um desfibrilador (DEA), se disponível. Se estiver sozinho, ligue você mesmo antes de iniciar a RCP.',
      warningText: null,
    },
    {
      stepNumber: 3,
      title: 'Posicione as mãos no centro do tórax',
      imageUrl: '/static/images/steps/compressao-toracica-adulto.svg',
      instruction:
        'Coloque a vítima em superfície rígida e plana. Posicione a base de uma mão no centro do tórax, entre os mamilos, e a outra mão sobre a primeira.',
      warningText: null,
    },
    {
      stepNumber: 4,
      title: 'Realize compressões torácicas',
      imageUrl: '/static/images/steps/compressao-toracica-adulto.svg',
      instruction:
        'Comprima o tórax a uma profundidade de 5 a 6 cm, numa frequência de 100 a 120 compressões por minuto, permitindo o retorno total do tórax entre as compressões.',
      warningText: 'Minimize interrupções nas compressões torácicas.',
    },
    {
      stepNumber: 5,
      title: 'Use o DEA assim que disponível',
      imageUrl: '/static/images/steps/dea.svg',
      instruction:
        'Ligue o desfibrilador automático externo e siga as instruções de voz do aparelho.',
      warningText: null,
    },
    {
      stepNumber: 6,
      title: 'Continue até a chegada do socorro',
      imageUrl: '/static/images/steps/continuar-socorro.svg',
      instruction:
        'Mantenha os ciclos de compressão até a chegada da equipe de emergência ou a vítima apresentar sinais de vida.',
      warningText: null,
    },
  ];

  for (const step of steps) {
    await prisma.procedureStep.upsert({
      where: { procedureId_stepNumber: { procedureId: procedure.id, stepNumber: step.stepNumber } },
      update: {},
      create: { procedureId: procedure.id, ...step },
    });
  }
}

async function seedBurns(categoryId: string) {
  const procedure = await prisma.emergencyProcedure.upsert({
    where: { id: '518c1d4d-d382-4c94-a1b1-4bda99649dd4' },
    update: {},
    create: {
      id: '518c1d4d-d382-4c94-a1b1-4bda99649dd4',
      categoryId,
      title: 'Queimaduras de 1º e 2º grau',
      summary: 'Primeiros socorros para queimaduras térmicas superficiais e de espessura parcial.',
      coverImageUrl: '/static/images/procedures/queimadura.svg',
      severityLevel: 'MEDIUM',
      sourceReference: 'Sociedade Brasileira de Queimaduras',
      isOfflineAvailable: true,
    },
  });

  const steps = [
    {
      stepNumber: 1,
      title: 'Afaste a vítima da fonte de calor',
      imageUrl: '/static/images/steps/afastar-calor.svg',
      instruction: 'Interrompa o contato com a fonte térmica e remova roupas e acessórios próximos à área queimada, se não estiverem grudados.',
      warningText: null,
    },
    {
      stepNumber: 2,
      title: 'Resfrie a queimadura',
      imageUrl: '/static/images/steps/resfriar-queimadura.svg',
      instruction: 'Coloque a área afetada sob água corrente em temperatura ambiente por 10 a 20 minutos.',
      warningText: 'Nunca use gelo diretamente sobre a queimadura — pode agravar a lesão.',
    },
    {
      stepNumber: 3,
      title: 'Cubra a lesão',
      imageUrl: '/static/images/steps/cobrir-ferida.svg',
      instruction: 'Cubra a área com um pano limpo, seco e não aderente. Não estoure bolhas.',
      warningText: 'Não aplique pomadas caseiras, pasta de dente, manteiga ou outros produtos não indicados.',
    },
    {
      stepNumber: 4,
      title: 'Avalie a gravidade',
      imageUrl: '/static/images/steps/avaliar-queimadura.svg',
      instruction:
        'Queimaduras de 2º grau com bolhas extensas, em rosto, mãos, genitais ou articulações, ou de 3º grau, exigem atendimento médico imediato.',
      warningText: null,
    },
    {
      stepNumber: 5,
      title: 'Busque atendimento médico se necessário',
      imageUrl: '/static/images/steps/atendimento-medico.svg',
      instruction: 'Procure uma unidade de saúde ou acione o SAMU (192) em queimaduras extensas, profundas ou em áreas sensíveis.',
      warningText: null,
    },
  ];

  for (const step of steps) {
    await prisma.procedureStep.upsert({
      where: { procedureId_stepNumber: { procedureId: procedure.id, stepNumber: step.stepNumber } },
      update: {},
      create: { procedureId: procedure.id, ...step },
    });
  }
}

async function seedCprTrack(categoryId: string) {
  const track = await prisma.trainingTrack.upsert({
    where: { id: '1c28c916-e910-4986-b84e-9be0d0dcc175' },
    update: {},
    create: {
      id: '1c28c916-e910-4986-b84e-9be0d0dcc175',
      categoryId,
      title: 'Fundamentos de RCP',
      description: 'Aprenda os fundamentos da ressuscitação cardiopulmonar em adultos.',
      estimatedTimeMinutes: 15,
      coverImageUrl: 'https://cdn.hics.app/covers/cpr-track.jpg',
    },
  });

  const cards = [
    {
      orderIndex: 1,
      title: 'O que é uma PCR?',
      mediaUrl: '/static/images/trainings/coracao-parado.svg',
      contentText:
        'A parada cardiorrespiratória (PCR) é a interrupção súbita da atividade cardíaca e da respiração. Reconhecer rapidamente os sinais salva vidas.',
    },
    {
      orderIndex: 2,
      title: 'A cadeia de sobrevivência',
      mediaUrl: '/static/images/trainings/cadeia-sobrevivencia.svg',
      contentText:
        'Reconhecimento precoce, acionamento do 192, RCP de qualidade, desfibrilação precoce e cuidados pós-parada formam a cadeia de sobrevivência.',
    },
    {
      orderIndex: 3,
      title: 'Compressões de qualidade',
      mediaUrl: '/static/images/steps/compressao-toracica-adulto.svg',
      contentText:
        'Compressões devem ter 5-6 cm de profundidade, frequência de 100-120 por minuto, com retorno total do tórax entre cada compressão.',
    },
  ];

  for (const card of cards) {
    await prisma.trainingCard.upsert({
      where: { trackId_orderIndex: { trackId: track.id, orderIndex: card.orderIndex } },
      update: {},
      create: { trackId: track.id, ...card },
    });
  }

  const question = await prisma.quizQuestion.upsert({
    where: { id: '83d87550-f0cf-4bc2-bb63-adc5e016255e' },
    update: {},
    create: {
      id: '83d87550-f0cf-4bc2-bb63-adc5e016255e',
      trackId: track.id,
      questionText: 'Qual a frequência recomendada de compressões torácicas durante a RCP em adultos?',
      explanation:
        'A frequência recomendada pela AHA é de 100 a 120 compressões por minuto, com profundidade de 5 a 6 cm.',
    },
  });

  const options = [
    { id: '1d63b720-f167-4afb-b7dc-bbf8b0074bb4', optionText: '60 a 80 compressões por minuto', isCorrect: false },
    { id: 'e5fd2bd9-327a-4859-8934-205cfab305ae', optionText: '100 a 120 compressões por minuto', isCorrect: true },
    { id: 'd7201e52-e57f-43a4-9bc8-a00a4a0084e8', optionText: '150 a 180 compressões por minuto', isCorrect: false },
  ];

  for (const option of options) {
    await prisma.quizOption.upsert({
      where: { id: option.id },
      update: {},
      create: { questionId: question.id, ...option },
    });
  }
}

async function seedEmergenciasTrack() {
  const track = await prisma.trainingTrack.upsert({
    where: { id: '43ed9826-06ef-48a2-b02f-d841694eaffd' },
    update: {},
    create: {
      id: '43ed9826-06ef-48a2-b02f-d841694eaffd',
      categoryId: null,
      title: 'Primeiros Socorros Essenciais',
      description: 'Reconhecimento rápido de AVC, convulsão e afogamento — as três emergências onde agir nos primeiros minutos salva vidas.',
      estimatedTimeMinutes: 10,
      coverImageUrl: 'https://cdn.hics.app/covers/emergencias-track.jpg',
    },
  });

  const cards = [
    {
      orderIndex: 1,
      title: 'Reconhecendo um AVC: o teste SAMU',
      mediaUrl: '/static/images/steps/avc-sorriso.svg',
      contentText:
        'O Ministério da Saúde adota a sigla SAMU para reconhecer um AVC: Sorriso (peça para sorrir e observe assimetria no rosto), Abraço (peça para levantar os dois braços e veja se um cai), Música/Mensagem (peça para repetir uma frase e note se a fala está enrolada) e Urgência (ligue 192 imediatamente se notar qualquer sinal).',
    },
    {
      orderIndex: 2,
      title: 'O que fazer (e não fazer) durante uma convulsão',
      mediaUrl: '/static/images/steps/proteger-convulsao.svg',
      contentText:
        'Proteja a pessoa afastando objetos próximos, nunca a contenha com força e nunca coloque objetos ou os dedos na boca dela. Após a crise, lateralize a cabeça para evitar engasgo e acione o SAMU se durar mais de 5 minutos ou se repetir sem recuperação da consciência.',
    },
    {
      orderIndex: 3,
      title: 'Afogamento: por que a RCP começa pela respiração',
      mediaUrl: '/static/images/steps/ventilacao-resgate.svg',
      contentText:
        'No afogamento, a vítima sofre primeiro por falta de oxigênio. Por isso, se não estiver respirando, a RCP começa com 5 ventilações de resgate antes das compressões torácicas — diferente do protocolo padrão de parada cardíaca, que começa pelas compressões.',
    },
  ];

  for (const card of cards) {
    await prisma.trainingCard.upsert({
      where: { trackId_orderIndex: { trackId: track.id, orderIndex: card.orderIndex } },
      update: {},
      create: { trackId: track.id, ...card },
    });
  }

  const strokeQuestion = await prisma.quizQuestion.upsert({
    where: { id: '529001d4-536c-4733-80bd-2fb4e6f6c365' },
    update: {},
    create: {
      id: '529001d4-536c-4733-80bd-2fb4e6f6c365',
      trackId: track.id,
      questionText: 'No teste SAMU para reconhecer um AVC, o que a letra "A" representa?',
      explanation:
        'A letra A do teste SAMU significa Abraço: pede-se à pessoa para levantar os dois braços — se um deles cair, há perda de força, um sinal de alerta para AVC.',
    },
  });

  const strokeOptions = [
    { id: 'f4e40ffc-326a-432f-a159-3b4ec2c17b7e', optionText: 'Abraço (força nos braços)', isCorrect: true },
    { id: '0bfcc0ab-8caf-45a4-a910-b551246f5c55', optionText: 'Ansiedade', isCorrect: false },
    { id: '00674198-c5fa-4cac-aa15-df2e85f6e22f', optionText: 'Audição', isCorrect: false },
  ];

  for (const option of strokeOptions) {
    await prisma.quizOption.upsert({
      where: { id: option.id },
      update: {},
      create: { questionId: strokeQuestion.id, ...option },
    });
  }

  const seizureQuestion = await prisma.quizQuestion.upsert({
    where: { id: 'ad0e79b4-e93d-47f6-ad5a-41de9c2a14d0' },
    update: {},
    create: {
      id: 'ad0e79b4-e93d-47f6-ad5a-41de9c2a14d0',
      trackId: track.id,
      questionText: 'Durante uma crise convulsiva, o que você NUNCA deve fazer?',
      explanation:
        'Colocar objetos ou os dedos na boca pode causar lesões ou obstruir as vias aéreas. A língua não é engolida durante a convulsão, então essa medida popular é desnecessária e perigosa.',
    },
  });

  const seizureOptions = [
    { id: '65a33e3e-9afd-4342-9244-9cfa9b281101', optionText: 'Colocar objetos ou os dedos na boca da pessoa', isCorrect: true },
    { id: '45050231-70f4-46b3-ad9f-64e76fadd695', optionText: 'Proteger a cabeça da pessoa com algo macio', isCorrect: false },
    { id: '7983ae51-9a8c-4fa2-bb1e-64b27ff36d16', optionText: 'Virar a pessoa de lado após a crise', isCorrect: false },
  ];

  for (const option of seizureOptions) {
    await prisma.quizOption.upsert({
      where: { id: option.id },
      update: {},
      create: { questionId: seizureQuestion.id, ...option },
    });
  }
}

interface VideoCategoryIds {
  chokingCategoryId: string;
  cardiacCategoryId: string;
  burnsCategoryId: string;
  traumaCategoryId: string;
  seizureCategoryId: string;
  strokeCategoryId: string;
  drowningCategoryId: string;
  bleedingCategoryId: string;
}

async function seedVideos(categoryIds: VideoCategoryIds) {
  const videos = [
    {
      id: '352db471-2ceb-4dc8-93b5-c75471e9db79',
      categoryId: categoryIds.cardiacCategoryId,
      title: '(RCP) Ressuscitação cardiopulmonar em adultos: o que fazer?',
      youtubeVideoId: 'gGE18Z2IaBk',
      durationSeconds: 165,
      description: 'Demonstração de como realizar a ressuscitação cardiopulmonar em adultos.',
      sourceReference: 'Hospital Sírio-Libanês — Canal oficial no YouTube',
    },
    {
      id: '381eaf12-b633-455c-ae7f-62584093f8dd',
      categoryId: categoryIds.cardiacCategoryId,
      title: '(RCP) Ressuscitação cardiopulmonar em crianças: o que fazer?',
      youtubeVideoId: 'bZUNrYdnnq4',
      durationSeconds: 179,
      description: 'Demonstração de como realizar a ressuscitação cardiopulmonar em crianças.',
      sourceReference: 'Hospital Sírio-Libanês — Canal oficial no YouTube',
    },
    {
      id: 'b1bbdff2-3299-4d05-b1b1-f776a72d80d5',
      categoryId: categoryIds.cardiacCategoryId,
      title: '(RCP) Ressuscitação cardiopulmonar em bebês: o que fazer?',
      youtubeVideoId: '91bJPaXAV_E',
      durationSeconds: 190,
      description: 'Demonstração de como realizar a ressuscitação cardiopulmonar em bebês.',
      sourceReference: 'Hospital Sírio-Libanês — Canal oficial no YouTube',
    },
    {
      id: 'a149ee9a-5c63-4c59-964c-461187d77861',
      categoryId: categoryIds.chokingCategoryId,
      title: 'Engasgo em adultos e crianças: o que fazer?',
      youtubeVideoId: 'mKgi3_Q_o-A',
      durationSeconds: 173,
      description: 'Como reconhecer e agir diante de um engasgo em adultos e crianças.',
      sourceReference: 'Hospital Sírio-Libanês — Canal oficial no YouTube',
    },
    {
      id: '962f0408-52eb-40c7-aceb-ea7be85649be',
      categoryId: categoryIds.chokingCategoryId,
      title: 'Bebê engasgado: manobra para sólidos (comida ou brinquedo)',
      youtubeVideoId: 'ha70RU06pHc',
      durationSeconds: 211,
      description: 'Pediatra de emergência explica como reconhecer e agir diante do engasgo em bebês.',
      sourceReference: 'Hospital Israelita Albert Einstein — Canal oficial no YouTube',
    },
    {
      id: '7555496a-edbc-403c-a0c6-371366d2b4ad',
      categoryId: categoryIds.seizureCategoryId,
      title: 'O que fazer quando alguém está tendo convulsão?',
      youtubeVideoId: 'H9rpKcW22fg',
      durationSeconds: 165,
      description: 'Orientações médicas sobre como agir durante e após uma crise convulsiva.',
      sourceReference: 'Hospital Israelita Albert Einstein — Canal oficial no YouTube',
    },
    {
      id: '07a3e08a-17b4-4cee-aab0-d4142bef7535',
      categoryId: categoryIds.strokeCategoryId,
      title: 'Como ajudar alguém durante um AVC?',
      youtubeVideoId: 'd2seL0rlEq8',
      durationSeconds: 119,
      description: 'Como reconhecer os sinais de AVC e agir rapidamente.',
      sourceReference: 'Hospital Israelita Albert Einstein — Canal oficial no YouTube',
    },
    {
      id: 'f2b99b2b-e27d-4c1d-88f2-1131797aae86',
      categoryId: categoryIds.drowningCategoryId,
      title: 'Quais são os primeiros socorros durante um afogamento?',
      youtubeVideoId: '4cSoJ9MvwBo',
      durationSeconds: 359,
      description: 'Orientações sobre resgate seguro e suporte respiratório em afogamentos.',
      sourceReference: 'Hospital Israelita Albert Einstein — Canal oficial no YouTube',
    },
    {
      id: '56907fa1-cbca-41b4-ae8e-da518dc9132f',
      categoryId: categoryIds.burnsCategoryId,
      title: 'Queimadura grave | Primeiros socorros',
      youtubeVideoId: 'ZtkwWQEiznY',
      durationSeconds: 123,
      description: 'Como agir diante de uma queimadura grave até a chegada do socorro.',
      sourceReference: 'SIKANA Brasil / Português — Canal oficial no YouTube',
    },
    {
      id: '62d492c9-5e95-44f0-8fee-fe6825b8362d',
      categoryId: categoryIds.burnsCategoryId,
      title: 'Queimaduras pequenas | Primeiros socorros',
      youtubeVideoId: 'zXVJRIPupqM',
      durationSeconds: 100,
      description: 'Cuidados com queimaduras de pequena extensão.',
      sourceReference: 'SIKANA Brasil / Português — Canal oficial no YouTube',
    },
    {
      id: '5a42e946-43c2-4905-a97d-e9ed37ed73d5',
      categoryId: categoryIds.traumaCategoryId,
      title: 'O que fazer em caso de FRATURA EXPOSTA em 6 passos',
      youtubeVideoId: 'tIlbFzRSuWw',
      durationSeconds: 149,
      description: 'Passo a passo de primeiros socorros para fraturas expostas.',
      sourceReference: 'Doutor Ajuda — Canal oficial no YouTube',
    },
    {
      id: '93c2b2d6-1fe3-4518-abec-118b05076fc9',
      categoryId: categoryIds.bleedingCategoryId,
      title: 'Controle de Hemorragia a nível de Primeiros Socorros | O que fazer?',
      youtubeVideoId: 'XIH8v579xDo',
      durationSeconds: 871,
      description: 'Aula prática sobre controle de hemorragias externas graves.',
      sourceReference: 'Instituto Brasileiro de APH (IBRAPH) — Canal oficial no YouTube',
    },
  ];

  for (const video of videos) {
    const { youtubeVideoId, ...rest } = video;
    await prisma.educationalVideo.upsert({
      where: { id: video.id },
      update: {},
      create: {
        ...rest,
        youtubeVideoId,
        thumbnailUrl: `https://img.youtube.com/vi/${youtubeVideoId}/hqdefault.jpg`,
      },
    });
  }
}

async function seedProfessionalFlow() {
  const passwordHash = await bcrypt.hash('senha123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'rafael.lima@hics.org.br' },
    update: {},
    create: {
      id: '72929aeb-c475-4484-9425-a0f30024401a',
      name: 'Rafael Lima',
      email: 'rafael.lima@hics.org.br',
      passwordHash,
      role: Role.ADMIN,
    },
  });

  const marina = await seedApprovedProfessional({
    userId: 'c3480899-c54d-4859-9dae-8d2f9d3f36b6',
    profileId: '653b3cc3-59aa-407f-9784-880195e9bd86',
    name: 'Marina Costa',
    email: 'marina.costa@hospital.org',
    council: ProfessionalCouncil.COREN,
    registrationNumber: '245871',
    uf: 'SP',
    passwordHash,
    reviewedById: admin.id,
  });

  const paulo = await seedApprovedProfessional({
    userId: '5c68e681-e543-4114-bc70-a652afd1e03f',
    profileId: '7f0d27c3-cf80-4eea-be75-bcfa78807b76',
    name: 'Paulo Mendes',
    email: 'paulo.mendes@hospital.org',
    council: ProfessionalCouncil.CRM,
    registrationNumber: '128734',
    uf: 'RJ',
    passwordHash,
    reviewedById: admin.id,
  });

  const julia = await seedApprovedProfessional({
    userId: '18ea5fa1-9bc1-4826-b585-8ff2bde8fadf',
    profileId: 'fb872dd4-6fbb-450d-bd6d-bb7eca17e5de',
    name: 'Júlia Ramos',
    email: 'julia.ramos@hospital.org',
    council: ProfessionalCouncil.COREN,
    registrationNumber: '310552',
    uf: 'MG',
    passwordHash,
    reviewedById: admin.id,
  });

  const now = new Date();
  const inThreeBusinessDays = new Date(now);
  inThreeBusinessDays.setDate(inThreeBusinessDays.getDate() + 5); // approx., illustrative seed data only

  await prisma.contentSubmission.upsert({
    where: { id: '74d86cb7-a066-43b1-9265-c3644144af8f' },
    update: {},
    create: {
      id: '74d86cb7-a066-43b1-9265-c3644144af8f',
      type: ContentType.EMERGENCY,
      status: SubmissionStatus.IN_REVIEW,
      title: 'Hemorragia externa em membro',
      authorId: paulo.id,
      submittedAt: now,
      dueAt: now, // "Vence hoje"
      payload: {
        title: 'Hemorragia externa em membro',
        categorySlug: 'hemorragias',
        severity: 'HIGH',
        summary: 'Controle de sangramento intenso em braços ou pernas.',
        warningText: 'Nunca remova objetos encravados no local do sangramento.',
        steps: [
          'Proteja-se com luvas ou um pano antes do contato com o sangue.',
          'Aplique pressão direta firme com um pano limpo sobre o local.',
          'Eleve o membro afetado acima do nível do coração, se não houver suspeita de fratura.',
          'Se o sangramento não parar, sobreponha outro pano sem remover o primeiro.',
          'Acione o SAMU (192) em sangramentos intensos ou que não parem.',
        ],
        dontDo: ['Remover objetos encravados', 'Usar torniquete sem necessidade extrema'],
        sourceLabel: 'SAMU 192',
      },
    },
  });

  await prisma.contentSubmission.upsert({
    where: { id: 'fb00cf1b-6b51-40a7-be83-608a2b91e862' },
    update: {},
    create: {
      id: 'fb00cf1b-6b51-40a7-be83-608a2b91e862',
      type: ContentType.TRACK,
      status: SubmissionStatus.IN_REVIEW,
      title: 'Atendimento inicial ao AVC',
      authorId: marina.id,
      submittedAt: now,
      dueAt: inThreeBusinessDays,
      payload: {
        title: 'Atendimento inicial ao AVC',
        categorySlug: 'avc',
        estimatedMinutes: 12,
        cards: [
          { title: 'O que é um AVC?', text: 'O Acidente Vascular Cerebral ocorre quando o fluxo de sangue para uma parte do cérebro é interrompido.' },
          { title: 'O teste SAMU', text: 'Sorriso, Abraço, Música/Mensagem e Urgência — os 4 passos para reconhecer um AVC rapidamente.' },
        ],
        questions: [
          {
            statement: 'Quanto tempo se tem, em média, para iniciar o tratamento ideal de um AVC?',
            options: ['Até 4h30', 'Até 24h', 'Até 48h', 'Não há prazo'],
            correctIndex: 0,
            explanation: 'A janela terapêutica ideal para trombólise é de até 4h30 do início dos sintomas.',
          },
        ],
        sourceLabel: 'Ministério da Saúde',
      },
    },
  });

  await prisma.contentSubmission.upsert({
    where: { id: '43d41a9a-a2c2-4c7f-821b-35e3a0c8d696' },
    update: {},
    create: {
      id: '43d41a9a-a2c2-4c7f-821b-35e3a0c8d696',
      type: ContentType.VIDEO,
      status: SubmissionStatus.IN_REVIEW,
      title: 'Uso do DEA em via pública',
      authorId: julia.id,
      submittedAt: now,
      dueAt: inThreeBusinessDays,
      payload: {
        title: 'Uso do DEA em via pública',
        categorySlug: 'parada-cardiorrespiratoria',
        youtubeVideo: 'vODy55Pk0T0',
        duration: '4:46',
        sourceLabel: 'AHA 2020',
      },
    },
  });

  await prisma.contentSubmission.upsert({
    where: { id: '7066042c-d9d6-41b5-9817-ca54cd463ce3' },
    update: {},
    create: {
      id: '7066042c-d9d6-41b5-9817-ca54cd463ce3',
      type: ContentType.VIDEO,
      status: SubmissionStatus.DRAFT,
      title: 'Posição lateral de segurança',
      authorId: marina.id,
      payload: {
        title: 'Posição lateral de segurança',
        categorySlug: 'convulsao',
        sourceLabel: 'Cruz Vermelha',
      },
    },
  });

  await prisma.contentSubmission.upsert({
    where: { id: 'ec57b978-5e5f-4d44-befa-8790bbb5a7b6' },
    update: {},
    create: {
      id: 'ec57b978-5e5f-4d44-befa-8790bbb5a7b6',
      type: ContentType.EMERGENCY,
      status: SubmissionStatus.CHANGES_REQUESTED,
      title: 'Queimadura química nos olhos',
      authorId: paulo.id,
      submittedAt: now,
      reviewerId: admin.id,
      reviewedAt: now,
      changeReasons: ['Fonte incorreta ou ausente'],
      reviewNote: 'Fonte incorreta ou ausente. Inclua o tempo mínimo de lavagem (15 minutos).',
      payload: {
        title: 'Queimadura química nos olhos',
        categorySlug: 'queimaduras',
        severity: 'CRITICAL',
        summary: 'Primeiros socorros para contato de produtos químicos com os olhos.',
        steps: [
          'Afaste a pessoa da fonte do produto químico.',
          'Lave o olho afetado com água limpa em abundância.',
          'Mantenha a pálpebra aberta durante a lavagem.',
          'Acione o SAMU (192) e encaminhe para atendimento oftalmológico de urgência.',
        ],
        dontDo: ['Tentar neutralizar o produto químico com outra substância'],
        sourceLabel: 'SAMU 192',
      },
    },
  });

  await seedPublishedEpistaxisSubmission(marina.id, admin.id);
}

async function seedApprovedProfessional(opts: {
  userId: string;
  profileId: string;
  name: string;
  email: string;
  council: ProfessionalCouncil;
  registrationNumber: string;
  uf: string;
  passwordHash: string;
  reviewedById: string;
}) {
  const user = await prisma.user.upsert({
    where: { email: opts.email },
    update: {},
    create: {
      id: opts.userId,
      name: opts.name,
      email: opts.email,
      passwordHash: opts.passwordHash,
      role: Role.HEALTH_PROFESSIONAL,
    },
  });

  await prisma.professionalProfile.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      id: opts.profileId,
      userId: user.id,
      council: opts.council,
      registrationNumber: opts.registrationNumber,
      uf: opts.uf,
      status: CredentialStatus.APPROVED,
      submittedAt: new Date(),
      reviewedAt: new Date(),
      reviewedById: opts.reviewedById,
    },
  });

  return user;
}

/** The one example submission that is already PUBLISHED — also materializes the real EmergencyProcedure, as admin approval would. */
async function seedPublishedEpistaxisSubmission(authorId: string, reviewedById: string) {
  const category = await prisma.category.upsert({
    where: { slug: 'hemorragias' },
    update: {},
    create: { name: 'Hemorragias', slug: 'hemorragias', description: 'Controle de sangramentos externos graves.' },
  });

  const submissionId = 'e160c6e6-2258-4b13-93f1-f6d1e1a26305';
  const procedureId = '13297eb1-d50c-407d-958e-dafb1a218323';
  const now = new Date();

  const payload = {
    title: 'Hemorragia nasal (epistaxe)',
    categorySlug: 'hemorragias',
    severity: 'MEDIUM',
    summary: 'Como estancar um sangramento nasal comum.',
    steps: [
      'Sente-se e incline a cabeça levemente para frente.',
      'Aperte as narinas firmemente por 10 minutos, respirando pela boca.',
      'Após 10 minutos, solte e verifique se o sangramento parou.',
      'Evite assoar o nariz nas próximas horas.',
      'Procure atendimento médico se o sangramento não parar em 20 minutos ou for muito intenso.',
    ],
    dontDo: ['Inclinar a cabeça para trás', 'Assoar o nariz durante o episódio'],
    sourceLabel: 'Cruz Vermelha',
  };

  await prisma.contentSubmission.upsert({
    where: { id: submissionId },
    update: {},
    create: {
      id: submissionId,
      type: ContentType.EMERGENCY,
      status: SubmissionStatus.PUBLISHED,
      title: payload.title,
      authorId,
      submittedAt: now,
      reviewerId: reviewedById,
      reviewedAt: now,
      checklist: { matchesSource: true, safeForLaypeople: true, clearLanguage: true, notDuplicate: true },
      publishedEntityId: procedureId,
      payload,
    },
  });

  const procedure = await prisma.emergencyProcedure.upsert({
    where: { id: procedureId },
    update: {},
    create: {
      id: procedureId,
      categoryId: category.id,
      title: payload.title,
      summary: payload.summary,
      coverImageUrl: '/static/images/procedures/hemorragia-nasal.svg',
      severityLevel: payload.severity,
      sourceReference: payload.sourceLabel,
      dontDoItems: payload.dontDo,
      origin: ContentOrigin.PROFESSIONAL,
      authorId,
      reviewedById,
      publishedAt: now,
      submissionId,
    },
  });

  const stepImages = [
    '/static/images/steps/inclinar-cabeca-frente.svg',
    '/static/images/steps/apertar-narinas.svg',
    '/static/images/steps/verificar-sangramento.svg',
    '/static/images/steps/nao-assoar-nariz.svg',
    '/static/images/steps/atendimento-medico.svg',
  ];

  for (const [index, instruction] of payload.steps.entries()) {
    await prisma.procedureStep.upsert({
      where: { procedureId_stepNumber: { procedureId: procedure.id, stepNumber: index + 1 } },
      update: {},
      create: {
        procedureId: procedure.id,
        stepNumber: index + 1,
        title: `Passo ${index + 1}`,
        instruction,
        imageUrl: stepImages[index],
      },
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
