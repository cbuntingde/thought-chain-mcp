/**
 * Copyright 2025 Chris Bunting <cbunting99@gmail.com>
 * All rights reserved.
 *
 * File: database.js
 * Description: Database operations for Thought Chain
 */

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import os from "os";
import { validateThoughtChain } from "./models.js";
import { constants } from "fs";

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
 * Database manager class for Thought Chain
 */
export class DatabaseManager {
  constructor(dbPath = DB_PATH) {
    // Ensure the directory exists with secure permissions
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true, mode: 0o700 });
    } else {
      try {
        fs.chmodSync(dbDir, 0o700);
      } catch (error) {
        console.warn("Could not set directory permissions:", error.message);
      }
    }

    this.db = new Database(dbPath);
    this.initDatabase();

    // Set secure permissions on the database file
    try {
      fs.chmodSync(dbPath, 0o600);
    } catch (error) {
      console.warn("Could not set database file permissions:", error.message);
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

      const chains = this.db.prepare(chainsQuery).all();

      // Get steps for each chain
      const stepsQuery = `
        SELECT chain_id, step_number, thought, reflection, timestamp, is_conclusion
        FROM thought_steps
        WHERE chain_id = ?
        ORDER BY step_number
      `;

      const stepsStmt = this.db.prepare(stepsQuery);

      return chains.map((chain) => {
        const steps = stepsStmt.all(chain.id).map((step) => ({
          id: step.step_number,
          thought: step.thought,
          reflection: step.reflection,
          timestamp: step.timestamp,
          is_conclusion: step.is_conclusion === 1,
          builds_on: step.step_number > 1 ? [step.step_number - 1] : [],
        }));

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

      chainStmt.run(
        thoughtChain.id,
        thoughtChain.created,
        thoughtChain.updated || null,
        thoughtChain.concluded || null,
        thoughtChain.status,
      );

      // Delete existing steps for this chain
      const deleteStmt = this.db.prepare(
        "DELETE FROM thought_steps WHERE chain_id = ?",
      );
      deleteStmt.run(thoughtChain.id);

      // Insert all steps
      if (thoughtChain.steps.length > 0) {
        const stepStmt = this.db.prepare(`
          INSERT INTO thought_steps (chain_id, step_number, thought, reflection, timestamp, is_conclusion)
          VALUES (?, ?, ?, ?, ?, ?)
        `);

        const insertTransaction = this.db.transaction(() => {
          thoughtChain.steps.forEach((step) => {
            stepStmt.run(
              thoughtChain.id,
              step.id,
              step.thought,
              step.reflection || null,
              step.timestamp,
              step.is_conclusion ? 1 : 0,
            );
          });
        });

        insertTransaction();
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
        WHERE id = ?
      `;

      const chain = this.db.prepare(chainQuery).get(chainId);
      if (!chain) {
        return null;
      }

      const stepsQuery = `
        SELECT chain_id, step_number, thought, reflection, timestamp, is_conclusion
        FROM thought_steps
        WHERE chain_id = ?
        ORDER BY step_number
      `;

      const steps = this.db
        .prepare(stepsQuery)
        .all(chainId)
        .map((step) => ({
          id: step.step_number,
          thought: step.thought,
          reflection: step.reflection,
          timestamp: step.timestamp,
          is_conclusion: step.is_conclusion === 1,
          builds_on: step.step_number > 1 ? [step.step_number - 1] : [],
        }));

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

      const chain = this.db.prepare(query).get();
      if (!chain) {
        return null;
      }

      return this.getThoughtChain(chain.id);
    } catch (error) {
      console.error("Failed to get most recent active chain:", error);
      return null;
    }
  }

  /**
   * Close the database connection
   */
  close() {
    try {
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
      const chainCount = this.db
        .prepare("SELECT COUNT(*) as count FROM thought_chains")
        .get();
      const stepCount = this.db
        .prepare("SELECT COUNT(*) as count FROM thought_steps")
        .get();
      const activeCount = this.db
        .prepare(
          "SELECT COUNT(*) as count FROM thought_chains WHERE status = 'active'",
        )
        .get();

      return {
        totalChains: chainCount.count,
        totalSteps: stepCount.count,
        activeChains: activeCount.count,
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
