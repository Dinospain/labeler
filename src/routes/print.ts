import { Router, Request, Response } from 'express'
import { renderLabelsToPdfFromRequest } from '../pdf/render'

const router = Router()

// GET /api/print?ids=1,2,3&size=100x70
router.get('/', async (req: Request, res: Response) => {
  try {
    console.log('[GET /api/print]', req.query)

    // Генерация PDF
    const pdfBuffer = await renderLabelsToPdfFromRequest(req)

    // Отдаём PDF напрямую в браузер
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', 'inline; filename="labels.pdf"')
    res.send(pdfBuffer)
  } catch (err: any) {
    console.error('❌ Ошибка печати:', err)
    res.status(500).json({
      error: 'Ошибка при рендере PDF',
      details: err?.message ?? String(err),
    })
  }
})

export default router
