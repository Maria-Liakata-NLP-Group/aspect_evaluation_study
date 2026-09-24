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
	const { status } = await saveResponse(
		kv,
		submission({ ratings: [1, 2, 3] }),
		NOW,
	);
	assert.equal(status, 400);
	assert.equal(kv.hashes["response:p1:0"], undefined);
});

test("saveResponse: 404 for unknown participant", async () => {
	const { status } = await saveResponse(
		kvWith(),
		submission({ participant: "nope" }),
		NOW,
	);
	assert.equal(status, 404);
});

test("saveResponse: 409 when index is not the current progress", async () => {
	const kv = kvWith(0);
	const { status, body } = await saveResponse(
		kv,
		submission({ index: 1, caseId: "c2" }),
		NOW,
	);
	assert.equal(status, 409);
	assert.equal(body.progress, 0);
	assert.equal(kv.hashes["participant:p1"].progress, 0);
});

test("saveResponse: 409 when caseId does not match the case at index", async () => {
	const { status } = await saveResponse(
		kvWith(0),
		submission({ caseId: "c2" }),
		NOW,
	);
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
	const last = await saveResponse(
		kv,
		submission({ index: 2, ratings: [5, 5, 5, 5, 5, 5, 5] }),
		NOW,
	);
	assert.deepEqual(last.body, { progress: 3, completed: true });
	assert.equal(kv.hashes["response:p1:0"].item_1, 1);
	assert.equal(kv.hashes["response:p1:2"].item_1, 5);
	assert.equal(kv.hashes["response:p1:0"].case_id, "c1");
	assert.equal(kv.hashes["response:p1:2"].case_id, "c1");
});
