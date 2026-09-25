# Inscrição TJR — Robótica

Sistema de inscrição para o **Torneio Juvenil de Robótica (TJR)**. A aplicação possui um formulário Next.js, uma API Express, persistência PostgreSQL via Prisma e suporte opcional a documentos no MinIO.

## Estado atual

A auditoria realizada em **25/09/2026** encontrou e corrigiu os problemas de documentação, configuração, migração e dependências identificados no código publicado.

Verificações realizadas após as correções:

- Backend: testes, lint e build aprovados.
- Frontend: lint e build aprovados.
- Prisma: schema validado com `DATABASE_URL` definida.
- Lockfiles: `npm ci --dry-run` aprovado para backend e frontend.
- Dependências: overrides adicionados para as vulnerabilidades transitivas do MinIO.
- Docker: não foi executado neste ambiente porque o Docker CLI não está instalado.

## Arquitetura

- **Frontend:** Next.js 16, React 19, TypeScript e Tailwind CSS 4.
- **Backend:** Express 5, Node.js e TypeScript.
- **Banco:** PostgreSQL com Prisma 5.
- **Arquivos:** MinIO opcional para documentos de identidade.
- **Infraestrutura local:** Docker Compose para PostgreSQL e MinIO.

O frontend envia JSON para `POST /registrations`. O backend repete todas as validações porque dados enviados pelo navegador nunca são confiáveis. A transação Prisma grava responsável, equipe e quatro integrantes de forma consistente. Quando documentos são enviados, os objetos do MinIO são removidos caso a gravação falhe depois do upload.

## Fluxo do formulário

1. Dados da etapa: nome, estado, local e data da competição.
2. Técnico ou responsável: nome, e-mail e telefone.
3. Equipe: nome, estado, cidade e nível.
4. Modalidades: uma ou mais opções do catálogo TJR.
5. Integrantes: exatamente quatro nomes e datas de nascimento.
6. Confirmação: declaração de veracidade e aceite obrigatório.

O nível é conferido pela idade do integrante mais velho na data da competição:

| Nível | Idade máxima do integrante mais velho |
|---|---:|
| Nível 1 | 9 anos |
| Nível 2 | 11 anos |
| Nível 3 | 14 anos |
| Nível 4 | 19 anos |

As faixas devem ser confirmadas contra o regulamento oficial do TJR antes de uma publicação definitiva.

## Configuração

Crie `backend/.env` a partir de `backend/.env.example`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/robotica?schema=public
PORT=3339
CORS_ORIGIN=http://localhost:3033
MINIO_ENDPOINT=localhost
MINIO_PORT=9020
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_USE_SSL=false
MINIO_BUCKET=identidades
```

Para o frontend, crie `frontend/.env.local` somente se a API não estiver em `http://localhost:3339`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3339
```

Em produção, substitua todas as credenciais de exemplo, limite o CORS a origens conhecidas e use HTTPS.

## Docker e execução local

Suba PostgreSQL e MinIO sem apagar os volumes existentes:

```bash
docker compose pull
docker compose up -d --remove-orphans --wait
docker compose ps
```

Aplique as migrações e execute a API:

```bash
cd backend
npm ci
npm run prisma:generate
npm run prisma:validate
npm run prisma:deploy
npm run dev
```

Em outro terminal, execute o frontend:

```bash
cd frontend
npm ci
npm run dev
```

Acesse:

- Frontend: `http://localhost:3033`
- API: `http://localhost:3339`
- Health check: `http://localhost:3339/health`
- MinIO API: `http://localhost:9020`
- MinIO Console: `http://localhost:9021`

Não use `docker compose down -v` em um ambiente com dados importantes. O parâmetro `-v` remove os volumes do PostgreSQL e do MinIO.

## Scripts de validação

Backend:

```bash
cd backend
npm ci
npm test
npm run lint
npm run build
npm run prisma:validate
```

Frontend:

```bash
cd frontend
npm ci
npm run lint
npm run build
```

A validação do Prisma exige que `DATABASE_URL` esteja definida. O comando `npm run prisma:validate` já informa explicitamente o schema correto.

## API

### `GET /health`

Consulta o PostgreSQL e retorna HTTP 200 quando a API está pronta. Retorna HTTP 503 quando a dependência não está acessível.

### `POST /registrations`

Recebe JSON ou multipart com os dados no campo `data`. Documentos são opcionais; quando enviados, devem ser quatro arquivos PDF, JPG, JPEG ou PNG de até 5 MB cada.

Payload mínimo:

