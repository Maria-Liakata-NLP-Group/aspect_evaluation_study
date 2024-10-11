import { kv } from "@vercel/kv";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }
    
    const { batchId } = req.body;
    
    if (!batchId) {
        return res.status(400).json({ error: "Missing required data" });
    }
    
    try {
        // Save the responses to Vercel KV using the participant as the key
        await kv.lpush("queue", batchId);
    
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error("Error pushing batch to queue:", error);
        return res
        .status(500)
        .json({ error: "Failed to push batch to queue." });
    }
}