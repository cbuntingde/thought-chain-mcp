<!--
Copyright 2025 Chris Bunting <cbunting99@gmail.com>
All rights reserved.

File: readme.md
Description: Comprehensive documentation for the Sequential Thinking MCP Server
-->

# 🧠 Thought Chain MCP Server

> **Transform any AI model into an advanced reasoning engine**  
> This MCP server empowers non-reasoning models with sophisticated step-by-step thinking capabilities, enabling complex problem-solving, structured analysis, and persistent thought processes across sessions.

## 🚀 Key Benefit: Advanced Reasoning for All AI Models

While modern AI models vary in their native reasoning capabilities, the Thought Chain MCP Server **levels the playing field** by providing:

- **Structured Thinking Framework**: Guides any AI model through systematic, logical reasoning processes
- **Persistent Memory**: Maintains context and reasoning chains across conversations and sessions
- **Complex Problem Decomposition**: Breaks down intricate problems into manageable, logical steps
- **Structured Analysis**: Enables thorough, documented decision-making processes
- **Cross-Model Consistency**: Ensures high-quality reasoning regardless of the underlying AI model

**Perfect for**: Enhancing models that lack native reasoning capabilities, standardizing thinking processes across different AI assistants, and maintaining audit trails for complex decision-making.

A Model Context Protocol (MCP) server that enables step-by-step reasoning with persistence, allowing you to save and recall thought processes across sessions.

## Overview

The Thought Chain MCP Server provides a structured approach to complex reasoning by enabling users to build thought chains incrementally, with full persistence and recall capabilities. This reliable solution ensures that complex reasoning work is never lost and can be built upon across sessions and across different AI coding assistants.

**Universal Compatibility**: Works with ANY MCP-compatible editor, extension, or AI assistant including Claude Desktop, Cursor, Cline, Roo Code, Windsurf, VS Code with MCP extensions, and custom implementations. Your thought chains persist regardless of which tool you're using.

## Features

### Core Functionality
- **Thought Chain**: Build reasoning chains step by step with reflections
- **Persistence**: Automatically saves all thought chains to SQLite database
- **Recall System**: Search and load previous thought processes by content
- **Chain Management**: Start new chains, review progress, conclude thoughts
- **Reflection Support**: Add notes on how each step builds on previous ones
- **Cross-Session Continuity**: Thought chains persist across assistant restarts
- **Cross-Platform Compatibility**: Use the same thought chains across different AI assistants

### Advanced Features
- **Reliable Data Storage**: SQLite database with ACID compliance
- **Secure Design**: Input validation and secure data handling
- **Optimized Performance**: Efficient query patterns and resource management
- **Modular Architecture**: Clean separation of concerns for maintainability

## Quick Start

### Prerequisites

- **Node.js**: Version 20.0.0 or higher
- **npm**: Latest stable version
- **AI Coding Assistant**: ANY MCP-compatible tool including:
  - Claude Desktop
  - Cursor
  - Cline
  - Roo Code
  - Windsurf
  - VS Code with MCP extensions
  - Custom MCP implementations
  - Any editor or tool that supports the Model Context Protocol

### Installation Options

### Option 1: NPX Installation (Recommended)

The easiest way to install and use the Thought Chain MCP Server:

```bash
npx thought-chain-mcp
```

For global access:
```bash
npm install -g thought-chain-mcp
```

Once installed globally, you can run:
```bash
thought-chain-mcp
```

### Option 2: Direct NPX Usage (No Installation)

Run directly without installing:
```bash
npx thought-chain-mcp@latest
```

### Option 3: Local Development Setup

