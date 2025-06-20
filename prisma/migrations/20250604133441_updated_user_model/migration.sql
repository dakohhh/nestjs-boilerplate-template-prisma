-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "passwordResetOtp" TEXT,
ADD COLUMN     "passwordResetOtpExpiresAt" TIMESTAMP(3),
ADD COLUMN     "verificationOtp" TEXT,
ADD COLUMN     "verificationOtpExpiresAt" TIMESTAMP(3);
