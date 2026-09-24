# Chest X-Ray Report Annotation App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the legacy claim-annotation flow with a per-case chest X-ray report rating interface (7 items, 5-point Likert, optional comment, per-case timing) backed by Vercel KV / Upstash Redis.

**Architecture:** Next.js 14 pages router, single page (`src/pages/index.js`) driving a stage machine `id → loading → intro → annotation → finish`. Two thin API routes delegate to pure, dependency-injected handlers in `src/lib/handlers.mjs` (tested with an in-memory fake KV). Case content comes from the bundled `src/data/xray_cases.json`; Redis holds only participants and responses.

**Tech Stack:** Next.js 14.2 (pages router), React 18, Bulma 1.0 + Sass, `@upstash/redis`, Node 22 built-in test runner (`node --test`, no new dependencies).

**Spec:** `docs/superpowers/specs/2026-09-24-xray-annotation-design.md`

## Global Constraints

- Do **not** run `git commit` or `git add`. The user manages git; the working tree already contains uncommitted user changes. Tasks end with a verification step instead of a commit.
- No new npm dependencies.
- Scale: 5 points, labels left → right exactly: `Completely disagree`, `Disagree`, `Neither agree nor disagree`, `Agree`, `Completely agree`. No "Not applicable". All 7 items required.
- Items shown in study-plan order without aspect headings; stored as `item_1` … `item_7`.
- Redis keys: `permitted_ids` (set), `participant:{id}` (hash: `case_ids` JSON list, `progress` int), `response:{id}:{index}` (hash: `case_id`, `item_1`…`item_7`, `comment`, `duration_ms`, `submitted_at`).
- Responses keyed by position `index` in `case_ids`, never by case ID (`case_ids` may contain a duplicate).
- Forward-only navigation, no Back button.
- Code style matches repo: `/** @format */` header, tabs, double quotes, semicolons.
- Upstash `@upstash/redis` auto-deserialises JSON: `case_ids` may arrive as an array **or** a JSON string, `progress` as a number **or** a string. Handle both.

## Review Focus

1. Double-click on Next or a second open tab → second submission must get 409 and must not advance progress twice or write to the wrong index (tested in Task 2: retry after success).
2. Upstash deserialisation variance (`case_ids` array vs string, `progress` number vs string) → state loads identically (tested in Task 2).
3. Same case ID at two positions (the duplicate sample) → two separate `response:{id}:{index}` keys, neither overwritten (tested in Task 2).
4. Network failure during save → rater stays on the case, answers and comment preserved, red notification shown (manual check in Task 5).
5. Rater closes the tab mid-study and re-enters ID → resumes at first unsaved case; a completed rater lands on the finish page (tested in Task 2 via `completed`; manual check in Task 5).

---

## File Structure

| File | Responsibility |
|---|---|
| `src/lib/study.mjs` (new) | Study constants (items, scale labels) and pure helpers: `validateSubmission`, `parseCaseIds`, `findCase`. |
| `src/lib/handlers.mjs` (new) | `getParticipantState(kv, participant)`, `saveResponse(kv, body, now)`; return `{ status, body }`. No Next/Redis imports. |
| `src/lib/kv.js` (new) | Shared Upstash client instance. |
| `src/pages/api/getData.js`, `saveResponses.js` (rewrite) | Method check, call handler, map to HTTP. |
| `src/components/*.js` (new) | UI components moved out of `pages/` (files in `pages/` become routes). |
| `src/pages/index.js` (rewrite) | Stage machine, API calls, help modal. |
| `tests/*.test.mjs` (new) | Node test runner tests for `src/lib`. |

---

### Task 1: Study constants and validation helpers

**Files:**
- Create: `src/lib/study.mjs`
- Create: `tests/study.test.mjs`
- Modify: `package.json` (add `test` script)

**Interfaces:**
- Produces:
  - `LIKERT_ITEMS: string[]` (7 statements)
  - `SCALE_LABELS: string[]` (5 labels)
  - `validateSubmission(body: object): string | null` — error message or `null`
  - `parseCaseIds(value: unknown): string[] | null`
  - `findCase(cases: object[], caseId: string): object | null`

- [ ] **Step 1: Add the test script to `package.json`**

In `"scripts"`, add after `"lint"`:

```json
		"lint": "next lint",
		"test": "node --test \"tests/**/*.test.mjs\""
```

(keep the existing 4-space indentation of `package.json`; the snippet shows the key/value only.)

- [ ] **Step 2: Write the failing tests**

Create `tests/study.test.mjs`:

