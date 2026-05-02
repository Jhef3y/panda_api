import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import authRoutes from './routes/auth.routes';
import walletRoutes from './routes/wallet.routes';
import contractRoutes from './routes/contract.routes';
import statementRoutes from './routes/statement.routes';
import priceRoutes from './routes/price.routes';

const app = express();

// ── Middlewares Globais ─────────────────────────────────────────────────────
app.use(helmet());             // Segurança: headers HTTP
app.use(cors());               // Permitir CORS
app.use(express.json());       // Parse de JSON no body
app.use(express.urlencoded({ extended: true }));

// ── Health Check ────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'OK',
    project: 'Panda Transfer API',
    timestamp: new Date().toISOString(),
  });
});

// ── Rotas ───────────────────────────────────────────────────────────────────
app.use('/auth', authRoutes);
app.use('/wallet', walletRoutes);
app.use('/contract', contractRoutes);
app.use('/statement', statementRoutes);
app.use('/price', priceRoutes);

// ── 404 Handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ message: 'Rota não encontrada.' });
});

// ── Error Handler Global ────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Error]', err.message);
  res.status(500).json({ message: 'Erro interno do servidor.' });
});

export default app;
