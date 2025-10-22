-- 0) Таблица аккаунтов (если ещё не создана генератором Prisma)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Account') THEN
        CREATE TABLE "Account" (
            "id" SERIAL PRIMARY KEY,
            "name" TEXT NOT NULL,
            "slug" TEXT NOT NULL UNIQUE,
            "apiKey" TEXT UNIQUE,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
    END IF;
END$$;

-- 1) Добавляем accountId как nullable (чтобы можно было проставить значения)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Label' AND column_name='accountId') THEN
        ALTER TABLE "Label" ADD COLUMN "accountId" INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Template' AND column_name='accountId') THEN
        ALTER TABLE "Template" ADD COLUMN "accountId" INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Folder' AND column_name='accountId') THEN
        ALTER TABLE "Folder" ADD COLUMN "accountId" INTEGER;
    END IF;
END$$;

-- 2) Гарантируем, что есть дефолтный аккаунт
INSERT INTO "Account" ("name","slug")
VALUES ('Default','default')
ON CONFLICT ("slug") DO NOTHING;

-- 3) Проставляем accountId дефолтного аккаунта там, где он NULL
UPDATE "Label"
SET "accountId" = (SELECT "id" FROM "Account" WHERE "slug"='default')
WHERE "accountId" IS NULL;

UPDATE "Template"
SET "accountId" = (SELECT "id" FROM "Account" WHERE "slug"='default')
WHERE "accountId" IS NULL;

UPDATE "Folder"
SET "accountId" = (SELECT "id" FROM "Account" WHERE "slug"='default')
WHERE "accountId" IS NULL;

-- 4) Делаем колонку обязательной
ALTER TABLE "Label"   ALTER COLUMN "accountId" SET NOT NULL;
ALTER TABLE "Template" ALTER COLUMN "accountId" SET NOT NULL;
ALTER TABLE "Folder"   ALTER COLUMN "accountId" SET NOT NULL;

-- 5) Вешаем внешние ключи (и индексы, если нужно)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Label_accountId_fkey') THEN
        ALTER TABLE "Label"
        ADD CONSTRAINT "Label_accountId_fkey"
        FOREIGN KEY ("accountId") REFERENCES "Account"("id")
        ON UPDATE CASCADE ON DELETE RESTRICT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Template_accountId_fkey') THEN
        ALTER TABLE "Template"
        ADD CONSTRAINT "Template_accountId_fkey"
        FOREIGN KEY ("accountId") REFERENCES "Account"("id")
        ON UPDATE CASCADE ON DELETE RESTRICT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Folder_accountId_fkey') THEN
        ALTER TABLE "Folder"
        ADD CONSTRAINT "Folder_accountId_fkey"
        FOREIGN KEY ("accountId") REFERENCES "Account"("id")
        ON UPDATE CASCADE ON DELETE RESTRICT;
    END IF;
END$$;

-- (опционально) Индексы для ускорения фильтрации по аккаунту
CREATE INDEX IF NOT EXISTS "Label_accountId_idx"   ON "Label"("accountId");
CREATE INDEX IF NOT EXISTS "Template_accountId_idx" ON "Template"("accountId");
CREATE INDEX IF NOT EXISTS "Folder_accountId_idx"   ON "Folder"("accountId");