```js
/** @format */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
	LIKERT_ITEMS,
	SCALE_LABELS,
	validateSubmission,
	parseCaseIds,
	findCase,
} from "../src/lib/study.mjs";

const validBody = () => ({
	participant: "test_participant",
	index: 0,
	caseId: "Mimic_1",
	ratings: [1, 2, 3, 4, 5, 3, 3],
	comment: "",
	durationMs: 1234,
});

test("study has 7 items and 5 scale labels", () => {
	assert.equal(LIKERT_ITEMS.length, 7);
	assert.deepEqual(SCALE_LABELS, [
		"Completely disagree",
		"Disagree",
		"Neither agree nor disagree",
		"Agree",
		"Completely agree",
	]);
});

test("validateSubmission accepts a valid body", () => {
	assert.equal(validateSubmission(validBody()), null);
});

test("validateSubmission accepts a missing comment", () => {
	const body = validBody();
	delete body.comment;
	assert.equal(validateSubmission(body), null);
});

test("validateSubmission rejects bad ratings", () => {
	for (const ratings of [
		[1, 2, 3, 4, 5, 3],
		[1, 2, 3, 4, 5, 3, 3, 3],
		[0, 2, 3, 4, 5, 3, 3],
		[6, 2, 3, 4, 5, 3, 3],
		[2.5, 2, 3, 4, 5, 3, 3],
		["3", 2, 3, 4, 5, 3, 3],
		[null, 2, 3, 4, 5, 3, 3],
		"1234567",
		undefined,
	]) {
		assert.notEqual(validateSubmission({ ...validBody(), ratings }), null, `ratings ${JSON.stringify(ratings)}`);
	}
});

test("validateSubmission rejects missing or malformed fields", () => {
	assert.notEqual(validateSubmission(undefined), null);
	assert.notEqual(validateSubmission({ ...validBody(), participant: "" }), null);
	assert.notEqual(validateSubmission({ ...validBody(), index: -1 }), null);
	assert.notEqual(validateSubmission({ ...validBody(), index: "0" }), null);
	assert.notEqual(validateSubmission({ ...validBody(), caseId: "" }), null);
	assert.notEqual(validateSubmission({ ...validBody(), comment: 5 }), null);
	assert.notEqual(validateSubmission({ ...validBody(), durationMs: -1 }), null);
	assert.notEqual(validateSubmission({ ...validBody(), durationMs: "10" }), null);
});

test("parseCaseIds handles arrays, JSON strings and junk", () => {
	assert.deepEqual(parseCaseIds(["a", "b"]), ["a", "b"]);
	assert.deepEqual(parseCaseIds('["a", "b"]'), ["a", "b"]);
	assert.equal(parseCaseIds("not json"), null);
	assert.equal(parseCaseIds('{"a": 1}'), null);
	assert.equal(parseCaseIds(undefined), null);
});

test("findCase returns the matching case or null", () => {
	const cases = [{ case_id: "a" }, { case_id: "b" }];
	assert.deepEqual(findCase(cases, "b"), { case_id: "b" });
	assert.equal(findCase(cases, "c"), null);
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL with `Cannot find module '.../src/lib/study.mjs'`.

- [ ] **Step 4: Implement `src/lib/study.mjs`**

```js
/** @format */

// Statements shown to raters, in study-plan order (stored as item_1 ... item_7)
export const LIKERT_ITEMS = [
	"The report is clinically correct.",
	"The report does not omit clinically relevant findings visible on the X-ray.",
	"The report addresses the clinical question raised in the indication.",
	"The report clearly communicates the severity of the case.",
	"The report is concise.",
	"The report does not include information that is not relevant to the clinical question.",
	"This report would save time interpreting the X-rays and writing the report.",
];

// Scale labels from left (1) to right (5)
export const SCALE_LABELS = [
	"Completely disagree",
	"Disagree",
	"Neither agree nor disagree",
	"Agree",
	"Completely agree",
];

const isValidRatings = (ratings) =>
	Array.isArray(ratings) &&
	ratings.length === LIKERT_ITEMS.length &&
	ratings.every(
		(value) => Number.isInteger(value) && value >= 1 && value <= SCALE_LABELS.length,
	);

// Returns an error message, or null if the submission is valid
export const validateSubmission = (body) => {
	const { participant, index, caseId, ratings, comment, durationMs } = body ?? {};

	if (typeof participant !== "string" || !participant) return "Missing participant";
	if (!Number.isInteger(index) || index < 0) return "Invalid index";
	if (typeof caseId !== "string" || !caseId) return "Missing caseId";
	if (!isValidRatings(ratings)) return "Ratings must be 7 integers between 1 and 5";
	if (comment !== undefined && typeof comment !== "string") return "Invalid comment";
	if (typeof durationMs !== "number" || !Number.isFinite(durationMs) || durationMs < 0)
		return "Invalid durationMs";
	return null;
};

// Upstash may return case_ids already parsed or as a JSON string
export const parseCaseIds = (value) => {
	if (Array.isArray(value)) return value;
	if (typeof value !== "string") return null;
	try {
		const parsed = JSON.parse(value);
		return Array.isArray(parsed) ? parsed : null;
	} catch {
		return null;
	}
};

export const findCase = (cases, caseId) =>
	cases.find((xrayCase) => xrayCase.case_id === caseId) ?? null;
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test`
Expected: all tests in `tests/study.test.mjs` PASS.

---

### Task 2: Server handlers and API routes

**Files:**
- Create: `src/lib/handlers.mjs`
- Create: `src/lib/kv.js`
- Create: `tests/handlers.test.mjs`
- Rewrite: `src/pages/api/getData.js`
- Rewrite: `src/pages/api/saveResponses.js`
- Delete: `src/pages/api/addToQueue.js`, `src/pages/api/hello.js`

**Interfaces:**
- Consumes: `validateSubmission`, `parseCaseIds` from `src/lib/study.mjs`.
- Produces:
  - `getParticipantState(kv, participant) → Promise<{ status, body }>`; 200 body `{ caseIds: string[], progress: number, completed: boolean }`
  - `saveResponse(kv, body, now = new Date()) → Promise<{ status, body }>`; 200 body `{ progress: number, completed: boolean }`; 409 body `{ error, progress }`
  - `kv` must provide `sismember(key, member) → 0|1`, `hgetall(key) → object|null`, `hset(key, object)`.
  - HTTP: `POST /api/getData {participant}`, `POST /api/saveResponses {participant, index, caseId, ratings, comment, durationMs}`.

- [ ] **Step 1: Write the failing tests**

Create `tests/handlers.test.mjs`:

```js
/** @format */

