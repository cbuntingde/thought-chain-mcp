/**
 * Copyright 2025 Chris Bunting <cbunting99@gmail.com>
 * All rights reserved.
 *
 * File: server.test.js
 * Description: Test suite for the Thought Chain MCP Server
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { ThoughtChainServer, RateLimiter } from '../src/server.js';
import { validateToolArguments, createThoughtChain, createThoughtStep, generateId } from '../src/models.js';
import { DatabaseManager } from '../src/database.js';
import { handleSequentialThink, handleRecallThoughts, handleLoadThoughtChain, handleGetStats } from '../src/handlers.js';

describe('Thought Chain Server Tests', () => {
  let server;
  let testDb;

  // Setup test environment
  test('setup', async () => {
    // Use in-memory database for testing
    testDb = new DatabaseManager(':memory:');
    await testDb.initialize();
    server = new ThoughtChainServer();
  });

  // Cleanup test environment
  test('cleanup', () => {
    if (testDb) {
      testDb.close();
    }
  });

  // Create a fresh database for each test suite
  beforeEach(async () => {
    testDb = new DatabaseManager(':memory:');
    await testDb.initialize();
  });

  afterEach(() => {
    if (testDb) {
      testDb.close();
    }
  });

  describe('Model Validation Tests', () => {
    test('should validate tool arguments for thought_chain', () => {
      // Valid arguments
      assert.doesNotThrow(() => {
        validateToolArguments('thought_chain', {
          action: 'add_step',
          thought: 'This is a test thought'
        });
      });

      // Invalid action
      assert.throws(() => {
        validateToolArguments('thought_chain', {
          action: 'invalid_action',
          thought: 'This is a test thought'
        });
      }, /Invalid action/);

      // Missing thought for add_step
      assert.throws(() => {
        validateToolArguments('thought_chain', {
          action: 'add_step'
        });
      }, /Thought is required/);

      // XSS prevention
      assert.throws(() => {
        validateToolArguments('thought_chain', {
          action: 'add_step',
          thought: '<script>alert("xss")</script>'
        });
      }, /dangerous content/);
    });

    test('should validate tool arguments for recall_thoughts', () => {
      // Valid arguments
      assert.doesNotThrow(() => {
        validateToolArguments('recall_thoughts', {
          query: 'test',
          limit: 5
        });
      });

      // Invalid limit
      assert.throws(() => {
        validateToolArguments('recall_thoughts', {
          query: 'test',
          limit: 150
        });
      }, /between 1 and 100/);
    });

    test('should validate tool arguments for load_thought_chain', () => {
      // Valid arguments
      assert.doesNotThrow(() => {
        validateToolArguments('load_thought_chain', {
          chain_id: 'valid-chain-id-123'
        });
      });

      // Invalid chain ID format
      assert.throws(() => {
        validateToolArguments('load_thought_chain', {
          chain_id: 'invalid@chain#id'
        });
      }, /invalid characters/);
    });

    test('should create thought chain correctly', () => {
      const chain = createThoughtChain();
      assert.strictEqual(typeof chain.id, 'string');
      assert.strictEqual(chain.status, 'active');
      assert(Array.isArray(chain.steps));
      assert.strictEqual(chain.steps.length, 0);
      assert(typeof chain.created, 'string');
    });

    test('should create thought step correctly', () => {
      const step = createThoughtStep(1, 'Test thought', 'Test reflection', false);
      assert.strictEqual(step.id, 1);
      assert.strictEqual(step.thought, 'Test thought');
      assert.strictEqual(step.reflection, 'Test reflection');
      assert.strictEqual(step.is_conclusion, false);
      assert(Array.isArray(step.builds_on));
      assert(typeof step.timestamp, 'string');
    });
  });

  describe('Database Tests', () => {
    test('should save and retrieve thought chains', () => {
      const chain = createThoughtChain('test-chain-1');
      chain.steps.push(createThoughtStep(1, 'Test thought 1'));
      chain.steps.push(createThoughtStep(2, 'Test thought 2', 'Test reflection'));

      testDb.saveThought(chain);

      const retrieved = testDb.getThoughtChain('test-chain-1');
      assert(retrieved !== null);
      assert.strictEqual(retrieved.id, 'test-chain-1');
      assert.strictEqual(retrieved.steps.length, 2);
      assert.strictEqual(retrieved.steps[0].thought, 'Test thought 1');
      assert.strictEqual(retrieved.steps[1].reflection, 'Test reflection');
    });

    test('should search thought chains', () => {
      const chain1 = createThoughtChain('search-test-1');
      chain1.steps.push(createThoughtStep(1, 'This is about programming'));

      const chain2 = createThoughtChain('search-test-2');
      chain2.steps.push(createThoughtStep(1, 'This is about cooking'));

      testDb.saveThought(chain1);
      testDb.saveThought(chain2);

      const results = testDb.searchThoughtChains('programming', 10);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].id, 'search-test-1');
    });

    test('should get database statistics', () => {
      const stats = testDb.getStats();
      assert(stats !== null);
      assert(typeof stats.totalChains, 'number');
      assert(typeof stats.totalSteps, 'number');
      assert(typeof stats.activeChains, 'number');
    });
  });

  describe('Handler Tests', () => {
    test('should handle new_chain action', async () => {
      const result = await handleSequentialThink({
        action: 'new_chain'
      }, server.getCurrentThoughtChain(), testDb);

      assert.strictEqual(result.content[0].type, 'text');
      assert(result.content[0].text.includes('Started new thought chain'));
    });

    test('should handle add_step action', async () => {
      const currentChain = createThoughtChain();

      const result = await handleSequentialThink({
        action: 'add_step',
        thought: 'This is a test step',
        reflection: 'Test reflection'
      }, currentChain, testDb);

      assert.strictEqual(result.content[0].type, 'text');
      assert(result.content[0].text.includes('Added step 1'));
      assert.strictEqual(currentChain.steps.length, 1);
      assert.strictEqual(currentChain.steps[0].thought, 'This is a test step');
    });

    test('should handle recall_thoughts', async () => {
      const result = await handleRecallThoughts({
        query: 'test',
        limit: 5
      }, testDb);

      assert.strictEqual(result.content[0].type, 'text');
      // Should not crash even with no data
    });

    test('should handle get_stats', async () => {
      const result = await handleGetStats(testDb);

      assert.strictEqual(result.content[0].type, 'text');
      assert(result.content[0].text.includes('Database Statistics'));
    });
  });

  describe('Security Tests', () => {
    test('should prevent XSS in thoughts', () => {
      assert.throws(() => {
        validateToolArguments('thought_chain', {
          action: 'add_step',
          thought: 'javascript:alert("xss")'
        });
      }, /dangerous content/);

      assert.throws(() => {
        validateToolArguments('thought_chain', {
          action: 'add_step',
          thought: '<img src=x onerror=alert("xss")>'
        });
      }, /dangerous content/);
    });

    test('should limit input lengths', () => {
      const longThought = 'a'.repeat(10001);
      assert.throws(() => {
        validateToolArguments('thought_chain', {
          action: 'add_step',
          thought: longThought
        });
      }, /too long/);

      const longReflection = 'a'.repeat(5001);
      assert.throws(() => {
        validateToolArguments('thought_chain', {
          action: 'add_step',
          thought: 'Valid thought',
          reflection: longReflection
        });
      }, /too long/);
    });

    test('should validate chain ID format', () => {
      const invalidIds = [
        '../../../etc/passwd',
        'SELECT * FROM users',
        '<script>alert("xss")</script>',
        'chain@id#with$special%chars',
        'path/to/somewhere',
        '..\\windows\\system32',
        'chain id with spaces',
        'chain\nid\nwith\nnewlines',
        'a'.repeat(101) // Too long
      ];

      invalidIds.forEach(id => {
        assert.throws(() => {
          validateToolArguments('load_thought_chain', {
            chain_id: id
          });
        }, /invalid characters|invalid length|too long/);
      });
    });

    test('should prevent SQL injection patterns', () => {
      const injectionPayloads = [
        "' OR '1'='1",
        "'; DROP TABLE users; --",
        "' UNION SELECT * FROM users --",
        "1' AND (SELECT COUNT(*) FROM users) > 0 --",
        "'; UPDATE thought_chains SET status = 'compromised'; --",
        "' || 'malicious' || '",
        "' AND 1=1#",
        "' OR 1=1--"
      ];

      injectionPayloads.forEach(payload => {
        assert.throws(() => {
          validateToolArguments('thought_chain', {
            action: 'add_step',
            thought: payload
          });
        }, /dangerous patterns/);
      });
    });

    test('should prevent control characters', () => {
      const controlCharPayloads = [
        'Test\x00thought',
        'Thought\x1Fwith\x7Fcontrol chars',
        'Test\r\nexploit',
        'Test\t\t\ttabs',
        'Test\u0000null byte'
      ];

      controlCharPayloads.forEach(payload => {
        assert.throws(() => {
          validateToolArguments('thought_chain', {
            action: 'add_step',
            thought: payload
          });
        }, /invalid characters/);
      });
    });

    test('should validate query parameters for search', () => {
      const dangerousQueries = [
        '<script>alert("xss")</script>',
        "'; DROP TABLE thought_chains; --",
        '../../../etc/passwd',
        'query with\x00null byte'
      ];

      dangerousQueries.forEach((query, index) => {
        try {
          validateToolArguments('recall_thoughts', {
            query: query
          });
          console.log(`Query ${index} "${query}" did not throw - this should not happen`);
          assert.fail(`Query ${index} "${query}" should have thrown an error`);
        } catch (error) {
          assert(error.message.includes('invalid characters') || error.message.includes('invalid path sequences'),
            `Query ${index} "${query}" should throw invalid characters or path sequences error, got: ${error.message}`);
        }
      });

      // Test that valid queries don't throw
      const validQueries = [
        'normal search query',
        'search with numbers 123',
        'search-with-hyphens',
        'search_with_underscores'
      ];

      validQueries.forEach(query => {
        assert.doesNotThrow(() => {
          validateToolArguments('recall_thoughts', {
            query: query
          });
        });
      });
    });
  });

  describe('Rate Limiting Tests', () => {
    test('should implement rate limiting', async () => {
      // This test would require modifying the server to expose rate limiting
      // For now, we'll test the rate limiter functionality directly

      // Create a rate limiter with low limits for testing
      const limiter = new RateLimiter(2, 1000); // 2 requests per second
      const clientId = 'test-client';

      // First request should be allowed
      assert.strictEqual(limiter.isAllowed(clientId), true);

      // Second request should be allowed
      assert.strictEqual(limiter.isAllowed(clientId), true);

      // Third request should be denied
      assert.strictEqual(limiter.isAllowed(clientId), false);

      // Wait and test cleanup
      await new Promise(resolve => setTimeout(resolve, 1100));
      limiter.cleanup();

      // Should be allowed again after cleanup
      assert.strictEqual(limiter.isAllowed(clientId), true);
    });
  });

  describe('Secure ID Generation Tests', () => {
    test('should generate cryptographically secure IDs', () => {
      const id1 = generateId();
      const id2 = generateId();

      // IDs should be different
      assert.notStrictEqual(id1, id2);

      // IDs should be 32 characters (16 bytes in hex)
      assert.strictEqual(id1.length, 32);
      assert.strictEqual(id2.length, 32);

      // IDs should only contain hex characters
      assert(/^[0-9a-f]{32}$/.test(id1));
      assert(/^[0-9a-f]{32}$/.test(id2));

      // Generate multiple IDs to ensure uniqueness
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        ids.add(generateId());
      }
      assert.strictEqual(ids.size, 100, 'All generated IDs should be unique');
    });
  });

  describe('Error Handling Tests', () => {
    test('should handle missing thought for add_step', async () => {
      const currentChain = createThoughtChain();

      await assert.rejects(async () => {
        await handleSequentialThink({
          action: 'add_step'
        }, currentChain, testDb);
      }, {
        message: /Thought is required for add_step and conclude actions/
      });
    });

    test('should handle missing thought for conclude', async () => {
      const currentChain = createThoughtChain();

      await assert.rejects(async () => {
        await handleSequentialThink({
          action: 'conclude'
        }, currentChain, testDb);
      }, {
        message: /Thought is required for add_step and conclude actions/
      });
    });

    test('should handle invalid chain_id', async () => {
      try {
        await handleLoadThoughtChain({
          chain_id: 'non-existent-chain'
        }, testDb);
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert(error.message.includes('not found'));
      }
    });
  });
});
