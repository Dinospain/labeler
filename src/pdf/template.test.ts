import fs from 'fs'
import path from 'path'
import { describe, expect, it } from 'vitest'
import { defaultTemplateHtml, fixupTemplate } from './template'

describe('fixupTemplate', () => {
  it('rewrites placeholder image src', () => {
    expect(fixupTemplate('<img src="barcode">')).toBe('<img src="{{this.barcodeDataUrl}}">')
    expect(fixupTemplate("<img src='{{ this.barcode }}'>")).toBe('<img src="{{this.barcodeDataUrl}}">')
  })
  it('drops the manual digits line', () => {
    expect(fixupTemplate('<p>a</p><div class="x">{{barcode}}</div><p>b</p>')).toBe('<p>a</p><p>b</p>')
  })
  it('removes any stray {{barcode}}', () => {
    expect(fixupTemplate('x {{ this.barcode }} y')).toBe('x  y')
  })
  it('removes elements with class digits', () => {
    expect(fixupTemplate('<p>a</p><div class="foo digits">1 2 3</div><p>b</p>')).toBe('<p>a</p><p>b</p>')
  })
  it('is idempotent', () => {
    const once = fixupTemplate('<img src="barcode"><div>{{barcode}}</div><span class="digits">1</span>')
    expect(fixupTemplate(once)).toBe(once)
  })
  it('keeps a normal template untouched', () => {
    const html = defaultTemplateHtml()
    expect(fixupTemplate(html)).toBe(html)
  })
})

describe('shipped templates', () => {
  it('are not altered in a surprising way by fixupTemplate', () => {
    for (const f of ['default.html', 'label-58x40.html']) {
      const html = fs.readFileSync(path.resolve(__dirname, '../../templates', f), 'utf8')
      expect(fixupTemplate(html)).toContain('{{#each labels}}')
    }
  })
})
