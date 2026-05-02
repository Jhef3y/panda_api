import { Router } from 'express';
import { WalletController } from '../controllers/wallet.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const walletController = new WalletController();

/**
 * @route GET /wallet/fee
 * @desc Retorna a taxa estimada de transferência da rede Solana
 * @access Public
 */
router.get('/fee', (req, res) => walletController.getTransferFee(req, res));

// Rotas protegidas pelo middleware JWT
router.use(authMiddleware);

/**
 * @route GET /wallet/balance
 * @desc Retorna saldo em SOL da carteira do usuário logado
 * @access Private
 */
router.get('/balance', (req, res) => walletController.getBalance(req as any, res));

/**
 * @route GET /wallet/tokens
 * @desc Lista todos os tokens SPL na carteira do usuário
 * @access Private
 */
router.get('/tokens', (req, res) => walletController.getTokens(req as any, res));

/**
 * @route POST /wallet/transfer
 * @desc Realiza transferência de SOL para um endereço destino
 * @access Private
 * @body { destination_address: string, amount: number }
 */
router.post('/transfer', (req, res) => walletController.transfer(req as any, res));

export default router;
