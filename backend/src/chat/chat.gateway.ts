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
import { ConversationService } from './conversation.service';
import { RoomsService } from '../rooms/rooms.service';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly chatService: ChatService,
    private readonly conversationService: ConversationService,
    private readonly roomsService: RoomsService,
  ) {}

  @WebSocketServer()
  server: Server;

  // Map username -> Set<socketId> (one user can have multiple tabs)
  private userSockets = new Map<string, Set<string>>();

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    const username = client.handshake.auth?.username;
    if (username) {
      // Join personal room for DM targeting
      client.join(`user:${username}`);
      
      // Track online presence
      if (!this.userSockets.has(username)) {
        this.userSockets.set(username, new Set());
      }
      this.userSockets.get(username)!.add(client.id);
      
      // Broadcast online status
      this.server.emit('user_online', { username });
      
      // Send current online users list to the newly connected client
      const onlineUsers = Array.from(this.userSockets.keys());
      client.emit('online_users', onlineUsers);
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    const username = client.handshake.auth?.username;
    if (username) {
      const sockets = this.userSockets.get(username);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.userSockets.delete(username);
          // Broadcast offline status only when all tabs are closed
          this.server.emit('user_offline', { username });
        }
      }
    }
  }

  // ─── Group Room Events ─────────────────────────────────────

  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @MessageBody() data: { room: string, username: string },
    @ConnectedSocket() client: Socket) {
      await client.join(data.room);
      
      // Auto-join the room membership
      await this.roomsService.joinRoom(data.room, data.username);
      
      const history = await this.chatService.getMessages(data.room, 50, data.username);
      client.emit('chat_history', history.reverse());

      client.to(data.room).emit('user_joined', { 
        username: data.username, 
        message: `${data.username} has joined the room.` 
      });
    }
  
  @SubscribeMessage('leave_room')
  async handleLeaveRoom(
    @MessageBody() data: { room: string, username: string },
    @ConnectedSocket() client: Socket) {
      await client.leave(data.room);
      client.to(data.room).emit('user_left', { 
        username: data.username, 
        message: `${data.username} has left the room.` 
      });
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
        chatType: chat.chatType,
        isEdited: chat.isEdited,
        createdAt: chat.createdAt,
      });
    }

  // ─── Private Message Events ────────────────────────────────

  @SubscribeMessage('join_private')
  async handleJoinPrivate(
    @MessageBody() data: { sender: string, recipient: string },
    @ConnectedSocket() client: Socket) {
      const room = `dm:${[data.sender, data.recipient].sort().join(':')}`;
      await client.join(room);
      
      // Ensure conversation exists
      await this.conversationService.findOrCreate(data.sender, data.recipient);
      
      const history = await this.chatService.getMessages(room, 50, data.sender);
      client.emit('private_history', history.reverse());
    }

  @SubscribeMessage('send_private_message')
  async handlePrivateMessage(
    @MessageBody() data: { sender: string, recipient: string, content: string }) {
      if (!data.content.trim()) return;
      
      const room = `dm:${[data.sender, data.recipient].sort().join(':')}`;
      const chat = await this.chatService.createPrivateMessage(
        data.sender, data.recipient, data.content, room,
      );
      
      // Update conversation preview
      await this.conversationService.updateLastMessage(data.sender, data.recipient, data.content);
      
      // Emit to the DM room
      this.server.to(room).emit('private_message', {
        _id: chat._id,
        username: chat.username,
        recipient: chat.recipientUsername,
        room: chat.room,
        content: chat.content,
        chatType: chat.chatType,
        createdAt: chat.createdAt,
      });

      // Also emit to user rooms so sidebar updates for both users
      this.server.to(`user:${data.sender}`).emit('conversation_updated', {
        participant: data.recipient,
        lastMessage: data.content,
        lastMessageAt: new Date(),
      });
      this.server.to(`user:${data.recipient}`).emit('conversation_updated', {
        participant: data.sender,
        lastMessage: data.content,
        lastMessageAt: new Date(),
      });
    }

  // ─── Message Edit/Delete Events ────────────────────────────

  @SubscribeMessage('edit_message')
  async handleEditMessage(
    @MessageBody() data: { messageId: string, username: string, newContent: string, room: string }) {
      const updated = await this.chatService.editMessage(data.messageId, data.username, data.newContent);
      if (updated) {
        this.server.to(data.room).emit('message_edited', {
          messageId: data.messageId,
          newContent: data.newContent,
          isEdited: true,
        });
      }
    }

  @SubscribeMessage('delete_message')
  async handleDeleteMessage(
    @MessageBody() data: { messageId: string, username: string, room: string, deleteFor: 'me' | 'everyone' },
    @ConnectedSocket() client: Socket) {
      if (data.deleteFor === 'everyone') {
        const deleted = await this.chatService.deleteForEveryone(data.messageId, data.username);
        if (deleted) {
          this.server.to(data.room).emit('message_deleted', {
            messageId: data.messageId,
            deleteFor: 'everyone',
          });
        }
      } else {
        await this.chatService.deleteForMe(data.messageId, data.username);
        client.emit('message_deleted', {
          messageId: data.messageId,
          deleteFor: 'me',
        });
      }
    }

  // ─── Room Management Events ────────────────────────────────

  @SubscribeMessage('delete_room')
  async handleDeleteRoom(
    @MessageBody() data: { roomName: string, username: string },
    @ConnectedSocket() client: Socket) {
      const result = await this.roomsService.deleteRoom(data.roomName, data.username);
      if (!result || 'error' in result) {
        client.emit('room_error', { message: result ? 'Only the room creator can delete this room' : 'Room not found' });
        return;
      }
      
      // Delete all messages in the room
      await this.chatService.deleteMessagesByRoom(data.roomName);
      
      // Notify all clients
      this.server.emit('room_deleted', { roomName: data.roomName, deletedBy: data.username });
    }

  @SubscribeMessage('rename_room')
  async handleRenameRoom(
    @MessageBody() data: { roomName: string, newName: string, username: string },
    @ConnectedSocket() client: Socket) {
      if (!data.newName?.trim()) {
        client.emit('room_error', { message: 'New name is required' });
        return;
      }
      
      const result = await this.roomsService.renameRoom(data.roomName, data.newName.trim(), data.username);
      if (!result || 'error' in result) {
        client.emit('room_error', { message: result ? 'Only the room creator can rename this room' : 'Room not found' });
        return;
      }
      
      // Notify all clients
      this.server.emit('room_renamed', { 
        oldName: data.roomName, 
        newName: data.newName.trim(),
        renamedBy: data.username,
      });
    }

  @SubscribeMessage('delete_conversation')
  async handleDeleteConversation(
    @MessageBody() data: { username: string, otherUser: string },
    @ConnectedSocket() client: Socket) {
      const room = `dm:${[data.username, data.otherUser].sort().join(':')}`;
      
      // Delete all messages
      await this.chatService.deleteMessagesByRoom(room);
      
      // Delete conversation document
      await this.conversationService.deleteConversation(data.username, data.otherUser);
      
      // Notify both participants
      this.server.to(`user:${data.username}`).emit('conversation_deleted', { 
        otherUser: data.otherUser,
        deletedBy: data.username,
      });
      this.server.to(`user:${data.otherUser}`).emit('conversation_deleted', { 
        otherUser: data.username,
        deletedBy: data.username,
      });
    }
}
