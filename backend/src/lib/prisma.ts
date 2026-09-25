import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

// Reutiliza a conexão durante hot reload para evitar esgotar o pool local.
export const prisma = globalForPrisma.prisma ?? new PrismaClient();

// Em desenvolvimento, guarda o cliente globalmente para sobreviver ao reload.
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