1. **Navigate to the project directory:**
   ```bash
   cd c:\mcpservers\thought-chain-mcp
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure your AI Assistant:**
   
   This MCP server works with multiple AI coding assistants. Choose your preferred platform below:

   ### Claude Desktop
   On Windows, edit your Claude Desktop config file at:
   `%APPDATA%\Claude\claude_desktop_config.json`
   
   ```json
   {
     "mcpServers": {
       "thought-chain": {
         "command": "npx",
         "args": ["thought-chain-mcp"]
       }
     }
   }
   ```
   
   **Alternative (if installed globally):**
   ```json
   {
     "mcpServers": {
       "thought-chain": {
         "command": "thought-chain-mcp"
       }
     }
   }
   ```

   ### Cursor
   Add to your Cursor settings (`settings.json`):
   ```json
   {
     "mcp.servers": {
       "thought-chain": {
         "command": "npx",
         "args": ["thought-chain-mcp"]
       }
     }
   }
   ```
   
   **Alternative (if installed globally):**
   ```json
   {
     "mcp.servers": {
       "thought-chain": {
         "command": "thought-chain-mcp"
       }
     }
   }
   ```

   ### Cline
   Add to your Cline configuration file:
   ```json
   {
     "mcpServers": {
       "thought-chain": {
         "command": "npx",
         "args": ["thought-chain-mcp"]
       }
     }
   }
   ```
   
   **Alternative (if installed globally):**
   ```json
   {
     "mcpServers": {
       "thought-chain": {
         "command": "thought-chain-mcp"
       }
     }
   }
   ```

   ### Roo Code
   Add to your Roo Code MCP configuration:
   ```json
   {
     "mcpServers": {
       "thought-chain": {
         "command": "npx",
         "args": ["thought-chain-mcp"]
       }
     }
   }
   ```
   
   **Alternative (if installed globally):**
   ```json
   {
     "mcpServers": {
       "thought-chain": {
         "command": "thought-chain-mcp"
       }
     }
   }
   ```

   ### Windsurf
   Add to your Windsurf configuration:
   ```json
   {
     "mcp.servers": {
       "thought-chain": {
         "command": "npx",
         "args": ["thought-chain-mcp"]
       }
     }
   }
   ```
   
   **Alternative (if installed globally):**
   ```json
   {
     "mcp.servers": {
       "thought-chain": {
         "command": "thought-chain-mcp"
       }
     }
   }
   ```

   ### ANY MCP-Compatible Tool
   For ANY editor, extension, or tool that supports MCP, add the server configuration to your MCP settings:
   ```json
   {
     "mcpServers": {
       "thought-chain": {
         "command": "npx",
         "args": ["thought-chain-mcp"]
       }
     }
   }
   ```
   
   **Alternative (if installed globally):**
   ```json
   {
     "mcpServers": {
       "thought-chain": {
         "command": "thought-chain-mcp"
       }
     }
   }
   ```
   
   **This includes:**
   - VS Code with MCP extensions
   - Custom MCP implementations
   - Any editor that supports the Model Context Protocol
   - Development environments with MCP integration
   - Standalone MCP clients

4. **Optional: Add AI Instructions (Copilot Users)**
   
   While not required for the MCP server to function, you can add the `mcp.instructions.md` file to your Copilot prompts directory to encourage consistent use of the thought chain process:
   
   - Copy `mcp.instructions.md` to your Copilot prompts directory
   - This helps guide the AI on when and how to use the thinking tools
   - The server works perfectly without these instructions - they're just for consistency

5. **Database Initialization**
   
   The server will automatically create a fresh SQLite database in your home directory (`~/.thought-chain-mcp/thoughts.db`) on first run. This database:
   - Stores all your thought chains locally in your user directory
   - Is created automatically if it doesn't exist
   - Persists across different installations and projects
   - Can be safely deleted to start fresh
   - Is portable and works with npx installations

6. **Restart your AI Assistant** to load the new MCP server

### Running the Server

- **Development mode (with auto-restart):**
  ```bash
  npm run dev
  ```

- **Production mode:**
  ```bash
  npm start
  ```

- **Run tests:**
  ```bash
  npm test
  ```

- **Security audit:**
  ```bash
  npm run security-check
  ```

## Usage Examples

### Basic Thought Chain Usage

```
I need to solve a complex problem. Let me think through it step by step.

