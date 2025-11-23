#!/usr/bin/env node

/**
 * Debug script to test regex patterns
 */

// Test the exact pattern from models.js
const injectionPatterns = /(?:['"]\s*(?:OR\s+[0-9]+=|OR\s+[0-9]+\s+|AND\s+[0-9]+=|AND\s+[0-9]+\s+|UNION\s+SELECT|SELECT\s+\*|INSERT\s+INTO|UPDATE\s+SET|DELETE\s+FROM|DROP\s+TABLE|CREATE\s+TABLE|ALTER\s+TABLE|EXEC(?:UTE)?\s+))|--|\/\*|\*\//i;

const testString = 'The user said "this is a test" and it worked';

console.log(`Testing string: "${testString}"`);
console.log(`Pattern matches: ${injectionPatterns.test(testString)}`);

// Let's break down the pattern
const pattern1 = /['"]\s*(?:OR\s+|AND\s+|UNION\s+|SELECT\s+|INSERT\s+|UPDATE\s+|DELETE\s+|DROP\s+|CREATE\s+|ALTER\s+|EXEC(?:UTE)?\s+)/i;
const pattern2 = /--|\/\*|\*\//i;

console.log(`Pattern 1 matches: ${pattern1.test(testString)}`);
console.log(`Pattern 2 matches: ${pattern2.test(testString)}`);

// Test with a simpler pattern
const simplePattern = /['"]\s*(?:OR\s+|AND\s+|UNION\s+|SELECT\s+)/i;
console.log(`Simple pattern matches: ${simplePattern.test(testString)}`);

// Test with just the quote
const quotePattern = /["']/;
console.log(`Quote pattern matches: ${quotePattern.test(testString)}`);

// Test with actual dangerous patterns
const dangerousString1 = '" OR 1=1';
const dangerousString2 = "' UNION SELECT * FROM users";

console.log(`\nTesting dangerous patterns:`);
console.log(`Dangerous 1: "${dangerousString1}" - Matches: ${injectionPatterns.test(dangerousString1)}`);
console.log(`Dangerous 2: "${dangerousString2}" - Matches: ${injectionPatterns.test(dangerousString2)}`);
