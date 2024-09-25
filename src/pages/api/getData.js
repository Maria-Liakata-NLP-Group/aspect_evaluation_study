import { kv } from "@vercel/kv";

export default async function handler(request, response) {
  // Get next batchid in queue
  const batchId = await kv.lpop("queue");

  // Get claim ids in batch
  const claimIdsRequest = await kv.hgetall(batchId);
  const claimIds = claimIdsRequest.claim_ids

  const claims = await Promise.all(
    claimIds.map(async (claimId) => {
      const claim = await kv.hgetall(claimId);
      claim.id = claimId;
      return claim;
    })
  );
  
  return response.status(200).json({"claims": claims, "batchId": batchId});
}
