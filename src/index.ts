import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { env } from './env';
import { router as labelsRouter } from './routes/labels'
import templatesRouter from './routes/templates';
import { router as printRouter } from './routes/print'
import { router as foldersRouter } from './routes/folders'
import { resolveAccount } from './middleware/account'
import { router as authRouter } from './routes/auth'
import path from 'path'

const app = express();
const prisma = new PrismaClient();
app.use(resolveAccount);
app.use(express.json({ limit: '2mb' }));
app.use(cors({ origin: true, credentials: true }));
app.use('/api/folders', foldersRouter)
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, env: env.NODE_ENV });
});

app.use('/api/labels', labelsRouter);
app.use('/api/templates', templatesRouter);
app.use('/api/print', printRouter);
app.use('/api/folders', foldersRouter)
// auth роуты без обязательного аккаунта (список отделов / "логин")
app.use('/api/auth', authRouter);
// ВСЕ остальные — с аккаунтом
// ---------- статика фронта ----------
const clientDist = path.resolve(__dirname, '../client/dist')
app.use(express.static(clientDist))
// SPA-фоллбек: всё не /api/* отдаём index.html
app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')))
app.use('/api/auth', authRouter)
const port = Number(env.PORT);
app.listen(port, () => {
  console.log(`API on http://localhost:${port}`);
});

// аккуратное завершение
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
