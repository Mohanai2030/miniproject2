/*
  Warnings:

  - A unique constraint covering the columns `[phone]` on the table `Student` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `phone` to the `Student` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "phone" TEXT NOT NULL,
ALTER COLUMN "year" SET DATA TYPE TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Student_phone_key" ON "Student"("phone");