import { test } from "node:test";
import assert from "node:assert/strict";
import { getParticipantState, saveResponse } from "../src/lib/handlers.mjs";

// Minimal in-memory stand-in for the Upstash client
const createFakeKv = ({ permitted = [], participants = {} } = {}) => {
	const sets = { permitted_ids: new Set(permitted) };
	const hashes = {};
	for (const [id, data] of Object.entries(participants)) {
		hashes[`participant:${id}`] = { ...data };
	}
	return {
		hashes,
		async sismember(key, member) {
			return sets[key]?.has(member) ? 1 : 0;
		},
		async hgetall(key) {
			return hashes[key] ? { ...hashes[key] } : null;
		},
		async hset(key, values) {
			hashes[key] = { ...(hashes[key] ?? {}), ...values };
			return Object.keys(values).length;
		},
	};
};

const CASE_IDS = ["c1", "c2", "c1"]; // c1 repeated, like the duplicate sample

const kvWith = (progress = 0, caseIds = JSON.stringify(CASE_IDS)) =>
	createFakeKv({
		permitted: ["p1"],
		participants: { p1: { case_ids: caseIds, progress } },
	});

const submission = (overrides = {}) => ({
	participant: "p1",
	index: 0,
	caseId: "c1",
	ratings: [5, 4, 3, 2, 1, 3, 3],
	comment: "looks fine",
	durationMs: 4200.7,
	...overrides,
});

const NOW = new Date("2026-09-24T10:00:00.000Z");

test("getParticipantState: 400 without participant", async () => {
	const { status } = await getParticipantState(kvWith(), undefined);
	assert.equal(status, 400);
});

test("getParticipantState: 404 when not permitted", async () => {
	const { status } = await getParticipantState(kvWith(), "someone_else");
	assert.equal(status, 404);
});

test("getParticipantState: 404 when permitted but no participant hash", async () => {
	const kv = createFakeKv({ permitted: ["p2"] });
	const { status } = await getParticipantState(kv, "p2");
	assert.equal(status, 404);
});

test("getParticipantState: loads JSON-string case_ids and string progress", async () => {
	const { status, body } = await getParticipantState(kvWith("1"), "p1");
	assert.equal(status, 200);
	assert.deepEqual(body, { caseIds: CASE_IDS, progress: 1, completed: false });
});

test("getParticipantState: loads already-parsed case_ids and numeric progress", async () => {
	const { body } = await getParticipantState(kvWith(0, [...CASE_IDS]), "p1");
	assert.deepEqual(body, { caseIds: CASE_IDS, progress: 0, completed: false });
});

test("getParticipantState: completed when progress reaches length", async () => {
	const { body } = await getParticipantState(kvWith(3), "p1");
	assert.equal(body.completed, true);
});

test("saveResponse: 400 on invalid ratings, nothing written", async () => {
	const kv = kvWith();
	const { status } = await saveResponse(kv, submission({ ratings: [1, 2, 3] }), NOW);
	assert.equal(status, 400);
	assert.equal(kv.hashes["response:p1:0"], undefined);
});

test("saveResponse: 404 for unknown participant", async () => {
	const { status } = await saveResponse(kvWith(), submission({ participant: "nope" }), NOW);
	assert.equal(status, 404);
});

test("saveResponse: 409 when index is not the current progress", async () => {
	const kv = kvWith(0);
	const { status, body } = await saveResponse(kv, submission({ index: 1, caseId: "c2" }), NOW);
	assert.equal(status, 409);
	assert.equal(body.progress, 0);
	assert.equal(kv.hashes["participant:p1"].progress, 0);
});

test("saveResponse: 409 when caseId does not match the case at index", async () => {
	const { status } = await saveResponse(kvWith(0), submission({ caseId: "c2" }), NOW);
	assert.equal(status, 409);
});

test("saveResponse: writes the response and advances progress", async () => {
	const kv = kvWith(0);
	const { status, body } = await saveResponse(kv, submission(), NOW);
	assert.equal(status, 200);
	assert.deepEqual(body, { progress: 1, completed: false });
	assert.deepEqual(kv.hashes["response:p1:0"], {
		case_id: "c1",
		item_1: 5,
		item_2: 4,
		item_3: 3,
		item_4: 2,
		item_5: 1,
		item_6: 3,
		item_7: 3,
		comment: "looks fine",
		duration_ms: 4201,
		submitted_at: "2026-09-24T10:00:00.000Z",
	});
	assert.equal(kv.hashes["participant:p1"].progress, 1);
});

test("saveResponse: missing comment is stored as empty string", async () => {
	const kv = kvWith(0);
	const body = submission();
	delete body.comment;
	await saveResponse(kv, body, NOW);
	assert.equal(kv.hashes["response:p1:0"].comment, "");
});

test("saveResponse: retrying an accepted submission returns 409 and does not double-advance", async () => {
	const kv = kvWith(0);
	await saveResponse(kv, submission(), NOW);
	const retry = await saveResponse(kv, submission(), NOW);
	assert.equal(retry.status, 409);
	assert.equal(kv.hashes["participant:p1"].progress, 1);
});

