import { Socket } from "socket.io";
import * as Sentry from "@sentry/nestjs";
import { BaseWsExceptionFilter, WsException } from "@nestjs/websockets";
import { ArgumentsHost, BadRequestException, Catch } from "@nestjs/common";

@Catch(WsException, BadRequestException)
export class WebsocketExceptionsFilter extends BaseWsExceptionFilter {
  catch(exception: WsException | BadRequestException, host: ArgumentsHost) {
    Sentry.captureException(exception);
    const client = host.switchToWs().getClient() as Socket;

    const error = exception instanceof WsException ? exception.getError() : exception.getResponse();
    const details = error instanceof Object ? { ...error } : { message: error };

    client.emit("error", { id: (client as any).id, ...details });
  }
}
