/**
 * Copyright 2025 Chris Bunting <cbunting99@gmail.com>
 * All rights reserved.
 * 
 * File: handlers.js
 * Description: Request handlers for Thought Chain MCP tools
 */

import { validateToolArguments, createThoughtChain, createThoughtStep } from "./models.js";
import { dbManager } from "./database.js";

/**
 * Handles thought_chain tool requests for Thought Chain
 * @param {Object} args - Tool arguments
 * @param {Object} currentChain - Current thought chain state
 * @param {DatabaseManager} database - Database manager instance (optional, defaults to dbManager)
 * @returns {Object} Response object
 */
export async function handleSequentialThink(args, currentChain, database = dbManager) {
  try {
    // Validate arguments
    validateToolArguments('thought_chain', args);

    const { thought = "", action, reflection = "" } = args;

    switch (action) {
      case "new_chain":
        const newChain = createThoughtChain();
        database.saveThought(newChain);
        
        return {
          content: [
            {
              type: "text",
              text: `🆕 Started new thought chain (ID: ${newChain.id})\n\nReady for your first thought step.`
            }
          ]
        };

      case "add_step":
        if (!thought.trim()) {
          throw new Error("Thought content is required when adding a step");
        }

        const step = createThoughtStep(
          currentChain.steps.length + 1,
          thought.trim(),
          reflection.trim(),
          false
        );

        currentChain.steps.push(step);
        currentChain.updated = new Date().toISOString();
        database.saveThought(currentChain);

        let response = `✅ Added step ${step.id} to thought chain\n\n`;
        response += `**Step ${step.id}:** ${step.thought}\n`;
        if (step.reflection) {
          response += `*Reflection:* ${step.reflection}\n`;
        }
        response += `\n*Chain progress: ${currentChain.steps.length} steps*`;

        return {
          content: [
            {
              type: "text",
              text: response
            }
          ]
        };

      case "review_chain":
        if (currentChain.steps.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: "🤔 No thoughts in current chain yet. Use 'add_step' to begin thinking."
              }
            ]
          };
        }

        let review = `🔍 **Thought Chain Review** (ID: ${currentChain.id})\n`;
        review += `*Created: ${new Date(currentChain.created).toLocaleString()}*\n\n`;

        currentChain.steps.forEach((step, index) => {
          review += `**Step ${step.id}:** ${step.thought}\n`;
          if (step.reflection) {
            review += `*Builds on previous:* ${step.reflection}\n`;
          }
          review += `*Time:* ${new Date(step.timestamp).toLocaleString()}\n`;
          if (index < currentChain.steps.length - 1) review += "\n";
        });

        return {
          content: [
            {
              type: "text",
              text: review
            }
          ]
        };

      case "conclude":
        if (!thought.trim()) {
          throw new Error("Conclusion thought is required");
        }

        const conclusionStep = createThoughtStep(
          currentChain.steps.length + 1,
          thought.trim(),
          reflection.trim(),
          true
        );

        currentChain.steps.push(conclusionStep);
        currentChain.status = "concluded";
        currentChain.concluded = new Date().toISOString();
        database.saveThought(currentChain);

        let conclusion = `🎯 **Thought Chain Concluded** (ID: ${currentChain.id})\n\n`;
        conclusion += `**Final Conclusion:** ${conclusionStep.thought}\n`;
        if (conclusionStep.reflection) {
          conclusion += `*Final Reflection:* ${conclusionStep.reflection}\n`;
        }
        conclusion += `\n*Total steps: ${currentChain.steps.length}*\n`;
        conclusion += `*Duration: ${new Date(currentChain.concluded).toLocaleString()} - ${new Date(currentChain.created).toLocaleString()}*`;

        return {
          content: [
            {
              type: "text",
              text: conclusion
            }
          ]
        };

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error("Error in handleSequentialThink:", error);
    throw error;
  }
}

/**
 * Handles recall_thoughts tool requests
 * @param {Object} args - Tool arguments
 * @returns {Object} Response object
 */
