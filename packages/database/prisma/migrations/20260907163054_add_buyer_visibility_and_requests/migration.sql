-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('AVAILABLE', 'LOCKED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "RequestVisibility" AS ENUM ('EVERYONE', 'BUYER_VISIBILITY_LIST');

-- CreateTable
CREATE TABLE "buyer_visibility_list" (
    "student_id" INTEGER NOT NULL,
    "buyer_id" INTEGER NOT NULL,

    CONSTRAINT "buyer_visibility_list_pkey" PRIMARY KEY ("student_id","buyer_id")
);

-- CreateTable
CREATE TABLE "Request" (
    "request_id" SERIAL NOT NULL,
    "requester_id" INTEGER NOT NULL,
    "item_name" TEXT NOT NULL,
    "brand_name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "image_url" TEXT,
    "request_status" "RequestStatus" NOT NULL DEFAULT 'AVAILABLE',
    "request_visibility" "RequestVisibility" NOT NULL DEFAULT 'EVERYONE',

    CONSTRAINT "Request_pkey" PRIMARY KEY ("request_id")
);
