import { Request, Response } from 'express';
import { PriceService } from '../services/price.service';

/**
 * Controller para expor cotações de preço.
 */
export class PriceController {
  private priceService = new PriceService();

  /**
   * GET /price/sol-usdt
   * Retorna o preço de 1 SOL em USDT.
   */
  async getSOLtoUSDT(_req: Request, res: Response) {
    try {
      const price = await this.priceService.getSOLPriceInUSDT();
      return res.status(200).json({
        pair: 'SOL/USDT',
        price, // número em USDT
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('[PriceController] getSOLtoUSDT:', err.message || err);
      return res.status(500).json({ message: 'Erro ao obter cotação SOL/USDT.' });
    }
  }

  /**
   * GET /price/usdt-sol
   * Retorna o preço de 1 USDT em SOL (inverso de SOL/USDT).
   */
  async getUSDTtoSOL(_req: Request, res: Response) {
    try {
      const solInUsdt = await this.priceService.getSOLPriceInUSDT();
      if (!solInUsdt || solInUsdt <= 0) {
        return res.status(502).json({ message: 'Cotação inválida recebida da fonte.' });
      }

      const price = 1 / solInUsdt; // quantidade de SOL por 1 USDT
      return res.status(200).json({
        pair: 'USDT/SOL',
        price,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('[PriceController] getUSDTtoSOL:', err.message || err);
      return res.status(500).json({ message: 'Erro ao obter cotação USDT/SOL.' });
    }
  }
}

