import { Client } from 'minio';
import { randomUUID } from 'crypto';
import { env } from '../config/env';

// O cliente usa as mesmas credenciais e endpoint definidos para o ambiente atual.
export const minioClient = new Client({
  endPoint: env.MINIO_ENDPOINT,
  port: env.MINIO_PORT,
  useSSL: env.MINIO_USE_SSL,
  accessKey: env.MINIO_ACCESS_KEY,
  secretKey: env.MINIO_SECRET_KEY,
});

export async function ensureBucketExists(bucketName: string) {
  // A operação é idempotente e permite iniciar o ambiente sem provisionamento manual.
  const exists = await minioClient.bucketExists(bucketName);
  if (!exists) {
    await minioClient.makeBucket(bucketName, 'us-east-1');
  }
}

export async function removeDocument(bucketName: string, objectName: string) {
  await minioClient.removeObject(bucketName, objectName);
}

export async function uploadDocument(file: Express.Multer.File, bucketName: string) {
  // O UUID impede colisões e não expõe o nome original no caminho persistido.
  await ensureBucketExists(bucketName);

  const extension = file.originalname.split('.').pop()?.toLowerCase() ?? 'bin';
  const objectName = `${randomUUID()}.${extension}`;

  await minioClient.putObject(bucketName, objectName, file.buffer, file.buffer.length, {
    'Content-Type': file.mimetype || 'application/octet-stream',
    'x-amz-meta-originalname': file.originalname,
  });

  return {
    objectName,
    bucketName,
    originalName: file.originalname,
    contentType: file.mimetype || 'application/octet-stream',
  };
}

export async function deleteDocument(bucketName: string, objectName: string) {
  // A limpeza é best-effort: falhar aqui não deve mascarar o erro original da inscrição.
  try {
    await removeDocument(bucketName, objectName);
  } catch {
    // Intencionalmente ignorado para limpar parcialmente em caso de falha.
  }
}
