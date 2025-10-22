// src/pdf/render.ts
import fs from 'fs/promises'
import path from 'path'
import * as handlebars from 'handlebars'
import bwipjs from 'bwip-js'
import puppeteer from 'puppeteer'
import { prisma } from '../prisma/client'

/** Опции рендера */
export type RenderOptions = {
  ids?: number[]
  all?: boolean
  size?: '58x40' | '100x70' | string
  perRow?: number // зарезервировано под раскладку по несколько в ряд
}

/* ======================= ЗАГРУЗКА ШАБЛОНА ======================= */

/** Подправляем старые плейсхолдеры в HTML (src="barcode" → src="{{this.barcodeDataUrl}}") */
function fixupTemplate(html: string): string {
  let out = html
  // 1) Любые заглушки для картинки → правильный data-url плейсхолдер
  out = out.replace(/src=["']\s*barcode\s*["']/gi, 'src="{{this.barcodeDataUrl}}"')
  out = out.replace(/src=["']\s*{{\s*(this\.)?barcode\s*}}\s*["']/gi, 'src="{{this.barcodeDataUrl}}"')
  // 2) Удаляем явную «ручную» строку цифр под штрихкодом (div/span/p с {{barcode}})
  out = out.replace(/<([a-z]+)([^>]*)>\s*{{\s*(this\.)?barcode\s*}}\s*<\/\1>/gis, '')
  // 3) На всякий случай — вырезаем любой одиночный {{barcode}} где бы он ни стоял
  out = out.replace(/{{\s*(this\.)?barcode\s*}}/gi, '')
  // 4) Старый класс "digits" (если остался) — сносим целиком
  out = out.replace(/<[^>]*class=["'][^"']*\bdigits\b[^"']*["'][^>]*>.*?<\/[^>]+>/gis, '')
  return out
}

/**
 * 1) Берём последний Template из БД (по updatedAt)
 * 2) Иначе файл TEMPLATE_PATH
 * 3) Иначе встроенный default
 */
async function loadTemplateHtml(): Promise<string> {
  try {
    const last = await prisma.template.findFirst({ orderBy: { updatedAt: 'desc' } })
    if (last?.html && last.html.trim()) {
      console.log('[TEMPLATE] source=database id=', last.id)
      return fixupTemplate(last.html)
    }
  } catch {
    /* ignore */
  }

  const p = process.env.TEMPLATE_PATH ?? './templates/default.html'
  try {
    const html = await fs.readFile(path.resolve(p), 'utf8')
    if (html.trim()) {
      console.log('[TEMPLATE] source=file path=', path.resolve(p))
      return fixupTemplate(html)
    }
  } catch {
    /* ignore */
  }

  console.log('[TEMPLATE] source=bundled-default')
  return defaultTemplateHtml()
}

/** Встроенный HTML-шаблон 100×70 (10×7 см) */
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
      </div>

      <div class="barcode">
        {{#if this.barcodeDataUrl}}
          <img src="{{this.barcodeDataUrl}}" alt="EAN-13" />
        {{/if}}
      </div>
    </div>
  </div>
  {{/each}}
</body>
</html>`
}

/* ======================= УТИЛИТЫ ======================= */

/** Нормализация к EAN-13 с вычислением контрольной цифры */
function ensureEan13(input?: string | null): string {
  const base = (input || '').replace(/\D/g, '')
  const digits = (base.length >= 12 ? base : (base + '000000000000')).slice(0, 12)
  const arr = digits.split('').map(Number)
  const sum = arr.reduce((acc, d, i) => acc + d * (i % 2 ? 3 : 1), 0)
  const check = (10 - (sum % 10)) % 10
  return digits + String(check)
}

/** Человекочитаемая подпись EAN-13: "D XXXXXX XXXXXX" */
function formatEanHuman(ean: string): string {
  const s = ean.replace(/\D/g, '').padStart(13, '0').slice(0, 13)
  return `${s[0]} ${s.slice(1, 7)} ${s.slice(7, 13)}`
}

/** Генерация штрих-кода (PNG data URL), строго EAN-13 */
async function makeBarcodeDataUrl(text?: string | null, compact = true): Promise<string> {
  const ean = ensureEan13(text)
  const buf = await bwipjs.toBuffer({
    bcid: 'ean13',
    text: ean,
    alttext: formatEanHuman(ean),
    includetext: true,
    guardwhitespace: true,
    scale: compact ? 3 : 4,
    height: compact ? 12 : 14,
    textsize: compact ? 10 : 11,

    // ↓ Добавляем точную настройку подписи
    textxalign: 'center',   // выравнивание по центру
    textxoffset: -7,        // немного левее (отрицательное — влево)
    textyoffset: -3,        // немного выше (отрицательное — вверх)
  } as any)
  return `data:image/png;base64,${buf.toString('base64')}`
}


/** Энергетическая ценность из Б/Ж/У */
function calcEnergyText(p?: number | null, f?: number | null, c?: number | null): string {
  const proteins = Number(p ?? 0)
  const fats = Number(f ?? 0)
  const carbs = Number(c ?? 0)
  const kcal = Math.round(proteins * 4 + fats * 9 + carbs * 4)
  const kJ = Math.round(kcal * 4.184)
  return `${kcal} ккал / ${kJ} кДж`
}

/** Дата в формате DD.MM.YYYY (если задана) */
function formatDate(d?: string | Date | null): string | undefined {
  if (!d) return undefined
  const date = typeof d === 'string' ? new Date(d) : d
  if (isNaN(date.getTime())) return undefined
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const yy = String(date.getFullYear())
  return `${dd}.${mm}.${yy}`
}

/** Подготовка данных этикеток для шаблона */
async function mapLabelsForTemplate(labels: any[], compactBarcode: boolean) {
  const mapped = await Promise.all(
    labels.map(async (l) => {
      const autoBase = String(200000000000 + Number(l.id || 0))
      const barcode = ensureEan13(l.barcode ? String(l.barcode) : autoBase)
      const barcodeDataUrl = await makeBarcodeDataUrl(barcode, compactBarcode)
      return {
        ...l,
        manufacturedAt: formatDate(l.manufacturedAt),
        packagedAt: formatDate(l.packagedAt),
        expiresAt: formatDate(l.expiresAt),
        energyText: calcEnergyText(l.proteins100g, l.fats100g, l.carbs100g),
        barcode,          // подпись под штрихами рисует bwip-js; поле оставляем на всякий случай
        barcodeDataUrl,   // data:image/png;base64,...
      }
    })
  )
  return mapped
}

/** Компилируем Handlebars */
async function buildHtml(payload: { labels: any[] }, tplHtml: string): Promise<string> {
  const tpl = handlebars.compile(tplHtml, { noEscape: true })
  return tpl(payload)
}

/* ======================= ОСНОВНОЙ РЕНДЕР ======================= */

export async function renderLabelsToPdf(options: RenderOptions): Promise<Buffer> {
  const size = (options.size ?? '').toLowerCase()
  const is58x40 = size === '58x40'
  const is100x70 = size === '100x70' || size === '10x7'

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
  const compactBarcode = is58x40 || is100x70
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

/** Хелпер для HTTP-роута */
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
