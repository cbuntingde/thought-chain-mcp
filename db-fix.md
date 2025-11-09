# Database Issue Fix for thought-chain-mcp

## Problem Description
The thought-chain-mcp server failed to start with the following error:
```
TypeError: Cannot open database because the directory does not exist
    at new Database (/home/gsxrchris/.npm/_npx/1822a694fa8dc416/node_modules/better-sqlite3/lib/database.js:65:9)
```

## Root Cause
The issue was in the `database.js` file where the database path was constructed as:
```javascript
const DB_PATH = path.join(__dirname, "..", "data", "thoughts.db");
```

This path resolves to: `node_modules/thought-chain-mcp/data/thoughts.db`

However, the `data` directory didn't exist in the package structure, causing the better-sqlite3 library to fail when trying to create the database file.

## Solution Applied
Created the missing directory manually:
```bash
mkdir -p /path/to/node_modules/thought-chain-mcp/data
```

## Recommended Fix for the MCP Server

### Option 1: Ensure Directory Exists (Recommended)
Modify the `DatabaseManager` constructor in `src/database.js` to create the directory if it doesn't exist:

```javascript
export class DatabaseManager {
  constructor(dbPath = DB_PATH) {
    // Ensure the directory exists
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    this.db = new Database(dbPath);
    this.initDatabase();
  }
}
```

You'll need to add the fs import at the top:
```javascript
import fs from "fs";
```

### Option 2: Use User Home Directory
Change the database path to use a directory in the user's home folder:

```javascript
import os from "os";
import path from "path";

const DB_PATH = path.join(os.homedir(), ".thought-chain-mcp", "thoughts.db");
```

### Option 3: Use Current Working Directory
Change the database path to use the current working directory:

```javascript
const DB_PATH = path.join(process.cwd(), "data", "thoughts.db");
```

## Files to Modify
- `src/database.js` - Add directory creation logic or change path strategy

## Testing
After implementing the fix, test with:
```bash
npx thought-chain-mcp
```

The server should start without requiring manual directory creation.
