import { ToolHandler } from './types';

export const echoTool: ToolHandler = {
  name: 'echo',
  description: 'Echo back a provided message',
  inputSchema: {
    type: 'object',
    properties: {
      message: { type: 'string' }
    },
    required: ['message']
  },
  async handler(args: Record<string, any>): Promise<{ message: string }> {
    return { message: String(args.message) };
  }
};
