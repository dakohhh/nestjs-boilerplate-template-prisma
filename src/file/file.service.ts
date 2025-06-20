import ms from "ms";
import { Cache } from "cache-manager";
import { File } from "@prisma/client";
import { ConfigService } from "@nestjs/config";
import { AwsService } from "src/aws/aws.service";
import { ObjectCannedACL } from "@aws-sdk/client-s3";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { PrismaService } from "src/prisma/prisma.service";
import { InternalServerErrorException } from "@nestjs/common";
import { Inject, Injectable, NotFoundException } from "@nestjs/common";
@Injectable()
export class FileService {
  constructor(
    private readonly awsService: AwsService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  async uploadFile(options: { file: Express.Multer.File; folder: string; ACL?: ObjectCannedACL }): Promise<File> {
    const uploadResult = await this.awsService.uploadFileToS3({ s3Bucket: this.configService.get("CONFIGS.AWS.S3_BUCKET"), file: options.file, folder: options.folder, ACL: options.ACL });

    if (!uploadResult) throw new InternalServerErrorException("Sorry, something went wrong while uploading the file, please try again");

    const key = uploadResult.split("amazonaws.com/").pop();

    const file = await this.prisma.file.create({ data: { key } });

    return file;
  }
  async getFileUrl(options: { fileId: string; isSigned: boolean; useCloudFront?: boolean }): Promise<string> {
    // Get the file if it exists in the cache
    const cacheKey = `file:${options.fileId}:${options.isSigned}:${options.useCloudFront || false}`;
    const cachedFileUrl = await this.cacheManager.get(cacheKey);
    if (cachedFileUrl) {
      return cachedFileUrl as string;
    }

    // Get the file from the database using the fileId
    const file = await this.prisma.file.findUnique({ where: { id: options.fileId }, select: { id: true, key: true } });

    if (!file) throw new NotFoundException("File not found");

    let fileUrl: string = null;
    let cacheTTL: number = null;

    if (options.isSigned && !options.useCloudFront) {
      // For signed URLs, calculate the expiration time in seconds
      const defaultExpiryMs = this.configService.get("CONFIGS.AWS_S3_SIGNED_URL_EXPIRY_DURATION") ?? ms("1d");
      const expiresInSeconds = defaultExpiryMs / 1000;

      fileUrl = await this.awsService.getSignedUrlFromS3({
        s3Bucket: this.configService.get("CONFIGS.AWS.S3_BUCKET"),
        Key: file.key,
        Expires: expiresInSeconds,
      });

      // Set cache TTL to be slightly shorter than the signed URL expiration
      // This ensures we never serve an expired URL from cache
      cacheTTL = Math.floor(expiresInSeconds * 0.9); // 90% of the signed URL expiration time
    } else if (options.useCloudFront) {
      fileUrl = await this.awsService.getCloudFrontURLFromS3({ Key: file.key, isSigned: options.isSigned });
      // For CloudFront URLs, use default cache duration or determine based on signature
      cacheTTL = this.configService.get("CONFIGS.FILE_CACHE_EXPIRY_DURATION") / 1000;
    } else {
      // For non-signed S3 URLs, they don't expire, so use default cache duration
      fileUrl = `https://${this.configService.get("CONFIGS.AWS.S3_BUCKET")}.s3.amazonaws.com/${file.key}`;
      cacheTTL = this.configService.get("CONFIGS.FILE_CACHE_EXPIRY_DURATION") / 1000;
    }

    // Cache the file URL with appropriate TTL
    if (fileUrl) {
      await this.cacheManager.set(cacheKey, fileUrl, { ttl: cacheTTL });
    }

    return fileUrl;
  }

  async deleteFile(options: { fileId: string }): Promise<void> {
    // Delete the file from the cache if it exists
    await this.cacheManager.del(`file:${options.fileId}`);

    const file = await this.prisma.file.findUnique({ where: { id: options.fileId }, select: { id: true, key: true } });

    if (!file) throw new NotFoundException("File not found");
    await Promise.all([this.awsService.deleteFileFromS3({ s3Bucket: this.configService.get("CONFIGS.AWS.S3_BUCKET"), Key: file.key }), this.prisma.file.delete({ where: { id: options.fileId } })]);
  }
}
