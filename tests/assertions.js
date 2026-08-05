export function assertTrue(value, message = "Expected value to be truthy") {
  if (!value) throw new Error(message);
}

export function assertFalse(value, message = "Expected value to be falsy") {
  if (value) throw new Error(message);
}

export function assertEqual(actual, expected, message = "Values are not equal") {
  if (!Object.is(actual, expected)) {
    throw new Error(`${message}: expected ${String(expected)}, received ${String(actual)}`);
  }
}

export function assertDeepEqual(actual, expected, message = "Values are not deeply equal") {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(`${message}: expected ${expectedJson}, received ${actualJson}`);
  }
}

export function assertResultOk(result) {
  assertTrue(result?.ok === true, `Expected success result, received ${JSON.stringify(result)}`);
}

export function assertResultError(result, expectedCode) {
  assertTrue(result?.ok === false, `Expected failure result, received ${JSON.stringify(result)}`);
  assertEqual(result.error?.code, expectedCode, "Unexpected error code");
}
