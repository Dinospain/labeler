// src/pdf/template.ts
import fs from 'fs/promises'
import path from 'path'
import { prisma } from '../prisma/client'

/** Подправляем старые плейсхолдеры в HTML (src="barcode" → src="{{this.barcodeDataUrl}}") */
export function fixupTemplate(html: string): string {
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
export async function loadTemplateHtml(): Promise<string> {
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
export function defaultTemplateHtml(): string {
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
