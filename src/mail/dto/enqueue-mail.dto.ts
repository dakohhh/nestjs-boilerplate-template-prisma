import * as React from "react";
import { ISendMailOptions } from "@nestjs-modules/mailer";

export class EnqueueMailDto {
  options: ISendMailOptions;
  template: React.ReactElement;
}
