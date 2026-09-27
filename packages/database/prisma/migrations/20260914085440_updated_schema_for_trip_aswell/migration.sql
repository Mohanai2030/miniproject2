/*
  Warnings:

  - The primary key for the `buyer_visibility_list` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `buyer_id` on the `buyer_visibility_list` table. All the data in the column will be lost.
  - You are about to drop the column `student_id` on the `buyer_visibility_list` table. All the data in the column will be lost.
  - Added the required column `possiblebuyerId` to the `buyer_visibility_list` table without a default value. This is not possible if the table is not empty.
  - Added the required column `requestId` to the `buyer_visibility_list` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TripVisibility" AS ENUM ('EVERYONE', 'BUYER_VISIBILITY_LIST');

-- AlterTable
ALTER TABLE "Request" ADD COLUMN     "creation_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deleted_or_not" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "buyer_visibility_list" DROP CONSTRAINT "buyer_visibility_list_pkey",
DROP COLUMN "buyer_id",
DROP COLUMN "student_id",
ADD COLUMN     "possiblebuyerId" INTEGER NOT NULL,
ADD COLUMN     "requestId" INTEGER NOT NULL,
ADD CONSTRAINT "buyer_visibility_list_pkey" PRIMARY KEY ("requestId", "possiblebuyerId");

-- CreateTable
CREATE TABLE "want_to_lock_request_from_buyer_to_requester" (
    "requestId" INTEGER NOT NULL,
    "buyerId" INTEGER NOT NULL,
    "approval_from_requester" BOOLEAN NOT NULL DEFAULT false,
    "creation_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "want_to_lock_request_from_buyer_to_requester_pkey" PRIMARY KEY ("requestId","buyerId")
);

-- CreateTable
CREATE TABLE "locked_requests" (
    "requestId" INTEGER NOT NULL,
    "buyerId" INTEGER NOT NULL,
    "locked_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "locked_requests_pkey" PRIMARY KEY ("requestId","buyerId")
);

-- CreateTable
CREATE TABLE "locked_requests_that_got_unlocked_by_requester" (
    "requestId" INTEGER NOT NULL,
    "buyerId" INTEGER NOT NULL,
    "unlocked_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "locked_requests_that_got_unlocked_by_requester_pkey" PRIMARY KEY ("requestId","buyerId","unlocked_time")
);

-- CreateTable
CREATE TABLE "locked_requests_that_got_unlocked_by_buyer" (
    "requestId" INTEGER NOT NULL,
    "buyerId" INTEGER NOT NULL,
    "unlocked_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "locked_requests_that_got_unlocked_by_buyer_pkey" PRIMARY KEY ("requestId","buyerId","unlocked_time")
);

-- CreateTable
CREATE TABLE "Trip" (
    "trip_id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "location" TEXT NOT NULL,
    "date_of_travel" TIMESTAMP(3) NOT NULL,
    "trip_visibility" "TripVisibility" NOT NULL DEFAULT 'EVERYONE',
    "expected_time_of_arrival" TIMESTAMP(3),
    "note" TEXT,
    "deleted_or_not" BOOLEAN NOT NULL DEFAULT false,
    "creation_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Trip_pkey" PRIMARY KEY ("trip_id")
);

-- CreateTable
CREATE TABLE "Requester_visibility_list" (
    "trip_id" INTEGER NOT NULL,
    "requester_id" INTEGER NOT NULL,

    CONSTRAINT "Requester_visibility_list_pkey" PRIMARY KEY ("trip_id","requester_id")
);

-- AddForeignKey
ALTER TABLE "buyer_visibility_list" ADD CONSTRAINT "buyer_visibility_list_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("request_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyer_visibility_list" ADD CONSTRAINT "buyer_visibility_list_possiblebuyerId_fkey" FOREIGN KEY ("possiblebuyerId") REFERENCES "Student"("student_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "Student"("student_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "want_to_lock_request_from_buyer_to_requester" ADD CONSTRAINT "want_to_lock_request_from_buyer_to_requester_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("request_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "want_to_lock_request_from_buyer_to_requester" ADD CONSTRAINT "want_to_lock_request_from_buyer_to_requester_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Student"("student_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locked_requests" ADD CONSTRAINT "locked_requests_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("request_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locked_requests" ADD CONSTRAINT "locked_requests_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Student"("student_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locked_requests_that_got_unlocked_by_requester" ADD CONSTRAINT "locked_requests_that_got_unlocked_by_requester_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("request_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locked_requests_that_got_unlocked_by_requester" ADD CONSTRAINT "locked_requests_that_got_unlocked_by_requester_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Student"("student_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locked_requests_that_got_unlocked_by_buyer" ADD CONSTRAINT "locked_requests_that_got_unlocked_by_buyer_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("request_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locked_requests_that_got_unlocked_by_buyer" ADD CONSTRAINT "locked_requests_that_got_unlocked_by_buyer_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Student"("student_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("student_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Requester_visibility_list" ADD CONSTRAINT "Requester_visibility_list_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "Trip"("trip_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Requester_visibility_list" ADD CONSTRAINT "Requester_visibility_list_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "Student"("student_id") ON DELETE CASCADE ON UPDATE CASCADE;
