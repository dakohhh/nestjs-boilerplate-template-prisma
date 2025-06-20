import ms from "ms";
import crypto from "crypto";
import moment from "moment";
import * as Sentry from "@sentry/node";
import { Injectable } from "@nestjs/common";
import { Upload } from "@aws-sdk/lib-storage";
import { ConfigService } from "@nestjs/config";
import { SESClient } from "@aws-sdk/client-ses";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getSignedUrl as getSignedCloudFrontUrl } from "@aws-sdk/cloudfront-signer";
import { CompleteMultipartUploadCommandOutput, DeleteObjectCommand, GetObjectCommand, ObjectCannedACL, S3Client, PutObjectCommandInput, ServerSideEncryption } from "@aws-sdk/client-s3";

@Injectable()
export class AwsService {
  s3Client: S3Client;
  sesClient: SESClient;

  constructor(private readonly configService: ConfigService) {
    this.sesClient = new SESClient({
      region: "us-east-2",
      credentials: {
        accessKeyId: this.configService.get("CONFIGS.AWS.ACCESS_KEY_ID"),
        secretAccessKey: this.configService.get("CONFIGS.AWS.SECRET_ACCESS_KEY"),
      },
    });

    this.s3Client = new S3Client({
      region: "us-east-2",
      credentials: {
        accessKeyId: this.configService.get("CONFIGS.AWS.ACCESS_KEY_ID"),
        secretAccessKey: this.configService.get("CONFIGS.AWS.SECRET_ACCESS_KEY"),
      },
    });
  }

  async uploadFileToS3({ s3Bucket, file, folder, fileName, ACL = ObjectCannedACL.public_read }: { s3Bucket: string; file: Express.Multer.File; folder: string; fileName?: string; ACL?: ObjectCannedACL }) {
    const finalFileName = fileName ? fileName : `${crypto.randomBytes(30).toString("hex")}`;

    const params: PutObjectCommandInput = {
      ACL,
      Bucket: s3Bucket,
      Body: file.buffer,
      ContentType: file.mimetype,
      Key: `${this.configService.get("DEPLOYMENT_ENV")}/${folder}/${finalFileName}`,
      ServerSideEncryption: ServerSideEncryption.AES256, //added this to encrypt the files on aws
    };

    try {
      const uploadData = new Upload({
        params: params,
        client: this.s3Client,
        leavePartsOnError: false,
      });

      const data = (await uploadData.done()) as CompleteMultipartUploadCommandOutput;

      if (!data.Location) return null;

      return data.Location;
    } catch (error: any) {
      console.log(error, "error");
      Sentry.captureException(new Error("From Third-Party: fn (uploadFileToS3)"), { extra: { params, response: error }, level: "error" });
      return null;
    }
  }

  async deleteFileFromS3({ s3Bucket, Key }: { s3Bucket: string; Key: string }) {
    const params = {
      Bucket: s3Bucket,
      Key: Key,
    };

    try {
      await this.s3Client.send(new DeleteObjectCommand(params));

      return true;
    } catch (error: any) {
      Sentry.captureException(new Error("From Third-Party: fn (deleteFileFromS3)"), { extra: { params, response: error }, level: "error" });
      return false;
    }
  }

  async getSignedUrlFromS3({ s3Bucket, Key, Expires }: { s3Bucket: string; Key: string; Expires?: number }) {
    // If the expires is not provided, use the default expiry duration
    // The default expiry duration is 1 day (in milliseconds), so we need to convert it to seconds
    if (!Expires) {
      const defaultExpiryMs = this.configService.get("CONFIGS.AWS_S3_SIGNED_URL_EXPIRY_DURATION") ?? ms("1d");
      Expires = defaultExpiryMs / 1000;
    }

    const params = {
      Bucket: s3Bucket,
      Key: Key,
    };

    try {
      const signedUrl = await getSignedUrl(this.s3Client, new GetObjectCommand(params), { expiresIn: Expires });

      return signedUrl;
    } catch (error: any) {
      console.log("error", error);
      Sentry.captureException(new Error("From Third-Party: fn (getSignedUrlFromS3)"), { extra: { params, response: error }, level: "error" });
      return null;
    }
  }

  async getCloudFrontURLFromS3({ Key, isSigned, dateLessThan = moment().add(1, "days") }: { Key: string; isSigned: boolean; dateLessThan?: moment.Moment }) {
    const cloudFrontUrl = `${this.configService.get("CONFIGS.AWS.AWS_CLOUDFRONT_DISTRIBUTION_DOMAIN_NAME")}/${Key}`;
    if (!isSigned) return cloudFrontUrl;

    const params = {
      url: cloudFrontUrl,
      dateLessThan: dateLessThan.toISOString(),
      keyPairId: this.configService.get("CONFIGS.AWS.AWS_CLOUDFRONT_KEY_PAIR_ID"),
      privateKey: this.configService.get("CONFIGS.AWS.AWS_CLOUDFRONT_PRIVATE_KEY"),
    };
    try {
      // Get signed URL for CloudFront
      const signedCloudFrontUrl = getSignedCloudFrontUrl(params);

      return signedCloudFrontUrl;
    } catch (error) {
      console.log(error);
      Sentry.captureException(new Error("From Third-Party: fn (getCloudFrontURLFromS3)"), { extra: { params, response: error }, level: "error" });
      return null;
    }
  }
}
