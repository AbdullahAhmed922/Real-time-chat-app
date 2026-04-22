/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ConversationDocument = Conversation & Document;

@Schema({ timestamps: true })
export class Conversation {
    @Prop({ type: [String], required: true })
    participants: string[];

    @Prop({ default: '' })
    lastMessage: string;

    @Prop({ default: null })
    lastMessageAt: Date;

    createdAt: Date;
    updatedAt: Date;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
