/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Chat, ChatDocument } from './schemas/chat.schema';

@Injectable()
export class ChatService {
    constructor(@InjectModel(Chat.name) private chatModel: Model<ChatDocument>) {}

    async create(username: string, room: string, content: string, chatType: string = 'group', recipientUsername?: string): Promise<ChatDocument> {
        return this.chatModel.create({ username, room, content, chatType, recipientUsername: recipientUsername || undefined });
    }

    async getMessages(room: string, limit: number = 50, username?: string) {
        const messages = await this.chatModel
            .find({
                room,
                isDeleted: { $ne: true },
                ...(username ? { deletedFor: { $nin: [username] } } : {}),
            })
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();
        return messages;
    }

    async createPrivateMessage(sender: string, recipient: string, content: string, room: string): Promise<ChatDocument> {
        return this.chatModel.create({
            username: sender,
            room,
            content,
            chatType: 'private',
            recipientUsername: recipient,
        });
    }

    async editMessage(messageId: string, username: string, newContent: string) {
        const message = await this.chatModel.findById(messageId);
        if (!message) return null;
        if (message.username !== username) return null;

        message.content = newContent;
        message.isEdited = true;
        await message.save();
        return message;
    }

    async deleteForMe(messageId: string, username: string) {
        return this.chatModel.findByIdAndUpdate(
            messageId,
            { $addToSet: { deletedFor: username } },
            { new: true },
        );
    }

    async deleteForEveryone(messageId: string, username: string) {
        const message = await this.chatModel.findById(messageId);
        if (!message) return null;
        if (message.username !== username) return null;

        message.isDeleted = true;
        message.content = 'This message was deleted';
        await message.save();
        return message;
    }

    async getPrivateMessages(user1: string, user2: string, limit: number = 50, currentUser?: string) {
        const room = `dm:${[user1, user2].sort().join(':')}`;
        return this.getMessages(room, limit, currentUser);
    }

    async deleteMessagesByRoom(room: string) {
        return this.chatModel.deleteMany({ room }).exec();
    }
}