import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { Prisma } from '@prisma/client';
import { env } from './config/env';
import { prisma } from './lib/prisma';
import { uploadDocument, deleteDocument, ensureBucketExists } from './lib/minio';
import { AppError, errorHandler, notFoundHandler } from './middleware/errorHandler';
import { RegistrationPayload, validateRegistration } from './business/registrationRules';

const app = express();
const allowedMimeTypes = new Set(['application/pdf', 'image/jpeg', 'image/png']);
const allowedExtensions = new Set(['pdf', 'jpg', 'jpeg', 'png']);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 4 },
  fileFilter: (_req, file, callback) => {
    const extension = file.originalname.split('.').pop()?.toLowerCase();
    if (allowedMimeTypes.has(file.mimetype) && extension && allowedExtensions.has(extension)) callback(null, true);
    else callback(new AppError('Arquivo inválido. Envie PDF, JPG, JPEG ou PNG'));
  },
});
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', async (_req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    await ensureBucketExists(env.MINIO_BUCKET);
    res.json({ success: true, status: 'ok', dependencies: { database: 'ok', minio: 'ok' } });
  } catch (error) {
    next(new AppError(`Serviço indisponível: ${error instanceof Error ? error.message : 'database ou MinIO'}`, 503));
  }
});

async function findTeam(id: string) {
  return prisma.team.findUnique({ where: { id }, include: { institution: true, responsible: true, competitors: true } });
}
app.get('/teams/:id', async (req, res, next) => {
  try { const team = await findTeam(req.params.id); if (!team) throw new AppError('Equipe não encontrada', 404); res.json({ success: true, data: team }); }
  catch (error) { next(error); }
});
app.get('/registrations/:id', async (req, res, next) => {
  try { const team = await findTeam(req.params.id); if (!team) throw new AppError('Inscrição não encontrada', 404); res.json({ success: true, data: team }); }
  catch (error) { next(error); }
});

app.post('/registrations', (req, res, next) => upload.array('documents', 4)(req, res, (uploadError) => {
  if (uploadError) return next(uploadError instanceof AppError ? uploadError : new AppError('Arquivo inválido ou maior que 5 MB'));
  return registrationHandler(req, res, next);
}));

async function registrationHandler(req: express.Request, res: express.Response, next: express.NextFunction) {
  const files = (req.files ?? []) as Express.Multer.File[];
  const uploaded: Array<{ bucket: string; objectName: string }> = [];
  try {
    let rawData: RegistrationPayload;
    try { rawData = typeof req.body?.data === 'string' ? JSON.parse(req.body.data) : req.body; }
    catch { throw new AppError('O campo data deve conter JSON válido'); }
    const registration = validateRegistration(rawData, files.length);
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const institution = registration.hasInstitution ? await tx.institution.create({
        data: {
          name: rawData.institution!.name!.trim(),
          cnpj: rawData.institution!.cnpj!.trim(),
          inepCode: rawData.institution!.inepCode?.trim() || null,
          city: rawData.institution!.city?.trim() || null,
          instagramUrl: rawData.institution!.instagramUrl?.trim() || null,
          isPatos: rawData.institution!.isPatos === true,
          type: registration.isGarage ? 'GARAGE' : 'EDUCATIONAL',
        },
      }) : null;
      const responsible = await tx.technicalResponsible.create({
        data: {
          fullName: rawData.responsible!.fullName!.trim(),
          document: rawData.responsible!.document!.trim(),
          inepCode: rawData.responsible!.inepCode?.trim() || null,
          institutionName: rawData.responsible!.institutionName?.trim() || null,
          email: rawData.responsible!.email!.trim().toLowerCase(),
          phone: rawData.responsible!.phone!.trim(),
          institutionId: institution?.id,
        },
      });
      const team = await tx.team.create({
        data: {
          name: rawData.team!.name!.trim(), state: rawData.team!.state!.trim().toUpperCase(), city: rawData.team!.city!.trim(),
          modalities: rawData.team!.modalities!, memberCount: rawData.competitors!.length,
          isGarage: registration.isGarage, institutionId: institution?.id, responsibleId: responsible.id,
          acceptedDeclaration: true, imageUseConsent: rawData.imageUseConsent === true, acceptedAt: new Date(), stageName: rawData.stage!.name!.trim(), stageState: rawData.stage!.state!.trim().toUpperCase(),
          stageVenue: rawData.stage!.venue!.trim(), competitionDate: new Date(rawData.stage!.competitionDate!),
        },
      });
      const competitors = [];
      for (const [index, competitor] of rawData.competitors!.entries()) {
        const meta = await uploadDocument(files[index], env.MINIO_BUCKET);
        uploaded.push({ bucket: meta.bucketName, objectName: meta.objectName });
        competitors.push(await tx.competitor.create({ data: {
          fullName: competitor.name!.trim(), documentPath: `${meta.bucketName}/${meta.objectName}`,
          inepCode: competitor.inepCode?.trim() || null, birthDate: new Date(competitor.birthDate!), city: competitor.city!.trim(),
          email: competitor.email!.trim().toLowerCase(), phone: competitor.phone!.trim(), teamId: team.id,
        } }));
      }
      const marketingIndex = rawData.team!.marketingCompetitorIndex;
      if (marketingIndex !== null && marketingIndex !== undefined) await tx.team.update({ where: { id: team.id }, data: { marketingCompetitorId: competitors[marketingIndex].id } });
      return { team, institution, responsible, competitors };
    });
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    await Promise.all(uploaded.map((file) => deleteDocument(file.bucket, file.objectName)));
    next(error);
  }
}
app.use(notFoundHandler);
app.use(errorHandler);
if (require.main === module) app.listen(env.PORT, () => console.log(`Backend running at http://localhost:${env.PORT}`));
export default app;
