/**
 * Service de cotação de preços via Binance API (pública, sem autenticação).
 */
export class PriceService {
  private readonly baseUrl = 'https://api.binance.com/api/v3';

  /**
   * Retorna o preço atual de SOL em USDT.
   */
  async getSOLPriceInUSDT(): Promise<number> {
    const response = await fetch(`${this.baseUrl}/ticker/price?symbol=SOLUSDT`, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; panda_api/1.0)',
            'Accept': 'application/json',
        }
    });

    if (!response.ok) {
      throw new Error(`Falha ao consultar cotação SOL/USDT: ${response.statusText}`);
    }

    const data = (await response.json()) as { symbol: string; price: string };
    return parseFloat(data.price);
  }
}

