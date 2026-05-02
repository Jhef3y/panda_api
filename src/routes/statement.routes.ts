import { Router } from 'express';
import { StatementController } from '../controllers/statement.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const statementController = new StatementController();

router.use(authMiddleware);

/**
 * @route GET /statement
 * @desc Retorna o extrato do usuário autenticado (entradas e saídas)
 * @access Private
 * @query status? PENDING | CONFIRMED | FAILED
 */
router.get('/', (req, res) => statementController.getStatement(req as any, res));

export default router;

