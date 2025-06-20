import { Module } from "@nestjs/common";
import { FileService } from "./file.service";
import { AwsModule } from "src/aws/aws.module";

@Module({
  imports: [AwsModule],
  providers: [FileService],
  exports: [FileService],
})
export class FileModule {}
