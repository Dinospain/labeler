// src/pdf/html.ts
import * as handlebars from 'handlebars'

/** Компилируем Handlebars */
export async function buildHtml(payload: { labels: any[] }, tplHtml: string): Promise<string> {
  const tpl = handlebars.compile(tplHtml, { noEscape: true })
  return tpl(payload)
}
