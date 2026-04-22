/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Conversation, ConversationDocument } from './schemas/conversation.schema';

@Injectable()
export class ConversationService {
    constructor(@InjectModel(Conversation.name) private conversationModel: Model<ConversationDocument>) {}

    async findOrCreate(user1: string, user2: string) {
        const participants = [user1, user2].sort();
        let conversation = await this.conversationModel.findOne({
            participants: { $all: participants, $size: 2 },
        });
        if (!conversation) {
            conversation = await this.conversationModel.create({ participants });
        }
        return conversation;
    }

    async updateLastMessage(user1: string, user2: string, content: string) {
        const participants = [user1, user2].sort();
        return this.conversationModel.findOneAndUpdate(
            { participants: { $all: participants, $size: 2 } },
            {
                lastMessage: content,
                lastMessageAt: new Date(),
            },
            { returnDocument: 'after' },
        );
    }

    async getConversations(username: string) {
        const conversations = await this.conversationModel
            .find({ participants: username })
            .sort({ lastMessageAt: -1 })
            .lean();
        
        // Deduplicate conversations by participant pair
        const seen = new Set<string>();
        return conversations.filter((c) => {
            const key = [...c.participants].sort().join(':');
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    async deleteConversation(user1: string, user2: string) {
        const participants = [user1, user2].sort();
        const result = await this.conversationModel.deleteMany({
            participants: { $all: participants, $size: 2 },
        });
        return result.deletedCount > 0;
    }

    async removeDuplicates() {
        const all = await this.conversationModel.find().sort({ lastMessageAt: -1 }).lean();
        const seen = new Set<string>();
        const toDelete: string[] = [];
        for (const c of all) {
            const key = [...c.participants].sort().join(':');
            if (seen.has(key)) {
                toDelete.push(c._id.toString());
            } else {
                seen.add(key);
            }
        }
        if (toDelete.length > 0) {
            await this.conversationModel.deleteMany({ _id: { $in: toDelete } });
        }
        return { removed: toDelete.length };
    }
}

