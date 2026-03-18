# Submission Notes

## Overview

This exercise is a backend proxy, but I approached it from a QA automation perspective that is directly relevant to frontend-web testing:

- use Playwright as the main automation framework,
- keep the tests end to end at the service boundary,
- control external dependencies with a deterministic stub,
- cover both happy path and failure handling.

## Why Playwright

I chose Playwright for two reasons:

1. It matches the target role and toolset for web QA automation.
2. It supports fast API-level validation now, while keeping the same framework available for future browser-based coverage.

## Test Strategy

The suite is intentionally small but risk-based.

- One happy-path scenario proves the proxy forwards the request and strips `user` from the downstream response.
- Negative scenarios verify that invalid input is rejected early and that malformed downstream behavior is handled safely.
- The downstream stub records what it receives so the tests can assert true proxy behavior, not only response payloads.

## Service Fixes

While writing the tests, I found one implementation issue that directly violated the requirements:

- the proxy removed `customer` instead of `user` from the downstream response.

I corrected that behavior and added validation for malformed JSON and non-object JSON bodies so the contract is explicit.

## If I Had More Time

- add contract-style tests around downstream error propagation,
- add CI configuration to run the Playwright suite automatically,
- add reporting artifacts and trace capture for failed runs,
- extend coverage to performance and resilience scenarios such as timeouts or unavailable downstream service.
