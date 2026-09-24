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
