import dotenv from 'dotenv';

dotenv.config();

// Todas as configurações ficam centralizadas para evitar valores divergentes
// entre a API, o cliente Prisma e o cliente MinIO.
export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: Number(process.env.PORT ?? 3339),
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? 'http://localhost:3033',
  DATABASE_URL: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/robotica?schema=public',
  MINIO_ENDPOINT: process.env.MINIO_ENDPOINT ?? 'localhost',
  MINIO_PORT: Number(process.env.MINIO_PORT ?? 9020),
  MINIO_ACCESS_KEY: process.env.MINIO_ACCESS_KEY ?? 'minioadmin',
  MINIO_SECRET_KEY: process.env.MINIO_SECRET_KEY ?? 'minioadmin',
  MINIO_USE_SSL: process.env.MINIO_USE_SSL === 'true',
  MINIO_BUCKET: process.env.MINIO_BUCKET ?? 'identidades',
};