1. thought_chain(action="new_chain") - Start fresh
2. thought_chain(action="add_step", thought="First, I need to understand the core issue...")
3. thought_chain(action="add_step", thought="Based on my analysis above, the key factors are...", reflection="This builds on my initial understanding by identifying specific elements")
4. thought_chain(action="review_chain") - See full reasoning chain
5. thought_chain(action="conclude", thought="Therefore, my recommendation is...")
```

### Recalling Previous Work

```
1. recall_thoughts(query="optimization") - Find chains about optimization
2. load_thought_chain(chain_id="abc123") - Continue previous work
3. thought_chain(action="add_step", thought="Building on my previous analysis...")
```

### Advanced Usage Patterns

#### Problem-Solving Workflow
```
1. thought_chain(action="new_chain", thought="Analyzing the system architecture challenge...")
2. thought_chain(action="add_step", thought="Current bottlenecks identified: database queries, API response times", reflection="This establishes the baseline issues to address")
3. thought_chain(action="add_step", thought="Proposed solutions: connection pooling, query optimization, caching layer", reflection="These solutions directly address the identified bottlenecks")
4. thought_chain(action="review_chain")
5. thought_chain(action="conclude", thought="Implementation priority: caching first, then query optimization, finally connection pooling")
```

#### Research and Analysis
```
1. thought_chain(action="new_chain", thought="Researching best practices for microservices security...")
2. thought_chain(action="add_step", thought="Key areas: authentication, authorization, data encryption, service mesh", reflection="This categorizes the security domains to investigate")
3. thought_chain(action="add_step", thought="Authentication findings: OAuth 2.0 with JWT tokens recommended", reflection="Industry standard approach with good tooling support")
4. thought_chain(action="add_step", thought="Authorization approach: RBAC with fine-grained permissions", reflection="Balances security with operational flexibility")
```

## Thought Chain Example

Here's a complete example of using the thought chain process to solve a complex problem:

### Scenario: Optimizing Database Performance

```
User: I need to optimize our slow database queries. The system is taking 10+ seconds for some reports.

AI: Let me think through this systematically using the thought chain process.

1. **Start Analysis**
   thought_chain(action="new_chain", thought="Analyzing database performance issue with 10+ second query times")
   
   ✅ Started new thought chain: analyzing-database-performance
   
2. **Identify Root Causes**
   thought_chain(action="add_step", 
     thought="Potential causes: missing indexes, large table scans, inefficient joins, lack of query optimization")
     
   ✅ Added step 1: Potential causes identified
   
3. **Analyze Current State**
   thought_chain(action="add_step", 
     thought="Need to examine: EXPLAIN plans, slow query logs, table sizes, index usage statistics",
     reflection="This builds on the potential causes by identifying specific diagnostic steps")
     
   ✅ Added step 2: Diagnostic approach defined
   
4. **Propose Solutions**
   thought_chain(action="add_step", 
     thought="Solutions: add composite indexes, optimize WHERE clauses, implement query caching, consider denormalization")
     
   ✅ Added step 3: Solution strategies identified
   
5. **Prioritize Implementation**
   thought_chain(action="add_step", 
     thought="Priority order: 1) Add missing indexes (quick win), 2) Optimize queries (medium effort), 3) Add caching (long-term solution)",
     reflection="This prioritization balances impact vs implementation effort")
     
   ✅ Added step 4: Implementation priority set
   
6. **Review Full Chain**
   thought_chain(action="review_chain")
   
   📋 Complete Thought Chain:
   Step 1: Analyzing database performance issue with 10+ second query times
   Step 2: Potential causes: missing indexes, large table scans, inefficient joins, lack of query optimization
   Step 3: Need to examine: EXPLAIN plans, slow query logs, table sizes, index usage statistics
   Step 4: Solutions: add composite indexes, optimize WHERE clauses, implement query caching, consider denormalization
   Step 5: Priority order: 1) Add missing indexes (quick win), 2) Optimize queries (medium effort), 3) Add caching (long-term solution)
   
