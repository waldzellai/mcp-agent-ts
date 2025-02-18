"use strict";
// CLI Module for MCP Agent
Object.defineProperty(exports, "__esModule", { value: true });
exports.McpAgentCli = void 0;
exports.runCli = runCli;
const commander_1 = require("commander");
const mcpServer_1 = require("../mcp/mcpServer");
const index_1 = require("../config/index");
const index_2 = require("../logging/index");
class McpAgentCli {
    server;
    logger;
    constructor(serverName = 'default-mcp-agent') {
        const config = (0, index_1.createDefaultConfig)(serverName);
        this.server = new mcpServer_1.McpServer({ config });
        this.logger = index_2.Logger.getInstance();
    }
    initialize() {
        commander_1.program
            .name('mcp-agent')
            .description('Model Context Protocol Agent CLI')
            .version('0.1.0');
        commander_1.program
            .command('start')
            .description('Start the MCP Agent server')
            .action(() => this.startServer());
        commander_1.program
            .command('list-tools')
            .description('List available tools')
            .action(() => this.listTools());
        commander_1.program
            .command('list-resources')
            .description('List available resources')
            .action(() => this.listResources());
        commander_1.program
            .command('log-level')
            .description('Set the logging level')
            .argument('<level>', 'Logging level (debug, info, warn, error)')
            .action((level) => this.setLogLevel(level));
        commander_1.program.parse(process.argv);
    }
    startServer() {
        this.logger.log(index_2.LogLevel.INFO, 'Starting MCP Agent server');
        // Placeholder for actual server start logic
        console.log('MCP Agent server started');
    }
    listTools() {
        try {
            const toolsResponse = this.server.handleRequest({
                id: 'cli-list-tools',
                method: 'listTools',
                params: {}
            });
            console.log('Available Tools:');
            // TODO: Implement proper tool listing
            console.log(toolsResponse);
        }
        catch (error) {
            this.logger.log(index_2.LogLevel.ERROR, 'Failed to list tools', { error });
        }
    }
    listResources() {
        try {
            const resourcesResponse = this.server.handleRequest({
                id: 'cli-list-resources',
                method: 'listResources',
                params: {}
            });
            console.log('Available Resources:');
            // TODO: Implement proper resource listing
            console.log(resourcesResponse);
        }
        catch (error) {
            this.logger.log(index_2.LogLevel.ERROR, 'Failed to list resources', { error });
        }
    }
    setLogLevel(level) {
        try {
            const validLevels = ['debug', 'info', 'warn', 'error'];
            if (!validLevels.includes(level)) {
                throw new Error(`Invalid log level. Must be one of: ${validLevels.join(', ')}`);
            }
            // TODO: Implement actual log level setting in Logger
            this.logger.log(index_2.LogLevel.INFO, `Log level set to ${level}`);
        }
        catch (error) {
            this.logger.log(index_2.LogLevel.ERROR, 'Failed to set log level', { error });
        }
    }
}
exports.McpAgentCli = McpAgentCli;
// Entry point for CLI
function runCli() {
    const cli = new McpAgentCli();
    cli.initialize();
}
