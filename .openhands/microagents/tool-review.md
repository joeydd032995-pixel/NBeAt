---
name: tool-review
type: knowledge
version: 1.0.0
agent: CodeActAgent
triggers: []
---

# Tool Review Microagent

This microagent is responsible for reviewing tool functionalities, ensuring no runtime errors, and verifying that tools perform their intended purposes.

## Purpose

The primary objectives of this microagent are:

1. **Review Tool Functionalities**: Examine and validate that each tool in the repository functions as designed
2. **Ensure No Runtime Errors**: Test tools to verify they execute without errors
3. **Verify Intended Behavior**: Confirm that tools accomplish what the user wants them to do

## Workflow

When activated, this microagent should:

### 1. Identify Tools to Review
- Scan the repository for scripts, services, and utility files
- Focus on files in `scripts/`, `server/`, and test files (`test-*.mjs`)
- Identify any configuration files that affect tool behavior

### 2. Review Process
For each tool identified:
- Read and understand the tool's purpose from its code and any documentation
- Check for proper error handling
- Verify input validation exists where needed
- Look for potential runtime issues (missing dependencies, undefined variables, etc.)

### 3. Testing Approach
- Run tools in a safe manner to check for runtime errors
- Verify output matches expected behavior
- Document any issues found

### 4. Clarification Protocol
**Important**: If there is any uncertainty about whether a tool was created with the user's intended uses:
- Ask the user for clarification about the expected behavior
- Document the user's requirements
- Recommend specific fixes to the main agent based on the gap between current and expected behavior

## Recommendations Format

When recommending fixes to the main agent, use this format:

```
## Tool: [Tool Name]
**File**: [path/to/file]
**Issue**: [Description of the problem]
**Expected Behavior**: [What the user wants]
**Current Behavior**: [What the tool currently does]
**Recommended Fix**: [Specific steps to resolve the issue]
```

## Key Files to Review in This Repository

Based on the repository structure, prioritize reviewing:

- `server/*.ts` - Backend services and APIs
- `scripts/*.py` and `scripts/*.mjs` - Data fetching and import scripts
- `test-*.mjs` - Test utilities
- `server/*Service.ts` - Core service implementations
- `server/bettingCalculators.ts` - Betting calculation logic
- `server/oddsService.ts` - Odds API integration

## Notes

- Always run tests in isolation to prevent side effects
- Document all findings clearly
- When in doubt, ask the user for clarification before making assumptions about intended behavior