7. **Conclude with Action Plan**
   thought_chain(action="conclude", 
     thought="Action plan: Start with index analysis using EXPLAIN, implement top 3 missing indexes, then optimize slow queries, finally implement Redis caching for frequently accessed data")
     
   ✅ Concluded thought chain with actionable implementation plan
```

### Key Benefits of This Approach

- **Structured Thinking**: Each step builds logically on the previous one
- **Documentation**: Complete reasoning process is preserved
- **Revisitable**: Can load this chain later to continue analysis
- **Shareable**: Chain ID can be shared with team members
- **Iterative**: Can add more steps as new information emerges

## Available Tools

### `thought_chain`
Main tool for building Thought Chain

**Actions:**
- `new_chain`: Start a fresh thought process
- `add_step`: Add reasoning step (requires `thought`)
- `review_chain`: Show complete thought chain
- `conclude`: Finish with final conclusion (requires `thought`)

**Parameters:**
- `thought`: Your current thought or reasoning step (required for add_step and conclude)
- `reflection`: Optional reflection on how this builds on previous steps
- `action`: What to do (required)

### `recall_thoughts`
Search previous thought chains

**Parameters:**
- `query`: Search term to find in previous thoughts (optional - if empty, shows recent chains)
- `limit`: Maximum number of results to return (default: 5)

### `load_thought_chain`  
Continue working on previous chain

**Parameters:**
- `chain_id`: ID of the thought chain to load (required)

## Project Structure

```
thought-chain-mcp/
├── index.js                 # Main entry point and MCP server setup
├── package.json            # Project configuration and dependencies
├── readme.md               # This documentation file
├── SECURITY.md             # Security documentation and policies
├── mcp.instructions.md     # Optional AI instructions for consistent usage
├── .gitignore              # Git ignore patterns (excludes database files)
├── src/                    # Source code directory
│   ├── server.js           # MCP server implementation
│   ├── handlers.js         # Tool request handlers
│   ├── models.js           # Data models and validation
│   └── database.js         # Database operations and management
├── tests/                  # Test suite
│   └── server.test.js      # Server and functionality tests
└── data/                   # Legacy data directory (git-ignored)
    └── thoughts.db         # Legacy SQLite database (migrated to home directory)
```

**Note**: The database is now stored in `~/.thought-chain-mcp/thoughts.db` for better portability and npx compatibility.
```

## Architecture

### Data Storage

- **Database**: SQLite (`thoughts.db`) in the project directory
- **Schema**: Optimized for fast queries and full-text search
- **Persistence**: ACID compliance ensures data integrity
- **Performance**: Indexed queries for efficient retrieval

### Security Features

- **Input Validation**: All inputs validated at boundaries
- **SQL Injection Protection**: Parameterized queries throughout
- **Data Sanitization**: Context-specific sanitization for all data
- **Error Handling**: Secure error messages without information leakage

### Performance Characteristics

- **Query Optimization**: Efficient database queries with proper indexing
- **Resource Management**: Proper connection pooling and timeout handling
- **Memory Efficiency**: Optimized for minimal memory footprint
- **Scalability**: Designed to handle large volumes of thought chains

## Benefits

### For Individual Users
- **Externalized Memory**: Thoughts persist across conversations
- **Reviewable Process**: Full reasoning chain always available  
- **Iterative Refinement**: Build on previous analysis
- **Knowledge Retention**: Never lose complex reasoning work

### For Teams
- **Collaborative Thinking**: Share thought chain IDs with team members
- **Consistent Methodology**: Standardized approach to complex reasoning
- **Knowledge Transfer**: Preserve and share analytical processes
- **Quality Assurance**: Review and refine reasoning chains
- **Tool Agnostic**: Team members can use different editors, extensions, or AI assistants while maintaining shared thought processes
- **Platform Independent**: Works across different development environments and tools