test("saveResponse: duplicate case at two positions gets two separate keys", async () => {
	const kv = kvWith(0);
	await saveResponse(kv, submission({ ratings: [1, 1, 1, 1, 1, 1, 1] }), NOW);
	await saveResponse(kv, submission({ index: 1, caseId: "c2" }), NOW);
	const last = await saveResponse(kv, submission({ index: 2, ratings: [5, 5, 5, 5, 5, 5, 5] }), NOW);
	assert.deepEqual(last.body, { progress: 3, completed: true });
	assert.equal(kv.hashes["response:p1:0"].item_1, 1);
	assert.equal(kv.hashes["response:p1:2"].item_1, 5);
	assert.equal(kv.hashes["response:p1:0"].case_id, "c1");
	assert.equal(kv.hashes["response:p1:2"].case_id, "c1");
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL with `Cannot find module '.../src/lib/handlers.mjs'`.

- [ ] **Step 3: Implement `src/lib/handlers.mjs`**

```js
/** @format */

import { parseCaseIds, validateSubmission } from "./study.mjs";

// Returns { caseIds, progress } for a permitted participant, otherwise null
const loadParticipant = async (kv, participant) => {
	const permitted = await kv.sismember("permitted_ids", participant);
	if (!permitted) return null;

	const data = await kv.hgetall(`participant:${participant}`);
	if (!data) return null;

	const caseIds = parseCaseIds(data.case_ids);
	if (!caseIds) return null;

	return { caseIds, progress: Number(data.progress ?? 0) };
};

export const getParticipantState = async (kv, participant) => {
	if (typeof participant !== "string" || !participant) {
		return { status: 400, body: { error: "Missing participant" } };
	}

	const state = await loadParticipant(kv, participant);
	if (!state) {
		return { status: 404, body: { error: "No data found for this ID" } };
	}

	return {
		status: 200,
		body: { ...state, completed: state.progress >= state.caseIds.length },
	};
};

export const saveResponse = async (kv, body, now = new Date()) => {
	const error = validateSubmission(body);
	if (error) return { status: 400, body: { error } };

	const { participant, index, caseId, ratings, comment = "", durationMs } = body;

	const state = await loadParticipant(kv, participant);
	if (!state) {
		return { status: 404, body: { error: "No data found for this ID" } };
	}

	// Only the current case may be submitted (guards double submits and stale tabs)
	if (index !== state.progress || state.caseIds[index] !== caseId) {
		return {
			status: 409,
			body: { error: "Submission does not match current progress", progress: state.progress },
		};
	}

	const response = { case_id: caseId };
	ratings.forEach((value, i) => {
		response[`item_${i + 1}`] = value;
	});
	response.comment = comment;
	response.duration_ms = Math.round(durationMs);
	response.submitted_at = now.toISOString();

	// Response first, then progress: a crash in between is safe, the retry overwrites the same key
	await kv.hset(`response:${participant}:${index}`, response);
	const progress = index + 1;
	await kv.hset(`participant:${participant}`, { progress });

	return {
		status: 200,
		body: { progress, completed: progress >= state.caseIds.length },
	};
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: all tests in `tests/study.test.mjs` and `tests/handlers.test.mjs` PASS.

- [ ] **Step 5: Create `src/lib/kv.js`**

```js
/** @format */

import { Redis } from "@upstash/redis";

const kv = new Redis({
	url: process.env.KV_REST_API_URL,
	token: process.env.KV_REST_API_TOKEN,
});

export default kv;
```

- [ ] **Step 6: Rewrite `src/pages/api/getData.js`**

```js
/** @format */

import kv from "@/lib/kv";
import { getParticipantState } from "@/lib/handlers.mjs";

export default async function handler(req, res) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method Not Allowed" });
	}

	try {
		const { status, body } = await getParticipantState(kv, req.body?.participant);
		return res.status(status).json(body);
	} catch (error) {
		console.error("Error loading participant from Vercel KV:", error);
		return res.status(500).json({ error: "Failed to load participant data" });
	}
}
```

- [ ] **Step 7: Rewrite `src/pages/api/saveResponses.js`**

```js
/** @format */

import kv from "@/lib/kv";
import { saveResponse } from "@/lib/handlers.mjs";

export default async function handler(req, res) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method Not Allowed" });
	}

	try {
		const { status, body } = await saveResponse(kv, req.body);
		return res.status(status).json(body);
	} catch (error) {
		console.error("Error saving response to Vercel KV:", error);
		return res.status(500).json({ error: "Failed to save response" });
	}
}
```

- [ ] **Step 8: Delete unused API routes**

Run: `rm src/pages/api/addToQueue.js src/pages/api/hello.js`

- [ ] **Step 9: Verify**

Run: `npm test`
Expected: PASS. (`next build` is verified in Task 5 once the UI no longer depends on the legacy API shape.)

---

### Task 3: Static UI components (navbar, instructions, intro, ID entry)

**Files:**
- Create: `src/components/navbar.js`
- Create: `src/components/guidelines.js`
- Create: `src/components/intro.js`
- Create: `src/components/enterID.js`

**Interfaces:**
- Produces:
  - `<Navbar clickOnHelp={() => void} />`
  - `<Guidelines />` (no props)
  - `<Intro progress={number} totalCases={number} onStart={() => void} />`
  - `<EnterID nextButtonFunction={(id: string) => void} />`

The legacy files in `src/pages/` stay in place until Task 5 so the app keeps compiling between tasks.

- [ ] **Step 1: Create `src/components/navbar.js`**

```js
/** @format */

const Navbar = ({ clickOnHelp }) => {
	return (
		<nav className="navbar is-dark is-flex">
			<div className="navbar-brand is-flex-grow-1">
				<span className="tag p-5 m-2 is-logo">
					<h1 className="is-size-5-desktop is-size-7-mobile">
						Radiology Report Rating
					</h1>
				</span>
			</div>
			<div className="navbar-end">
				<span
					className="is-size-5-desktop is-size-7-mobile tag link p-5 m-2"
					onClick={clickOnHelp}
				>
					Instructions
				</span>
			</div>
		</nav>
	);
};

