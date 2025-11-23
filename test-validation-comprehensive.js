#!/usr/bin/env node

/**
 * Comprehensive validation test suite
 * Tests both benign text (should pass) and malicious patterns (should be blocked)
 */

import { validateToolArguments } from "./src/models.js";

console.log("=".repeat(70));
console.log("COMPREHENSIVE VALIDATION TEST SUITE");
console.log("=".repeat(70));

// Test cases that should PASS (normal, benign text)
const benignTestCases = [
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
        name: "Text with SQL keywords (non-injection)",
        thought: "We need to select the best option and update our approach"
    },
    {
        name: "Text with OR in normal context",
        thought: "You can choose option A or option B, whichever works better"
    },
    {
        name: "Text with AND in normal context",
        thought: "We need both speed and accuracy in this implementation"
    },
    {
        name: "Technical discussion with SQL terms",
        thought: "The database query should select records where the status is active"
    },
    {
        name: "Code discussion",
        thought: "The function should insert the data into the array and return the result"
    },
    {
        name: "Multiple quotes in sentence",
        thought: "He said \"I think it's great\" and I replied \"that's wonderful\""
    },
    {
        name: "Apostrophes in contractions",
        thought: "It's important that we don't overlook the user's feedback"
    },
    {
        name: "Mathematical expressions",
        thought: "If x > 5 and y < 10, then we should proceed with the calculation"
    },
    {
        name: "File paths with slashes",
        thought: "The config file is located at /etc/config/app.conf"
    },
    {
        name: "URLs in text",
        thought: "Check the documentation at https://example.com/docs for more info"
    },
    {
        name: "JSON-like structures",
        thought: "The response format is {\"status\": \"success\", \"data\": []}"
    },
    {
        name: "Programming logic",
        thought: "If the condition is true or false, execute the appropriate branch"
    },
    {
        name: "Natural language with conjunctions",
        thought: "We can improve performance by optimizing the algorithm or adding caching"
    },
    {
        name: "Questions with quotes",
        thought: "Should we use 'strict mode' or 'loose mode' for validation?"
    },
    {
        name: "Complex technical explanation",
        thought: "The system checks if user_id = current_user AND status = 'active' before proceeding"
    }
];

// Test cases that should FAIL (actual malicious patterns)
const maliciousTestCases = [
    {
        name: "SQL injection: OR with equals",
        thought: "' OR 1=1 --"
    },
    {
        name: "SQL injection: OR with comparison",
        thought: "\" OR '1'='1"
    },
    {
        name: "SQL injection: AND with equals",
        thought: "' AND 1=1 --"
    },
    {
        name: "SQL injection: DROP TABLE",
        thought: "'; DROP TABLE users; --"
    },
    {
        name: "SQL injection: UNION SELECT",
        thought: "' UNION SELECT * FROM passwords --"
    },
    {
        name: "SQL injection: UNION ALL SELECT",
        thought: "\" UNION ALL SELECT username, password FROM users --"
    },
    {
        name: "SQL injection: DELETE FROM",
        thought: "'; DELETE FROM sessions WHERE 1=1; --"
    },
    {
        name: "SQL injection: INSERT INTO",
        thought: "'; INSERT INTO admins VALUES ('hacker', 'pass'); --"
    },
    {
        name: "SQL injection: UPDATE SET",
        thought: "'; UPDATE users SET role='admin' WHERE id=1; --"
    },
    {
        name: "XSS: script tag",
        thought: "<script>alert('xss')</script>"
    },
    {
        name: "XSS: javascript protocol",
        thought: "javascript:alert('xss')"
    },
    {
        name: "XSS: event handler",
        thought: "<img onerror='alert(1)' src=x>"
    },
    {
        name: "SQL comment injection",
        thought: "admin' --"
    },
    {
        name: "SQL multi-line comment",
        thought: "test /* comment */ injection"
    },
    {
        name: "SQL injection: CREATE TABLE",
        thought: "'; CREATE TABLE backdoor (cmd TEXT); --"
    }
];

// Run benign tests
console.log("\n📋 TESTING BENIGN TEXT (should all PASS)");
console.log("-".repeat(70));

let benignPassed = 0;
let benignFailed = 0;

benignTestCases.forEach((testCase, index) => {
    try {
        validateToolArguments("thought_chain", {
            action: "add_step",
            thought: testCase.thought
        });
        console.log(`✅ ${index + 1}. ${testCase.name}`);
        benignPassed++;
    } catch (error) {
        console.log(`❌ ${index + 1}. ${testCase.name}`);
        console.log(`   Error: ${error.message}`);
        console.log(`   Input: "${testCase.thought}"`);
        benignFailed++;
    }
});

// Run malicious tests
console.log("\n🛡️  TESTING MALICIOUS PATTERNS (should all be BLOCKED)");
console.log("-".repeat(70));

let maliciousBlocked = 0;
let maliciousPassed = 0;

maliciousTestCases.forEach((testCase, index) => {
    try {
        validateToolArguments("thought_chain", {
            action: "add_step",
            thought: testCase.thought
        });
        console.log(`❌ ${index + 1}. ${testCase.name} - FAILED TO BLOCK!`);
        console.log(`   Input: "${testCase.thought}"`);
        maliciousPassed++;
    } catch (error) {
        console.log(`✅ ${index + 1}. ${testCase.name} - Correctly blocked`);
        maliciousBlocked++;
    }
});

// Summary
console.log("\n" + "=".repeat(70));
console.log("TEST RESULTS SUMMARY");
console.log("=".repeat(70));

console.log(`\n📊 Benign Text Tests:`);
console.log(`   ✅ Passed: ${benignPassed}/${benignTestCases.length}`);
console.log(`   ❌ Failed: ${benignFailed}/${benignTestCases.length}`);

console.log(`\n🛡️  Malicious Pattern Tests:`);
console.log(`   ✅ Blocked: ${maliciousBlocked}/${maliciousTestCases.length}`);
console.log(`   ❌ Not Blocked: ${maliciousPassed}/${maliciousTestCases.length}`);

const allTestsPassed =
    benignPassed === benignTestCases.length &&
    maliciousBlocked === maliciousTestCases.length;

if (allTestsPassed) {
    console.log("\n🎉 SUCCESS! All tests passed!");
    console.log("   ✓ No false positives (benign text accepted)");
    console.log("   ✓ No false negatives (malicious patterns blocked)");
    process.exit(0);
} else {
    console.log("\n⚠️  FAILURE! Some tests did not pass.");
    if (benignFailed > 0) {
        console.log(`   ✗ ${benignFailed} false positive(s) detected`);
    }
    if (maliciousPassed > 0) {
        console.log(`   ✗ ${maliciousPassed} false negative(s) detected`);
    }
    process.exit(1);
}
