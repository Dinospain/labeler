# Refactor & Test Plan

Status: **Phases 0–3 done (see §0), Phases 4–5 open**. Written after a full read of `src/`, `client/src/`, `prisma/`, `scripts/`, `templates/`.
Intended to be executed by a separate session, phase by phase. Each phase = one PR, CI green before the next.

Ground rules for the implementer:

- **Tests first, then refactor.** Phase 1 pins current behaviour of the pure logic so later moves are safe.
- Behaviour-preserving by default. Anything that changes behaviour is listed explicitly in §3 (bugs) or §7 (decisions) — don't invent extra changes.
- Keep the stack: Express 4, Prisma 5, React 19, Vite, Tailwind 4, zustand. No framework migrations, no major version bumps.
- Match style: single quotes, no semicolons (server), Russian UI strings/comments stay Russian.
- Every schema change → Prisma migration.
- Update `AGENTS.md` at the end of each phase if layout/commands changed.

---

## 0. Progress & handoff (read this first)

**TL;DR** — Phases 0, 1, 2 are implemented on branch `claude/youthful-cray-t8825p` ([PR #6](https://github.com/Dinospain/labeler/pull/6)). Phases 3–5 are untouched. State: root `npm run lint`, `typecheck`, `build`, `npm test` (36 unit tests) and `npm run test:api` (41 API tests, real Postgres) are green locally; client `build`/`lint`/`test` pass (lint has 18 warnings, see below). CI (`.github/workflows/ci.yml`: `server`, `api`, `client` jobs) was added but had not been observed running when this was written.

**Done**
- Phase 0: CI, Vitest (root + client), supertest/Playwright deps (Playwright not used yet, no `playwright.config.ts`/`e2e/` yet), root `lint`/`typecheck`/`test`/`test:api` scripts. B1 (deleted `src/prisma/seed.ts`), B21 (`.env.example`). `dist/` is now gitignored.
- Phase 1: `src/pdf/render.ts` split into `ean13, format, barcode, template, viewModel, html, sizes` (moved unchanged); dead `renderLabelsToPdfFromRequest` removed. Pinned-behaviour tests live next to the modules (`src/pdf/*.test.ts`), marked `pinned`.
- Phase 2: `src/app.ts` (`createApp({ prisma, pdfRenderer, clientDist? })`), thin `src/index.ts` (listens, SIGINT/SIGTERM shutdown), `src/http/{errors,asyncHandler,validate}.ts`, `middleware/{account,requireAccount}.ts` (`readAccountRef` is pure), `src/modules/{auth,labels,folders,templates,print}/` with zod schemas, account-scoped services (`findFirst({ id, accountId })`) and routes. Old `src/routes/*` deleted. Fixed **B2, B6, B7, B8, B9, B13** (B13 validation on write only; print still auto-corrects) and the single-`isCurrent`-per-account rule. Middleware order is now cors → json → resolveAccount → `/api` routers → `/api/*` JSON 404 → static → SPA fallback (non-`/api` only) → errorHandler. `address`, `mchsInfo`, `website` are now accepted by the labels API.
- API tests in `test/*.api.test.ts` (helpers in `test/helpers.ts`, DB reset in `test/globalSetup.ts` via `prisma migrate reset`, `TRUNCATE` per test). They need `DATABASE_URL` pointing at a **throwaway** DB (migrate reset wipes it). Locally in the cloud container: `service postgresql start`, create DB `labeler_test`, `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/labeler_test`.

**Not done / deviations from the plan**
- Phase 2 tests were written together with the refactor rather than strictly before it.
- `extra` (Json) is still not exposed by the labels API/schema.
- `renderLabelsToPdf` still ignores the account and still has the `all` option (B3, B4, Phase 3). The `pdfRenderer` injected in `index.ts` calls it with `{ ids, size }` only; Phase 3 should change the `PdfRenderer` type in `modules/print/print.routes.ts` to also receive `accountId`, and add the unknown-size 400 (B5).
- Print route still passes `size` through unvalidated; unknown size → A4 (pinned in `sizes.ts`/`render.ts`).
- Both PDF-related pinned tests (`html.test.ts` "does not escape values", `format.test.ts` local-time dates) must be **updated deliberately** when fixing B10/B12.
- The PDF smoke test (§4.2) is not written; no real PDF has been rendered in this work, so "print output unchanged" for Phase 1 is only covered by unit tests.
- Client lint: `no-explicit-any`, `no-empty`, `no-unused-vars` are downgraded to warnings in `client/eslint.config.js` (restored to error in Phase 4).
- `scripts/` (B20), client (B14–B19), `axios` removal, e2e: untouched.

**Phase 3 done** (branch `claude/practical-einstein-lw50rc`): B3, B4, B5, B10, B11, B12 fixed. `renderLabelsToPdf({ accountId, ids, size })` (no `all`, filtered by account, throws `UnknownSizeError`); `loadTemplateHtml(accountId, size)`; `PdfRenderer` receives `accountId`; print route returns 400 for unknown size (`10x7` normalized to `100x70`); a4 removed from `sizes.ts`; `pdf/browser.ts` shared Chromium (closed in `index.ts` shutdown); Puppeteer request interception allows only `data:`; Handlebars escaping on; dates in UTC (D4 default). Templates: address/МЧС/website wrapped in `{{#if}}`; the hard-coded placeholder address/МЧС/site in `label-58x40.html` were replaced by the label fields. A DB template with `isCurrent` applies to every size (its own `@page` decides the page). `TEMPLATE_PATH` now only overrides the 100x70 file. Tests: `test/pdf.api.test.ts` (real Chromium + DB, `SKIP_PDF=1` to skip; CI `api` job now downloads Chromium). Chromium rounds page size to px (100mm → 282.96pt), so MediaBox is asserted with ±1pt.

**Phase 4 done** (branch `claude/practical-einstein-lw50rc`, client only; B14–B18 fixed): `client/src/api/{client,labels,folders,templates,auth}.ts` (`request<T>()` sets `X-Account`, parses `{error}`, handles 204; the `window.fetch` monkey patch and `src/api.ts` are gone); `types.ts` has `address/mchsInfo/website` + `LabelPayload`; `pages/LabelsPage.tsx` (composition only) uses `features/labels/{useLabels,LabelList,LabelForm,labelForm,labelList}`, `features/folders/{useFolders,FolderPanel}`, `features/print/{PrintModal,printUrl}`; one `LabelForm` for create+edit (with date/address/МЧС/website fields), mounted only while its modal is open; `prompt/alert/confirm` replaced with `components/{PromptDialog,ConfirmDialog}` + `Modal`, action errors go to one banner (`page-error`); folder counts are derived from local labels; stable `data-testid`s (`new-folder`, `new-label`, `edit-label`, `print-label`, `delete-label`, `delete-folder`, `folder-all`, `folder-<id>`, `label-<id>`, `search`, `f-<field>`, `form-submit`, `form-error`, `confirm-ok`, `prompt-input`, `prompt-submit`, `print-dialog`, `print-close`, `page-error`). Dead stores `store/labels.ts`, `store/folders.ts` deleted; `store/templates.ts` kept (uses `templatesApi`) until D5. Client ESLint rules `no-explicit-any/no-empty/no-unused-vars` are back to `error`. Client unit tests: 17 (`labelForm`, `labelList`, `printUrl`, `api/client`). Manual Playwright smoke (login → folder → label with dates → edit → print 200 pdf → delete) passed.

**Next: Phase 5** (E2E + B19/D5 + B20 + remove `axios` + AGENTS.md cleanup). Keep `AGENTS.md` updated at the end of each phase.

---

## 1. Current state (summary, as of the start of the work)

Server (`src/`): Express app with 5 routers, Prisma, Handlebars + Puppeteer PDF rendering, bwip-js EAN-13.
Client (`client/`): one real page (`LabelsFourPanels`, 314 lines), `Login`, an unrouted `TemplateEditor`, 4 modals, 3 zustand stores (2 of them unused/broken).
No tests, no CI, no root lint script. `npm run build` likely fails today (see B1).

## 2. Target structure

```
src/
  app.ts                 createApp({ prisma, pdfRenderer }) -> express app (no listen) — testable with supertest
  index.ts               reads env, createApp(), listen, graceful shutdown (SIGINT/SIGTERM)
  env.ts
  prisma/client.ts       the ONLY PrismaClient
  http/
    errors.ts            HttpError, notFound(), badRequest(); errorHandler middleware (JSON, zod-aware)
    asyncHandler.ts      wraps async handlers (Express 4 does not catch rejections)
    validate.ts          zod helpers: parseBody(schema), parseIdParam()
  middleware/
    account.ts           resolveAccount (parsing split into pure fn `readAccountRef(req)`)
    requireAccount.ts    single 401 guard (replaces 3 copies)
  modules/
    labels/   labels.schema.ts (zod), labels.service.ts (account-scoped queries), labels.routes.ts
    folders/  folders.schema.ts, folders.service.ts, folders.routes.ts
    templates/templates.schema.ts, templates.service.ts, templates.routes.ts   (account-scoped!)
    auth/     auth.routes.ts
    print/    print.routes.ts
  pdf/
    ean13.ts             ensureEan13, formatEanHuman, autoBarcodeFor(id)
    format.ts            formatDate, calcEnergy (returns {kcal,kJ}) + energyText
    barcode.ts           makeBarcodeDataUrl (bwip-js)
    template.ts          fixupTemplate, loadTemplateHtml(accountId, size), bundled default
    viewModel.ts         toLabelViewModel(label) — pure except barcode image
    html.ts              buildHtml(tpl, labels)
    browser.ts           shared Puppeteer browser (lazy launch, reuse, close on shutdown)
    render.ts            renderLabelsToPdf({ accountId, ids, size }) — orchestration only
    sizes.ts             LABEL_SIZES = { '58x40': {...pdf opts}, '100x70': {...}, a4 } + parseSize()
client/src/
  api/client.ts          request<T>() — one place for headers (X-Account), JSON, error mapping, 204
  api/{labels,folders,templates,auth}.ts
  types.ts               single source of domain types (incl. address, mchsInfo, website, dates)
  features/labels/       LabelForm.tsx (shared by create+edit), labelForm.ts (pure: toPayload/fromLabel),
                         LabelList.tsx, useLabels.ts (state + CRUD)
  features/folders/      FolderPanel.tsx, useFolders.ts, CreateFolderDialog.tsx
  features/print/        PrintModal.tsx, printUrl.ts
  pages/                 LabelsPage.tsx (composition only), Login.tsx, TemplateEditor.tsx (routed or deleted, see D5)
  components/            Modal.tsx, ConfirmDialog.tsx, Toast/inline error
  utils/account.ts
```

Delete: `client/src/store/labels.ts`, `client/src/store/folders.ts` (dead/broken), `renderLabelsToPdfFromRequest`, `src/prisma/seed.ts` (broken, superseded by `scripts/seed-accounts.ts`), unused `axios` dep, the second `PrismaClient`s in `index.ts`/`templates.ts`.
Decide on `store/templates.ts` together with D5.

## 3. Bugs found (fix during the refactor, each with a regression test)

| # | Where | Problem | Fix |
|---|---|---|---|
| B1 | `src/prisma/seed.ts` | Uses non-existent `priceCents`, no `accountId`, `upsert` template without `accountId` → `tsc` fails (it's under `rootDir`) | Delete; `npm run seed` already uses `scripts/seed-accounts.ts`. Verify `npm run build` passes. |
| B2 | `src/routes/templates.ts` | Not account-scoped; `POST` cannot work (`accountId` is required in schema); `make-current`/`updateMany` reset **every tenant's** templates; own `PrismaClient` | Scope all queries by `req.account.id`, require account, use shared prisma, 404 on foreign id |
| B3 | `src/pdf/render.ts:39` | `loadTemplateHtml` picks the latest-updated template of **any** account; ignores `isCurrent` and size | `loadTemplateHtml(accountId, size)`: account's `isCurrent` template → file for the size → bundled default |
| B4 | `render.ts:233` | `all: true` prints labels of all tenants (currently unreachable from routes, but exported) | Remove `all`; render takes `accountId` and always filters by it |
| B5 | `PrintModal` sends `size=58x40`, but default `TEMPLATE_PATH` is `default.html` with `@page 100mm 70mm` + `preferCSSPageSize: true` | Size param effectively ignored; output page size comes from template CSS | Map size → template file (`58x40 → label-58x40.html`, `100x70 → default.html`); reject unknown sizes with 400 |
| B6 | `labels.ts:23` `pickCreateUpdate` on `PUT` | Fields missing from the body are written as `null` → editing a label wipes `manufacturedAt/packagedAt/expiresAt/address/...` that the form doesn't send | `PUT` uses a zod schema where omitted = `undefined` (unchanged), explicit `null` = clear. Consider `PATCH` semantics (D3) |
| B7 | `labels.ts` | No validation: `Number('abc')` → `NaN` passed to Prisma (500); `:id` not validated | zod schemas; `parseIdParam` → 400 |
| B8 | all routes | Async handlers without try/catch in Express 4 → Prisma error = unhandled rejection, request hangs | `asyncHandler` + central `errorHandler` |
| B9 | `index.ts` | `resolveAccount` before `cors`/`json`; `/api/folders` and `/api/auth` mounted twice; `app.get('*')` SPA fallback returns `index.html` for unknown `/api/*` GETs | Order: cors → json → resolveAccount → `/api` routers → `/api/*` 404 JSON → static → SPA fallback (non-`/api` only) |
| B10 | `render.ts:220` | Handlebars `noEscape: true` → label text with `<`/`&` breaks layout and is HTML injection into a Chromium running with `--no-sandbox` | Escape by default (`{{ }}`); templates that need raw HTML use `{{{ }}}` explicitly. Also block all non-`data:` network requests in Puppeteer (`page.setRequestInterception`) so templates can't hit `file://`/internal URLs. See D2 |
| B11 | `render.ts:249` | New Chromium per request (slow, memory) | Shared browser, new page per request, close page in `finally` |
| B12 | `render.ts:187` `formatDate` | Uses server-local timezone; dates sent as `YYYY-MM-DD` are stored as UTC midnight → may print previous day on servers west of UTC | Format in UTC (or a configured TZ, D4). Test with `TZ=America/New_York` |
| B13 | `ensureEan13` | Input <12 digits is right-padded with zeros; a 13-digit input with a wrong check digit is silently "corrected" | Keep auto-fix behaviour for printing (pinned by tests), but validate on write: barcode must be 12 digits, or 13 with a valid check digit → 400 otherwise (D6) |
| B14 | `LabelsFourPanels.tsx:96` | `.sort()` mutates the `labels` state array when no filter applies | `[...arr].sort(...)` |
| B15 | `LabelCreateModal` | Stays mounted when closed → form state not reset between opens; `defaultFolderId` only read on first mount | Mount form only when open (or `key`), init from props |
| B16 | Create/Edit modals | No inputs for `manufacturedAt/packagedAt/expiresAt/address/mchsInfo/website` although templates print them (`default.html:89-91` prints empty "МЧС:", "Сайт:") | Add fields to the shared `LabelForm`; wrap optional footer lines in `{{#if}}` in templates |
| B17 | `LabelsFourPanels.handleDelete` | No error handling (unhandled rejection, UI silently stale) | Use the same error surface as other actions |
| B18 | Folder `_count` | Counts in folder list not updated after create/delete/move of labels | Recompute from local labels or refetch folders after label mutations |
| B19 | `TemplateEditor` | Not routed; calls `/api/print?all=true` (param ignored by server) | See D5 |
| B20 | `scripts/create-account.js` | Requires `dist/` | Rewrite as `scripts/create-account.ts`, run via `ts-node`, add `npm run account:create` |
| B21 | `.env.example` | Typo `DATABASE_URL==`; missing PORT/TEMPLATE_PATH | Fix, document all vars |

Already fine (verified, no action): `X-Account` **is** sent — `client/src/main.tsx` monkey-patches `window.fetch`. Replace that patch with the explicit header in `api/client.ts` (Phase 4), keep `?account=` for the PDF iframe URL. `Label.folderId` FK is `ON DELETE SET NULL`, so deleting a non-empty folder works.

## 4. Testing strategy

**Unit / API — Vitest** (root and client each get their own `vitest.config.ts`).
**E2E — Playwright** (`e2e/` at repo root, own `playwright.config.ts`).
Component behaviour is covered by extracting pure logic into modules (Vitest) + Playwright e2e for real UI. No React Testing Library unless D7 says otherwise.

### 4.1 Server unit (Vitest, no DB)
- `ean13`: check digit for known codes (`460123456789 → 4601234567893`, `200000000001 → …`), non-digits stripped, 13-digit input recomputed, short input padding (pinned), `formatEanHuman`, `autoBarcodeFor(id)`.
- `format`: `formatDate` (Date, ISO string, invalid → undefined, null), UTC behaviour under `TZ` env (B12); `calcEnergy` (zeros, nulls, decimals, rounding; pin current 4/9/4 + `kcal*4.184`).
- `template.fixupTemplate`: each of the 4 regex rewrites, idempotence, untouched normal template.
- `viewModel.toLabelViewModel`: dates formatted, auto barcode when missing, barcodeDataUrl starts with `data:image/png;base64,` (real bwip-js — it's fast).
- `html.buildHtml`: renders N labels, escapes `<script>` in productName (B10), both shipped templates compile.
- `sizes.parseSize`: `58x40`, `100x70`, `10x7` alias, case-insensitive, unknown → error.
- `labels.schema`: number/empty-string/null coercion, date parsing, folderId variants, barcode validation (B13), PUT omitted-vs-null (B6).
- `middleware/account.readAccountRef`: header > query > cookie precedence, numeric id vs slug, cookie with `=` in value.

### 4.2 Server API (Vitest + supertest, real Postgres)
- Needs a real DB: `DATABASE_URL` pointing to a throwaway Postgres (CI service container; locally `docker run postgres:16`). Per test file: `prisma migrate reset --force --skip-seed` once in `globalSetup`, `TRUNCATE ... RESTART IDENTITY CASCADE` in `beforeEach`. Run API test files sequentially (`fileParallelism: false`).
- `createApp({ prisma, pdfRenderer })` — inject a fake `pdfRenderer` for route tests so they don't launch Chromium.
- Fixtures helper: `makeAccount(slug)`, `makeFolder`, `makeLabel`.
- Cases:
  - auth: list accounts sorted; login ok / 400 empty / 404 unknown.
  - every protected route: 401 without account; account via header, `?account=`, cookie, numeric id.
  - **tenant isolation matrix** (the most important tests): account B cannot GET/PUT/DELETE A's label/folder/template (404), cannot attach a label to A's folder (400), print with A's ids → 404, template list only own.
  - labels CRUD: create minimal, create full, validation errors (400 with message), PUT partial does not clobber (B6), delete 204 then 404.
  - folders: CRUD, `_count`, delete with labels → labels' folderId null.
  - templates: create, single `isCurrent` per account, make-current doesn't touch other tenant (B2).
  - print: ids filtering/ordering, all-labels default, unknown size 400, renderer called with `accountId` and resolved template.
  - unknown `/api/x` → JSON 404 (B9); Prisma error → JSON 500 (B8).
- One **PDF smoke test** (tagged, real Puppeteer, can be skipped with `SKIP_PDF=1`): response starts with `%PDF`, page count == label count (count `/Type /Page` objects), MediaBox matches size (58×40 mm ≈ 164.4×113.4 pt).

### 4.3 Client unit (Vitest, `environment: 'node'` is enough for pure modules)
- `labelForm`: `fromLabel(label)` ↔ `toPayload(values)` (empty strings → null, numeric parsing, dates `YYYY-MM-DD`, trims name).
- label filtering/sorting helper (folder filter, case-insensitive search, Russian `localeCompare`, no mutation — B14).
- `api/client.request`: sets `X-Account`, parses `{error}` messages, handles 204, network error → Error (stub `fetch` with `vi.fn`).
- `printUrl(labelId, size, slug)`.

### 4.4 E2E (Playwright, Chromium from `/opt/pw-browsers` in cloud sessions)
- `webServer`: build client, start API (`npm start` after build) on a test port against the test DB, run `npm run seed` (accounts `hlebzavod`, `restaurant`).
- Flows:
  1. Redirect to `/login` without account; login via select and via manual slug; unknown slug shows error.
  2. Seeded labels visible for `hlebzavod`, not those of `restaurant` (and vice versa after "Сбросить" + re-login).
  3. Create folder → appears and becomes active; create label in it → listed, count updated.
  4. Edit label (incl. date fields) → saved values persist after reload; untouched fields not wiped (B6).
  5. Search filter + folder filter.
  6. Print preview: opening the modal triggers `/api/print` → `200 application/pdf` (assert with `page.waitForResponse`; don't assert the PDF viewer UI).
  7. Delete label (confirm dialog) and delete folder → labels move to "Все".
- Replace `prompt/alert/confirm` (D8) before writing e2e, or handle via `page.on('dialog')`.
- Use stable selectors: add `data-testid` / accessible names during Phase 4.

### 4.5 CI
`.github/workflows/ci.yml`: Node 20, `postgres:16` service; jobs: `lint` (root + client), `typecheck` (root `tsc --noEmit`, client `tsc -b`), `test:unit` (root + client), `test:api`, `e2e` (Playwright, upload report on failure).

New scripts — root: `lint`, `typecheck`, `test` (unit), `test:api`, `test:e2e`; client: `test`.

## 5. Phases

**Phase 0 — tooling & baseline (no behaviour change)**
- Fix B1, B21. Add Vitest (root + client), supertest, Playwright deps; root `lint`/`typecheck` scripts; CI workflow with lint + typecheck + an empty-passing test job.
- Done when: `npm run build`, `npm run lint`, `npm run typecheck`, `cd client && npm run build && npm run lint` pass in CI.

**Phase 1 — extract & pin pure PDF logic**
- Split `render.ts` into `pdf/{ean13,format,barcode,template,viewModel,html,sizes}.ts` by *moving* code unchanged; delete `renderLabelsToPdfFromRequest`.
- Write §4.1 tests for current behaviour (including the odd ones, marked `// pinned: current behaviour`).
- Done when: unit tests green, print output unchanged (manual check of one PDF or the smoke test).

**Phase 2 — server structure + API tests**
- `createApp` / `index.ts` split, middleware order (B9), `asyncHandler` + `errorHandler` (B8), `requireAccount`, single prisma, zod schemas (B7), services with account-scoped queries (`findFirst({ where: { id, accountId } })` instead of find-then-compare).
- Write §4.2 tests *against the current API contract first*, then refactor routes until green.
- Then fix B2, B6, B13 with failing tests first.
- Done when: API suite green, including the tenant-isolation matrix.

**Phase 3 — PDF pipeline fixes**
- B3, B4, B5 (size→template mapping, `sizes.ts`), B10 (escaping + request interception), B11 (shared browser, closed on shutdown), B12 (UTC dates).
- Update both templates: `{{#if}}` around address/МЧС/website; keep raw-HTML fields only where intended.
- PDF smoke test.

**Phase 4 — client refactor**
- `api/client.ts` + per-resource modules, remove `window.fetch` monkey patch and dead stores, single `types.ts` (add missing fields).
- Split `LabelsFourPanels` into `LabelList`, `FolderPanel`, `useLabels`, `useFolders`; one `LabelForm` for create+edit (B15, B16); fix B14, B17, B18.
- Replace `prompt/alert/confirm` with `Modal`-based dialogs + inline error (D8). Add `data-testid`s.
- §4.3 tests.

**Phase 5 — E2E + cleanup**
- Playwright suite §4.4 in CI.
- B19/D5 (template editor), B20, remove `axios`, update `AGENTS.md` (layout, commands, remove fixed "known problems").

## 6. Out of scope (unless asked)
Real authentication, i18n, UI redesign, Prisma/Express/React major upgrades, multi-labels-per-page layout (`perRow`), barcode types other than EAN-13.

## 7. Decisions needed from the owner (defaults in **bold** — implementer uses the default if unanswered)

- **D1 Auth**: keep slug-only "login" (**yes**, out of scope) — but note any user can read any tenant by changing the header.
- **D2 Template escaping**: escape label fields by default (**yes**); allow raw HTML in templates themselves (**yes**, templates are trusted per tenant).
- **D3 Update semantics**: keep `PUT` but with "omitted = unchanged" (**yes**) vs. introduce `PATCH`.
- **D4 Date timezone**: format dates in UTC (**UTC**) vs. a configurable `LABEL_TZ` (e.g. `Europe/Minsk`).
- **D5 TemplateEditor**: **route it at `/templates` with account-scoped API** vs. delete it and the templates store.
- **D6 Barcode validation**: reject invalid EAN-13 on save (**yes**) vs. keep silent auto-correction everywhere.
- **D7 Component tests**: **none beyond pure-logic Vitest + Playwright e2e** vs. Playwright component testing (`@playwright/experimental-ct-react`, still experimental).
- **D8 Dialogs**: **replace native `prompt/alert/confirm` with in-app modals** vs. keep them.
- **D9 Energy formula**: keep current 4/9/4 kcal + `kcal × 4.184` kJ (**keep**) vs. TR TS 022 coefficients (17/37/17 kJ per g) computed independently.
