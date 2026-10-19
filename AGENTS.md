# AGENTS.md

Multi-tenant web app for designing and printing product labels (food labels: composition, nutrition, dates, EAN-13 barcode) as PDF. UI text and code comments are mostly Russian.

## Layout

```
src/            Express + TypeScript API (CommonJS, ts-node-dev)
  index.ts        app wiring, static serving of client/dist, SPA fallback
  env.ts          zod-validated env (DATABASE_URL, PORT=8080, TEMPLATE_PATH)
  middleware/account.ts   resolves tenant from X-Account header | ?account= | cookie -> req.account
  routes/         auth (list/"login" by slug), labels, folders, templates, print
  pdf/render.ts   labels -> Handlebars template -> Puppeteer PDF; EAN-13 via bwip-js
  prisma/         shared PrismaClient (client.ts), seed.ts
prisma/         schema.prisma (PostgreSQL) + migrations
templates/      default.html, label-58x40.html (Handlebars label templates)
scripts/        seed-accounts.ts, purge-default.ts, create-account.js
client/         Vite + React 19 + Tailwind 4 + zustand + react-router (separate package.json)
  src/api.ts      fetch wrappers (used by LabelsFourPanels page)
  src/store/      zustand stores (labels/folders/templates) - partly unused/duplicated
  src/pages/      Login, LabelsFourPanels (main 4-panel screen), TemplateEditor
  src/components/ modals (create/edit/print), Header
  src/utils/account.ts   account slug in localStorage
```

## Domain model (prisma/schema.prisma)

`Account` (tenant, unique `slug`) owns `Folder`, `Label`, `Template`. A label optionally belongs to a folder. All data access must be scoped by `accountId`.

## Auth

None real: "login" just stores an account slug; API trusts the `X-Account` header/cookie/query. Routes `labels`, `folders`, `print` reject requests without `req.account` (401).

## Commands

Root (API): `npm run dev` (port 8080), `npm run build` (tsc -> dist), `npm start`, `npm run prisma:migrate|prisma:generate|prisma:studio`, `npm run seed`.
Client (`cd client`): `npm run dev` (port 5173, proxies `/api` to 8080), `npm run build`, `npm run lint`.
Requires `.env` with `DATABASE_URL` (Postgres); see `.env.example`. Puppeteer needs Chromium.
There are currently **no tests** and no root lint script (eslint config exists).

## Print flow

`GET /api/print?ids=1,2&size=58x40|100x70` -> `renderLabelsToPdf` -> loads template -> maps labels (formats dates DD.MM.YYYY, computes kcal/kJ from protein/fat/carbs, generates EAN-13 with check digit; auto barcode `200000000000 + id` if missing) -> PDF.

## Known problems (refactor targets)

- `templates` routes are not account-scoped and use their own `PrismaClient`; `index.ts` also creates one. `renderLabelsToPdf` / `loadTemplateHtml` ignore the account (templates and `all` leak across tenants; "latest updated" template wins, `isCurrent` unused).
- Routes mounted twice (`/api/folders`, `/api/auth`); auth route registered after SPA fallback; `resolveAccount` runs before `cors`/`json`.
- Ownership checks duplicated per route; no zod validation in labels/folders; unsafe `any` types; `barcodeType` forced to `ean13`; `extra`, `address`, `mchsInfo`, `website` fields not exposed in client types/API payload.
- Client: label type duplicated in `types.ts` and `store/labels.ts`; stores expect `data.items` while API returns arrays (store/labels is likely dead code); fetch error handling duplicated; account header is never sent by `api.ts` (relies on cookie - verify); large page component with `prompt`/`alert`.
- `render.ts` mixes template loading, barcode, formatting and Puppeteer; launches a browser per request; contains dead `renderLabelsToPdfFromRequest`.
- `scripts/create-account.js` requires `dist/` build.

## Conventions

Match surrounding style (API uses no semicolons in newer files, single quotes). Add a Prisma migration for any schema change. Planned testing: Vitest for unit/API tests (pure helpers in `render.ts`, route handlers), Playwright for e2e flows.
