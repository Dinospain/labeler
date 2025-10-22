// src/types/express-account.d.ts
import 'express';

declare module 'express-serve-static-core' {
    interface Request {
        account?: { id: number; slug: string };
    }
}
