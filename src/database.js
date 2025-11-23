/**
 * Copyright 2025 Chris Bunting <cbunting99@gmail.com>
 * All rights reserved.
 *
 * File: database.js
 * Description: Database operations for Thought Chain using sql.js
 */

import initSqlJs from "sql.js";
import path from "path";
import fs from "fs";
import os from "os";
import { validateThoughtChain } from "./models.js";

/**
 * Get the application data directory based on the platform
 * @returns {string} Path to the application data directory
 */
function getAppDataDir() {
  const platform = process.platform;
  const homedir = os.homedir();

  if (platform === 'win32') {
    return process.env.APPDATA || path.join(homedir, 'AppData', 'Roaming');
  } else if (platform === 'darwin') {
    return path.join(homedir, 'Library', 'Application Support');
  } else {
    return process.env.XDG_CONFIG_HOME || path.join(homedir, '.config');
  }
}

/**
 * Get the database path for npx-compatible storage with cross-platform support
 * @returns {string} Path to the database file
 */
function getDatabasePath() {
  const appDataDir = path.join(getAppDataDir(), "thought-chain-mcp");
  const dbPath = path.join(appDataDir, "thoughts.db");

  // Legacy path check (migration)
  const legacyDir = path.join(os.homedir(), ".thought-chain-mcp");
  const legacyDbPath = path.join(legacyDir, "thoughts.db");

  // If legacy DB exists and new one doesn't, migrate
  if (fs.existsSync(legacyDbPath) && !fs.existsSync(dbPath)) {
    try {
      // Ensure new directory exists
      if (!fs.existsSync(appDataDir)) {
        fs.mkdirSync(appDataDir, { recursive: true, mode: 0o700 });
      }

      // Copy file
      fs.copyFileSync(legacyDbPath, dbPath);
      console.error(`Migrated database from ${legacyDbPath} to ${dbPath}`);
    } catch (error) {
      console.warn(`Failed to migrate database: ${error.message}. Falling back to legacy path.`);
      return legacyDbPath;
    }
  }

  // Ensure the directory exists
  if (!fs.existsSync(appDataDir)) {
    try {
      fs.mkdirSync(appDataDir, { recursive: true, mode: 0o700 });
    } catch (error) {
      // Fallback to legacy if we can't create the standard one
      console.warn(`Failed to create app data dir: ${error.message}. Using legacy path.`);
      if (!fs.existsSync(legacyDir)) {
        fs.mkdirSync(legacyDir, { recursive: true, mode: 0o700 });
      }
      return legacyDbPath;
    }
  } else {
    // Ensure existing directory has secure permissions (best effort)
    try {
      fs.chmodSync(appDataDir, 0o700);
    } catch (error) {
      // Ignore chmod errors on Windows or if not owned
    }
  }

  return dbPath;
}

const DB_PATH = getDatabasePath();

/**
 * Database manager class for Thought Chain using sql.js
 */
export class DatabaseManager {
  constructor(dbPath = DB_PATH) {
    this.dbPath = dbPath;
    this.SQL = null;
    this.db = null;
    this.initialized = false;
  }

