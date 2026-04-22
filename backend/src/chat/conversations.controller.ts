/* eslint-disable prettier/prettier */
import { Controller, Get, Post, Delete, Param, Req, UseGuards } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
    constructor(
        private conversationService: ConversationService,
        private chatService: ChatService,
    ) {}

    @Get()
    async getConversations(@Req() req: any) {
        const username = req.user?.username;
        if (!username) return [];
        return this.conversationService.getConversations(username);
    }

    @Delete(':otherUser')
    async deleteConversation(@Param('otherUser') otherUser: string, @Req() req: any) {
        const username = req.user?.username;
        if (!username) return { error: 'Unauthorized' };
        
        const room = `dm:${[username, otherUser].sort().join(':')}`;
        
        // Delete all messages in the conversation
        await this.chatService.deleteMessagesByRoom(room);
        
        // Delete the conversation document
        const deleted = await this.conversationService.deleteConversation(username, otherUser);
        if (!deleted) return { error: 'Conversation not found' };
        
        return { success: true, otherUser };
    }

    @Post('cleanup')
    async cleanupDuplicates() {
        return this.conversationService.removeDuplicates();
    }
}
