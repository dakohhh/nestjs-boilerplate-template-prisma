-- CreateEnum
CREATE TYPE "Provider" AS ENUM ('FACEBOOK');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "provider" "Provider",
ADD COLUMN     "providerId" TEXT;
