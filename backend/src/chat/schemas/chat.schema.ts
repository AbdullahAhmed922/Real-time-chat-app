/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type ChatDocument = Chat & Document;

@Schema({ timestamps: true })
export class Chat {

    @Prop({ required: true })
    username:string;

    @Prop({ required: true })
    room:string;
    
    @Prop({ required: true })
    content:string;

    createdAt: Date;
    updatedAt: Date;
}

export const ChatSchema = SchemaFactory.createForClass(Chat);