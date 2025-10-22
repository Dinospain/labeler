// src/middleware/account.ts
import type { Request, Response, NextFunction } from 'express'
import { prisma } from '../prisma/client'

export async function resolveAccount(req: Request, _res: Response, next: NextFunction) {
    try {
        // читаем из заголовка, query, а затем из cookie
        const cookieHeader = req.headers.cookie || ''
        const cookieMap = Object.fromEntries(cookieHeader.split(';').map(p => {
            const [k, ...rest] = p.trim().split('=')
            return [k, rest.join('=')]
        }))

        const raw = (
            req.header('X-Account') ||
            req.query.account ||
            cookieMap['X-Account'] ||
            ''
        ).toString().trim()

        if (!raw) return next()

        let acc = null as null | { id: number; slug: string }
        if (/^\d+$/.test(raw)) {
            acc = await prisma.account.findUnique({ where: { id: Number(raw) }, select: { id: true, slug: true } })
        } else {
            acc = await prisma.account.findUnique({ where: { slug: raw }, select: { id: true, slug: true } })
        }
        if (acc) req.account = acc
        next()
    } catch (e) {
        next(e)
    }
}