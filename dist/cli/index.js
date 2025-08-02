#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.McpAgentCli = void 0;
exports.runCli = runCli;
const commander_1 = require("commander");
const mcpServer_1 = require("../mcp/mcpServer");
const index_1 = require("../config/index");
const index_2 = require("../logging/index");
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
class McpAgentCli {
    mcpServer;
    localServer;
    logger;
    constructor(serverName = 'default-mcp-agent') {
        const config = (0, index_1.createDefaultConfig)(serverName);
        this.localServer = new mcpServer_1.McpServer({ config });
        this.logger = index_2.Logger.getInstance();
        this.mcpServer = new index_js_1.Server({
            name: serverName,
            version: '0.1.0',
        }, {
            capabilities: {
                resources: {},
                tools: {
                    'list-tools': this.listTools.bind(this),
                    'list-resources': this.listResources.bind(this),
                },
            },
        });
    }
    async listTools() {
        try {
            const toolsResponse = await this.localServer.handleRequest({
                id: 'cli-list-tools',
                method: 'listTools',
                params: {}
            });
            return { tools: toolsResponse.result?.tools || {} };
        }
        catch (error) {
            this.logger.log(index_2.LogLevel.ERROR, 'Failed to list tools', { error });
            throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, 'Failed to list tools');
        }
    }
    async listResources() {
        try {
            const resourcesResponse = await this.localServer.handleRequest({
                id: 'cli-list-resources',
                method: 'listResources',
                params: {}
            });
            return { resources: resourcesResponse.result?.resources || {} };
        }
        catch (error) {
            this.logger.log(index_2.LogLevel.ERROR, 'Failed to list resources', { error });
            throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, 'Failed to list resources');
        }
    }
    async start() {
        this.logger.log(index_2.LogLevel.INFO, 'Starting MCP Agent server');
        // Set up request handlers
        this.mcpServer.setRequestHandler(types_js_1.ListToolsRequestSchema, this.listTools);
        this.mcpServer.setRequestHandler(types_js_1.ListResourcesRequestSchema, this.listResources);
        // Start the server using stdio transport
        const transport = new stdio_js_1.StdioServerTransport();
        await this.mcpServer.connect(transport);
        this.logger.log(index_2.LogLevel.INFO, 'MCP Agent server running');
    }
    initialize() {
        commander_1.program
            .name('mcp-agent')
            .description('Model Context Protocol Agent CLI')
            .version('0.1.0');
        commander_1.program
            .command('start')
            .description('Start the MCP Agent server')
            .action(async () => {
            try {
                await this.start();
            }
            catch (error) {
                this.logger.log(index_2.LogLevel.ERROR, 'Failed to start server', { error });
                process.exit(1);
            }
        });
        commander_1.program
            .command('list-tools')
            .description('List available tools')
            .action(async () => {
            try {
                const tools = await this.listTools();
                console.log('Available Tools:', JSON.stringify(tools, null, 2));
            }
            catch (error) {
                console.error('Error listing tools:', error);
            }
        });
        commander_1.program
            .command('list-resources')
            .description('List available resources')
            .action(async () => {
            try {
                const resources = await this.listResources();
                console.log('Available Resources:', JSON.stringify(resources, null, 2));
            }
            catch (error) {
                console.error('Error listing resources:', error);
            }
        });
        commander_1.program.parse(process.argv);
    }
}
exports.McpAgentCli = McpAgentCli;
// Entry point for CLI
function runCli() {
    const cli = new McpAgentCli();
    cli.initialize();
}
// If run directly
if (require.main === module) {
    runCli();
}
