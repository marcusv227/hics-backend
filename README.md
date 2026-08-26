# HICS Backend

API REST do **HICS (Hub Integrado de Capacitação em Saúde)** — backend do aplicativo móvel de primeiros socorros e capacitação em saúde. Construído com NestJS, Prisma e PostgreSQL, com um chatbot de orientação (RAG) integrado via n8n.

## Stack

- **NestJS 11** + TypeScript
- **Prisma 6** + PostgreSQL 16
- **JWT** (access + refresh tokens) com `passport-jwt` e `bcrypt`
- **Swagger / OpenAPI** em `/api/docs`
- **Docker Compose** (API + Postgres dedicado, isolado do banco `pgvector` usado pelo n8n)
- Proxy para um agente n8n via `@nestjs/axios` para o chat de orientação

## Módulos

| Módulo | Rotas | Descrição |
|---|---|---|
| `auth` | `/api/v1/auth/*` | Cadastro, login, perfil (JWT) |
| `emergencies` | `/api/v1/emergencies/*` | Categorias e guias de emergência passo a passo |
| `trainings` | `/api/v1/trainings/*` | Trilhas de treinamento, cards e quizzes com cálculo de score |
| `chat` | `/api/v1/chat/*` | Sessões de atendimento e proxy para o agente n8n |
| `search` | `/api/v1/search` | Busca unificada (procedimentos, trilhas, vídeos) |
| `videos` | `/api/v1/videos` | Catálogo de vídeos educativos |

## Como rodar

### Com Docker (recomendado)

```bash
cp .env.example .env   # preencha os valores
docker compose up -d --build
```

Isso sobe dois containers: `postgres-app` (Postgres 16 na porta `5433`, isolado do banco do n8n) e `api` (porta `3000`), aplicando as migrations do Prisma automaticamente no boot.

Popule o banco com dados de exemplo (procedimentos de primeiros socorros, trilha de treinamento):

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

## Variáveis de ambiente

Veja `.env.example`. Principais:

- `DATABASE_URL` — Postgres dedicado da API (não é o banco `pgvector` do n8n)
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — segredos dos tokens
- `N8N_WEBHOOK_CHAT_URL` — webhook do agente de chat no n8n
- `SWAGGER_USER` / `SWAGGER_PASSWORD` — protegem `/api/docs` via Basic Auth quando `NODE_ENV=production`

## Documentação da API

Swagger UI disponível em `/api/docs` (protegido por Basic Auth em produção). O schema OpenAPI completo fica em `/api/docs-json`.

## Scripts úteis

```bash
npm run prisma:migrate   # nova migration em dev
npm run prisma:deploy    # aplica migrations pendentes (produção)
npm run prisma:studio    # Prisma Studio
npm run prisma:seed      # popular dados de exemplo
npm run build             # build de produção
npm run test               # testes unitários
npm run test:e2e           # testes e2e
```
