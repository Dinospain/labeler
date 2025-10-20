import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();
const router = Router();

const labelCreateSchema = z.object({
  productName: z.string().min(1),
  weight: z.string().optional(),
  packagedAt: z.string().datetime().optional(),
  manufacturedAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  shelfLife: z.string().optional(),
  composition: z.string().optional(),
  proteins100g: z.coerce.number().nullable().optional(),
  fats100g: z.coerce.number().nullable().optional(),
  carbs100g: z.coerce.number().nullable().optional(),
  standard: z.string().optional(),
  address: z.string().optional(),
  mchsInfo: z.string().optional(),
  website: z.string().optional(),
  barcode: z.string().optional().nullable(),
  barcodeType: z.string().optional(),
  priceCents: z.number().int().optional(),
  folderId: z.coerce.number().int().nullable().optional(),
  extra: z.any().optional()
});
function nowIso() { return new Date().toISOString(); }
router.get('/', async (req, res) => {
  const page = Number(req.query.page ?? 1);
  const take = Number(req.query.take ?? 20);
  const skip = (page - 1) * take;

  const [items, total] = await Promise.all([
    prisma.label.findMany({ skip, take, orderBy: { id: 'desc' } }),
    prisma.label.count()
  ]);

  res.json({ items, total, page, take });
});

router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const item = await prisma.label.findUnique({ where: { id } });
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

router.post('/', async (req, res) => {
  console.log('[POST /labels] body =', req.body);
  const parsed = labelCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);

  const data = parsed.data;
  const created = await prisma.label.create({
    data: {
      productName: data.productName,
      weight: data.weight,
      manufacturedAt: new Date(data.manufacturedAt ?? nowIso()), // авто-датa
      packagedAt: new Date(data.packagedAt ?? nowIso()),
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      shelfLife: data.shelfLife ?? null,
      composition: data.composition ?? null,
      standard: data.standard ?? null,
      address: data.address ?? null,
      mchsInfo: data.mchsInfo ?? null,
      website: data.website ?? null,
      proteins100g: data.proteins100g ?? null,
      fats100g: data.fats100g ?? null,
      carbs100g: data.carbs100g ?? null,
      barcode: data.barcode ?? null,
      barcodeType: 'ean13',
      folderId: data.folderId ?? null,
      extra: data.extra ?? null
    }
  });
  res.status(201).json(created);
});

router.put('/:id', async (req, res) => {
  console.log('[PUT /labels/:id] body =', req.body);
  const id = Number(req.params.id);
  const parsed = labelCreateSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);

  const data = parsed.data;
  const updated = await prisma.label.update({
    where: { id },
    data: {
      productName: data.productName,
      weight: data.weight,
      manufacturedAt: data.manufacturedAt ? new Date(data.manufacturedAt) : undefined,
      packagedAt: data.packagedAt ? new Date(data.packagedAt) : undefined,      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      shelfLife: data.shelfLife,
      composition: data.composition,
      proteins100g: data.proteins100g ?? undefined,
      fats100g: data.fats100g ?? undefined,
      carbs100g: data.carbs100g ?? undefined,
      standard: data.standard,
      address: data.address,
      mchsInfo: data.mchsInfo,
      website: data.website,
      barcodeType: 'ean13',
      folderId: data.folderId ?? undefined,
      extra: data.extra ?? undefined
    }
  });
  res.json(updated);
});

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  await prisma.label.delete({ where: { id } });
  res.json({ ok: true });
});

export default router;
