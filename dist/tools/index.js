"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultTools = void 0;
exports.registerTools = registerTools;
exports.listTools = listTools;
const echo_1 = require("./echo");
/**
 * Default set of tool handlers exposed by the server.
 */
exports.defaultTools = [echo_1.echoTool];
/**
 * Register provided tools with an MCP server instance.
 */
function registerTools(server, tools = exports.defaultTools) {
    for (const tool of tools) {
        server.registerTool(tool.name, {
            description: tool.description,
            inputSchema: tool.inputSchema,
            outputSchema: tool.outputSchema,
            handler: tool.handler
        });
    }
}
/**
 * Convenience method to retrieve tool metadata without handlers.
 */
function listTools(tools = exports.defaultTools) {
    const result = {};
    for (const tool of tools) {
        result[tool.name] = {
            description: tool.description,
            inputSchema: tool.inputSchema,
            outputSchema: tool.outputSchema
        };
    }
    return result;
}
__exportStar(require("./types"), exports);
__exportStar(require("./echo"), exports);
