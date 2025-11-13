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
 * Get the database path for npx-compatible storage
 * @returns {string} Path to the database file
 */
function getDatabasePath() {
  const homeDir = os.homedir();
  const appDataDir = path.join(homeDir, ".thought-chain-mcp");

  // Ensure the directory exists with secure permissions
  if (!fs.existsSync(appDataDir)) {
    fs.mkdirSync(appDataDir, { recursive: true, mode: 0o700 });
  } else {
    // Ensure existing directory has secure permissions
    try {
      fs.chmodSync(appDataDir, 0o700);
    } catch (error) {
      console.warn("Could not set directory permissions:", error.message);
    }
  }

  return path.join(appDataDir, "thoughts.db");
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

      // Ensure the directory exists with secure permissions
      const dbDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true, mode: 0o700 });
      } else {
        try {
          fs.chmodSync(dbDir, 0o700);
        } catch (error) {
          console.warn("Could not set directory permissions:", error.message);
        }
      }

      // Load existing database or create new one
      if (this.dbPath !== ':memory:' && fs.existsSync(this.dbPath)) {
        const filebuffer = fs.readFileSync(this.dbPath);
        this.db = new this.SQL.Database(new Uint8Array(filebuffer));
      } else {
        this.db = new this.SQL.Database();
      }

      this.initDatabase();

      // Set secure permissions on the database file (skip for in-memory databases)
      if (this.dbPath !== ':memory:') {
        try {
          fs.chmodSync(this.dbPath, 0o600);
        } catch (error) {
          console.warn("Could not set database file permissions:", error.message);
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
      const chainsQuery = `
        SELECT id, created, updated, concluded, status
        FROM thought_chains
        ORDER BY created DESC
      `;

      const chainsResult = this.db.exec(chainsQuery);
      const chains = chainsResult.length > 0 ? chainsResult[0].values.map(row => {
        const [id, created, updated, concluded, status] = row;
        return { id, created, updated, concluded, status };
      }) : [];

      return chains.map((chain) => {
        // Get steps for this chain
        const stepsQuery = `
          SELECT chain_id, step_number, thought, reflection, timestamp, is_conclusion
          FROM thought_steps
          WHERE chain_id = '${chain.id.replace(/'/g, "''")}'
          ORDER BY step_number
        `;

        const stepsResult = this.db.exec(stepsQuery);
        const steps = stepsResult.length > 0 ? stepsResult[0].values.map(row => {
          const [chain_id, step_number, thought, reflection, timestamp, is_conclusion] = row;
          return {
            id: step_number,
            thought: thought,
            reflection: reflection,
            timestamp: timestamp,
            is_conclusion: is_conclusion === 1,
            builds_on: step_number > 1 ? [step_number - 1] : [],
          };
        }) : [];

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
      const chainQuery = `
        INSERT OR REPLACE INTO thought_chains (id, created, updated, concluded, status)
        VALUES ('${thoughtChain.id.replace(/'/g, "''")}', '${thoughtChain.created}', ${thoughtChain.updated ? `'${thoughtChain.updated}'` : 'NULL'}, ${thoughtChain.concluded ? `'${thoughtChain.concluded}'` : 'NULL'}, '${thoughtChain.status}')
      `;
      this.db.exec(chainQuery);

      // Delete existing steps for this chain
      const deleteQuery = `DELETE FROM thought_steps WHERE chain_id = '${thoughtChain.id.replace(/'/g, "''")}'`;
      this.db.exec(deleteQuery);

      // Insert all steps
      if (thoughtChain.steps.length > 0) {
        thoughtChain.steps.forEach((step) => {
          const stepQuery = `
            INSERT INTO thought_steps (chain_id, step_number, thought, reflection, timestamp, is_conclusion)
            VALUES ('${thoughtChain.id.replace(/'/g, "''")}', ${step.id}, '${step.thought.replace(/'/g, "''")}', ${step.reflection ? `'${step.reflection.replace(/'/g, "''")}'` : 'NULL'}, '${step.timestamp}', ${step.is_conclusion ? 1 : 0})
          `;
          this.db.exec(stepQuery);
        });
      }
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
      const chainQuery = `
        SELECT id, created, updated, concluded, status
        FROM thought_chains
        WHERE id = '${chainId.replace(/'/g, "''")}'
      `;

      const chainResult = this.db.exec(chainQuery);
      if (chainResult.length === 0 || chainResult[0].values.length === 0) {
        return null;
      }

      const [id, created, updated, concluded, status] = chainResult[0].values[0];
      const chain = { id, created, updated, concluded, status };

      const stepsQuery = `
        SELECT chain_id, step_number, thought, reflection, timestamp, is_conclusion
        FROM thought_steps
        WHERE chain_id = '${chainId.replace(/'/g, "''")}'
        ORDER BY step_number
      `;

      const stepsResult = this.db.exec(stepsQuery);
      const steps = stepsResult.length > 0 ? stepsResult[0].values.map(row => {
        const [chain_id, step_number, thought, reflection, timestamp, is_conclusion] = row;
        return {
          id: step_number,
          thought: thought,
          reflection: reflection,
          timestamp: timestamp,
          is_conclusion: is_conclusion === 1,
          builds_on: step_number > 1 ? [step_number - 1] : [],
        };
      }) : [];

      return {
        id: chain.id,
        created: chain.created,
        updated: chain.updated,
        concluded: chain.concluded,
        status: chain.status,
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
      const query = `
        SELECT id, created, updated, concluded, status
        FROM thought_chains
        WHERE status = 'active'
        ORDER BY created DESC
        LIMIT 1
      `;

      const chainResult = this.db.exec(query);
      if (chainResult.length === 0 || chainResult[0].values.length === 0) {
        return null;
      }

      const [id] = chainResult[0].values[0];
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
      const chainResult = this.db.exec("SELECT COUNT(*) as count FROM thought_chains");
      const chainCount = chainResult.length > 0 ? chainResult[0].values[0][0] : 0;

      const stepResult = this.db.exec("SELECT COUNT(*) as count FROM thought_steps");
      const stepCount = stepResult.length > 0 ? stepResult[0].values[0][0] : 0;

      const activeResult = this.db.exec("SELECT COUNT(*) as count FROM thought_chains WHERE status = 'active'");
      const activeCount = activeResult.length > 0 ? activeResult[0].values[0][0] : 0;

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
