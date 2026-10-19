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
  it('escapes values by default (B10)', async () => {
    const html = await buildHtml({ labels: [{ productName: '<script>x</script> & <b>' }] }, defaultTemplateHtml())
    expect(html).not.toContain('<script>x</script>')
    expect(html).toContain('&lt;script&gt;x&lt;/script&gt; &amp; &lt;b&gt;')
  })
  it('still allows raw html via triple braces in a template', async () => {
    const html = await buildHtml({ labels: [{ productName: '<b>x</b>' }] }, '{{#each labels}}{{{this.productName}}}{{/each}}')
    expect(html).toBe('<b>x</b>')
  })
  it('omits empty address/МЧС/website lines in shipped templates', async () => {
    for (const f of tplFiles) {
      const tpl = fixupTemplate(fs.readFileSync(path.resolve(__dirname, '../../templates', f), 'utf8'))
      const empty = await buildHtml({ labels: [{ productName: 'A' }] }, tpl)
      expect(empty).not.toMatch(/МЧС|Сайт:/)
      const full = await buildHtml({ labels: [{ productName: 'A', address: 'ул. Х', mchsInfo: '101', website: 'a.by' }] }, tpl)
      expect(full).toMatch(/ул\. Х/)
      expect(full).toContain('МЧС')
      expect(full).toContain('a.by')
    }
  })
})
