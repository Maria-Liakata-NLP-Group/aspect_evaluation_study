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
		assert.notEqual(
			validateSubmission({ ...validBody(), ratings }),
			null,
			`ratings ${JSON.stringify(ratings)}`,
		);
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
