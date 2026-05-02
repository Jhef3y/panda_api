import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { StatementService } from '../services/statement.service';

const statementService = new StatementService();

export class StatementController {
  /**
   * GET /statement
   * Retorna o extrato do usuário autenticado.
   * Query param opcional: ?status=PENDING|CONFIRMED|FAILED
   */
  async getStatement(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const status = req.query.status as string | undefined;

      const statement = await statementService.getStatement(userId, status);
      res.status(200).json({ statement });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
}

