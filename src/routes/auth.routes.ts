import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

const router = Router();
const authController = new AuthController();

/**
 * @route POST /auth/register
 * @desc Registra novo usuário e gera carteira Solana
 * @access Public
 */
router.post('/register', (req, res) => authController.register(req, res));

/**
 * @route POST /auth/login
 * @desc Autentica usuário e retorna JWT
 * @access Public
 */
router.post('/login', (req, res) => authController.login(req, res));

export default router;

