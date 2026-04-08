/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RoomDocument = Room & Document;

@Schema()
export class Room {
    @Prop({ required: true, unique: true })
    name: string;
 
    @Prop({ default: '' })
    description: string;
}

export const RoomSchema = SchemaFactory.createForClass(Room);