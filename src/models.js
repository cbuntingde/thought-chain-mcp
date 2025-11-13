/**
 * Copyright 2025 Chris Bunting <cbunting99@gmail.com>
 * All rights reserved.
 *
 * File: models.js
 * Description: Data models and business logic for Thought Chain
 */

import { randomBytes } from "crypto";

/**
 * Validates a thought chain object
 * @param {Object} thoughtChain - The thought chain to validate
 * @returns {boolean} True if valid, throws error if invalid
 */
export function validateThoughtChain(thoughtChain) {
  if (!thoughtChain || typeof thoughtChain !== "object") {
    throw new Error("Thought chain must be an object");
  }

  if (!thoughtChain.id || typeof thoughtChain.id !== "string") {
    throw new Error("Thought chain must have a valid id");
  }

  if (!thoughtChain.created || typeof thoughtChain.created !== "string") {
    throw new Error("Thought chain must have a valid created timestamp");
  }

  if (!Array.isArray(thoughtChain.steps)) {
    throw new Error("Thought chain must have steps array");
  }

  // Validate each step
  thoughtChain.steps.forEach((step, index) => {
    if (!step.id || typeof step.id !== "number") {
      throw new Error(`Step ${index} must have a valid id`);
    }

    if (!step.thought || typeof step.thought !== "string") {
      throw new Error(`Step ${index} must have a valid thought`);
    }

    if (step.timestamp && typeof step.timestamp !== "string") {
      throw new Error(`Step ${index} must have a valid timestamp`);
    }

    if (step.reflection && typeof step.reflection !== "string") {
      throw new Error(`Step ${index} must have a valid reflection`);
    }
  });

  return true;
}

/**
 * Validates tool arguments for security
 * @param {string} toolName - Name of the tool
 * @param {Object} args - Arguments to validate
 * @returns {boolean} True if valid, throws error if invalid
 */
export function validateToolArguments(toolName, args) {
  if (!args || typeof args !== "object") {
    throw new Error("Arguments must be an object");
  }

  switch (toolName) {
    case "thought_chain":
      // Enhanced XSS prevention patterns
      const dangerousPatterns =
        /<script|javascript:|on\w+=|data:text|vbscript:/i;
      const injectionPatterns = /['";\\]|--+|\/\*|\*\//i;
      const controlCharacters = /[\x00-\x1F\x7F]/g;

      if (!args.action || typeof args.action !== "string") {
        throw new Error("Action is required and must be a string");
      }

      const validActions = [
        "add_step",
        "review_chain",
        "conclude",
        "new_chain",
      ];
      if (!validActions.includes(args.action)) {
        throw new Error(
          `Invalid action: ${args.action}. Must be one of: ${validActions.join(", ")}`,
        );
      }

      if (args.action === "add_step" || args.action === "conclude") {
        if (!args.thought || typeof args.thought !== "string") {
          throw new Error(
            "Thought is required for add_step and conclude actions",
          );
        }

        // Sanitize thought content
        if (args.thought.length > 10000) {
          throw new Error("Thought content too long (max 10000 characters)");
        }

        if (dangerousPatterns.test(args.thought)) {
          throw new Error(
            "Thought content contains potentially dangerous content",
          );
        }

        if (injectionPatterns.test(args.thought)) {
          throw new Error(
            "Thought content contains potentially dangerous patterns",
          );
        }

        if (controlCharacters.test(args.thought)) {
          throw new Error("Thought content contains invalid characters");
        }
      }

      if (args.reflection && typeof args.reflection !== "string") {
        throw new Error("Reflection must be a string");
      }

      if (args.reflection && args.reflection.length > 5000) {
        throw new Error("Reflection content too long (max 5000 characters)");
      }

      if (args.reflection && dangerousPatterns.test(args.reflection)) {
        throw new Error(
          "Reflection content contains potentially dangerous content",
        );
      }

      if (args.reflection && injectionPatterns.test(args.reflection)) {
        throw new Error(
          "Reflection content contains potentially dangerous patterns",
        );
      }

      if (args.reflection && controlCharacters.test(args.reflection)) {
        throw new Error("Reflection content contains invalid characters");
      }

      break;

    case "recall_thoughts":
      if (args.query && typeof args.query !== "string") {
        throw new Error("Query must be a string");
      }

      if (args.query && args.query.length > 1000) {
        throw new Error("Query too long (max 1000 characters)");
      }

      // Validate query for dangerous patterns
      if (args.query) {
        const searchPatterns = /[<>'"\\]/;
        if (searchPatterns.test(args.query)) {
          throw new Error("Query contains invalid characters");
        }

        // Also check for control characters
        const controlCharacters = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;
        if (controlCharacters.test(args.query)) {
          throw new Error("Query contains invalid characters");
        }

        // Check for SQL injection patterns
        const sqlPatterns = /['";\\]|--+|\/\*|\*\//i;
        if (sqlPatterns.test(args.query)) {
          throw new Error("Query contains invalid characters");
        }

        // Prevent path traversal attempts
        if (args.query.includes("..") || args.query.includes("/")) {
          throw new Error("Query contains invalid path sequences");
        }
      }

      if (
        args.limit &&
        (typeof args.limit !== "number" || args.limit < 1 || args.limit > 100)
      ) {
        throw new Error("Limit must be a number between 1 and 100");
      }

      break;

    case "load_thought_chain":
      if (!args.chain_id || typeof args.chain_id !== "string") {
        throw new Error("Chain ID is required and must be a string");
      }

      if (args.chain_id.length > 100) {
        throw new Error("Chain ID too long (max 100 characters)");
      }

      // Enhanced chain ID validation with length and pattern checks
      if (!/^[a-zA-Z0-9_-]{1,100}$/.test(args.chain_id)) {
        throw new Error(
          "Chain ID contains invalid characters or invalid length",
        );
      }

      // Prevent path traversal attempts in chain IDs
      if (args.chain_id.includes("..") || args.chain_id.includes("/")) {
        throw new Error("Chain ID contains invalid path sequences");
      }

      break;

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }

  return true;
}

/**
 * Generates a unique ID for thought chains
 * @returns {string} Unique ID
 */
export function generateId() {
  return randomBytes(16).toString("hex");
}

/**
 * Creates a new thought chain object
 * @param {string} [id] - Optional ID, will generate if not provided
 * @returns {Object} New thought chain
 */
export function createThoughtChain(id = null) {
  return {
    id: id || generateId(),
    created: new Date().toISOString(),
    updated: null,
    concluded: null,
    status: "active",
    steps: [],
  };
}

/**
 * Creates a new thought step
 * @param {number} stepId - Step ID
 * @param {string} thought - Thought content
 * @param {string} [reflection] - Optional reflection
 * @param {boolean} [isConclusion] - Whether this is a conclusion step
 * @returns {Object} New thought step
 */
export function createThoughtStep(
  stepId,
  thought,
  reflection = null,
  isConclusion = false,
) {
  return {
    id: stepId,
    thought: thought.trim(),
    reflection: reflection ? reflection.trim() : null,
    timestamp: new Date().toISOString(),
    is_conclusion: isConclusion,
    builds_on: stepId > 1 ? [stepId - 1] : [],
  };
}
