/*
  Warnings:

  - A unique constraint covering the columns `[public_id]` on the table `wallets` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "wallets" ADD COLUMN     "public_id" UUID NOT NULL DEFAULT gen_random_uuid();

-- CreateIndex
CREATE UNIQUE INDEX "wallets_public_id_key" ON "wallets"("public_id");
