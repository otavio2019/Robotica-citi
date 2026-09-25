ALTER TABLE "TechnicalResponsible" ALTER COLUMN "document" DROP NOT NULL;
ALTER TABLE "TechnicalResponsible" ALTER COLUMN "institutionId" DROP NOT NULL;
ALTER TABLE "Competitor" ALTER COLUMN "documentPath" DROP NOT NULL;
ALTER TABLE "Competitor" DROP COLUMN IF EXISTS "inepCode";
ALTER TABLE "Competitor" DROP COLUMN IF EXISTS "email";
ALTER TABLE "Competitor" DROP COLUMN IF EXISTS "phone";
-- Remove o default enum antes da conversão para texto.
-- Isso evita que o PostgreSQL bloqueie a alteração por causa do cast automático.
ALTER TABLE "Institution" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "Institution" ALTER COLUMN "type" TYPE TEXT USING "type"::text;
DROP TYPE IF EXISTS "InstitutionType";
ALTER TABLE "Institution" ALTER COLUMN "type" SET DEFAULT 'GARAGE';
ALTER TABLE "Team" ADD COLUMN IF NOT EXISTS "state" TEXT NOT NULL DEFAULT 'PB';
ALTER TABLE "Team" ADD COLUMN IF NOT EXISTS "city" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Team" ADD COLUMN IF NOT EXISTS "level" TEXT NOT NULL DEFAULT 'LEVEL_1';
ALTER TABLE "Team" ADD COLUMN IF NOT EXISTS "modalities" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Team" ADD COLUMN IF NOT EXISTS "acceptedDeclaration" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Team" ADD COLUMN IF NOT EXISTS "acceptedAt" TIMESTAMP(3);
ALTER TABLE "Team" ALTER COLUMN "institutionId" DROP NOT NULL;
ALTER TABLE "Team" ALTER COLUMN "memberCount" SET DEFAULT 4;
