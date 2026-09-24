/** @format */

import { kv } from "@vercel/kv";

export default async function handler(req, res) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method Not Allowed" });
	}

	const {
		claimId,
		workpackage,
		annotationResponse,
		participant,
		progress,
		dataLength,
	} = req.body;

	console.log("participant", participant);
	console.log("response", annotationResponse);
	console.log("progress", progress);
	console.log("claimID", claimId);
	console.log("workpackage", workpackage);

	if (
		!claimId ||
		!workpackage ||
		!participant ||
		!annotationResponse ||
		!progress ||
		!dataLength
	) {
		return res.status(400).json({ error: "Missing required data" });
	}

	try {
		// Save the responses to Vercel KV using the participant as the key
		const submission = {
			[`${claimId}`]: annotationResponse,
			[`${workpackage}_progress`]: progress,
		};
		// Update the stage if all claims have been annotated
		if (progress === dataLength) {
			switch (workpackage) {
				case "workpackage1":
					submission["stage"] = "workpackage2";
					break;
				case "workpackage2":
					submission["stage"] = "workpackage3";
					break;
				case "workpackage3":
					submission["stage"] = "completed";
					break;
			}
		}
		await kv.hset(participant, submission);

		return res.status(200).json({ success: true });
	} catch (error) {
		console.error("Error saving responses to Vercel KV:", error);
		return res
			.status(500)
			.json({ error: "Failed to save responses to Vercel KV" });
	}
}
