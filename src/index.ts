import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { env } from './env';
import labelsRouter from './routes/labels';
import templatesRouter from './routes/templates';
import printRouter from './routes/print';
import foldersRouter from './routes/folders'

const app = express();
const prisma = new PrismaClient();

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

const port = Number(env.PORT);
app.listen(port, () => {
  console.log(`API on http://localhost:${port}`);
});

// аккуратное завершение
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
