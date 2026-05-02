import { TransactionRepository, StatementEntry } from '../repositories/transaction.repository';
import { TransactionStatus } from '../lib/prisma';
import { prisma } from '../lib/prisma';

const transactionRepository = new TransactionRepository();

export class StatementService {
  /**
   * Retorna o extrato do usuário autenticado.
   * Transações onde o usuário é o remetente aparecem como SAIDA.
   * Transações onde a carteira do usuário é o destino aparecem como ENTRADA.
   */
  async getStatement(userId: string, status?: string): Promise<StatementEntry[]> {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new Error('Usuário não encontrado.');
    }

    if (!user.wallet_address) {
      throw new Error('Usuário não possui carteira vinculada.');
    }

    let parsedStatus: TransactionStatus | undefined;
    if (status) {
      const upper = status.toUpperCase();
      if (!['PENDING', 'CONFIRMED', 'FAILED'].includes(upper)) {
        throw new Error('Status inválido. Use: PENDING, CONFIRMED ou FAILED.');
      }
      parsedStatus = upper as TransactionStatus;
    }

    return transactionRepository.findStatement(user.wallet_address, userId, parsedStatus);
  }
}

