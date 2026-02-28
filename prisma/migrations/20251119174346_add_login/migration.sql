/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `passwordHash` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "users"
ADD COLUMN "passwordHash" TEXT DEFAULT '$2b$10$P5QHDqS5AxAOAmWOhj5zgu2UNQKzq/oQuEkvcLYgcKDUeuLso6NPm',
ADD COLUMN "username" TEXT;

UPDATE "users" SET "passwordHash" = '$2b$10$P5QHDqS5AxAOAmWOhj5zgu2UNQKzq/oQuEkvcLYgcKDUeuLso6NPm' WHERE "passwordHash" IS NULL;

ALTER TABLE "users" ALTER COLUMN "passwordHash" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
