/* eslint-disable prettier/prettier */
import { IsNotEmpty, IsString, IsOptional,  } from "class-validator";

export class GoogleLoginDto {
    @IsNotEmpty()   
    @IsString()
    crediantials: string;

    @IsOptional()
    @IsString()
    username?: string;

    @IsOptional()
    @IsString()
    email?: string;
}