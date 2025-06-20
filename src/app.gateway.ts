import bcryptjs from "bcryptjs";
import { Repository } from "redis-om";
import { CONFIGS } from "./../configs";
import { JwtService } from "@nestjs/jwt";
import { Server, Socket } from "socket.io";
import { ConfigService } from "@nestjs/config";
import { instrument } from "@socket.io/admin-ui";
import { UsersService } from "./users/users.service";
import { SocketUser } from "./socket-user/socket-user.entity";
import { InjectRepository } from "./redisom/redisom.decorators";
import { WebsocketExceptionsFilter } from "./common/filters/websocket-exception.filter";
import { Logger, OnModuleInit, UseFilters, UsePipes, ValidationPipe } from "@nestjs/common";
import { ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, WebSocketGateway, WebSocketServer, WsException } from "@nestjs/websockets";

@WebSocketGateway({
  cors: {
    credentials: true,
    origin: [...CONFIGS.CORS_ALLOWED_ORIGINS],
  },
  transports: ["websocket", "polling"],
})
@UseFilters(WebsocketExceptionsFilter)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class AppGateway implements OnModuleInit, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(AppGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UsersService,
    private readonly configService: ConfigService,
    @InjectRepository(SocketUser) private readonly socketUserRepository: Repository<SocketUser>
  ) {}

  afterInit() {
    instrument(this.server, {
      auth: {
        type: "basic",
        username: CONFIGS.SOCKET_IO.USERNAME,
        password: bcryptjs.hashSync(CONFIGS.SOCKET_IO.PASSWORD, 10),
      },
      mode: CONFIGS.SOCKET_IO.MODE,
    });

    this.logger.log("AppGateWay initialized.");
  }

  async onModuleInit() {
    // On server startup, clean up stale socket connections in Redis.
    // This iterates through all stored socket users and checks if their socket ID
    // still exists in the current server's active socket connections.
    // If not, it means the server was restarted or the client disconnected unexpectedly,
    // so we remove the stale socket entry from Redis to maintain an accurate state.
    const staleUsers = await this.socketUserRepository.search().return.all();

    for (const user of staleUsers) {
      const stillConnected = this.server.sockets.sockets.has(user.socketId);
      if (!stillConnected) {
        await this.socketUserRepository.remove(user.entityId);
      }
    }
  }

  async handleConnection(client: Socket) {
    const authorization = client?.handshake?.auth?.authorization || client?.handshake.headers.authorization;
    const authToken = authorization?.split(" ")[1];
    if (!authToken) {
      client.emit("connect_failed", new WsException("Unauthorized"));
      client.disconnect();

      return;
    }

    try {
      const decoded = this.jwtService.verify(authToken, { secret: this.configService.get("CONFIGS.JWT_SECRET") });
      if (!decoded || !decoded.sub) {
        client.emit("connect_failed", new WsException("Invalid token payload"));
        client.disconnect();
        return;
      }
      const user = await this.userService.getById(decoded.sub);
      if (!user) {
        client.emit("connect_failed", new WsException("User not found"));
        client.disconnect();
      }

      client.data = { user };

      // Using a redis stack here to store the cache
      // Save the active socket connection ID in the cache (e.g., Redis) using the user ID as the key
      // This helps in tracking the active socket connections for broadcasting or disconnection purposes
      await this.socketUserRepository.createAndSave({ userId: String(user.id), socketId: client.id });

      return;
    } catch (error) {
      client.emit("connect_failed", new WsException("Invalid tokens"));
      client.disconnect();

      return;
    }
  }

  async handleDisconnect(@ConnectedSocket() client: Socket) {
    const user = client.data.user;
    if (user) {
      const rooms = Array.from(client.rooms);

      rooms.forEach((room) => {
        client.leave(room);
        this.server.to(room).emit("user-status-update", { userId: user._id, status: "offline", roomId: room });
      });

      // Search for the user in Redis using the current socket ID to identify which user is associated with this disconnected socket.
      const socketUser = await this.socketUserRepository.search().where("socketId").equals(client.id).first();

      // Delete the user's socket ID from the Redis cache to ensure that the connection data is cleared when the user disconnects.
      await this.socketUserRepository.remove(socketUser.entityId);

      this.server.emit("user-status-update", { userId: user._id, status: "offline" });
    }
  }
}
