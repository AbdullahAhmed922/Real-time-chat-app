/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Room, RoomDocument } from './schemas/rooms.schema';

@Injectable()
export class RoomsService {
    constructor(@InjectModel(Room.name) private roomModel: Model<RoomDocument>) {}

    async create(name: string, description: string) {
        return this.roomModel.create({ name, description });
    }

    async findAll() {
        return this.roomModel.find().exec();
    }
}
