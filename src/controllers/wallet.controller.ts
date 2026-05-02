import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { WalletService } from '../services/wallet.service';

const walletService = new WalletService();

/**
 * Controller de carteira Solana.
 * Gerencia saldo, tokens SPL e transferências de SOL.
 */
export class WalletController {
  /**
   * GET /wallet/balance
   * Retorna o saldo em SOL da carteira do usuário autenticado.
   */
  async getBalance(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const result = await walletService.getBalance(userId);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  /**
   * GET /wallet/tokens
   * Lista todos os tokens SPL na carteira do usuário autenticado.
   */
  async getTokens(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const result = await walletService.getTokens(userId);
      res.status(200).json({ tokens: result });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  /**
   * POST /wallet/transfer
   * Realiza transferência de SOL para um endereço destino.
   * Body: { destination_address: string, amount: number }
   */
  async transfer(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { destination_address, amount } = req.body;

      if (!destination_address || !amount) {
        res.status(400).json({ message: 'destination_address e amount são obrigatórios.' });
        return;
      }

      if (typeof amount !== 'number' || amount <= 0) {
        res.status(400).json({ message: 'amount deve ser um número positivo.' });
        return;
      }

      const result = await walletService.transferSOL(userId, destination_address, amount);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  /**
   * GET /wallet/fee
   * Retorna a taxa estimada de transferência da rede Solana.
   */
  async getTransferFee(req: Request, res: Response): Promise<void> {
    try {
      const result = await walletService.getTransferFee();
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
}
