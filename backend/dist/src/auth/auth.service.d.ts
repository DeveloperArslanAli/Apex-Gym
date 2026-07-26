import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    signUp(dto: {
        email: string;
        password?: string;
        name: string;
        phone?: string;
        role?: Role;
        gymId: string;
    }): Promise<{
        id: string;
        email: string;
        name: string;
        role: import("@prisma/client").$Enums.Role;
        status: import("@prisma/client").$Enums.MemberStatus;
        gymId: string;
    }>;
    signIn(dto: {
        email: string;
        password?: string;
    }): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            name: string;
            role: import("@prisma/client").$Enums.Role;
            status: import("@prisma/client").$Enums.MemberStatus;
            gymId: string;
        };
    }>;
}
