export class TokenBackendError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TokenBackendError";
  }
}

export class TokenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TokenError";
  }
}
