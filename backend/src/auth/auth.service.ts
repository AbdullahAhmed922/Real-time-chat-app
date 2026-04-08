/* eslint-disable prettier/prettier */
import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) {}

    async register(username: string, password: string, email: string) {
        const existing = await this.usersService.findByEmail(email);
        if (existing) {
            throw new ConflictException('Email already in use');  
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await this.usersService.create(username, email, hashedPassword);

        const token = this.jwtService.sign({ sub: String(user._id), username: user.username });
        return { token, username: user.username };
    }

    async login(email: string, password: string) {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const token = this.jwtService.sign({ sub: String(user._id), username: user.username });
        return { token, username: user.username };
    }
}