import { CheckInsService } from './check-ins.service';
export declare class CheckInsController {
    private checkInsService;
    constructor(checkInsService: CheckInsService);
    verifyCheckIn(req: any, dto: {
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
    manualOverride(req: any, dto: {
        memberId: string;
    }): Promise<{
        success: boolean;
        memberName: string;
    }>;
    getLogs(req: any): Promise<{
        id: string;
        timestamp: Date;
        method: string;
        success: boolean;
        errorMessage: string | null;
        memberName: string;
        photoUrl: string | null;
    }[]>;
}