export default Navbar;
```

- [ ] **Step 2: Create `src/components/guidelines.js`**

Rater instructions from the study plan with the two "Not applicable" sentences removed (spec, "Instructions text"). Use HTML entities for quotes/apostrophes to satisfy `react/no-unescaped-entities`.

```js
/** @format */

const Guidelines = () => {
	return (
		<div className="content">
			<p>
				Imagine the following scenario. A referring clinician has requested a
				chest X-ray for one of their patients, providing a short clinical
				indication explaining what they want examined. You are the radiologist
				receiving the request. Once the X-ray has been taken, it is uploaded to
				your practice&apos;s system, which automatically generates a draft
				report.
			</p>
			<p>
				We are evaluating how useful these AI-generated reports are and whether
				they meet the requirements radiologists have for a good report. Through
				interviews with radiologists, we have identified seven such
				requirements. Your task is to rate each report against these seven
				requirements.
			</p>
			<h3>What you will see for each case</h3>
			<ul>
				<li>The clinical indication provided by the referring clinician.</li>
				<li>The frontal and lateral X-ray images.</li>
				<li>The AI-generated report.</li>
			</ul>
			<h3>What you will do</h3>
			<p>
				For each report, rate your agreement with seven statements on a
				5-point Likert scale from Completely disagree (1) to Completely agree
				(5). An optional free-text comment box is provided if you want to
				explain your reasoning or flag anything unusual.
			</p>
			<h3>Definitions to keep consistent across raters</h3>
			<ul>
				<li>
					The referring clinician is the doctor who ordered the X-ray. In this
					study, cases come from a US teaching hospital&apos;s emergency and
					inpatient services rather than primary care, so the referrer is
					typically a hospital physician.
				</li>
				<li>
					The clinical question is the reason for the X-ray as stated or
					implied in the indication.
				</li>
				<li>
					Six of the seven items ask you to evaluate the report itself. The
					final item (&ldquo;would save the referring clinician time&rdquo;)
					asks you to consider how the report would function in clinical use.
				</li>
			</ul>
			<p>
				Please rate each report based on your own clinical judgment of what
				the case requires, rather than by comparison to any specific reference
				report. Take the time you need &mdash; there is no time pressure
				&mdash; but try to rate each case in one sitting to keep your judgments
				consistent.
			</p>
			<p>
				Your ratings will be used to evaluate the AI system and to refine our
				evaluation framework. Individual ratings will not be shared outside the
				research team.
			</p>
			<p>Thank you for your time.</p>
		</div>
	);
};

export default Guidelines;
```

- [ ] **Step 3: Create `src/components/intro.js`**

```js
/** @format */

import Guidelines from "./guidelines";

const Intro = ({ progress, totalCases, onStart }) => {
	return (
		<section className="section narrow-page">
			<h1 className="title mt-2">Welcome to the Radiology Rating Study</h1>
			<p className="mb-4">
				{progress > 0
					? `Welcome back. You have rated ${progress} of ${totalCases} cases and will continue where you left off.`
					: `There are ${totalCases} cases to rate.`}{" "}
				Your progress is saved after every case, so you can take a break at any
				time.
			</p>
			<p className="mb-4">
				Please read the instructions below carefully. You can bring them up
				again at any time by clicking Instructions in the top right corner.
			</p>
			<div className="box">
				<Guidelines />
			</div>
			<button
				className="button is-link"
				onClick={onStart}
			>
				{progress > 0 ? "Continue" : "Start"}
			</button>
		</section>
	);
};

export default Intro;
```

- [ ] **Step 4: Create `src/components/enterID.js`**

Same behaviour as the legacy page (including `?ID=` prefill), trimmed input, Enter key submits.

```js
/** @format */

import { useState, useEffect } from "react";
import { useRouter } from "next/router";

const EnterID = ({ nextButtonFunction }) => {
	const [id, setId] = useState("");
	const router = useRouter();

	const handleSubmit = (event) => {
		event.preventDefault();
		const trimmedId = id.trim();
		if (trimmedId) {
			nextButtonFunction(trimmedId);
		} else {
			alert("Please enter your ID");
		}
	};

	// Set ID from query parameters
	useEffect(() => {
		if (router.isReady && router.query.ID) {
			setId(router.query.ID);
		}
	}, [router.isReady, router.query]);

	return (
		<section className="section narrow-page">
			<h1 className="title mt-2">Welcome to the Radiology Rating Study.</h1>
			<p className="mt-4">Please enter your ID in the field below.</p>
			<form onSubmit={handleSubmit}>
				<div className="field mt-2 mb-5">
					<label
						className="label"
						htmlFor="participant-id"
					>
						ID
					</label>
					<div className="control">
						<input
							id="participant-id"
							className="input"
							type="text"
							value={id}
							placeholder="Enter your ID"
							onChange={(event) => setId(event.target.value)}
						/>
					</div>
				</div>
				<button
					className="button mt-4"
					type="submit"
				>
					Next
				</button>
			</form>
		</section>
	);
};

