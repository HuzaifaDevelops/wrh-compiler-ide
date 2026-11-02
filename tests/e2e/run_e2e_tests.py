#!/usr/bin/env python3
"""
WRH Full-Stack Compiler E2E Test Runner.
Executes the comprehensive 4-Tier test suite:
- Tier 1: Feature Coverage (Types, Vars, Arithmetic, Relational, Conditionals, Loops, Output)
- Tier 2: Boundary & Corner Cases
- Tier 3: Cross-Feature Combinations
- Tier 4: Real-World Scenarios & Authoritative Lab Benchmarks
- API Contracts

Usage:
    python wrh_compiler_app/tests/e2e/run_e2e_tests.py
    python wrh_compiler_app/tests/e2e/run_e2e_tests.py --tier 1
    python wrh_compiler_app/tests/e2e/run_e2e_tests.py --tier 2
    python wrh_compiler_app/tests/e2e/run_e2e_tests.py --tier 3
    python wrh_compiler_app/tests/e2e/run_e2e_tests.py --tier 4
    python wrh_compiler_app/tests/e2e/run_e2e_tests.py --api
    python wrh_compiler_app/tests/e2e/run_e2e_tests.py --api-url http://127.0.0.1:8000
"""

import sys
import os
import time
import argparse
import unittest
from pathlib import Path

# Setup paths so imports resolve cleanly from anywhere
CURRENT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = CURRENT_DIR.parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))

# Import test modules
try:
    from wrh_compiler_app.tests.e2e.test_tier1_features import TestTier1Features
    from wrh_compiler_app.tests.e2e.test_tier2_boundaries import TestTier2Boundaries
    from wrh_compiler_app.tests.e2e.test_tier3_combinations import TestTier3Combinations
    from wrh_compiler_app.tests.e2e.test_tier4_scenarios import TestTier4Scenarios
    from wrh_compiler_app.tests.e2e.test_api_contracts import TestApiContracts
except ImportError:
    # Direct import fallback when run from inside e2e directory
    from test_tier1_features import TestTier1Features  # type: ignore
    from test_tier2_boundaries import TestTier2Boundaries  # type: ignore
    from test_tier3_combinations import TestTier3Combinations  # type: ignore
    from test_tier4_scenarios import TestTier4Scenarios  # type: ignore
    from test_api_contracts import TestApiContracts  # type: ignore


TIER_MAPPING = {
    "1": ("Tier 1: Feature Coverage", [TestTier1Features]),
    "2": ("Tier 2: Boundary & Corner Cases", [TestTier2Boundaries]),
    "3": ("Tier 3: Cross-Feature Combinations", [TestTier3Combinations]),
    "4": ("Tier 4: Real-World Scenarios", [TestTier4Scenarios]),
    "api": ("API Endpoint Contracts", [TestApiContracts]),
}


def run_test_group(title: str, test_classes: list, verbose: bool = False):
    """Runs a group of test classes and returns metrics."""
    suite = unittest.TestSuite()
    loader = unittest.TestLoader()
    for tc in test_classes:
        suite.addTests(loader.loadTestsFromTestCase(tc))

    start = time.perf_counter()
    stream = sys.stdout if verbose else None
    runner = unittest.TextTestRunner(stream=stream, verbosity=2 if verbose else 0)
    result = runner.run(suite)
    duration = time.perf_counter() - start

    return {
        "title": title,
        "total": result.testsRun,
        "passed": result.testsRun - len(result.failures) - len(result.errors),
        "failures": len(result.failures),
        "errors": len(result.errors),
        "duration": duration,
        "failure_details": result.failures + result.errors,
    }


def main():
    parser = argparse.ArgumentParser(description="WRH E2E Test Runner")
    parser.add_argument("--tier", choices=["1", "2", "3", "4", "all"], default="all",
                        help="Specific tier to run (1, 2, 3, 4, or all)")
    parser.add_argument("--api", action="store_true", help="Run only API contract tests")
    parser.add_argument("--api-url", default=None, help="Target live API URL (e.g. http://127.0.0.1:8000)")
    parser.add_argument("-v", "--verbose", action="store_true", help="Verbose test execution")
    args = parser.parse_args()

    # Determine which tiers to execute
    selected_tiers = []
    if args.api:
        selected_tiers = [("api", TIER_MAPPING["api"])]
    elif args.tier != "all":
        selected_tiers = [(args.tier, TIER_MAPPING[args.tier])]
    else:
        selected_tiers = [
            ("1", TIER_MAPPING["1"]),
            ("2", TIER_MAPPING["2"]),
            ("3", TIER_MAPPING["3"]),
            ("4", TIER_MAPPING["4"]),
            ("api", TIER_MAPPING["api"]),
        ]

    print("=" * 82)
    print("  WRH FULL-STACK COMPILER -- END-TO-END AUTOMATED TEST SUITE RUNNER")
    print(f"  Target: {'Live HTTP API (' + args.api_url + ')' if args.api_url else 'Compiler Engine (Direct)'}")
    print("=" * 82)

    tier_results = []
    total_tests = 0
    total_passed = 0
    total_failures = 0
    total_errors = 0
    total_duration = 0.0
    all_failure_details = []

    for key, (title, classes) in selected_tiers:
        if args.verbose:
            print(f"\n--- Running {title} ---")
        metrics = run_test_group(title, classes, verbose=args.verbose)
        tier_results.append(metrics)
        total_tests += metrics["total"]
        total_passed += metrics["passed"]
        total_failures += metrics["failures"]
        total_errors += metrics["errors"]
        total_duration += metrics["duration"]
        if metrics["failure_details"]:
            all_failure_details.extend(metrics["failure_details"])

    # Print Formatted Report Table
    print("\n" + "=" * 82)
    print(f"{'Tier / Category':<38} {'Tests':<8} {'Passed':<8} {'Failed':<8} {'Errors':<8} {'Time':<8}")
    print("-" * 82)
    for m in tier_results:
        print(f"{m['title']:<38} {m['total']:<8} {m['passed']:<8} {m['failures']:<8} {m['errors']:<8} {m['duration']:.3f}s")
    print("-" * 82)
    print(f"{'TOTAL':<38} {total_tests:<8} {total_passed:<8} {total_failures:<8} {total_errors:<8} {total_duration:.3f}s")
    print("=" * 82)

    if all_failure_details:
        print("\nFAILURE DETAILS:")
        for test, trace in all_failure_details:
            print(f"\n[FAIL] {test}:")
            print(trace)
        print("\nOVERALL STATUS: FAILED (Some tests failed)")
        sys.exit(1)
    else:
        success_rate = (total_passed / total_tests * 100) if total_tests > 0 else 0
        print(f"\nOVERALL STATUS: ALL TESTS PASSED ({success_rate:.1f}% SUCCESS RATE)")
        sys.exit(0)


if __name__ == "__main__":
    main()
