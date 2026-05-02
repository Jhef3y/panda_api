import { PrismaClient, $Enums } from '@prisma/client';
import type { User, Transaction } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });

export const prisma = new PrismaClient({ adapter });

export type { User, Transaction };
export { $Enums };
export type TransactionType = $Enums.TransactionType;
export type TransactionStatus = $Enums.TransactionStatus;
export const TransactionType = $Enums.TransactionType;
export const TransactionStatus = $Enums.TransactionStatus;
