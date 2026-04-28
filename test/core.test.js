const test = require('node:test');
const assert = require('node:assert/strict');
const { solveOptimalSamples } = require('../api/algorithm');
const { evaluateCoverage, normalizeGroups, verifyCoverageOrThrow } = require('../api/verify-core');
const solveHandler = require('../api/solve');
const filesHandler = require('../api/files');
const { readDbFile, deleteDbFile } = require('../cli/src/db');

function mockResponse() {
  return {
    statusCode: 200,
    payload: null,
    headers: {},
    setHeader(key, value) {
      this.headers[key] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.payload = body;
      return this;
    },
    end() {
      return this;
    }
  };
}

test('exact solver returns valid minimum for classic small case', () => {
  const samples = [1, 2, 3, 4, 5, 6, 7, 8];
  const result = solveOptimalSamples(45, 8, 6, 6, 5, 1, samples, 'balanced');
  const check = evaluateCoverage(result.samples, result.groups, 6, 5, 1);

  assert.equal(result.method, 'backtrack');
  assert.equal(result.count, 4);
  assert.equal(check.passed, true);
  assert.equal(check.satisfied, check.total);
});

test('balanced heuristic completes at least one construction after heavy precompute', () => {
  const samples = [1, 3, 9, 11, 14, 15, 18, 21, 22, 23, 29, 33, 34, 35, 36, 39];
  const result = solveOptimalSamples(45, 16, 6, 6, 4, 1, samples, 'balanced');
  const check = evaluateCoverage(result.samples, result.groups, 6, 4, 1);

  assert.equal(result.method, 'grasp');
  assert.ok(result.count > 0);
  assert.equal(check.passed, true);
});

test('heuristic returns feasible non-empty covers across varied sample sets', () => {
  const cases = [
    { m: 45, n: 16, k: 6, j: 6, s: 4, samples: [1, 3, 9, 11, 14, 15, 18, 21, 22, 23, 29, 33, 34, 35, 36, 39] },
    { m: 45, n: 16, k: 6, j: 6, s: 4, samples: Array.from({ length: 16 }, (_, i) => i + 1) },
    { m: 50, n: 16, k: 6, j: 5, s: 4, samples: [2, 4, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 50] }
  ];

  for (const c of cases) {
    const result = solveOptimalSamples(c.m, c.n, c.k, c.j, c.s, 1, c.samples, 'balanced');
    const check = evaluateCoverage(result.samples, result.groups, c.j, c.s, 1);
    assert.ok(result.count > 0, `expected non-empty cover for ${JSON.stringify(c.samples)}`);
    assert.equal(check.passed, true);
  }
});

test('verify rejects incomplete candidate groups', () => {
  assert.throws(
    () => verifyCoverageOrThrow([1, 2, 3, 4, 5, 6, 7], [[1, 2, 3, 4, 5, 6]], 6, 5, 5, 1),
    /do not satisfy coverage/
  );
});

test('verify rejects non-numeric group injection payloads', () => {
  assert.throws(
    () => normalizeGroups([[1, 2, 3, 4, 5, '<img src=x onerror=alert(1)>']]),
    /group values must be positive integers/
  );
});

test('solve API rejects forged precomputed saves before persistence', async () => {
  const originalError = console.error;
  console.error = () => {};
  const req = {
    method: 'POST',
    body: {
      m: 45,
      n: 7,
      k: 6,
      j: 5,
      s: 5,
      atLeast: 1,
      samples: [1, 2, 3, 4, 5, 6, 7],
      save: true,
      precomputed: {
        samples: [1, 2, 3, 4, 5, 6, 7],
        groups: [[1, 2, 3, 4, 5, 6]],
        count: 1,
        method: 'unknown'
      }
    }
  };
  const res = mockResponse();

  try {
    await solveHandler(req, res);
  } finally {
    console.error = originalError;
  }

  assert.equal(res.statusCode, 400);
  assert.match(res.payload.error, /do not satisfy coverage/);
});

test('local DB rejects path traversal filenames', () => {
  assert.throws(() => readDbFile('../secret'), /Invalid DB file name/);
  assert.throws(() => deleteDbFile('45-8-6-6-5-1-4.json'), /Invalid DB file name/);
});

test('files API degrades gracefully when cloud history is unavailable', async () => {
  const req = { method: 'GET' };
  const res = mockResponse();

  await filesHandler(req, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.payload.files, []);
  assert.equal(res.payload.unavailable, true);
});
