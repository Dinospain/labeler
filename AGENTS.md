# AGENTS.md

Multi-tenant web app for designing and printing product labels (food labels: composition, nutrition, dates, EAN-13 barcode) as PDF. UI text and code comments are mostly Russian.

## Layout

```
src/            Express + TypeScript API (CommonJS, ts-node-dev)
  index.ts        listen + graceful shutdown; builds the app via createApp
  app.ts          createApp({ prisma, pdfRenderer, clientDist }) - middleware order, routers, SPA fallback, errorHandler
  env.ts          zod-validated env (DATABASE_URL, PORT=8080, TEMPLATE_PATH = file for size 100x70)
  http/           HttpError + errorHandler, asyncHandler, zod parse helpers
  middleware/     account.ts (tenant from X-Account header | ?account= | cookie -> req.account), requireAccount.ts (401)
  modules/        auth, labels, folders, templates, print: *.routes.ts / *.schema.ts (zod) / *.service.ts (account-scoped)
  pdf/            render.ts (orchestration) + browser (shared Chromium), ean13, format, barcode, template, viewModel, html, sizes
  prisma/         shared PrismaClient (client.ts)
prisma/         schema.prisma (PostgreSQL) + migrations
templates/      default.html, label-58x40.html (Handlebars label templates)
test/           API tests (*.api.test.ts, supertest + real Postgres; globalSetup runs prisma migrate reset!)
scripts/        seed-accounts.ts, purge-default.ts, create-account.js
client/         Vite + React 19 + Tailwind 4 + zustand + react-router (separate package.json)
  src/api/        client.ts (request<T>: X-Account header, error mapping, 204) + labels/folders/templates/auth
  src/features/   labels (useLabels, LabelList, LabelForm, pure labelForm/labelList), folders (useFolders, FolderPanel), print (PrintModal, printUrl)
  src/store/      templates.ts only (zustand; used by the unrouted TemplateEditor)
  src/pages/      Login, LabelsPage (composition), TemplateEditor (unrouted)
  src/components/ Modal, ConfirmDialog, PromptDialog, Header
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
Root also has `npm run lint`, `npm run typecheck`, `npm test` (Vitest unit, `src/**/*.test.ts`), `npm run test:api` (Vitest + real throwaway Postgres via `DATABASE_URL`; resets the DB; includes a real-Chromium PDF smoke test, skip with `SKIP_PDF=1`, Chromium path via `PUPPETEER_EXECUTABLE_PATH`); client has `npm test`. CI: `.github/workflows/ci.yml`. Remaining refactor work (Phase 5) and handoff notes: see `docs/REFACTOR_PLAN.md` (phased refactor & test plan).

## Print flow

`GET /api/print?ids=1,2&size=58x40|100x70` (unknown size -> 400) -> `renderLabelsToPdf({accountId, ids, size})` -> loads template (account's `isCurrent` DB template -> file for size: 58x40 `label-58x40.html`, 100x70 `default.html` -> bundled) -> maps labels (formats dates DD.MM.YYYY in UTC, computes kcal/kJ from protein/fat/carbs, generates EAN-13 with check digit; auto barcode `200000000000 + id` if missing) -> PDF via a shared lazily-launched Chromium (page per request; only `data:` requests allowed; closed on shutdown). Handlebars escapes `{{ }}`; raw HTML only via `{{{ }}}` in the template.

## Known problems (refactor targets)

- `barcodeType` forced to `ean13`; `extra` not exposed by the API.
- Client: `TemplateEditor` is unrouted and calls the ignored `?all=true` (Phase 5, D5); `axios` is an unused dependency.
- `scripts/create-account.js` requires `dist/` build.

## Conventions

Match surrounding style (API uses no semicolons in newer files, single quotes). Add a Prisma migration for any schema change. Planned testing: Vitest for unit/API tests (pure helpers in `render.ts`, route handlers), Playwright for e2e flows.
