# WRH Compiler App - Testing Architecture & Guide

This directory houses the comprehensive test suites for the WRH Full-Stack Compiler Web Application.

## Test Directory Structure

```
tests/
├── README.md                 # This guide
└── e2e/                      # Multi-tier end-to-end integration test suite
    ├── compiler_adapter.py      # Unified compiler execution bridge
    ├── test_tier1_features.py   # Tier 1: Core language feature coverage
    ├── test_tier2_boundaries.py # Tier 2: Boundary conditions & corner cases
    ├── test_tier3_combinations.py # Tier 3: Cross-feature interactions
    └── test_tier4_scenarios.py  # Tier 4: Real-world algorithms & complex programs
```

## Test Execution Commands

### 1. Run Complete Monorepo Test Suite
From the monorepo root:
```bash
npm test
```

### 2. Run Backend Unit & Integration Tests
Runs Django REST Framework test cases located in `backend/apps/*/tests/`:
```bash
npm run test:backend
# Or directly via manage.py inside backend/
python manage.py test apps
```

### 3. Run E2E Integration Test Suite
Executes the 4-tier opaque-box test runner against the compiler pipeline and API:
```bash
npm run test:e2e
# Or directly via Python:
python -m unittest discover -s tests/e2e -p "test_*.py"
```

### 4. Run Frontend Lint & Build Checks
Verifies TypeScript types, ESLint rules, and production build cleanliness:
```bash
npm run lint --prefix frontend
npm run build --prefix frontend
```
