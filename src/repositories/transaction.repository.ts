import { prisma, TransactionType, TransactionStatus } from '../lib/prisma';
import type { Transaction, User } from '../lib/prisma';

type TransactionWithUser = Transaction & { user: Pick<User, 'wallet_address'> };

export interface CreateTransactionDTO {
  user_id: string;
  tx_signature?: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  destination_address: string;
}

export interface StatementEntry extends Transaction {
  direction: 'ENTRADA' | 'SAIDA';
  sender_address: string | null;
}

/**
 * Repositório responsável pelas operações de banco de dados da entidade Transaction.
 */
export class TransactionRepository {
  async create(data: CreateTransactionDTO): Promise<Transaction> {
    return prisma.transaction.create({ data });
  }

  async findByUserId(userId: string): Promise<Transaction[]> {
    return prisma.transaction.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    });
  }

  async findById(id: string): Promise<Transaction | null> {
    return prisma.transaction.findUnique({ where: { id } });
  }

  async updateStatus(id: string, status: TransactionStatus, tx_signature?: string): Promise<Transaction> {
    return prisma.transaction.update({
      where: { id },
      data: { status, ...(tx_signature && { tx_signature }) },
    });
  }

  /**
   * Retorna o extrato do usuário: saídas (user_id) e entradas (destination_address = wallet do usuário).
   * Opcionalmente filtra por status.
   */
  async findStatement(walletAddress: string, userId: string, status?: TransactionStatus): Promise<StatementEntry[]> {
    const statusFilter = status ? { status } : {};

    const [outgoing, incoming] = await Promise.all([
      prisma.transaction.findMany({
        where: { user_id: userId, ...statusFilter },
        orderBy: { created_at: 'desc' },
        include: { user: { select: { wallet_address: true } } },
      }),
      prisma.transaction.findMany({
        where: { destination_address: walletAddress, ...statusFilter },
        orderBy: { created_at: 'desc' },
        include: { user: { select: { wallet_address: true } } },
      }),
    ]);

    const outgoingMapped: StatementEntry[] = (outgoing as TransactionWithUser[]).map(({ user, ...t }) => ({
      ...t,
      direction: 'SAIDA' as const,
      sender_address: user.wallet_address,
    }));

    const incomingMapped: StatementEntry[] = (incoming as TransactionWithUser[])
      .filter((t: TransactionWithUser) => t.user_id !== userId)
      .map(({ user, ...t }: TransactionWithUser) => ({
        ...t,
        direction: 'ENTRADA' as const,
        sender_address: user.wallet_address,
      }));

    return [...outgoingMapped, ...incomingMapped].sort(
      (a: StatementEntry, b: StatementEntry) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }
}
