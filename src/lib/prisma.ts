import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development
declare global {
  var prisma: PrismaClient | undefined;
}

// Configuration for the PrismaClient
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
};

// Create a singleton instance of PrismaClient
const prisma = global.prisma || prismaClientSingleton();

// Set the global prisma instance in development to prevent hot-reload issues
if (process.env.NODE_ENV === 'development') {
  global.prisma = prisma;
}

export default prisma;