export default EnterID;
```

- [ ] **Step 5: Verify**

Run: `npx eslint src/components`
Expected: no errors.

---

### Task 4: Annotation page (Likert items, image viewer, panel, styles)

**Files:**
- Create: `src/components/likertItem.js`
- Create: `src/components/imageModal.js`
- Create: `src/components/annotationPanel.js`
- Modify: `src/styles/global.scss`

**Interfaces:**
- Consumes: `LIKERT_ITEMS`, `SCALE_LABELS` from `@/lib/study.mjs`.
- Produces:
  - `<AnnotationPanel caseData={{ case_id, indication, images: { frontal, lateral }, report }} caseNumber={number} totalCases={number} onSubmit={({ ratings: number[], comment: string, durationMs: number }) => Promise<void>} />`
  - `onSubmit` rejects (throws) on save failure; the panel then shows the error and keeps its inputs. The parent must render the panel with `key={index}` so state and timer reset per case.

- [ ] **Step 1: Create `src/components/likertItem.js`**

```js
/** @format */

import { SCALE_LABELS } from "@/lib/study.mjs";

const LikertItem = ({ number, statement, value, onChange, disabled }) => {
	return (
		<fieldset className="likert-item">
			<legend className="has-text-weight-semibold mb-3">
				{number}. {statement}
			</legend>
			<div className="likert-scale">
				{SCALE_LABELS.map((label, i) => {
					const score = i + 1;
					return (
						<label
							key={score}
							className={`likert-option ${value === score ? "is-selected" : ""}`}
						>
							<input
								type="radio"
								name={`item_${number}`}
								value={score}
								checked={value === score}
								onChange={() => onChange(score)}
								disabled={disabled}
							/>
							<span>{label}</span>
						</label>
					);
				})}
			</div>
		</fieldset>
	);
};

export default LikertItem;
```

- [ ] **Step 2: Create `src/components/imageModal.js`**

```js
/** @format */

import { useEffect } from "react";

