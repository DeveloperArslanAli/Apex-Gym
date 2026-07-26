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
exports.PlansController = void 0;
const common_1 = require("@nestjs/common");
const plans_service_1 = require("./plans.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const client_1 = require("@prisma/client");
let PlansController = class PlansController {
    plansService;
    constructor(plansService) {
        this.plansService = plansService;
    }
    async createPlan(req, dto) {
        return this.plansService.createPlan(req.user.gymId, dto);
    }
    async findAllPlans(req) {
        return this.plansService.findAllPlans(req.user.gymId);
    }
    async subscribeMember(dto) {
        return this.plansService.subscribeMember(dto);
    }
    async recordPayment(paymentId, dto) {
        return this.plansService.recordPayment(paymentId, dto);
    }
    async getPayments(req) {
        return this.plansService.getPayments(req.user.gymId);
    }
};
exports.PlansController = PlansController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PlansController.prototype, "createPlan", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PlansController.prototype, "findAllPlans", null);
__decorate([
    (0, common_1.Post)('subscribe'),
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PlansController.prototype, "subscribeMember", null);
__decorate([
    (0, common_1.Post)('payments/:id/pay'),
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PlansController.prototype, "recordPayment", null);
__decorate([
    (0, common_1.Get)('payments'),
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PlansController.prototype, "getPayments", null);
exports.PlansController = PlansController = __decorate([
    (0, common_1.Controller)('plans'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [plans_service_1.PlansService])
], PlansController);
//# sourceMappingURL=plans.controller.js.map