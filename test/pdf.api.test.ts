import { beforeEach, describe, expect, it, afterAll } from 'vitest'
import { closeBrowser } from '../src/pdf/browser'
import { loadTemplateHtml } from '../src/pdf/template'
import { renderLabelsToPdf } from '../src/pdf/render'
import { makeAccount, makeLabel, makeTemplate, prisma, resetDb } from './helpers'

let a: { id: number }
let b: { id: number }
beforeEach(async () => {
  await resetDb()
  a = await makeAccount('a')
  b = await makeAccount('b')
})
afterAll(closeBrowser)

describe('loadTemplateHtml (B3)', () => {
  it('uses own isCurrent template, ignoring other tenants and non-current ones', async () => {
    await makeTemplate(b.id, { html: '<p>B</p>{{#each labels}}{{/each}}', isCurrent: true })
    await makeTemplate(a.id, { html: '<p>A-old</p>', isCurrent: false })
    expect(await loadTemplateHtml(a.id, '100x70')).not.toContain('<p>B</p>')
    expect(await loadTemplateHtml(a.id, '100x70')).not.toContain('A-old')
    await makeTemplate(a.id, { html: '<p>A-cur</p>', isCurrent: true })
    expect(await loadTemplateHtml(a.id, '58x40')).toContain('A-cur')
  })
  it('falls back to the size-specific file', async () => {
    expect(await loadTemplateHtml(a.id, '58x40')).toContain('58mm 40mm')
    expect(await loadTemplateHtml(a.id, '100x70')).toContain('100mm 70mm')
  })
})

// Реальный Chromium; пропускается при SKIP_PDF=1
describe.skipIf(process.env.SKIP_PDF === '1')('pdf smoke', () => {
  const pages = (pdf: Buffer) => (pdf.toString('latin1').match(/\/Type\s*\/Page(?![s\w])/g) ?? []).length
  const mediaBox = (pdf: Buffer) =>
    /\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]/.exec(pdf.toString('latin1'))!.slice(1).map(Number)

  it('renders one 58x40 page per label, only own labels', async () => {
    const l1 = await makeLabel(a.id, { productName: '<b>Хлеб & соль</b>', manufacturedAt: new Date('2024-03-09T00:00:00Z') })
    const l2 = await makeLabel(a.id)
    const foreign = await makeLabel(b.id)
    const pdf = await renderLabelsToPdf({ accountId: a.id, ids: [l1.id, l2.id, foreign.id], size: '58x40' })
    expect(pdf.subarray(0, 4).toString()).toBe('%PDF')
    expect(pages(pdf)).toBe(2)
    const [w, h] = mediaBox(pdf)
    expect(w).toBeCloseTo(164.4, 0)
    expect(h).toBeCloseTo(113.4, 0)
  })

  it('renders 100x70 and reuses the shared browser', async () => {
    const l1 = await makeLabel(a.id)
    const first = await renderLabelsToPdf({ accountId: a.id, ids: [l1.id], size: '100x70' })
    const second = await renderLabelsToPdf({ accountId: a.id, ids: [l1.id], size: '10x7' })
    for (const pdf of [first, second]) {
      expect(pages(pdf)).toBe(1)
      const [w, h] = mediaBox(pdf)
      expect(Math.abs(w - 283.5)).toBeLessThan(1)
      expect(Math.abs(h - 198.4)).toBeLessThan(1)
    }
  })

  it('rejects unknown sizes', async () => {
    const l1 = await makeLabel(a.id)
    await expect(renderLabelsToPdf({ accountId: a.id, ids: [l1.id], size: 'a4' })).rejects.toThrow(/Unknown print size/)
  })

  it('blocks network/file requests from templates', async () => {
    const l1 = await makeLabel(a.id)
    await makeTemplate(a.id, {
      html: '{{#each labels}}<img src="file:///etc/passwd"><img src="http://127.0.0.1:1/x">{{/each}}',
      isCurrent: true,
    })
    const pdf = await renderLabelsToPdf({ accountId: a.id, ids: [l1.id], size: '100x70' })
    expect(pdf.subarray(0, 4).toString()).toBe('%PDF')
  })
})

afterAll(() => prisma.$disconnect())
