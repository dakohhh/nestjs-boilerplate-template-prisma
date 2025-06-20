import ms from "ms";
import { TokenError } from "./token.error";

export enum TokenType {
  ACCESS = "access",
  REFRESH = "refresh",
}

export interface TokenPayload {
  sub: string; // user ID
  exp?: Date;
  iat?: Date;
  iss?: string;
  type?: TokenType;
  jti?: string; // unique identifier for the token
  [key: string]: any;
}

export abstract class Token {
  sub: string;
  exp?: Date;
  iat?: Date;
  iss: string;
  type: TokenType;
  jti?: string;
  [key: string]: any;

  constructor(payload: TokenPayload) {
    this.sub = payload.sub;
    this.exp = payload.exp ?? new Date();
    this.iat = payload.iat ?? new Date();
    this.iss = payload.iss || "default";
    this.type = payload.type ?? TokenType.ACCESS;
    this.jti = payload.jti;

    Object.assign(this, payload); // allow extra fields

    if (!this.verifyExp()) {
      throw new TokenError("Token has expired");
    }
    if (!this.verifyType(this.type)) {
      throw new TokenError("Token type is invalid");
    }
  }

  private verifyExp(): boolean {
    if (!this.exp) return true;
    return this.exp > new Date();
  }

  private verifyType(expectedType: TokenType): boolean {
    return this.type === expectedType;
  }

  serializeDatetimeFields(): Record<string, number | undefined> {
    return {
      exp: this.exp?.getTime() ?? undefined,
      iat: this.iat?.getTime() ?? undefined,
    };
  }
}

export class AccessToken extends Token {
  constructor(payload: TokenPayload) {
    super(payload);
    this.type = TokenType.ACCESS;
  }
}

export class RefreshToken extends Token {
  constructor(payload: TokenPayload) {
    super(payload);
    this.type = TokenType.REFRESH;
  }

  private get noCopyClaims(): Set<string> {
    return new Set(["exp", "iat", "type"]);
  }

  getAccessToken(options?: {
    issueTime?: Date;
    expiresIn?: number; // in milliseconds
    jti?: string;
  }): AccessToken {
    const now = options?.issueTime ?? new Date();
    const expiresIn = options?.expiresIn ?? ms("15m");
    const exp = new Date(now.getTime() + expiresIn);

    const accessClaims: TokenPayload = {
      sub: this.sub,
      exp,
      iat: now,
      iss: this.iss,
      jti: options?.jti || this.jti,
      type: TokenType.ACCESS,
    };

    for (const key in this) {
      if (typeof key === "string" && !this.noCopyClaims.has(key) && !(key in accessClaims)) {
        accessClaims[key] = (this as any)[key];
      }
    }

    return new AccessToken(accessClaims);
  }
}
