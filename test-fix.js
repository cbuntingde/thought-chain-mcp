#!/usr/bin/env node

/**
 * Test script to verify the fix for "Thought content contains potentially dangerous patterns" error
 */

import { validateToolArguments } from "./src/models.js";

console.log("Testing validation with normal text containing quotes and other characters...\n");

// Test cases that should now pass
const testCases = [
  {
    name: "Text with single quotes",
    thought: "I'm thinking about the problem and it's quite interesting"
  },
  {
    name: "Text with double quotes",
    thought: 'The user said "this is a test" and it worked'
  },
  {
    name: "Text with semicolons",
    thought: "First, I need to analyze the problem; then, I'll implement a solution"
  },
  {
    name: "Text with backslashes",
    thought: "The path is C:\\Users\\Documents\\file.txt"
  },
  {
    name: "Text with mixed special characters",
    thought: "I'm testing 'quotes', \"double quotes\", and \\backslashes\\; all should work!"
  },
  {
    name: "Text with SQL keywords but not injection",
    thought: "We need to select the best option and update our approach"
  }
];

let passedTests = 0;
let totalTests = testCases.length;

testCases.forEach(testCase => {
  try {
    validateToolArguments("thought_chain", {
      action: "add_step",
      thought: testCase.thought
    });
    console.log(`✅ ${testCase.name}: PASS`);
    passedTests++;
  } catch (error) {
    console.log(`❌ ${testCase.name}: FAIL - ${error.message}`);
  }
});

// Test cases that should still fail (actual dangerous patterns)
console.log("\nTesting validation with actual dangerous patterns...\n");

const dangerousTestCases = [
  {
    name: "SQL injection attempt",
    thought: "'; DROP TABLE users; --"
  },
  {
    name: "XSS attempt",
    thought: "<script>alert('xss')</script>"
  },
  {
    name: "SQL injection with OR",
    thought: "' OR '1'='1"
  }
];

let dangerousTestsBlocked = 0;

dangerousTestCases.forEach(testCase => {
  try {
    validateToolArguments("thought_chain", {
      action: "add_step",
      thought: testCase.thought
    });
    console.log(`❌ ${testCase.name}: FAIL - Should have been blocked`);
  } catch (error) {
    console.log(`✅ ${testCase.name}: PASS - Correctly blocked`);
    dangerousTestsBlocked++;
  }
});

console.log(`\nTest Results:`);
console.log(`Normal text tests: ${passedTests}/${totalTests} passed`);
console.log(`Dangerous pattern tests: ${dangerousTestsBlocked}/${dangerousTestCases.length} correctly blocked`);

if (passedTests === totalTests && dangerousTestsBlocked === dangerousTestCases.length) {
  console.log("\n🎉 All tests passed! The fix is working correctly.");
} else {
  console.log("\n⚠️ Some tests failed. The fix may need further adjustment.");
}