// Full-screen image viewer; closes with ×, Esc or a click on the background
const ImageModal = ({ src, alt, onClose }) => {
	useEffect(() => {
		if (!src) return;
		const handleKeyDown = (event) => {
			if (event.key === "Escape") onClose();
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [src, onClose]);

	return (
		<div className={`modal ${src ? "is-active" : ""}`}>
			<div
				className="modal-background"
				onClick={onClose}
			></div>
			<div className="modal-content image-modal-content">
				{/* eslint-disable-next-line @next/next/no-img-element */}
				{src && <img src={src} alt={alt} />}
			</div>
			<button
				className="modal-close is-large"
				aria-label="close"
				onClick={onClose}
			></button>
		</div>
	);
};

export default ImageModal;
```

- [ ] **Step 3: Create `src/components/annotationPanel.js`**

```js
/** @format */

import { useState, useRef, useCallback } from "react";
import ImageModal from "./imageModal";
import LikertItem from "./likertItem";
import { LIKERT_ITEMS } from "@/lib/study.mjs";

const VIEWS = ["frontal", "lateral"];

const AnnotationPanel = ({ caseData, caseNumber, totalCases, onSubmit }) => {
	const [ratings, setRatings] = useState(LIKERT_ITEMS.map(() => null));
	const [comment, setComment] = useState("");
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const [enlargedView, setEnlargedView] = useState(null);
	const startTime = useRef(Date.now()); // Panel is remounted per case, so this is the case start

	const allAnswered = ratings.every((rating) => rating !== null);
	const closeModal = useCallback(() => setEnlargedView(null), []);

	const setRating = (itemIndex, score) => {
		setRatings((previous) =>
			previous.map((rating, i) => (i === itemIndex ? score : rating)),
		);
	};

	const handleNext = async () => {
		if (!allAnswered || saving) return;
		setSaving(true);
		setError("");
		try {
			await onSubmit({
				ratings,
				comment,
				durationMs: Date.now() - startTime.current,
			});
		} catch (submitError) {
			console.error("Error saving response:", submitError);
			setError(
				"Could not save your response. Please check your connection and try again.",
			);
		} finally {
			setSaving(false);
		}
	};

	return (
		<section className="section">
			<h1 className="title mb-3">
				Case {caseNumber} / {totalCases}
			</h1>
			<progress
				className="progress is-small is-link"
				value={caseNumber - 1}
				max={totalCases}
			/>

			<div className="box">
				<h2 className="subtitle mb-2">Clinical indication</h2>
				<p>{caseData.indication}</p>
			</div>

			<div className="columns">
				{VIEWS.map((view) => (
					<div
						className="column"
						key={view}
					>
						<button
							type="button"
							className="xray-button"
							onClick={() => setEnlargedView(view)}
						>
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img
								src={caseData.images[view]}
								alt={`${view} chest X-ray`}
							/>
						</button>
						<p className="xray-caption">{view} (click to enlarge)</p>
					</div>
				))}
			</div>

			<div className="box">
				<h2 className="subtitle mb-2">AI-generated report</h2>
				<p className="report-text">{caseData.report}</p>
			</div>

			<div className="box">
				<h2 className="subtitle">
					How much do you agree with the following statements?
				</h2>
				{LIKERT_ITEMS.map((statement, i) => (
					<LikertItem
						key={statement}
						number={i + 1}
						statement={statement}
						value={ratings[i]}
						onChange={(score) => setRating(i, score)}
						disabled={saving}
					/>
				))}
			</div>

			<div className="field">
				<label
					className="label"
					htmlFor="comment"
				>
					Comment (optional)
				</label>
				<textarea
					id="comment"
					className="textarea"
					rows={3}
					value={comment}
					onChange={(event) => setComment(event.target.value)}
					disabled={saving}
				/>
			</div>

			{error && <div className="notification is-danger">{error}</div>}

			<button
				className={`button is-link ${saving ? "is-loading" : ""}`}
				onClick={handleNext}
				disabled={!allAnswered || saving}
			>
				Next
			</button>
			{!allAnswered && (
				<p className="help">Please rate all 7 statements to continue.</p>
			)}

			<ImageModal
				src={enlargedView ? caseData.images[enlargedView] : null}
				alt={enlargedView ? `${enlargedView} chest X-ray` : ""}
				onClose={closeModal}
			/>
		</section>
	);
};

export default AnnotationPanel;
```

- [ ] **Step 4: Update `src/styles/global.scss`**

Replace the `main { max-width: 800px; margin: auto; }` block with:

```scss
main {
  max-width: 1200px;
  margin: auto;
}

.narrow-page {
  max-width: 800px;
  margin: 0 auto;
}
```

Append at the end of the file:

```scss
.xray-button {
  display: block;
  width: 100%;
  padding: 0;
  border: 0;
  border-radius: var(--bulma-radius);
  overflow: hidden;
  background: #000;
  cursor: zoom-in;

  img {
    display: block;
    width: 100%;
    height: 60vh;
    object-fit: contain;
  }
}

.xray-caption {
  margin-top: 0.5rem;
  text-align: center;
  text-transform: capitalize;
}

.report-text {
  white-space: pre-wrap;
}

.likert-item {
  padding: 1rem 0;
  border-top: 1px solid var(--bulma-border);

  &:first-of-type {
    border-top: 0;
  }
}

.likert-scale {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.5rem;

  @media screen and (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.likert-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem;
  border: 1px solid var(--bulma-border);
  border-radius: var(--bulma-radius);
  font-size: 0.875rem;
  text-align: center;
  cursor: pointer;

  &.is-selected {
    border-color: var(--bulma-link);
    box-shadow: inset 0 0 0 1px var(--bulma-link);
  }
}

.modal-content.image-modal-content {
  width: auto;
  max-width: 95vw;

  img {
    display: block;
    width: auto;
    max-height: 95vh;
    margin: auto;
  }
}
```

- [ ] **Step 5: Verify**

Run: `npx eslint src/components`
Expected: no errors.

---

### Task 5: Wire up `index.js`, remove legacy code, verify end to end

**Files:**
- Rewrite: `src/pages/index.js`
- Delete: `src/pages/annotation.js`, `src/pages/enterID.js`, `src/pages/intro.js`, `src/pages/successfulAssessment.js`, `src/pages/components/` (whole directory), `public/images/guidelines_flowchart.png`

**Interfaces:**
- Consumes: all components from Tasks 3–4; `findCase` from `@/lib/study.mjs`; API contracts from Task 2.

- [ ] **Step 1: Rewrite `src/pages/index.js`**

```js
/** @format */

import { useState, useEffect } from "react";
import Head from "next/head";
import AnnotationPanel from "@/components/annotationPanel";
import EnterID from "@/components/enterID";
import Guidelines from "@/components/guidelines";
import Intro from "@/components/intro";
import Navbar from "@/components/navbar";
import xrayCases from "@/data/xray_cases.json";
import { findCase } from "@/lib/study.mjs";

const postJson = async (url, body) => {
	const response = await fetch(url, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
	const result = await response.json().catch(() => ({}));
	return { status: response.status, ok: response.ok, result };
};

export default function Home() {
	const [participant, setParticipant] = useState("");
	const [stage, setStage] = useState("id"); // id, loading, intro, annotation, finish
	const [caseIds, setCaseIds] = useState([]); // Case order for this participant
	const [progress, setProgress] = useState(0); // Number of submitted cases = index of current case
	const [showHelp, setShowHelp] = useState(false); // Display instructions in a modal

	// Scroll to top when stage or case changes
	useEffect(() => {
		window.scrollTo({ top: 0, behavior: "smooth" });
	}, [stage, progress]);

	const applyState = (state) => {
		setCaseIds(state.caseIds);
		setProgress(state.progress);
		if (state.completed) setStage("finish");
	};

	const proceedFromID = async (id) => {
		setStage("loading");
		try {
			const { status, ok, result } = await postJson("/api/getData", {
				participant: id,
			});
			if (status === 404) {
				alert("ID not recognised. Please check your ID.");
				setStage("id");
				return;
			}
			if (!ok) {
				throw new Error(result.error || `Unexpected response status: ${status}`);
			}
			setParticipant(id);
			setStage("intro");
			applyState(result);
		} catch (error) {
			console.error("Error fetching participant data:", error);
			alert("Could not load your data. Please try again.");
			setStage("id");
		}
	};

	// Called by AnnotationPanel; throws on failure so the panel keeps its inputs
	const submitResponse = async ({ ratings, comment, durationMs }) => {
		const { status, ok, result } = await postJson("/api/saveResponses", {
			participant,
			index: progress,
			caseId: caseIds[progress],
			ratings,
			comment,
			durationMs,
		});

		// Out of sync (double submit, other tab): reload state and show the correct case
		if (status === 409) {
			const refreshed = await postJson("/api/getData", { participant });
			if (!refreshed.ok) throw new Error("Failed to reload participant state");
			applyState(refreshed.result);
			return;
		}
		if (!ok) {
			throw new Error(result.error || `Unexpected response status: ${status}`);
		}

		setProgress(result.progress);
		if (result.completed) setStage("finish");
	};

	const getStagePage = () => {
		if (stage === "id") {
			return <EnterID nextButtonFunction={proceedFromID} />;
		} else if (stage === "loading") {
			return (
				<section className="section narrow-page">
					<h1 className="title">Loading...</h1>
				</section>
			);
		} else if (stage === "intro") {
			return (
				<Intro
					progress={progress}
					totalCases={caseIds.length}
					onStart={() => setStage("annotation")}
				/>
			);
		} else if (stage === "annotation") {
			const caseId = caseIds[progress];
			const caseData = findCase(xrayCases, caseId);
			if (!caseData) {
				return (
					<section className="section narrow-page">
						<div className="notification is-danger">
							Case {caseId} could not be found. Please contact the research
							team.
						</div>
					</section>
				);
			}
			return (
				<AnnotationPanel
					key={progress}
					caseData={caseData}
					caseNumber={progress + 1}
					totalCases={caseIds.length}
					onSubmit={submitResponse}
				/>
			);
		} else if (stage === "finish") {
			return (
				<section className="section narrow-page">
					<h1 className="title">Thank you!</h1>
					<p>You have rated all cases. You can close this window.</p>
				</section>
			);
		}
	};

	return (
		<>
			<Head>
				<title>Radiology Report Rating</title>
				<meta
					name="description"
					content="Rating study for AI-generated chest X-ray reports"
				/>
				<meta
					name="viewport"
					content="width=device-width, initial-scale=1"
				/>
				<link
					rel="icon"
					href="/favicon.ico"
				/>
			</Head>
			<Navbar clickOnHelp={() => setShowHelp(true)} />

			<div className={`modal ${showHelp ? "is-active" : ""}`}>
				<div
					className="modal-background"
					onClick={() => setShowHelp(false)}
				></div>
				<div className="modal-content">
					<div className="box">
						<Guidelines />
					</div>
				</div>
				<button
					className="modal-close is-large"
					aria-label="close"
					onClick={() => setShowHelp(false)}
				></button>
			</div>

			<main>{getStagePage()}</main>
		</>
	);
}
```

Note on `proceedFromID`: `setStage("intro")` comes before `applyState` so that a completed participant's `applyState` overrides it with `"finish"` (React batches both updates; last write wins).

- [ ] **Step 2: Delete legacy files**

Run:
```bash
rm src/pages/annotation.js src/pages/enterID.js src/pages/intro.js src/pages/successfulAssessment.js public/images/guidelines_flowchart.png
rm -r src/pages/components
```

- [ ] **Step 3: Check nothing references removed files**

Run: `grep -rnE "countDown|explanationInput|successfulAssessment|guidelines_flowchart|addToQueue|pages/components|workpackage|claim" src`
Expected: no output.

- [ ] **Step 4: Run tests, lint and build**

Run: `npm test && npm run lint && npm run build`
Expected: tests PASS, lint reports no errors, build succeeds and lists only `/`, `/404`, `/api/getData`, `/api/saveResponses` (plus Next internals) as routes.

- [ ] **Step 5: Manual end-to-end check**

Requires `.env.local` with KV credentials and `test_participant` created via the notebook. Submitting writes real `response:test_participant:*` keys; reset afterwards with `delete_participant` + `add_participant` in the notebook.

Run: `npm run dev`, open `http://localhost:3000`, and check:
- Unknown ID → "ID not recognised" alert, stays on ID page.
- `?ID=test_participant` pre-fills the field; Enter submits.
- Intro shows total case count = length of `case_ids`; Start leads to "Case 1 / N".
- Both images render; clicking opens full-screen; Esc, × and background click close it.
- Next is disabled until all 7 items answered; hint text visible meanwhile.
- Submit two cases; reload the page, re-enter ID → intro says "rated 2 of N", Continue shows "Case 3 / N".
- In DevTools → Network, set "Offline", answer and click Next → red notification, answers and comment still there; go back online, click Next → advances.
- Help ("Instructions") modal opens and closes.

---

### Task 6: Notebook export cell

**Files:**
- Modify: `data_prep/handle_vercel_kv.ipynb` (insert one code cell directly after the cell defining `add_participant` / `delete_participant`; do not modify other cells)

**Interfaces:**
- Consumes: `r` (redis client) and `convert_from_byte` from earlier notebook cells; key layout from Task 2.
- Produces: `export_responses(participant_id) -> pd.DataFrame`, writes `{participant_id}_responses.csv` in `data_prep/` (git-ignored by `/data_prep/*.csv`).

- [ ] **Step 1: Insert the cell**

Use the NotebookEdit tool (`edit_mode: "insert"`, `cell_type: "code"`, after the `add_participant`/`delete_participant` cell) with this source:

```python
# Export all submitted responses of a participant to csv
def export_responses(participant_id):
    participant = convert_from_byte(r.hgetall(f"participant:{participant_id}"))
    case_ids = json.loads(participant["case_ids"])

    rows = []
    for index in range(len(case_ids)):
        response = r.hgetall(f"response:{participant_id}:{index}")
        if not response:
            continue
        rows.append({"index": index, **convert_from_byte(response)})

    columns = ["index", "case_id"] + [f"item_{i}" for i in range(1, 8)] + ["comment", "duration_ms", "submitted_at"]
    df = pd.DataFrame(rows, columns=columns)
    for column in [f"item_{i}" for i in range(1, 8)] + ["duration_ms"]:
        df[column] = pd.to_numeric(df[column])
    # Flag the second occurrence of the duplicated case (within-rater consistency check)
    df["is_repeat"] = df.duplicated("case_id")

    print(f"{len(df)} of {len(case_ids)} responses found for {participant_id}.")
    df.to_csv(f"{participant_id}_responses.csv", index=False)
    return df
```

- [ ] **Step 2: Verify**

Run: `python3 -c "import json; nb=json.load(open('data_prep/handle_vercel_kv.ipynb')); print(sum('def export_responses' in ''.join(c['source']) for c in nb['cells']))"`
Expected: `1`. (Running the cell against Redis is done by the researcher after the manual check in Task 5.)
