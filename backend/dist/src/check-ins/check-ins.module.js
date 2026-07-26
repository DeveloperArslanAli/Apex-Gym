"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckInsModule = void 0;
const common_1 = require("@nestjs/common");
const check_ins_service_1 = require("./check-ins.service");
const check_ins_controller_1 = require("./check-ins.controller");
const check_ins_gateway_1 = require("./check-ins.gateway");
let CheckInsModule = class CheckInsModule {
};
exports.CheckInsModule = CheckInsModule;
exports.CheckInsModule = CheckInsModule = __decorate([
    (0, common_1.Module)({
        providers: [check_ins_service_1.CheckInsService, check_ins_gateway_1.CheckInsGateway],
        controllers: [check_ins_controller_1.CheckInsController],
        exports: [check_ins_service_1.CheckInsService],
    })
], CheckInsModule);
//# sourceMappingURL=check-ins.module.js.map