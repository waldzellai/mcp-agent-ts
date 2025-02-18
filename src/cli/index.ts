#!/usr/bin/env node
import { program } from 'commander';
import { McpServer } from '../mcp/mcpServer';
import { createDefaultConfig } from '../config/index';
import { Logger, LogLevel } from '../logging/index';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

export class McpAgentCli {
  private mcpServer: Server;
  private localServer: McpServer;
  private logger: Logger;

  constructor(serverName: string = 'default-mcp-agent') {
    const config = createDefaultConfig(serverName);
    this.localServer = new McpServer({ config });
    this.logger = Logger.getInstance();

    this.mcpServer = new Server(
      {
        name: serverName,
        version: '0.1.0',
      },
      {
        capabilities: {
          resources: {},
          tools: {
            'list-tools': this.listTools.bind(this),
            'list-resources': this.listResources.bind(this),
          },
        },
      }
    );
  }

  private async listTools(): Promise<{ tools: Record<string, unknown> }> {
    try {
      const toolsResponse = await this.localServer.handleRequest({
        id: 'cli-list-tools',
        method: 'listTools',
        params: {}
      });

      return { tools: toolsResponse.result?.tools || {} };
    } catch (error) {
      this.logger.log(LogLevel.ERROR, 'Failed to list tools', { error });
      throw new McpError(ErrorCode.InternalError, 'Failed to list tools');
    }
  }

  private async listResources(): Promise<{ resources: Record<string, unknown> }> {
    try {
      const resourcesResponse = await this.localServer.handleRequest({
        id: 'cli-list-resources',
        method: 'listResources',
        params: {}
      });

      return { resources: resourcesResponse.result?.resources || {} };
    } catch (error) {
      this.logger.log(LogLevel.ERROR, 'Failed to list resources', { error });
      throw new McpError(ErrorCode.InternalError, 'Failed to list resources');
    }
  }

  public async start(): Promise<void> {
    this.logger.log(LogLevel.INFO, 'Starting MCP Agent server');

    // Set up request handlers
    this.mcpServer.setRequestHandler(ListToolsRequestSchema, this.listTools);
    this.mcpServer.setRequestHandler(ListResourcesRequestSchema, this.listResources);

    // Start the server using stdio transport
    const transport = new StdioServerTransport();
    await this.mcpServer.connect(transport);

    this.logger.log(LogLevel.INFO, 'MCP Agent server running');
  }

  public initialize(): void {
    program
      .name('mcp-agent')
      .description('Model Context Protocol Agent CLI')
      .version('0.1.0');

    program
      .command('start')
      .description('Start the MCP Agent server')
      .action(async () => {
        try {
          await this.start();
        } catch (error) {
          this.logger.log(LogLevel.ERROR, 'Failed to start server', { error });
          process.exit(1);
        }
      });

    program
      .command('list-tools')
      .description('List available tools')
      .action(async () => {
        try {
          const tools = await this.listTools();
          console.log('Available Tools:', JSON.stringify(tools, null, 2));
        } catch (error) {
          console.error('Error listing tools:', error);
        }
      });

    program
      .command('list-resources')
      .description('List available resources')
      .action(async () => {
        try {
          const resources = await this.listResources();
          console.log('Available Resources:', JSON.stringify(resources, null, 2));
        } catch (error) {
          console.error('Error listing resources:', error);
        }
      });

    program.parse(process.argv);
  }
}

// Entry point for CLI
export function runCli(): void {
  const cli = new McpAgentCli();
  cli.initialize();
}

// If run directly
if (require.main === module) {
  runCli();
}
