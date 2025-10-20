import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();
const router = Router();

router.get('/', async (_req, res) => {
  const items = await prisma.template.findMany({
    orderBy: [{ isCurrent: 'desc' }, { updatedAt: 'desc' }]
  });
  res.json(items);
});

router.post('/', async (req, res) => {
  const schema = z.object({
    name: z.string().min(1),
    html: z.string().min(1),
    isCurrent: z.boolean().optional()
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);

  if (parsed.data.isCurrent) {
    await prisma.template.updateMany({ data: { isCurrent: false } });
  }
  const created = await prisma.template.create({ data: parsed.data });
  res.status(201).json(created);
});

router.put('/:id/make-current', async (req, res) => {
  const id = Number(req.params.id);
  await prisma.template.updateMany({ data: { isCurrent: false } });
  const updated = await prisma.template.update({
    where: { id },
    data: { isCurrent: true }
  });
  res.json(updated);
});

router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const schema = z.object({ name: z.string().optional(), html: z.string().optional(), isCurrent: z.boolean().optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);

  const data = parsed.data;
  if (data.isCurrent === true) {
    await prisma.template.updateMany({ data: { isCurrent: false } });
  }
  const updated = await prisma.template.update({
    where: { id },
    data
  });
  res.json(updated);
});

export default router;
