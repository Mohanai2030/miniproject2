/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `College` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[domain_name]` on the table `College` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `domain_name` to the `College` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "College" ADD COLUMN     "domain_name" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "StudentRefreshToken" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "refresh_token" TEXT NOT NULL,

    CONSTRAINT "StudentRefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StudentRefreshToken_student_id_key" ON "StudentRefreshToken"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "StudentRefreshToken_refresh_token_key" ON "StudentRefreshToken"("refresh_token");

-- CreateIndex
CREATE UNIQUE INDEX "College_name_key" ON "College"("name");

-- CreateIndex
CREATE UNIQUE INDEX "College_domain_name_key" ON "College"("domain_name");

-- AddForeignKey
ALTER TABLE "StudentRefreshToken" ADD CONSTRAINT "StudentRefreshToken_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("student_id") ON DELETE CASCADE ON UPDATE CASCADE;
