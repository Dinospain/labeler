import fs from 'fs/promises'
import path from 'path'
import * as handlebars from 'handlebars'
import bwip from 'bwip-js'
import puppeteer from 'puppeteer'
import { prisma } from '../prisma/client'

/**
 * Опции рендера
 */
export type RenderOptions = {
  ids?: number[]
  all?: boolean
  size?: '58x40' | '100x70' | string
  perRow?: number
}

/**
 * Безопасный load шаблона:
 * 1) из БД: Template (берём последний активный / или последний по updatedAt)
 * 2) из файла по TEMPLATE_PATH
 * 3) если нет — даём встроенный минимальный шаблон (100×70)
 */
async function loadTemplateHtml(): Promise<string> {
    // 1) БД: берём самый свежий по updatedAt
  try {
    const last = await prisma.template.findFirst({
      orderBy: { updatedAt: 'desc' },
    })
    if (last?.html && last.html.trim().length > 0) {
      return last.html
    }
  } catch {
    // игнор — пойдём дальше
  }
  // 2) файл
  const p = process.env.TEMPLATE_PATH ?? './templates/default.html'
  try {
    const html = await fs.readFile(path.resolve(p), 'utf8')
    if (html.trim()) return html
  } catch {
    // игнор — дадим бандл-шаблон
  }

  // 3) встроенный
  return defaultTemplateHtml()
}

/**
 * Встроенный простой шаблон 100×70 (10×7 см)
 * — небольшой, универсальный, с минимальными стилями
 */
