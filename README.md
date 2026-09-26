# Cadastro TJR — Robótica CiTI-DE

Sistema de inscrição de equipes para o **Torneio Juvenil de Robótica (TJR)**. O projeto possui frontend Next.js, API Express, PostgreSQL com Prisma e armazenamento de identidades no MinIO.

## Regras atuais do cadastro

- A instituição/escola deve ser obrigatoriamente de **Patos-PB**.
- Nome e CNPJ da instituição são obrigatórios.
- O código INEP da instituição é opcional; quando não informado, a equipe é classificada como **equipe de garagem**.
- Cada equipe deve possuir **3 ou 4 competidores**.
- A modalidade disponível é somente **Seguir Linha**.
- O campo de **nível foi removido** do formulário e das validações.
- Cada competidor deve ter no máximo **19 anos na data da competição**.
- A identidade de cada competidor é obrigatória em PDF, JPG, JPEG ou PNG, com limite de 5 MB.
- O responsável pelo marketing é opcional.
- A autorização de uso de imagem é obrigatória e aparece na primeira etapa do formulário.
- A declaração de veracidade também é obrigatória antes do envio.

As regras são verificadas no frontend para orientar o usuário e novamente no backend, porque dados enviados pelo navegador nunca são considerados confiáveis.

## Arquitetura

```text
Frontend Next.js :3033
        |
        v
API Express :3339
   |             |
   v             v
PostgreSQL     MinIO
 :5432         :9020
```

### Tecnologias

- **Frontend:** Next.js 16, React 19, TypeScript e Tailwind CSS 4.
- **Backend:** Express 5, Node.js e TypeScript.
- **Banco de dados:** PostgreSQL 16 com Prisma 5.
- **Documentos:** MinIO, bucket `identidades`.
- **Infraestrutura:** Docker Compose.

## Execução com Docker

Pré-requisitos:

- Docker;
- Docker Compose.

Na raiz do projeto, execute:

```bash
docker compose up -d --build
```

Verifique os serviços:

```bash
docker compose ps
curl http://localhost:3339/health
```

Acesse:

- Formulário: http://localhost:3033
- API: http://localhost:3339
- Health check: http://localhost:3339/health
- MinIO API: http://localhost:9020
- MinIO Console: http://localhost:9021

O container do backend executa `prisma migrate deploy` antes de iniciar a API. Os serviços dependem dos health checks do PostgreSQL e do MinIO.

Para acompanhar os logs:

```bash
docker compose logs -f backend
```

Para desligar sem apagar os dados:

```bash
docker compose down
```

Para apagar também os volumes do PostgreSQL e do MinIO — use somente quando isso for intencional:

```bash
docker compose down -v
```

## Execução sem Docker

Suba PostgreSQL e MinIO por outros meios e crie os arquivos de ambiente:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
```

Backend:

```bash
cd backend
npm ci
npm run prisma:generate
npm run prisma:deploy
npm run dev
```

Frontend, em outro terminal:

```bash
cd frontend
npm ci
npm run dev
```

## API

### `GET /health`

Verifica PostgreSQL e MinIO. Quando ambos estão disponíveis, retorna:

```json
{
  "success": true,
  "status": "ok",
  "dependencies": {
    "database": "ok",
    "minio": "ok"
  }
}
```

Caso uma dependência esteja indisponível, retorna HTTP 503.

### `POST /registrations`

Recebe `multipart/form-data` com:

- `data`: JSON da inscrição;
- `documents`: 3 ou 4 arquivos de identidade, na mesma ordem dos competidores.

Exemplo de dados:

```json
{
  "stage": {
    "name": "TJR — Paraíba",
    "state": "PB",
    "venue": "Ginásio Municipal",
    "competitionDate": "2026-10-01"
  },
  "institution": {
    "name": "Escola Exemplo",
    "cnpj": "12.345.678/0001-90",
    "inepCode": "25000000",
    "city": "Patos",
    "instagramUrl": "https://instagram.com/escola",
    "isPatos": true
  },
  "responsible": {
    "fullName": "Maria da Silva",
    "document": "12345678900",
    "inepCode": "25000000",
    "institutionName": "Escola Exemplo",
    "email": "maria@email.com",
    "phone": "83999999999"
  },
  "team": {
    "name": "Equipe Exemplo",
    "state": "PB",
    "city": "Patos",
    "modalities": ["SEGUIR_LINHA"],
    "isGarage": false,
    "marketingCompetitorIndex": 0
  },
  "competitors": [
    {
      "name": "Ana",
      "inepCode": "25000001",
      "birthDate": "2010-01-10",
      "city": "Patos",
      "email": "ana@email.com",
      "phone": "83999999991"
    },
    {
      "name": "Bruno",
      "inepCode": "25000002",
      "birthDate": "2010-02-11",
      "city": "Patos",
      "email": "bruno@email.com",
      "phone": "83999999992"
    },
    {
      "name": "Caio",
      "inepCode": "25000003",
      "birthDate": "2010-03-12",
      "city": "Patos",
      "email": "caio@email.com",
      "phone": "83999999993"
    }
  ],
  "imageUseConsent": true,
  "acceptedDeclaration": true
}
```

A API grava instituição, técnico, equipe e competidores em uma transação Prisma. Os arquivos são enviados ao MinIO; caso a transação falhe após algum upload, os objetos enviados são removidos.

### `GET /registrations/:id` e `GET /teams/:id`

Consultam uma equipe pelo ID. Essas rotas ainda retornam dados pessoais e devem receber autenticação e autorização antes de serem expostas publicamente.

## Migrações

As migrations ficam em `backend/prisma/migrations` e são aplicadas automaticamente pelo container do backend.

A migration mais recente:

```text
20260925215000_seguir_linha_sem_nivel
```

Ela torna o campo legado de nível opcional para manter compatibilidade com registros antigos. O formulário e as validações atuais não utilizam mais esse campo.

## Validação local

Backend:

```bash
cd backend
npm test
npm run lint
npm run build
npm run prisma:validate
```

Frontend:

```bash
cd frontend
npm run lint
npm run build
```

## Segurança e produção

As credenciais no Compose são apenas para desenvolvimento local. Em produção:

- troque as credenciais do PostgreSQL e MinIO;
- use HTTPS;
- restrinja `CORS_ORIGIN` às origens conhecidas;
- adicione autenticação e autorização às rotas de consulta;
- configure backup dos volumes e do bucket de documentos;
- não exponha o console do MinIO publicamente sem proteção.

## Estado do projeto

O fluxo principal de inscrição está implementado e validado com testes de regras, lint, build do backend, build do frontend e validação do schema Prisma.
