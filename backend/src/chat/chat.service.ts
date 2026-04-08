/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Chat, ChatDocument } from './schemas/chat.schema';

@Injectable()
export class ChatService {
    constructor(@InjectModel(Chat.name) private chatModel: Model<ChatDocument>){}
    async create(username: string, room: string, content: string){
        return this.chatModel.create({ username, room, content });
    }

    async getMessages(room: string, limit: number = 50){
        return this.chatModel.find({ room }).sort({ createdAt: -1 }).limit(limit).lean();
    }
}