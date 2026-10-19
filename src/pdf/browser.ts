// src/pdf/browser.ts
import puppeteer, { type Browser } from 'puppeteer'

let browserPromise: Promise<Browser> | null = null

/** Общий Chromium: запускается лениво, переиспользуется, пересоздаётся после падения */
export function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    const launched = puppeteer.launch({ args: ['--no-sandbox', '--font-render-hinting=medium'] })
    browserPromise = launched
    launched.then(
      (b) => b.on('disconnected', () => { if (browserPromise === launched) browserPromise = null }),
      () => { if (browserPromise === launched) browserPromise = null },
    )
  }
  return browserPromise
}

export async function closeBrowser(): Promise<void> {
  const current = browserPromise
  browserPromise = null
  if (current) await (await current.catch(() => null))?.close()
}
