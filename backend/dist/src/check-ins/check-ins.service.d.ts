import { PrismaService } from '../prisma/prisma.service';
import { CheckInsGateway } from './check-ins.gateway';
export declare class CheckInsService {
    private prisma;
    private gateway;
    constructor(prisma: PrismaService, gateway: CheckInsGateway);
    verifyCheckIn(dto: {
        gymId: string;
        memberId?: string;
        email?: string;
        method: 'FACE' | 'FINGERPRINT' | 'QR' | 'MANUAL';
        photoUrl?: string;
    }): Promise<{
        authorized: boolean;
        reason: string;
        memberName: string;
        planName?: undefined;
    } | {
        authorized: boolean;
        memberName: string;
        planName: string;
        reason?: undefined;
    }>;
    manualOverride(gymId: string, staffId: string, memberId: string): Promise<{
        success: boolean;
        memberName: string;
    }>;
    getLogs(gymId: string): Promise<{
        id: string;
        timestamp: Date;
        method: string;
        success: boolean;
        errorMessage: string | null;
        memberName: string;
        photoUrl: string | null;
    }[]>;
}
