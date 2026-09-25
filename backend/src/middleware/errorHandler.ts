import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';

export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
  }
}

// Converte erros de domínio, Prisma e falhas inesperadas em um formato único.
export function errorHandler(error: Error, _req: Request, res: Response, _next: NextFunction) {
  void _next;
  let statusCode = error instanceof AppError ? error.statusCode : 500;
  let message = error instanceof AppError ? error.message : 'Erro interno do servidor';
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    statusCode = 409;
    message = 'Já existe um cadastro com um dos dados informados';
  }
  if (statusCode === 500) console.error(error);
  res.status(statusCode).json({ success: false, error: message });
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ success: false, error: 'Rota não encontrada' });
}
