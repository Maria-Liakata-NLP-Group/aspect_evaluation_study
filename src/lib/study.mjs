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
		(value) =>
			Number.isInteger(value) && value >= 1 && value <= SCALE_LABELS.length,
	);

// Returns an error message, or null if the submission is valid
export const validateSubmission = (body) => {
	const { participant, index, caseId, ratings, comment, durationMs } =
		body ?? {};

	if (typeof participant !== "string" || !participant)
		return "Missing participant";
	if (!Number.isInteger(index) || index < 0) return "Invalid index";
	if (typeof caseId !== "string" || !caseId) return "Missing caseId";
	if (!isValidRatings(ratings))
		return "Ratings must be 7 integers between 1 and 5";
	if (comment !== undefined && typeof comment !== "string")
		return "Invalid comment";
	if (
		typeof durationMs !== "number" ||
		!Number.isFinite(durationMs) ||
		durationMs < 0
	)
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
