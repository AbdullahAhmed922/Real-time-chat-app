/* eslint-disable prettier/prettier */
import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
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
    async create(@Body() Body: { name: string; description: string }) {
        return this.roomsService.create(Body.name, Body.description);
    }

}
