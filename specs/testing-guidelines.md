# Testing Guidelines

These rules apply to unit, integration, and end-to-end tests in this repository.

## Test Suite Header

Every automated test file must begin, before imports, with a suite comment that states:

- `Test type`: the execution boundary, such as unit, integration, or end-to-end;
- `Intent`: exactly `Feature` or `Regression`;
- `Subject`: the behavior or contract being exercised; and
- `Assertions`: a compact summary of the observable outcomes the test proves.

Use `Feature` for intended behavior and `Regression` when the test protects a previously observed
failure. A regression header must name that failure. Since each suite covers one scenario, do not
combine feature and regression intent in one file. Update the header whenever the suite's scope or
assertions change.

## Structure

- Test file placement must mirror the source folder structure.
- Tests for `lib/example.ts` belong under `test/<test-kind>/lib/example/`.
- When a source file needs multiple scenarios, create a folder named after that source file without
  the extension.
- Example: scenarios for `lib/apply-suggestions.ts` belong under
  `test/unit/lib/apply-suggestions/`.
- Prefer one test file per scenario instead of grouping unrelated scenarios in one file.
- A test suite must cover exactly one scenario.
- A scenario can be a success path, failure path, edge case, or regression.
- Ask for clarification before adding a scenario that does not clearly fit an existing source file,
  folder, or scenario type.

## Suite Shape

- Define the system under test as `sut`.
- Initialize `sut` inside a `beforeAll` block.
- Keep setup inside the suite that owns the scenario.
- Avoid shared mutable state across unrelated suites.
- Avoid combining multiple scenarios in one `describe`.

## Assertions

- Each `it` block must make exactly one assertion.
- Use multiple `it` blocks when a scenario needs to verify multiple outcomes.
- Do not hide multiple assertions inside helper functions.
- Test names must clearly describe what is being tested.
- Test names should state whether the scenario is a success, failure, edge case, or regression when that distinction matters.

## Naming

- Use descriptive file names that include the source behavior and scenario.
- Test file names must start with the scenario type as the first hyphen-separated token:
  `success`, `failure`, `edge-case`, or `regression`.
- Prefer names like `success-apply-suggestion-input.test.ts` over broad names like
  `apply-suggestions.test.ts`.
- Do not put the scenario type at the end of the file name.
- `describe` statements must use Gherkin-style BDD phrasing with this shape:
  `Given <context>, when <action>, then <expected outcome>`.
- Prefer suite names like
  `Given an input field with a matching suggestion, when applySuggestion runs, then it applies the replacement`.
- Prefer assertion names like `updates the input value`.

## Examples

```ts
/**
 * Test type: Unit
 * Intent: Feature
 * Subject: Applying a suggestion to valid input
 * Assertions: The operation returns the expected replacement value
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { doSomething } from '../../../../lib/example';

type Sut = {
  result: string;
};

describe('Given valid input, when doSomething runs, then it returns the expected value', () => {
  let sut: Sut;

  beforeAll(() => {
    sut = {
      result: doSomething('valid input'),
    };
  });

  it('returns the expected value', () => {
    expect(sut.result).toBe('expected value');
  });
});
```

## Current Exceptions

- None.
