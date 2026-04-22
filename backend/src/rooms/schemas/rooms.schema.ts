/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RoomDocument = Room & Document;

@Schema({ timestamps: true })
export class Room {
    @Prop({ required: true, unique: true })
    name: string;
 
    @Prop({ default: '' })
    description: string;

    @Prop({ default: '' })
    createdBy: string;

    @Prop({ type: [String], default: [] })
    members: string[];
}

export const RoomSchema = SchemaFactory.createForClass(Room);