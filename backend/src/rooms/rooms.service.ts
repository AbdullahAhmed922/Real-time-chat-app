/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Room, RoomDocument } from './schemas/rooms.schema';

@Injectable()
export class RoomsService {
    constructor(@InjectModel(Room.name) private roomModel: Model<RoomDocument>) {}

    async create(name: string, description: string, createdBy: string = '') {
        return this.roomModel.create({ name, description, createdBy, members: createdBy ? [createdBy] : [] });
    }

    async findAll() {
        return this.roomModel.find().exec();
    }

    async joinRoom(roomName: string, username: string) {
        return this.roomModel.findOneAndUpdate(
            { name: roomName },
            { $addToSet: { members: username } },
            { new: true },
        );
    }

    async leaveRoom(roomName: string, username: string) {
        return this.roomModel.findOneAndUpdate(
            { name: roomName },
            { $pull: { members: username } },
            { new: true },
        );
    }

    async findByMember(username: string) {
        return this.roomModel.find({ members: username }).exec();
    }

    async getMembers(roomName: string) {
        const room = await this.roomModel.findOne({ name: roomName }).exec();
        return room?.members || [];
    }

    async findByName(roomName: string) {
        return this.roomModel.findOne({ name: roomName }).exec();
    }

    async deleteRoom(roomName: string, username: string) {
        const room = await this.roomModel.findOne({ name: roomName }).exec();
        if (!room) return null;
        // Only the creator can permanently delete
        if (room.createdBy !== username) return { error: 'unauthorized' };
        await this.roomModel.deleteOne({ name: roomName }).exec();
        return { success: true, roomName };
    }

    async renameRoom(roomName: string, newName: string, username: string) {
        const room = await this.roomModel.findOne({ name: roomName }).exec();
        if (!room) return null;
        // Any member can rename the room
        if (!room.members.includes(username)) return { error: 'unauthorized' };
        room.name = newName;
        await room.save();
        return room;
    }
}