  /**
   * Initialize the database with sql.js
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Initialize sql.js
      this.SQL = await initSqlJs();

      // Ensure the directory exists (redundant check but safe)
      const dbDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true, mode: 0o700 });
      }

      // Load existing database or create new one
      if (this.dbPath !== ':memory:' && fs.existsSync(this.dbPath)) {
        const filebuffer = fs.readFileSync(this.dbPath);
        this.db = new this.SQL.Database(new Uint8Array(filebuffer));
      } else {
        this.db = new this.SQL.Database();
      }

      this.initDatabase();

      // Save to disk to ensure file exists and persist initial schema
      if (this.dbPath !== ':memory:') {
        this.saveToDisk();

        try {
          fs.chmodSync(this.dbPath, 0o600);
        } catch (error) {
          // Ignore chmod errors on Windows
        }
      }

      this.initialized = true;
    } catch (error) {
      console.error("Failed to initialize database:", error);
      throw error;
    }
  }

  /**
   * Initialize database tables
   */
  initDatabase() {
    try {
      // Create thought_chains table
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS thought_chains (
          id TEXT PRIMARY KEY,
          created TEXT NOT NULL,
          updated TEXT,
          concluded TEXT,
          status TEXT NOT NULL DEFAULT 'active'
        )
      `);

      // Create thought_steps table
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS thought_steps (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          chain_id TEXT NOT NULL,
          step_number INTEGER NOT NULL,
          thought TEXT NOT NULL,
          reflection TEXT,
          timestamp TEXT NOT NULL,
          is_conclusion BOOLEAN DEFAULT 0,
          FOREIGN KEY (chain_id) REFERENCES thought_chains (id)
        )
      `);

      // Create indexes for better performance
      this.db.exec(`
        CREATE INDEX IF NOT EXISTS idx_thought_chains_created ON thought_chains(created);
        CREATE INDEX IF NOT EXISTS idx_thought_chains_status ON thought_chains(status);
        CREATE INDEX IF NOT EXISTS idx_thought_steps_chain_id ON thought_steps(chain_id);
        CREATE INDEX IF NOT EXISTS idx_thought_steps_timestamp ON thought_steps(timestamp);
      `);
    } catch (error) {
      console.error("Failed to initialize database tables:", error);
      throw error;
    }
  }

  /**
   * Load all saved thought chains
   * @returns {Array} Array of thought chains
   */
  loadSavedThoughts() {
    try {
      // Get all thought chains
      const chainsStmt = this.db.prepare("SELECT id, created, updated, concluded, status FROM thought_chains ORDER BY created DESC");
      const chains = [];
      while (chainsStmt.step()) {
        chains.push(chainsStmt.getAsObject());
      }
      chainsStmt.free();

      return chains.map((chain) => {
        // Get steps for this chain
        const stepsStmt = this.db.prepare(`
          SELECT chain_id, step_number, thought, reflection, timestamp, is_conclusion
          FROM thought_steps
          WHERE chain_id = ?
          ORDER BY step_number
        `);
        stepsStmt.bind([chain.id]);

        const steps = [];
        while (stepsStmt.step()) {
          const row = stepsStmt.getAsObject();
          steps.push({
            id: row.step_number,
            thought: row.thought,
            reflection: row.reflection,
            timestamp: row.timestamp,
            is_conclusion: row.is_conclusion === 1,
            builds_on: row.step_number > 1 ? [row.step_number - 1] : [],
          });
        }
        stepsStmt.free();

        return {
          id: chain.id,
          created: chain.created,
          updated: chain.updated,
          concluded: chain.concluded,
          status: chain.status,
          steps: steps,
        };
      });
    } catch (error) {
      console.error("Failed to load saved thoughts:", error);
      return [];
    }
  }

  /**
   * Save a thought chain to the database
   * @param {Object} thoughtChain - The thought chain to save
   */
  saveThought(thoughtChain) {
    try {
      // Validate the thought chain
      validateThoughtChain(thoughtChain);

      // Insert or replace thought chain
      const chainStmt = this.db.prepare(`
        INSERT OR REPLACE INTO thought_chains (id, created, updated, concluded, status)
        VALUES (?, ?, ?, ?, ?)
      `);

      chainStmt.run([
        thoughtChain.id,
        thoughtChain.created,
        thoughtChain.updated,
        thoughtChain.concluded,
        thoughtChain.status
      ]);
      chainStmt.free();

      // Delete existing steps for this chain
      const deleteStmt = this.db.prepare("DELETE FROM thought_steps WHERE chain_id = ?");
      deleteStmt.run([thoughtChain.id]);
      deleteStmt.free();

      // Insert all steps
      if (thoughtChain.steps.length > 0) {
        const stepStmt = this.db.prepare(`
          INSERT INTO thought_steps (chain_id, step_number, thought, reflection, timestamp, is_conclusion)
          VALUES (?, ?, ?, ?, ?, ?)
        `);

        thoughtChain.steps.forEach((step) => {
          stepStmt.run([
            thoughtChain.id,
            step.id,
            step.thought,
            step.reflection,
            step.timestamp,
            step.is_conclusion ? 1 : 0
          ]);
        });
        stepStmt.free();
      }

      this.saveToDisk();
    } catch (error) {
      console.error("Failed to save thought chain:", error);
      throw error;
    }
  }

  /**
   * Get a specific thought chain by ID
   * @param {string} chainId - The chain ID to retrieve
   * @returns {Object|null} The thought chain or null if not found
   */
  getThoughtChain(chainId) {
    try {
      const chainStmt = this.db.prepare("SELECT * FROM thought_chains WHERE id = ?");
      const chainResult = chainStmt.getAsObject([chainId]);
      chainStmt.free();

      if (!chainResult || !chainResult.id) {
        return null;
      }

      const stepsStmt = this.db.prepare(`
        SELECT chain_id, step_number, thought, reflection, timestamp, is_conclusion
        FROM thought_steps
        WHERE chain_id = ?
        ORDER BY step_number
      `);
      stepsStmt.bind([chainId]);

      const steps = [];
      while (stepsStmt.step()) {
        const row = stepsStmt.getAsObject();
        steps.push({
          id: row.step_number,
          thought: row.thought,
          reflection: row.reflection,
          timestamp: row.timestamp,
          is_conclusion: row.is_conclusion === 1,
          builds_on: row.step_number > 1 ? [row.step_number - 1] : [],
        });
      }
      stepsStmt.free();

      return {
        id: chainResult.id,
        created: chainResult.created,
        updated: chainResult.updated,
        concluded: chainResult.concluded,
        status: chainResult.status,
        steps: steps,
      };
    } catch (error) {
      console.error("Failed to get thought chain:", error);
      return null;
    }
  }

  /**
   * Search thought chains by content
   * @param {string} searchTerm - The search term
   * @param {number} limit - Maximum number of results
   * @returns {Array} Array of matching thought chains
   */
  searchThoughtChains(searchTerm, limit = 5) {
    try {
      if (!searchTerm || searchTerm.trim() === "") {
        return this.loadSavedThoughts().slice(0, limit);
      }

      const allChains = this.loadSavedThoughts();
      const searchLower = searchTerm.toLowerCase();

      const filtered = allChains.filter((chain) =>
        chain.steps.some(
          (step) =>
            step.thought.toLowerCase().includes(searchLower) ||
            (step.reflection &&
              step.reflection.toLowerCase().includes(searchLower)),
        ),
      );

      // Sort by most recent first
      filtered.sort((a, b) => new Date(b.created) - new Date(a.created));
      return filtered.slice(0, limit);
    } catch (error) {
      console.error("Failed to search thought chains:", error);
      return [];
    }
  }

  /**
   * Get the most recent active thought chain
   * @returns {Object|null} The most recent active chain or null
   */
  getMostRecentActiveChain() {
    try {
      const stmt = this.db.prepare("SELECT id FROM thought_chains WHERE status = 'active' ORDER BY created DESC LIMIT 1");
      let id = null;
      if (stmt.step()) {
        id = stmt.getAsObject().id;
      }
      stmt.free();

      if (!id) return null;
      return this.getThoughtChain(id);
    } catch (error) {
      console.error("Failed to get most recent active chain:", error);
      return null;
    }
  }

  /**
   * Save the database to disk
   */
  saveToDisk() {
    if (this.dbPath === ':memory:') return; // Skip for in-memory databases

    try {
      const data = this.db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(this.dbPath, buffer);
    } catch (error) {
      console.error("Failed to save database to disk:", error);
    }
  }

  /**
   * Close the database connection
   */
  close() {
    try {
      // Save to disk before closing (for persistent databases)
      this.saveToDisk();
      this.db.close();
    } catch (error) {
      console.error("Failed to close database:", error);
    }
  }

  /**
   * Get database statistics
   * @returns {Object} Database statistics
   */
  getStats() {
    try {
      const chainStmt = this.db.prepare("SELECT COUNT(*) as count FROM thought_chains");
      let chainCount = 0;
      if (chainStmt.step()) chainCount = chainStmt.getAsObject().count;
      chainStmt.free();

      const stepStmt = this.db.prepare("SELECT COUNT(*) as count FROM thought_steps");
      let stepCount = 0;
      if (stepStmt.step()) stepCount = stepStmt.getAsObject().count;
      stepStmt.free();

      const activeStmt = this.db.prepare("SELECT COUNT(*) as count FROM thought_chains WHERE status = 'active'");
      let activeCount = 0;
      if (activeStmt.step()) activeCount = activeStmt.getAsObject().count;
      activeStmt.free();

      return {
        totalChains: chainCount,
        totalSteps: stepCount,
        activeChains: activeCount,
        databasePath: DB_PATH,
      };
    } catch (error) {
      console.error("Failed to get database stats:", error);
      return null;
    }
  }
}

// Export singleton instance and class for testing
export const dbManager = new DatabaseManager();
