// src/pdf/html.ts
import * as handlebars from 'handlebars'

/**
 * Компилируем Handlebars. Значения {{ }} экранируются; сырой HTML — только через {{{ }}}
 * в самом шаблоне (шаблоны доверенные, поля этикеток — нет).
 */
export async function buildHtml(payload: { labels: any[] }, tplHtml: string): Promise<string> {
  const tpl = handlebars.compile(tplHtml)
  return tpl(payload)
}
