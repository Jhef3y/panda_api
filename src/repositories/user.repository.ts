import { prisma } from '../lib/prisma';
import type { User } from '../lib/prisma';

export interface CreateUserDTO {
  name: string;
  email: string;
  password: string;
  wallet_address?: string;
  encrypted_private_key?: string;
}

/**
 * Repositório responsável pelas operações de banco de dados da entidade User.
 */
export class UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  async create(data: CreateUserDTO): Promise<User> {
    return prisma.user.create({ data });
  }

  async updateWallet(userId: string, walletAddress: string, encryptedPrivateKey: string): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: {
        wallet_address: walletAddress,
        encrypted_private_key: encryptedPrivateKey,
      },
    });
  }
}
