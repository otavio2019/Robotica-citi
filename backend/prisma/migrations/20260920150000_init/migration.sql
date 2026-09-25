-- CreateEnum
CREATE TYPE "InstitutionType" AS ENUM ('EDUCATIONAL', 'GARAGE');

-- CreateTable
CREATE TABLE "Institution" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cnpj" TEXT,
    "inepCode" TEXT,
    "city" TEXT,
    "instagramUrl" TEXT,
    "isPatos" BOOLEAN NOT NULL DEFAULT false,
    "type" "InstitutionType" NOT NULL DEFAULT 'GARAGE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Institution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechnicalResponsible" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "document" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "inepCode" TEXT,
    "institutionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TechnicalResponsible_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "memberCount" INTEGER NOT NULL,
    "institutionId" TEXT NOT NULL,
    "responsibleId" TEXT NOT NULL,
    "marketingCompetitorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Competitor" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "documentPath" TEXT NOT NULL,
    "inepCode" TEXT,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "city" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "isMarketingLeader" BOOLEAN NOT NULL DEFAULT false,
    "teamId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Competitor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Institution_cnpj_key" ON "Institution"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "Institution_inepCode_key" ON "Institution"("inepCode");

-- CreateIndex
CREATE UNIQUE INDEX "TechnicalResponsible_document_key" ON "TechnicalResponsible"("document");

-- CreateIndex
CREATE UNIQUE INDEX "TechnicalResponsible_email_key" ON "TechnicalResponsible"("email");

-- CreateIndex
CREATE UNIQUE INDEX "TechnicalResponsible_institutionId_key" ON "TechnicalResponsible"("institutionId");

-- CreateIndex
CREATE INDEX "Team_institutionId_idx" ON "Team"("institutionId");

-- CreateIndex
CREATE INDEX "Team_responsibleId_idx" ON "Team"("responsibleId");

-- CreateIndex
CREATE UNIQUE INDEX "Team_marketingCompetitorId_key" ON "Team"("marketingCompetitorId");

-- CreateIndex
CREATE INDEX "Competitor_teamId_idx" ON "Competitor"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "Competitor_teamId_email_key" ON "Competitor"("teamId", "email");

-- AddForeignKey
ALTER TABLE "TechnicalResponsible" ADD CONSTRAINT "TechnicalResponsible_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "TechnicalResponsible"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_marketingCompetitorId_fkey" FOREIGN KEY ("marketingCompetitorId") REFERENCES "Competitor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Competitor" ADD CONSTRAINT "Competitor_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
