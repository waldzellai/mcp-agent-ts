"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.echoTool = void 0;
exports.echoTool = {
    name: 'echo',
    description: 'Echo back a provided message',
    inputSchema: {
        type: 'object',
        properties: {
            message: { type: 'string' }
        },
        required: ['message']
    },
    async handler(args) {
        return { message: String(args.message) };
    }
};
