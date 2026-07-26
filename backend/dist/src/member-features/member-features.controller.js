"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemberFeaturesController = void 0;
const common_1 = require("@nestjs/common");
const member_features_service_1 = require("./member-features.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const client_1 = require("@prisma/client");
let MemberFeaturesController = class MemberFeaturesController {
    memberFeaturesService;
    constructor(memberFeaturesService) {
        this.memberFeaturesService = memberFeaturesService;
    }
    async logWorkout(req, dto) {
        return this.memberFeaturesService.createWorkoutSession(req.user.id, dto);
    }
    async getWorkoutHistory(req) {
        return this.memberFeaturesService.getWorkoutHistory(req.user.id);
    }
    async logMeal(req, dto) {
        return this.memberFeaturesService.createMealLog(req.user.id, dto);
    }
    async getMealLogs(req) {
        return this.memberFeaturesService.getMealLogs(req.user.id);
    }
    async getCoachAdvice(req) {
        return this.memberFeaturesService.getCoachAdvice(req.user.id);
    }
};
exports.MemberFeaturesController = MemberFeaturesController;
__decorate([
    (0, common_1.Post)('workout'),
    (0, roles_decorator_1.Roles)(client_1.Role.MEMBER, client_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MemberFeaturesController.prototype, "logWorkout", null);
__decorate([
    (0, common_1.Get)('workout/history'),
    (0, roles_decorator_1.Roles)(client_1.Role.MEMBER, client_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MemberFeaturesController.prototype, "getWorkoutHistory", null);
__decorate([
    (0, common_1.Post)('meal'),
    (0, roles_decorator_1.Roles)(client_1.Role.MEMBER, client_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MemberFeaturesController.prototype, "logMeal", null);
__decorate([
    (0, common_1.Get)('meals'),
    (0, roles_decorator_1.Roles)(client_1.Role.MEMBER, client_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MemberFeaturesController.prototype, "getMealLogs", null);
__decorate([
    (0, common_1.Get)('coach/advice'),
    (0, roles_decorator_1.Roles)(client_1.Role.MEMBER, client_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MemberFeaturesController.prototype, "getCoachAdvice", null);
exports.MemberFeaturesController = MemberFeaturesController = __decorate([
    (0, common_1.Controller)('member'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [member_features_service_1.MemberFeaturesService])
], MemberFeaturesController);
//# sourceMappingURL=member-features.controller.js.map