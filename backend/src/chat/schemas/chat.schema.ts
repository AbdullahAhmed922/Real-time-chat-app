/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type ChatDocument = Chat & Document;

@Schema({ timestamps: true })
export class Chat {

    @Prop({ required: true })
    username: string;

    @Prop({ required: true })
    room: string;
    
    @Prop({ required: true })
    content: string;

    @Prop({ default: 'group', enum: ['group', 'private'] })
    chatType: string;

    @Prop({ default: null })
    recipientUsername: string;

    @Prop({ default: false })
    isEdited: boolean;

    @Prop({ default: false })
    isDeleted: boolean;

    @Prop({ type: [String], default: [] })
    deletedFor: string[];

    createdAt: Date;
    updatedAt: Date;
}

export const ChatSchema = SchemaFactory.createForClass(Chat);