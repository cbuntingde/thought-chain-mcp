# Security Policy

## Supported Versions

| Version | Supported Until |
|---------|-----------------|
| 1.1.0   | Current         |
| 1.0.x   | Security fixes only |

## Security Model

The Thought Chain MCP Server is designed with security as a primary consideration. This document outlines our security practices, threat model, and vulnerability reporting process.

## Threat Model

### Trust Boundaries

1. **MCP Client ↔ Server Communication**
   - Communication occurs via stdio
   - No network exposure
   - Input validation at all entry points

2. **Server ↔ File System**
   - Database stored in user's home directory (`~/.thought-chain-mcp/`)
   - No access to files outside designated directory
   - Secure file permissions enforced

3. **Server ↔ Database**
   - Parameterized queries prevent SQL injection
   - No dynamic SQL construction
   - Input validation for all database operations

### Security Controls

#### Input Validation
- All user inputs are validated and sanitized
- XSS prevention via pattern matching
- Length limits enforced on all inputs
- Chain ID format validation (alphanumeric, underscore, hyphen only)

#### Database Security
- Uses prepared statements exclusively
- No dynamic SQL query construction
- SQLite database with appropriate permissions
- Data stored in user's private directory

#### Code Execution Security
- No use of `eval()`, `Function()`, or similar dynamic execution
- No dynamic imports or requires
- Cryptographically secure random number generation
- No network connectivity

#### Error Handling
- Sanitized error messages prevent information disclosure
- Comprehensive error logging without exposing sensitive data
- Graceful degradation on errors

## Security Features

### Implemented Controls

✅ **Input Sanitization**
- XSS pattern detection: `/<script|javascript:|on\w+=/i`
- Maximum length enforcement (thoughts: 10,000 chars, reflections: 5,000 chars)
- Chain ID validation with regex: `/^[a-zA-Z0-9_-]+$/`

✅ **SQL Injection Prevention**
- All database queries use prepared statements
- No string concatenation in SQL queries
- Parameter binding for all user input

✅ **Secure Random Generation**
- Uses `crypto.randomBytes()` for ID generation
- Cryptographically secure entropy source

✅ **File System Security**
- Database isolated to user home directory
- No path traversal vulnerabilities
- Secure directory creation with appropriate permissions

✅ **Error Information Disclosure Prevention**
- Database errors masked in user-facing messages
- No internal error details exposed
- Consistent error message format

### Additional Hardening

🔒 **Memory Safety**
- No unsafe memory operations
- Proper error handling prevents memory leaks
- Database connections properly closed

🔒 **Process Security**
- Runs with user privileges only
- No privilege escalation attempts
- Isolated MCP server process

## Security Best Practices

### For Users

1. **Keep Updated**: Always use the latest version
2. **File Permissions**: Ensure `~/.thought-chain-mcp/` has appropriate permissions
3. **Network Isolation**: The server does not require network access
4. **Regular Cleanup**: Periodically review and clean old thought chains

### For Developers

1. **Input Validation**: Always validate inputs using `validateToolArguments()`
2. **Database Operations**: Use only the provided `DatabaseManager` methods
3. **Error Handling**: Use `handleToolError()` for consistent error responses
4. **Testing**: Run security tests before deploying changes

## Security Testing

### Automated Tests

- Input validation fuzzing
- SQL injection attempt detection
- XSS payload testing
- Path traversal attempt testing

### Manual Testing

- Code review for security patterns
- Threat modeling analysis
- Penetration testing (quarterly)

## Security Changelog

### Version 1.1.0
- Added cryptographically secure ID generation
- Enhanced input validation patterns
- Improved error message sanitization
- Added comprehensive security documentation

### Version 1.0.2
- Fixed potential path traversal in chain ID validation
- Enhanced XSS prevention patterns
- Improved database error handling

## License

This security policy is licensed under the Creative Commons Attribution 4.0 International License.

---

**Last Updated**: January 2025
**Next Review**: April 2025
