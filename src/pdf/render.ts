// src/pdf/render.ts
import puppeteer from 'puppeteer'
import { prisma } from '../prisma/client'
import { buildHtml } from './html'
import { LABEL_SIZES, parseSize } from './sizes'
import { loadTemplateHtml } from './template'
import { mapLabelsForTemplate } from './viewModel'

/** Опции рендера */
export type RenderOptions = {
  ids?: number[]
  all?: boolean
  size?: '58x40' | '100x70' | string
  perRow?: number // зарезервировано под раскладку по несколько в ряд
}

/* ======================= ОСНОВНОЙ РЕНДЕР ======================= */

export async function renderLabelsToPdf(options: RenderOptions): Promise<Buffer> {
  const size = parseSize(options.size)

  // 1) Получаем записи
  let labels: any[] = []
  if (options.all) {
    labels = await prisma.label.findMany({ orderBy: { id: 'asc' } })
  } else if (options.ids && options.ids.length > 0) {
    labels = await prisma.label.findMany({
      where: { id: { in: options.ids } },
      orderBy: { id: 'asc' },
    })
  }

  // 2) Готовим данные + загружаем шаблон
  const compactBarcode = size !== null
  const prepared = await mapLabelsForTemplate(labels, compactBarcode)
  const tplHtml = await loadTemplateHtml()
  const html = await buildHtml({ labels: prepared }, tplHtml)

  // 3) Рендерим PDF Puppeteer'ом
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--font-render-hinting=medium'],
  })
  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })

    const pdfBuffer = await page.pdf(LABEL_SIZES[size ?? 'a4'])

    await page.close()
    return pdfBuffer
  } finally {
    await browser.close()
  }
}