export async function handleRecallThoughts(args) {
  try {
    // Validate arguments
    validateToolArguments('recall_thoughts', args);

    const { query = "", limit = 5 } = args;
    const savedThoughts = dbManager.searchThoughtChains(query, limit);

    if (savedThoughts.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: query ? `🔍 No thought chains found matching "${query}"` : "📝 No saved thought chains found"
          }
        ]
      };
    }

    let response = query ? 
      `🔍 Found ${savedThoughts.length} thought chains matching "${query}":\n\n` :
      `📝 Recent thought chains (${savedThoughts.length}):\n\n`;

    savedThoughts.forEach(chain => {
      response += `**ID:** ${chain.id}\n`;
      response += `**Created:** ${new Date(chain.created).toLocaleString()}\n`;
      response += `**Status:** ${chain.status}\n`;
      response += `**Steps:** ${chain.steps.length}\n`;
      
      if (chain.steps.length > 0) {
        response += `**First thought:** ${chain.steps[0].thought.substring(0, 100)}${chain.steps[0].thought.length > 100 ? '...' : ''}\n`;
        
        if (chain.status === 'concluded' && chain.steps.length > 1) {
          const lastStep = chain.steps[chain.steps.length - 1];
          response += `**Conclusion:** ${lastStep.thought.substring(0, 100)}${lastStep.thought.length > 100 ? '...' : ''}\n`;
        }
      }
      
      response += "\n";
    });

    return {
      content: [
        {
          type: "text",
          text: response.trim()
        }
      ]
    };
  } catch (error) {
    console.error("Error in handleRecallThoughts:", error);
    throw error;
  }
}

/**
 * Handles load_thought_chain tool requests
 * @param {Object} args - Tool arguments
 * @returns {Object} Response object
 */
export async function handleLoadThoughtChain(args) {
  try {
    // Validate arguments
    validateToolArguments('load_thought_chain', args);

    const { chain_id } = args;
    const chain = dbManager.getThoughtChain(chain_id);
    
    if (!chain) {
      throw new Error(`Thought chain with ID ${chain_id} not found`);
    }

    // Reactivate the chain for continued work
    chain.status = "active";
    dbManager.saveThought(chain);
    
    let response = `📂 **Loaded thought chain** (ID: ${chain.id})\n`;
    response += `*Originally created: ${new Date(chain.created).toLocaleString()}*\n`;
    response += `*Steps: ${chain.steps.length}*\n\n`;

    if (chain.steps.length > 0) {
      response += "**Recent steps:**\n";
      const recentSteps = chain.steps.slice(-3); // Show last 3 steps
      recentSteps.forEach(step => {
        response += `- Step ${step.id}: ${step.thought.substring(0, 80)}${step.thought.length > 80 ? '...' : ''}\n`;
      });
    }
    
    response += "\n*Chain is now active. Use 'add_step' to continue thinking or 'review_chain' to see all steps.*";

    return {
      content: [
        {
          type: "text",
          text: response
        }
      ]
    };
  } catch (error) {
    console.error("Error in handleLoadThoughtChain:", error);
    throw error;
  }
}

/**
 * Handles database statistics requests
 * @returns {Object} Response object with database stats
 */
export async function handleGetStats() {
  try {
    const stats = dbManager.getStats();
    
    if (!stats) {
      throw new Error("Failed to retrieve database statistics");
    }

    let response = `📊 **Database Statistics**\n\n`;
    response += `**Total Thought Chains:** ${stats.totalChains}\n`;
    response += `**Total Thought Steps:** ${stats.totalSteps}\n`;
    response += `**Active Chains:** ${stats.activeChains}\n`;
    response += `**Database Path:** ${stats.databasePath}\n`;

    return {
      content: [
        {
          type: "text",
          text: response
        }
      ]
    };
  } catch (error) {
    console.error("Error in handleGetStats:", error);
    throw error;
  }
}

/**
 * Error handler for tool requests
 * @param {Error} error - The error that occurred
 * @param {string} toolName - Name of the tool that failed
 * @returns {Object} Error response
 */
export function handleToolError(error, toolName) {
  console.error(`Error in ${toolName}:`, error);
  
  // Don't expose sensitive information in error messages
  const safeMessage = error.message.includes('database') || 
                      error.message.includes('SQL') || 
                      error.message.includes('internal') 
                      ? 'An internal error occurred. Please try again.' 
                      : error.message;

  return {
    content: [
      {
        type: "text",
        text: `❌ Error: ${safeMessage}`
      }
    ],
    isError: true
  };
}
