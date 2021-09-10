"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestStatus = exports.RequestActions = void 0;
var RequestActions;
(function (RequestActions) {
    RequestActions["UPDATE_STATUS"] = "UPDATE_STATUS";
})(RequestActions = exports.RequestActions || (exports.RequestActions = {}));
var RequestStatus;
(function (RequestStatus) {
    RequestStatus["PENDING"] = "PENDING";
    RequestStatus["PROCESSING"] = "PROCESSING";
    RequestStatus["FAILED"] = "FAILED";
    RequestStatus["DONE"] = "DONE";
})(RequestStatus = exports.RequestStatus || (exports.RequestStatus = {}));
//# sourceMappingURL=types.js.map