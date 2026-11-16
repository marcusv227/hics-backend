# 🩺 HICS Backend

<div align="center">

**API REST do HICS (Hub Integrado de Capacitação em Saúde) — autenticação, conteúdo de primeiros socorros, pipeline de revisão por profissionais de saúde e chat de orientação**

![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?style=flat-square&logo=nestjs&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=flat-square&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)

</div>

---

## 📋 Sobre o projeto

Backend do app móvel HICS: cadastro/login, catálogo de condutas de emergência, trilhas de treinamento com quiz, vídeos educativos, busca unificada e um chat de orientação (proxy para um fluxo de RAG no n8n).

A partir daí, qualquer profissional de saúde com registro verificado (CRM/COREN/CREFITO/CRF) pode enviar suas próprias condutas, trilhas e vídeos. Cada submissão passa por um admin — checklist clínico de 4 itens, aprovação ou pedido de ajustes — antes de virar conteúdo publicado de verdade, carregando a autoria de quem escreveu.

### ✨ Principais funcionalidades

- 🔐 **Autenticação JWT** (access + refresh) com papéis `USER` / `HEALTH_PROFESSIONAL` / `ADMIN`
- 🚑 **Condutas, trilhas e vídeos** — CRUD de leitura público, com categorias e busca unificada
- 🪪 **Verificação profissional** — registro no conselho + upload de comprovante (S3/MinIO ou disco local), com retenção de 90 dias (LGPD)
- 📝 **Pipeline de submissão de conteúdo** — rascunho ou envio para revisão, validação de payload por tipo (conduta/trilha/vídeo)
- ✅ **Revisão administrativa** — fila de pendentes/concluídas, checklist clínico, aprovar (materializa o conteúdo publicado) ou pedir ajustes com motivo
- 🔔 **Notificações in-app** — aprovação/rejeição de credencial, publicação/ajuste de conteúdo
- 💬 **Chat de orientação** — sessões persistidas, proxy para um agente de RAG no n8n
- 🖼️ **Assets estáticos** — ilustrações SVG de procedimentos/passos servidas em `/static/*`
- 🚦 **Rate limiting** global (120 req/min) e Swagger protegido por Basic Auth em produção
- 📜 **Audit log** de ações administrativas (aprovação/rejeição de credencial e conteúdo)

---

## 🛠️ Tecnologias utilizadas

![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Jest](https://img.shields.io/badge/Jest-C21325?style=for-the-badge&logo=jest&logoColor=white)

- **NestJS 11** + TypeScript, **Prisma 6** + PostgreSQL 16
- **JWT** (access + refresh) via `passport-jwt` + `bcrypt`; `RolesGuard`/`@Roles()` para `ADMIN`, `VerifiedProfessionalGuard` para criação de conteúdo
- **class-validator / class-transformer** nos DTOs de entrada
- **@nestjs/throttler** — rate limiting global
- **Armazenamento de documentos** abstraído (`DocumentStorage`): S3-compatível (MinIO) em produção, disco local em dev sem Docker
- **Swagger/OpenAPI** em `/api/docs` (Basic Auth quando `NODE_ENV=production`)
- **Docker Compose** — Postgres dedicado (isolado do banco `pgvector` do n8n), MinIO + bootstrap do bucket, e a própria API
- **Jest** — testes unitários e e2e

---

## 🗂️ Módulos e rotas

| Módulo | Rotas | Descrição |
|---|---|---|
| `auth` | `/api/v1/auth/*` | Cadastro (com role opcional), login, perfil |
| `emergencies` | `/api/v1/emergencies/*` | Categorias e guias de emergência passo a passo (só conteúdo publicado) |
| `trainings` | `/api/v1/trainings/*` | Trilhas, cards, quiz com cálculo de score |
| `videos` | `/api/v1/videos` | Catálogo de vídeos educativos |
| `search` | `/api/v1/search` | Busca unificada (condutas, trilhas, vídeos) |
| `chat` | `/api/v1/chat/*` | Sessões de chat e proxy para o agente de RAG no n8n |
| `professionals` | `/api/v1/professionals/me/credential*` | Consulta/edição do registro profissional e upload do comprovante |
| `submissions` | `/api/v1/submissions*` | Criar/consultar submissões de conteúdo (exige credencial aprovada) |
| `admin` (submissions) | `/api/v1/admin/submissions/*` | Fila de revisão, checklist, aprovar/pedir ajustes (role `ADMIN`) |
| `admin` (credentials) | `/api/v1/admin/credentials/*` | Fila de credenciais, link assinado pro documento, aprovar/rejeitar (role `ADMIN`) |
| `notifications` | `/api/v1/notifications/*` | Notificações do usuário logado, marcar como lida(s) |

---

## 🚀 Como rodar

### Com Docker (recomendado)

```bash
cp .env.example .env   # preencha os valores
docker compose up -d --build
```

Sobe três serviços: `postgres-app` (Postgres 16 na porta `5433`, isolado do banco do n8n), `minio` (armazenamento S3-compatível dos documentos de credencial) e `api` (porta `3000`) — migrations do Prisma aplicadas automaticamente no boot.

Popule o banco com dados de exemplo:

```bash
npm run prisma:seed
```

### Localmente (sem Docker)

```bash
npm install
npx prisma migrate dev
npm run prisma:seed
npm run start:dev
```

Sem `S3_ENDPOINT` configurado, o armazenamento de documentos cai automaticamente para disco local (`storage/`).

### Criar um usuário admin

```bash
npm run create-admin
```

---

## ⚙️ Variáveis de ambiente

Veja `.env.example`. Principais:

- `DATABASE_URL` — Postgres dedicado da API
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — segredos dos tokens
- `N8N_WEBHOOK_CHAT_URL` — webhook do agente de chat no n8n
- `SWAGGER_USER` / `SWAGGER_PASSWORD` — protegem `/api/docs` via Basic Auth em produção
- `S3_ENDPOINT` / `S3_BUCKET` / `S3_ACCESS_KEY` / `S3_SECRET_KEY` — MinIO; deixe `S3_ENDPOINT` vazio para usar disco local

---

## 📖 Documentação da API

Swagger UI em `/api/docs` (Basic Auth em produção). Schema OpenAPI completo em `/api/docs-json`.

---

## 🧪 Testes

```bash
npm run test        # unitários
npm run test:e2e    # end-to-end
npm run test:cov    # com cobertura
```

---

## 📜 Licença

Projeto privado (`UNLICENSED`) — uso restrito ao time do HICS.

---

## 👤 Autor

**Marcus Vinicius**

- GitHub: [@marcusv227](https://github.com/marcusv227)

---

<div align="center">

Feito com ❤️ e NestJS

</div>
