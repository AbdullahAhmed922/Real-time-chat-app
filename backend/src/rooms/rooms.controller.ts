/* eslint-disable prettier/prettier */
import { Controller, Get, Post, Delete, Patch, Body, Param, Req, UseGuards } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('rooms')
@UseGuards(JwtAuthGuard)
export class RoomsController {
    constructor(private roomsService: RoomsService) {}

    @Get()
    async findAll() {
        return this.roomsService.findAll();
    }

    @Post()
    async create(@Body() body: { name: string; description: string }, @Req() req: any) {
        const username = req.user?.username || '';
        return this.roomsService.create(body.name, body.description, username);
    }

    @Post(':name/join')
    async joinRoom(@Param('name') name: string, @Req() req: any) {
        const username = req.user?.username;
        if (!username) return { error: 'Unauthorized' };
        return this.roomsService.joinRoom(name, username);
    }

    @Post(':name/leave')
    async leaveRoom(@Param('name') name: string, @Req() req: any) {
        const username = req.user?.username;
        if (!username) return { error: 'Unauthorized' };
        return this.roomsService.leaveRoom(name, username);
    }

    @Get('my')
    async myRooms(@Req() req: any) {
        const username = req.user?.username;
        if (!username) return [];
        return this.roomsService.findByMember(username);
    }

    @Get(':name/members')
    async getMembers(@Param('name') name: string) {
        return this.roomsService.getMembers(name);
    }

    @Get(':name/info')
    async getRoomInfo(@Param('name') name: string) {
        const room = await this.roomsService.findByName(name);
        if (!room) return { error: 'Room not found' };
        return {
            name: room.name,
            description: room.description,
            createdBy: room.createdBy,
            members: room.members,
            memberCount: room.members?.length || 0,
        };
    }

    @Delete(':name')
    async deleteRoom(@Param('name') name: string, @Req() req: any) {
        const username = req.user?.username;
        if (!username) return { error: 'Unauthorized' };
        const result = await this.roomsService.deleteRoom(name, username);
        if (!result) return { error: 'Room not found' };
        if ('error' in result) return { error: 'Only the room creator can delete this room' };
        return result;
    }

    @Patch(':name')
    async renameRoom(@Param('name') name: string, @Body() body: { newName: string }, @Req() req: any) {
        const username = req.user?.username;
        if (!username) return { error: 'Unauthorized' };
        if (!body.newName?.trim()) return { error: 'New name is required' };
        const result = await this.roomsService.renameRoom(name, body.newName.trim(), username);
        if (!result) return { error: 'Room not found' };
        if ('error' in result) return { error: 'Only the room creator can rename this room' };
        return result;
    }
}
