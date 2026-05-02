import { Router } from 'express';
import { ContractController } from '../controllers/contract.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const contractController = new ContractController();

// Todas as rotas de contrato são protegidas pelo middleware JWT
router.use(authMiddleware);

/**
 * @route POST /contract/initiate
 * @desc Inicia interação com um Smart Contract (Program ID)
 * @access Private
 * @body { program_id, destination_address, amount, execution_key }
 */
router.post('/initiate', (req, res) => contractController.initiate(req as any, res));

/**
 * @route POST /contract/execute
 * @desc Executa lógica adicional de um contrato já iniciado
 * @access Private
 * @body { program_id, transaction_id, instruction_data }
 */
router.post('/execute', (req, res) => contractController.execute(req as any, res));

export default router;

