/* eslint-disable prettier/prettier */
import { 
  SubscribeMessage,
  WebSocketGateway,
  MessageBody,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,

} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';


@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly chatService: ChatService) {}

  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, string>(); // userId -> socketId

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    const userId = client.handshake.auth?.userId;
    if (userId) {
      this.userSockets.set(userId, client.id);
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    const userId = client.handshake.auth?.userId;
    if (userId) {
      this.userSockets.delete(userId);
    }
  }
  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @MessageBody() data: { room: string, username: string },
    @ConnectedSocket() client: Socket) {
      await client.join(data.room);
      const history = await this.chatService.getMessages(data.room, 50);
      client.emit('chat_history', history.reverse());

      client.to(data.room).emit('user_joined', { username: data.username, message: `${data.username} has joined the room.` });
    }
  
  @SubscribeMessage('leave_room')
  async handleLeaveRoom(
    @MessageBody() data: { room: string, username: string },
    @ConnectedSocket() client: Socket) {
      await client.leave(data.room);
      client.to(data.room).emit('user_left', { username: data.username, message: `${data.username} has left the room.` });
    }

  @SubscribeMessage('send_message')
  async handleMessage(
    @MessageBody() data: { room: string, username: string, content: string }) {
      if (!data.content.trim()) {
        return;
      }

      const chat = await this.chatService.create(data.username, data.room, data.content);
      this.server.to(data.room).emit('new_message', {
        _id: chat._id,
        username: chat.username,
        room: chat.room,
        content: chat.content,
        createdAt: chat.createdAt,
      });
    }
  }
