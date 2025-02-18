# MCP Agent TypeScript Port

## Overview

The MCP (Model Context Protocol) Agent TypeScript Port is a robust, type-safe implementation of the MCP Agent system. It provides a flexible framework for building intelligent, context-aware agents with advanced workflow management, logging, and execution capabilities.

## Features

- 🚀 **Modular Architecture**
  - Comprehensive TypeScript implementation
  - Flexible, extensible design
  - Type-safe interfaces

- 📊 **Advanced Workflow Management**
  - Step-based workflow execution
  - Concurrent task processing
  - Detailed context tracking

- 🔍 **Powerful Logging System**
  - Configurable log levels
  - Context-rich logging
  - Log export capabilities

- 🧰 **Flexible Executor**
  - Task queuing
  - Timeout handling
  - Concurrent task management

- 🖥️ **CLI Support**
  - Command-line interface
  - Easy agent management

## Installation

```bash
npm install @waldzell/mcp-agent-ts
```

## Quick Start

### Creating a Workflow

```typescript
import { BaseWorkflow } from '@waldzell/mcp-agent-ts';

class MyDataProcessingWorkflow extends BaseWorkflow {
  constructor() {
    super('my-workflow', 'Data Processing');

    this.addStep({
      id: 'extract',
      name: 'Data Extraction',
      execute: async (context) => {
        // Implement data extraction logic
        return { data: ['item1', 'item2'] };
      }
    });

    this.addStep({
      id: 'transform',
      name: 'Data Transformation',
      execute: async (context) => {
        // Implement data transformation logic
        return { transformedData: ['ITEM1', 'ITEM2'] };
      }
    });
  }
}

async function runWorkflow() {
  const workflow = new MyDataProcessingWorkflow();
  const results = await workflow.execute();
  console.log(results);
}
```

### Logging

```typescript
import { debug, info, warn, error } from '@waldzell/mcp-agent-ts';

// Log with different levels
debug('Debugging information', { userId: 123 });
info('System started');
warn('Potential issue detected');
error('Critical error occurred');
```

### CLI Usage

```bash
# Start the MCP Agent
npx mcp-agent start

# List available tools
npx mcp-agent list-tools

# Set log level
npx mcp-agent log-level debug
```

## Executor Usage

```typescript
import { BaseExecutor, Task } from '@waldzell/mcp-agent-ts';

const executor = new BaseExecutor({ 
  maxConcurrentTasks: 3,
  timeout: 60000 // 1-minute timeout
});

const task: Task = {
  id: 'example-task',
  name: 'Sample Task',
  execute: async () => {
    // Task implementation
    return 'Task completed';
  }
};

await executor.enqueueTask(task);
```

## Configuration

The MCP Agent can be configured through:
- Environment variables
- Configuration files
- Programmatic configuration

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Contact

Waldzell AI - [Your Contact Information]

Project Link: [https://github.com/your-repo/mcp-agent-ts](https://github.com/your-repo/mcp-agent-ts)
