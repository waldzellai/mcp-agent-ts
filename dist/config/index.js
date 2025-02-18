"use strict";
// Configuration module exports
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDefaultConfig = createDefaultConfig;
function createDefaultConfig(name) {
    return {
        serverName: name,
        version: '0.1.0',
        logLevel: 'info',
        capabilities: {
            resources: {},
            tools: {}
        }
    };
}
