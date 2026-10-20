/*
  Warnings:

  - The values [BUYER_VISIBILITY_LIST] on the enum `TripVisibility` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TripVisibility_new" AS ENUM ('EVERYONE', 'REQUESTER_VISIBILITY_LIST');
ALTER TABLE "public"."Trip" ALTER COLUMN "trip_visibility" DROP DEFAULT;
ALTER TABLE "Trip" ALTER COLUMN "trip_visibility" TYPE "TripVisibility_new" USING ("trip_visibility"::text::"TripVisibility_new");
ALTER TYPE "TripVisibility" RENAME TO "TripVisibility_old";
ALTER TYPE "TripVisibility_new" RENAME TO "TripVisibility";
DROP TYPE "public"."TripVisibility_old";
ALTER TABLE "Trip" ALTER COLUMN "trip_visibility" SET DEFAULT 'EVERYONE';
COMMIT;
