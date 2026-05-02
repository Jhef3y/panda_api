import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { ContractService } from '../services/contract.service';

const contractService = new ContractService();

/**
 * Controller de Smart Contracts Solana.
 * Gerencia iniciação e execução de instruções em programas on-chain.
 */
export class ContractController {
  /**
   * POST /contract/initiate
   * Inicia uma interação com um Smart Contract.
   * Body: { program_id, destination_address, amount, execution_key }
   */
  async initiate(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { program_id, destination_address, amount, execution_key } = req.body;

      if (!program_id || !destination_address || !amount || !execution_key) {
        res.status(400).json({
          message: 'program_id, destination_address, amount e execution_key são obrigatórios.',
        });
        return;
      }

      const result = await contractService.initiateContract(userId, {
        program_id,
        destination_address,
        amount,
        execution_key,
      });

      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  /**
   * POST /contract/execute
   * Executa lógica adicional de um contrato já iniciado.
   * Body: { program_id, transaction_id, instruction_data }
   */
  async execute(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { program_id, transaction_id, instruction_data } = req.body;

      if (!program_id || !transaction_id || !instruction_data) {
        res.status(400).json({
          message: 'program_id, transaction_id e instruction_data são obrigatórios.',
        });
        return;
      }

      if (!Array.isArray(instruction_data)) {
        res.status(400).json({ message: 'instruction_data deve ser um array de bytes (number[]).' });
        return;
      }

      const result = await contractService.executeContract(userId, {
        program_id,
        transaction_id,
        instruction_data,
      });

      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
}

