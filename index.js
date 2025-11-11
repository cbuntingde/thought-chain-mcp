#!/usr/bin/env node

/**
 * Copyright 2025 Chris Bunting <cbunting99@gmail.com>
 * All rights reserved.
 * 
 * File: index.js
 * Description: Main entry point for the Thought Chain MCP Server
 */

import { ThoughtChainServer } from "./src/server.js";

// Create and start the server
const server = new ThoughtChainServer();
server.run().catch((error) => {
  console.error("Failed to start Thought Chain MCP Server:", error);
  process.exit(1);
});