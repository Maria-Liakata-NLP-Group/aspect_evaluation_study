/** @format */

import kv from "@/lib/kv";
import { getParticipantState } from "@/lib/handlers.mjs";

export default async function handler(req, res) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method Not Allowed" });
	}

	try {
		const { status, body } = await getParticipantState(
			kv,
			req.body?.participant,
		);
		return res.status(status).json(body);
	} catch (error) {
		console.error("Error loading participant from Vercel KV:", error);
		return res.status(500).json({ error: "Failed to load participant data" });
	}
}