```json
{
  "stage": {
    "name": "TJR — Paraíba",
    "state": "PB",
    "venue": "Ginásio Municipal",
    "competitionDate": "2026-10-01"
  },
  "responsible": {
    "fullName": "Maria da Silva",
    "email": "maria@email.com",
    "phone": "88999999999"
  },
  "team": {
    "name": "Equipe A",
    "state": "PB",
    "city": "Patos",
    "level": "LEVEL_4",
    "modalities": ["SUMO", "VCT"]
  },
  "competitors": [
    { "name": "Ana", "birthDate": "2010-01-10" },
    { "name": "Bruno", "birthDate": "2010-02-11" },
    { "name": "Caio", "birthDate": "2010-03-12" },
    { "name": "Duda", "birthDate": "2010-04-13" }
  ],
  "acceptedDeclaration": true
}
```

### `GET /registrations/:id` e `GET /teams/:id`

Consultam uma equipe pelo ID e retornam responsável e integrantes. Antes de disponibilizar essas rotas publicamente, implemente autenticação e autorização, pois elas retornam dados pessoais.

## Migrações

A migração `backend/prisma/migrations/20260924200000_tjr_registration/migration.sql` adapta o banco para o TJR. Ela torna documentos e vínculo institucional opcionais, adiciona estado, cidade, nível, modalidades e aceite da declaração, além de remover colunas antigas que não fazem parte do formulário.

A migração remove o default do enum institucional antes de converter a coluna para texto e só depois remove o tipo enum. Essa ordem evita falha de cast no PostgreSQL.

## Comentários no código

O código foi comentado nas decisões que exigem contexto para manutenção:

- regras de faixa etária e catálogo de modalidades;
- diferença entre validação de interface e validação confiável da API;
- readiness check do PostgreSQL;
- transação e limpeza compensatória do MinIO;
- reuso do cliente Prisma durante hot reload;
- contrato de erros HTTP;
- propósito das entidades no schema Prisma;
- estados e etapas do formulário React;
- configuração de ambiente e metadados da aplicação.

Os comentários explicam decisões e invariantes. Eles não repetem literalmente cada instrução da linguagem, porque comentários redundantes aumentam o custo de manutenção.

## Dependências e segurança

O backend mantém o MinIO na versão declarada pelo projeto e aplica overrides no `package.json` para corrigir as versões transitivas vulneráveis de `decode-uri-component` e `stream-json`. Após qualquer atualização de dependências, execute:

```bash
cd backend
npm ci
npm audit --omit=dev --audit-level=moderate
```

As credenciais padrão do Compose são somente para desenvolvimento local. Não reutilize `postgres/postgres` ou `minioadmin/minioadmin` em produção.

## Limitações conhecidas

O MVP ainda não possui autenticação, painel administrativo, exportação, alteração de inscrição, status operacional ou catálogo persistido de etapas. As faixas etárias do nível dependem de confirmação no regulamento oficial. A integração real com PostgreSQL e MinIO precisa ser testada em uma máquina com Docker ou serviços equivalentes.

## Referências

[1]: https://github.com/otavio2019/Robotica "Repositório do projeto Robótica no GitHub"

## Cadastro institucional TJR — atualização

O cadastro atual contempla instituição/escola, equipe de garagem, técnico responsável e de 3 a 4 competidores. Para cada competidor, a identidade é obrigatória em PDF, JPG, JPEG ou PNG, com limite de 5 MB. Quando o código INEP da instituição não é informado, a equipe é classificada automaticamente como garagem.

A instituição, o técnico, a equipe, os dados da etapa e os competidores são persistidos na mesma transação. O competidor responsável pelo marketing é opcional e fica associado à equipe quando selecionado.

## Ligações do ambiente local

A ligação entre as partes funciona assim:

```text
Frontend (localhost:3033) -> API Express (localhost:3339)
                                  |-> PostgreSQL (localhost:5432)
                                  |-> MinIO (localhost:9020)
```

Prepare o ambiente uma vez:

```bash
docker compose up -d --remove-orphans
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local

cd backend
npm ci
npm run prisma:generate
npm run prisma:deploy
npm run dev
```

Em outro terminal:

```bash
cd frontend
npm ci
npm run dev
```

Verifique as ligações em `http://localhost:3339/health`. O retorno esperado contém `database: "ok"` e `minio: "ok"`. O formulário envia o campo JSON `data` e os quatro arquivos no campo multipart `documents`; a API grava os dados no PostgreSQL e as identidades no bucket `identidades` do MinIO.
