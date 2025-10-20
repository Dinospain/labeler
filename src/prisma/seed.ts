import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import { env } from '../env';

const prisma = new PrismaClient();

async function main() {
  const html = await fs.readFile(env.TEMPLATE_PATH, 'utf8');

  // Сброс текущих флагов:
  await prisma.template.updateMany({ data: { isCurrent: false } });

  // Создаём/обновляем шаблон "Default"
  const def = await prisma.template.upsert({
    where: { id: 1 },
    create: { name: 'Default', html, isCurrent: true },
    update: { html, isCurrent: true }
  });

  console.log('Template current:', def.id);

  // Демо-этикетки
  await prisma.label.createMany({
    data: [
      {
        productName: 'Хлеб пшеничный',
        weight: '500 г',
        barcode: '123456789012',
        priceCents: 12000
      },
      {
        productName: 'Булочка с маком',
        weight: '90 г',
        barcode: null,
        priceCents: 4500
      }
    ]
  });

  console.log('Seed done');
}

main().finally(() => prisma.$disconnect());
