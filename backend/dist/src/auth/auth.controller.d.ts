import { AuthService } from './auth.service';
import { Role } from '@prisma/client';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    signUp(body: {
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
    signIn(body: {
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
