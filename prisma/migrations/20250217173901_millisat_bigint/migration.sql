-- AlterTable
ALTER TABLE "PlatformLightningAddress" ALTER COLUMN "maxSendable" SET DEFAULT 10000000000,
ALTER COLUMN "maxSendable" SET DATA TYPE BIGINT,
ALTER COLUMN "minSendable" SET DEFAULT 1000,
ALTER COLUMN "minSendable" SET DATA TYPE BIGINT;
