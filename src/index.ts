import path from 'path'
import { createApp } from './app'
import { env } from './env'
import { prisma } from './prisma/client'
import { renderLabelsToPdf } from './pdf/render'

const app = createApp({
  prisma,
  pdfRenderer: ({ ids, size }) => renderLabelsToPdf({ ids, size }),
  clientDist: path.resolve(__dirname, '../client/dist'),
})

const server = app.listen(Number(env.PORT), () => {
  console.log(`API on http://localhost:${env.PORT}`)
})

// аккуратное завершение
async function shutdown() {
  server.close()
  await prisma.$disconnect()
  process.exit(0)
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
