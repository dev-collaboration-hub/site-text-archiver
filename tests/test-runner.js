const suites = [];
let currentSuite = null;

export function describe(name, callback) {
  const suite = { name, tests: [] };
  suites.push(suite);
  const previous = currentSuite;
  currentSuite = suite;
  callback();
  currentSuite = previous;
}

export function test(name, callback) {
  if (!currentSuite) throw new Error("test() must be called inside describe()");
  currentSuite.tests.push({ name, callback });
}

async function runTest(testCase) {
  const started = performance.now();
  try {
    await testCase.callback();
    return { ...testCase, status: "PASSED", durationMs: performance.now() - started, error: null };
  } catch (error) {
    return {
      ...testCase,
      status: "FAILED",
      durationMs: performance.now() - started,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

export async function run() {
  const output = document.querySelector("#results");
  const summary = document.querySelector("#summary");
  let passed = 0;
  let failed = 0;

  for (const suite of suites) {
    const section = document.createElement("section");
    const heading = document.createElement("h2");
    heading.textContent = suite.name;
    section.append(heading);

    for (const testCase of suite.tests) {
      const result = await runTest(testCase);
      result.status === "PASSED" ? passed++ : failed++;
      const row = document.createElement("p");
      row.className = result.status.toLowerCase();
      row.textContent = `${result.status} — ${result.name} (${result.durationMs.toFixed(2)} ms)${result.error ? `: ${result.error}` : ""}`;
      section.append(row);
    }

    output.append(section);
  }

  summary.textContent = `${passed} passed, ${failed} failed`;
  summary.className = failed === 0 ? "passed" : "failed";
}
