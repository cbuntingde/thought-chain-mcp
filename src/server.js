/**
 * Copyright 2025 Chris Bunting <cbunting99@gmail.com>
 * All rights reserved.
 * 
 * File: server.js
 * Description: Thought Chain MCP server setup and configuration
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { dbManager } from "./database.js";
import {
  handleSequentialThink,
  handleRecallThoughts,
  handleLoadThoughtChain,
  handleGetStats,
  handleToolError
} from "./handlers.js";
import { createThoughtChain } from "./models.js";

/**
 * Thought Chain MCP Server class
 */
export class ThoughtChainServer {
  constructor() {
    this.server = new Server(
      {
        name: "thought-chain-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // In-memory storage for current session
    this.currentThoughtChain = createThoughtChain();

    this.setupHandlers();
  }

  /**
   * Setup request handlers for the MCP server
   */
  setupHandlers() {
    // Setup tool listing handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "thought_chain",
          description: "Add a step to your Thought Chain process, building on previous thoughts",
          inputSchema: {
            type: "object",
            properties: {
              thought: {
                type: "string",
                description: "Your current thought or reasoning step"
              },
              action: {
                type: "string",
                enum: ["add_step", "review_chain", "conclude", "new_chain"],
                description: "Action to take: add_step (add new thought), review_chain (show all steps), conclude (finish thinking), new_chain (start fresh)"
              },
              reflection: {
                type: "string",
                description: "Optional reflection on how this builds on previous steps"
              }
            },
            required: ["action"]
          }
        },
        {
          name: "recall_thoughts",
          description: "Search and recall previous thought chains",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Search term to find in previous thoughts (optional - if empty, shows recent chains)"
              },
              limit: {
                type: "number",
                description: "Maximum number of results to return",
                default: 5,
                minimum: 1,
                maximum: 100
              }
            }
          }
        },
        {
          name: "load_thought_chain",
          description: "Load a previous thought chain to continue working on it",
          inputSchema: {
            type: "object",
            properties: {
              chain_id: {
                type: "string",
                description: "ID of the thought chain to load",
                pattern: "^[a-zA-Z0-9_-]+$",
                maxLength: 100
              }
            },
            required: ["chain_id"]
          }
        },
        {
          name: "get_stats",
          description: "Get database statistics and system information",
          inputSchema: {
            type: "object",
            properties: {}
          }
        }
      ]
    }));

    // Setup tool call handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "thought_chain":
            return await handleSequentialThink(args, this.currentThoughtChain);
          case "recall_thoughts":
            return await handleRecallThoughts(args);
          case "load_thought_chain":
            const result = await handleLoadThoughtChain(args);
            // Update current chain when loading
            const loadedChain = dbManager.getThoughtChain(args.chain_id);
            if (loadedChain) {
              this.currentThoughtChain = loadedChain;
            }
            return result;
          case "get_stats":
            return await handleGetStats();
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return handleToolError(error, name);
      }
    });
  }

  /**
   * Initialize the server and load existing data
   */
  async initialize() {
    try {
      // Load the most recent active thought chain if it exists
      const activeChain = dbManager.getMostRecentActiveChain();
      if (activeChain) {
        this.currentThoughtChain = activeChain;
      }

      console.log("Server initialized successfully");
      console.log(`Current thought chain: ${this.currentThoughtChain.id}`);
      console.log(`Database stats:`, dbManager.getStats());
    } catch (error) {
      console.error("Failed to initialize server:", error);
      throw error;
    }
  }

  /**
   * Start the server
   */
  async run() {
    try {
      await this.initialize();
      
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      
      console.log("Thought Chain MCP Server started successfully");
    } catch (error) {
      console.error("Failed to start server:", error);
      dbManager.close();
      process.exit(1);
    }
  }

  /**
   * Gracefully shutdown the server
   */
  async shutdown() {
    try {
      console.log('Shutting down server...');
      dbManager.close();
      process.exit(0);
    } catch (error) {
      console.error("Error during shutdown:", error);
      process.exit(1);
    }
  }

  /**
   * Get current thought chain (for testing/debugging)
   */
  getCurrentThoughtChain() {
    return this.currentThoughtChain;
  }

  /**
   * Set current thought chain (for testing/debugging)
   */
  setCurrentThoughtChain(chain) {
    this.currentThoughtChain = chain;
  }
}

/**
 * Setup graceful shutdown handlers
 */
function setupGracefulShutdown(server) {
  process.on('SIGINT', () => server.shutdown());
  process.on('SIGTERM', () => server.shutdown());
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    server.shutdown();
  });
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    server.shutdown();
  });
}

/**
 * Main function to start the server
 */
async function main() {
  const server = new ThoughtChainServer();
  setupGracefulShutdown(server);
  await server.run();
}

// Start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("Failed to start server:", error);
    process.exit(1);
  });
}

export { setupGracefulShutdown };