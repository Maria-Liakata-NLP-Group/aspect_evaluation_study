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

	const {
		participant,
		index,
		caseId,
		ratings,
		comment = "",
		durationMs,
	} = body;

	const state = await loadParticipant(kv, participant);
	if (!state) {
		return { status: 404, body: { error: "No data found for this ID" } };
	}

	// Only the current case may be submitted (guards double submits and stale tabs)
	if (index !== state.progress || state.caseIds[index] !== caseId) {
		return {
			status: 409,
			body: {
				error: "Submission does not match current progress",
				progress: state.progress,
			},
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
