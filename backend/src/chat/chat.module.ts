/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { MongooseModule } from '@nestjs/mongoose';
import { Chat, ChatSchema } from './schemas/chat.schema';
import { Conversation, ConversationSchema } from './schemas/conversation.schema';
import { ConversationService } from './conversation.service';
import { ConversationsController } from './conversations.controller';
import { RoomsModule } from '../rooms/rooms.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Chat.name, schema: ChatSchema },
      { name: Conversation.name, schema: ConversationSchema },
    ]),
    RoomsModule,
  ],
  providers: [ChatGateway, ChatService, ConversationService],
  controllers: [ConversationsController],
  exports: [ChatService, ConversationService],
})
export class ChatModule {}