### For Organizations
- **Decision Documentation**: Complete audit trail of reasoning processes
- **Compliance Support**: Structured approach to regulatory requirements
- **Training Resource**: Example chains for onboarding and development
- **Process Improvement**: Identify patterns in successful reasoning

## Example Output

```
✅ Added step 2 to thought chain

Step 2: Given the constraints, I should prioritize solutions that are both cost-effective and scalable
Reflection: This builds on my problem analysis by focusing on practical implementation criteria

Chain progress: 2 steps
```

## Troubleshooting

### Common Issues

1. **"Command not found"**: Ensure Node.js is installed and in your PATH
2. **"Module not found"**: Run `npm install` in the project directory  
3. **"Permission denied"**: Make sure the project directory is accessible
4. **No thoughts saving**: Check write permissions in the project directory
5. **AI Assistant not connecting**:
   - Verify the config file path for your specific assistant
   - Restart your AI assistant
   - Check that the MCP server is running (`npm run dev` or `npm start`)
   - Consult your assistant's documentation for MCP configuration
6. **Server not starting**: Check for port conflicts or run `npm run dev` for detailed error messages
7. **Database errors**: 
   - Ensure the `data/` directory exists and is writable
   - Delete `data/thoughts.db` to start fresh if corrupted
   - Check that SQLite is properly installed
8. **Tool not found**: 
   - Verify the MCP server is properly configured in your AI assistant
   - Check that the server is running and accessible
   - Restart both the server and your AI assistant

### Debug Mode

For detailed debugging, run:
```bash
DEBUG=* npm run dev
```

### Log Analysis

Check the following locations for diagnostic information:
- Console output for server status
- Database logs for query performance
- Error logs for troubleshooting

## Dependencies

### Runtime Dependencies
- **@modelcontextprotocol/sdk**: ^1.0.0 - MCP protocol implementation
- **better-sqlite3**: ^12.2.0 - High-performance SQLite driver
- **@vscode/webview-ui-toolkit**: ^1.4.0 - UI toolkit components

### Development Requirements
- **Node.js**: >=20.0.0
- **npm**: Latest stable version

### Optional Development Tools
- **Testing**: Built-in Node.js test runner
- **Security**: npm audit for vulnerability scanning
- **Development**: `--watch` flag for auto-restart during development

## Security Considerations

### Data Protection
- All data stored locally in SQLite database
- No external network connections required
- Input validation prevents injection attacks
- Secure error handling prevents information leakage

### Best Practices
- Regular security audits via `npm run security-check`
- Dependency updates monitored for vulnerabilities
- Code follows security best practices
- Comprehensive input validation and sanitization

## Contributing

This project follows established coding standards. When contributing:

1. Follow the established code patterns and architecture
2. Ensure all code passes security checks
3. Add comprehensive tests for new functionality
4. Update documentation for any API changes
5. Adhere to the coding standards defined in the project

## Version History

### v1.0.2 (Current)
- Renamed `sequential_think` tool to `thought_chain` for clarity
- Enhanced security validation with improved XSS prevention
- Fixed duplicate configuration issues
- Updated test suite with comprehensive coverage
- Improved database handling and .gitignore configuration
- Added support for multiple AI assistants and editors
- Enhanced documentation with detailed setup instructions

### v1.0.1
- Enhanced security features
- Improved error handling
- Performance optimizations
- Updated documentation
- Added npx support for easy installation

### v1.0.0
- Initial release
- Core sequential thinking functionality
- SQLite persistence
- MCP integration

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/cbuntingde/thought-chain-mcp/issues)
- **Repository**: [GitHub Repository](https://github.com/cbuntingde/thought-chain-mcp)
- **Documentation**: [Project Wiki](https://github.com/cbuntingde/thought-chain-mcp/wiki)

## Author

**Chris Bunting** <cbunting99@gmail.com>

Specializing in enterprise-grade software solutions with focus on security, performance, and maintainability.