function defaultTemplateHtml(): string {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8" />
<style>
  @page { size: 100mm 70mm; margin: 0; }
  html, body { margin: 0; padding: 0; font-family: Arial, sans-serif; }

  .label {
    box-sizing: border-box;
    width: 100mm; height: 70mm;
    padding: 2mm 3mm;
    display: grid; grid-template-rows: auto 1fr auto;
    gap: 1mm; page-break-after: always;
    font-size: 6.2pt; line-height: 1.15;
  }
  .label * { font-size: inherit; line-height: inherit; font-family: inherit; }
  .label h1,.label h2,.label h3,.label h4,.label h5,.label h6 { margin:0; font-weight:700; }
  .label b, .label strong { font-weight:700; font-size: inherit; }

  .title { font-size: 10pt !important; font-weight: 700; text-align:center; line-height:1.1; }
  .mass  { font-size: 8.2pt !important; font-weight: 700; text-align:center; }

  .row { display:grid; grid-template-columns: 1fr 22mm; gap: 1mm; }
  .block { margin-top: 0.6mm; }
  .small { opacity: .98; }
  .tiny  { opacity: .95; }

  .barcode { text-align:center; align-self:end; }
  .barcode img { width:100%; height:auto; display:block; }
  .digits { font-size: 6pt !important; margin-top: 0.3mm; letter-spacing: .2pt; }
</style>
</head>
<body>
  {{#each labels}}
  <div class="label">
    <div>
      <div class="title">{{this.productName}}</div>
      {{#if this.weight}}<div class="mass">масса нетто {{this.weight}}</div>{{/if}}
    </div>

    <div class="row">
      <div>
        {{#if this.composition}}<div class="block"><b>Состав:</b> {{this.composition}}</div>{{/if}}
        <div class="block">
          <b>Пищевая ценность / 100 г:</b>
          белки {{this.proteins100g}} г, жиры {{this.fats100g}} г, углеводы {{this.carbs100g}} г.
        </div>
        <div class="block"><b>Энерг. ценность:</b> {{this.energyText}}</div>
        {{#if this.standard}}<div class="small">СТБ / ГОСТ: {{this.standard}}</div>{{/if}}
        {{#if this.shelfLife}}<div class="small">Срок годности: {{this.shelfLife}}</div>{{/if}}
        <div class="tiny">
          {{#if this.manufacturedAt}}Изготовлено: {{this.manufacturedAt}}; {{/if}}
          {{#if this.packagedAt}}Упаковано: {{this.packagedAt}}{{/if}}
          {{#if this.expiresAt}}; Годен до: {{this.expiresAt}}{{/if}}
        </div>
        <div class="tiny">Адрес: {{this.address}}</div>
        <div class="tiny">{{this.mchsInfo}}</div>
        <div class="tiny">Сайт: {{this.website}}</div>
      </div>

      <div class="barcode">
        {{#if this.barcodeDataUrl}}
          <img src="{{this.barcodeDataUrl}}" alt="EAN-13" />
        {{/if}}
        <div class="digits">{{this.barcode}}</div>
      </div>
    </div>
  </div>
  {{/each}}
</body>
</html>`
}

/**
 * EAN-13 checksum + нормализация.
 * Если пришло меньше 12 цифр — добиваем нулями слева; если больше — берём первые 12.
 */
function ensureEan13(input?: string | null): string {
  const base = (input || '').replace(/\D/g, '')
  const digits = (base.length >= 12 ? base : (base + '000000000000')).slice(0, 12)
  const arr = digits.split('').map(Number)
  const sum = arr.reduce((acc, d, i) => acc + d * (i % 2 ? 3 : 1), 0)
  const check = (10 - (sum % 10)) % 10
  return digits + String(check)
}

/**
 * Баркод как SVG data URL — это заметно снижает вес PDF.
 */
async function makeBarcodeDataUrl(text?: string | null, compact = true): Promise<string> {
  const svgBuf = await bwip.toBuffer({
    bcid: 'ean13',
    text: ensureEan13(text),
    scale: compact ? 2.0 : 2.4,
    height: compact ? 8 : 9,
    includetext: false,
    textxalign: 'center',
    svg: true,
  } as any)
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgBuf.toString('utf8'))}`
}

/**
 * Энергетическая ценность из Б/Ж/У
 */
function calcEnergyText(p?: number | null, f?: number | null, c?: number | null): string {
  const proteins = Number(p ?? 0)
  const fats = Number(f ?? 0)
  const carbs = Number(c ?? 0)
  const kcal = Math.round(proteins * 4 + fats * 9 + carbs * 4)
  const kJ = Math.round(kcal * 4.184)
  return `${kcal} ккал / ${kJ} кДж`
}

/**
 * Человекочитаемая дата (если не null)
 */
function formatDate(d?: string | Date | null): string | undefined {
  if (!d) return undefined
  const date = typeof d === 'string' ? new Date(d) : d
  if (isNaN(date.getTime())) return undefined
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const yy = String(date.getFullYear())
  return `${dd}.${mm}.${yy}`
}

/**
 * Подготовить данные этикеток: рассчитать barcode/energy, формат дат, заглушки.
 */
async function mapLabelsForTemplate(labels: any[], compactBarcode: boolean) {
  const mapped = await Promise.all(
    labels.map(async (l) => {
      const autoBase = String(200000000000 + Number(l.id || 0)) // стабильная база
      const barcode = ensureEan13(l.barcode ? String(l.barcode) : autoBase)
      const barcodeDataUrl = await makeBarcodeDataUrl(barcode, compactBarcode)

      return {
        ...l,
        manufacturedAt: formatDate(l.manufacturedAt),
        packagedAt: formatDate(l.packagedAt),
        expiresAt: formatDate(l.expiresAt),
        energyText: calcEnergyText(l.proteins100g, l.fats100g, l.carbs100g),
        barcode,
        barcodeDataUrl,
        address: l.address ?? 'Адрес: Республика Беларусь, г. Минск, ул. Примерная, 1',
        mchsInfo: l.mchsInfo ?? 'МЧС: в случае ЧС звоните 101 или 112',
        website: l.website ?? 'https://example.by',
      }
    })
  )
  return mapped
}

/**
 * Собрать финальный HTML, используя Handlebars.
 */
async function buildHtml(payload: { labels: any[] }, tplHtml: string): Promise<string> {
  const tpl = handlebars.compile(tplHtml, { noEscape: true })
  return tpl(payload)
}

/**
 * Основной экспорт: отрисовка PDF по ids|all, с заданным размером страницы.
 */
export async function renderLabelsToPdf(options: RenderOptions): Promise<Buffer> {
  const size = (options.size ?? '').toLowerCase()
  const is58x40 = size === '58x40'
  const is100x70 = size === '100x70' || size === '10x7' // разрешим синоним

  // Получаем записи
  let labels: any[] = []
  if (options.all) {
    labels = await prisma.label.findMany({ orderBy: { id: 'asc' } })
  } else if (options.ids && options.ids.length > 0) {
    labels = await prisma.label.findMany({
      where: { id: { in: options.ids } },
      orderBy: { id: 'asc' },
    })
  } else {
    labels = [] // пусто — вернём PDF с пустым телом
  }

  // Подготовка данных + шаблон
  const compactBarcode = is58x40 || is100x70
  const prepared = await mapLabelsForTemplate(labels, compactBarcode)
  const tplHtml = await loadTemplateHtml()
  const html = await buildHtml({ labels: prepared }, tplHtml)

  // Puppeteer
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--font-render-hinting=medium'],
  })
  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })

    // Для этикеток фоновую печать часто отключаем (экономит размер)
    const printBackground = false

    const pdfBuffer = await page.pdf(
      is58x40
        ? {
            width: '58mm',
            height: '40mm',
            margin: { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' },
            printBackground,
            preferCSSPageSize: true,
          }
        : is100x70
        ? {
            width: '100mm',
            height: '70mm',
            margin: { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' },
            printBackground,
            preferCSSPageSize: true,
          }
        : {
            format: 'A4',
            margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' },
            printBackground: true,
            preferCSSPageSize: true,
          }
    )

    await page.close()
    return pdfBuffer
  } finally {
    await browser.close()
  }
}

/**
 * Удобный HTTP-хелпер: можно вызвать из роута.
 * Пример использования:
 *   const buf = await renderLabelsToPdfFromRequest(req);
 *   res.setHeader('Content-Type', 'application/pdf');
 *   res.send(buf);
 */
export async function renderLabelsToPdfFromRequest(req: any): Promise<Buffer> {
  const idsParam = (req.query.ids as string | undefined)?.trim()
  const all = String(req.query.all ?? '').toLowerCase() === 'true'
  const size = (req.query.size as string | undefined) ?? '100x70'

  let ids: number[] | undefined
  if (idsParam) {
    ids = idsParam
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n))
  }

  return renderLabelsToPdf({ ids, all, size })
}
