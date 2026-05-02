import { Router } from 'express';
import { PriceController } from '../controllers/price.controller';

const router = Router();
const priceController = new PriceController();

/**
 * @route GET /price/sol-usdt
 * @desc Retorna o preço de 1 SOL em USDT
 * @access Public
 */
router.get('/sol-usdt', (req, res) => priceController.getSOLtoUSDT(req, res));

/**
 * @route GET /price/usdt-sol
 * @desc Retorna o preço de 1 USDT em SOL (inverso)
 * @access Public
 */
router.get('/usdt-sol', (req, res) => priceController.getUSDTtoSOL(req, res));

export default router;

