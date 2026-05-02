import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';

const authService = new AuthService();

/**
 * Controller de autenticação.
 * Gerencia registro e login de usuários.
 */
export class AuthController {
  /**
   * POST /auth/register
   * Registra um novo usuário e gera sua carteira Solana.
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        res.status(400).json({ message: 'Nome, e-mail e senha são obrigatórios.' });
        return;
      }

      const result = await authService.register({ name, email, password });
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  /**
   * POST /auth/login
   * Autentica o usuário e retorna o JWT.
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ message: 'E-mail e senha são obrigatórios.' });
        return;
      }

      const result = await authService.login({ email, password });
      res.status(200).json(result);
    } catch (error: any) {
      res.status(401).json({ message: error.message });
    }
  }
}

