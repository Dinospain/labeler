import path from 'path'
import { createApp } from './app'
import { env } from './env'
import { prisma } from './prisma/client'
import { closeBrowser } from './pdf/browser'
import { renderLabelsToPdf } from './pdf/render'

const app = createApp({
  prisma,
  pdfRenderer: (opts) => renderLabelsToPdf(opts),
  clientDist: path.resolve(__dirname, '../client/dist'),
})

const server = app.listen(Number(env.PORT), () => {
  console.log(`API on http://localhost:${env.PORT}`)
})

// аккуратное завершение
async function shutdown() {
  server.close()
  await closeBrowser()
  await prisma.$disconnect()
  process.exit(0)
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
