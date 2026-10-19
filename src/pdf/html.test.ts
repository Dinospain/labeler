import fs from 'fs'
import path from 'path'
import { describe, expect, it } from 'vitest'
import { buildHtml } from './html'
import { defaultTemplateHtml, fixupTemplate } from './template'

const tplFiles = ['default.html', 'label-58x40.html']

describe('buildHtml', () => {
  it('renders one block per label', async () => {
    const html = await buildHtml({ labels: [{ productName: 'A' }, { productName: 'B' }, { productName: 'C' }] }, defaultTemplateHtml())
    expect(html.match(/class="label"/g)).toHaveLength(3)
    expect(html).toContain('>A<')
  })
  it('compiles the shipped templates', async () => {
    for (const f of tplFiles) {
      const tpl = fixupTemplate(fs.readFileSync(path.resolve(__dirname, '../../templates', f), 'utf8'))
      const html = await buildHtml({ labels: [{ productName: 'Хлеб', barcodeDataUrl: 'data:image/png;base64,AA' }] }, tpl)
      expect(html).toContain('Хлеб')
    }
  })
  it('does not escape values', async () => {
    // pinned: current behaviour (noEscape: true), changes in Phase 3 (B10)
    const html = await buildHtml({ labels: [{ productName: '<b>x</b>' }] }, defaultTemplateHtml())
    expect(html).toContain('<b>x</b>')
  })
})
