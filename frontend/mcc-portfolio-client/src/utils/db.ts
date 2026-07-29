import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  dbUrl: string | undefined;
};

function getPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!globalForPrisma.prisma || globalForPrisma.dbUrl !== connectionString) {
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    globalForPrisma.prisma = new PrismaClient({ adapter });
    globalForPrisma.dbUrl = connectionString;
  }
  return globalForPrisma.prisma;
}

export const prisma = getPrismaClient();

