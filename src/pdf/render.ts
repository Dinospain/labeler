// src/pdf/render.ts
import { prisma } from '../prisma/client'
import { getBrowser } from './browser'
import { buildHtml } from './html'
import { LABEL_SIZES, parseSize } from './sizes'
import { loadTemplateHtml } from './template'
import { mapLabelsForTemplate } from './viewModel'

/** Опции рендера */
export type RenderOptions = {
  accountId: number
  ids: number[]
  size: '58x40' | '100x70' | string
}

/** Неизвестный размер печати */
export class UnknownSizeError extends Error {
  constructor(size: string) {
    super(`Unknown print size: ${size}`)
  }
}

/* ======================= ОСНОВНОЙ РЕНДЕР ======================= */

export async function renderLabelsToPdf(options: RenderOptions): Promise<Buffer> {
  const size = parseSize(options.size)
  if (!size) throw new UnknownSizeError(options.size)

  // 1) Записи только этого аккаунта
  const labels = options.ids.length
    ? await prisma.label.findMany({
        where: { accountId: options.accountId, id: { in: options.ids } },
        orderBy: { id: 'asc' },
      })
    : []

  // 2) Готовим данные + загружаем шаблон
  const prepared = await mapLabelsForTemplate(labels, true)
  const tplHtml = await loadTemplateHtml(options.accountId, size)
  const html = await buildHtml({ labels: prepared }, tplHtml)

  // 3) Рендерим PDF в общем браузере, страница закрывается всегда
  const browser = await getBrowser()
  const page = await browser.newPage()
  try {
    // шаблоны не должны ходить в сеть / file:// — разрешены только data: URL
    await page.setRequestInterception(true)
    page.on('request', (req) => {
      if (req.url().startsWith('data:')) void req.continue()
      else void req.abort()
    })
    await page.setContent(html, { waitUntil: 'networkidle0' })
    return Buffer.from(await page.pdf(LABEL_SIZES[size]))
  } finally {
    await page.close().catch(() => {})
  }
}
