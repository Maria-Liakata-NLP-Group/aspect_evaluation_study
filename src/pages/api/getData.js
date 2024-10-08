import { kv } from "@vercel/kv";

const getAssessmentBatch = (batchId) => {
  if (batchId?.includes("vitc")) return "assess_vitc";
  else if (batchId?.includes("cl")) return "assess_clfever";
  else if (batchId?.includes("ph")) return "assess_phemeplus";
  else return "";
};


export default async function handler(request, response) {
  console.log("Get data pleaaaaaaase!!!!!!")
  // Get next batchid in queue
  const batchId = await kv.lpop("queue");
  console.log("batchId", batchId);
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

  // Get assessement claims
  const assessmentBatch = getAssessmentBatch(batchId);
  const assessmentRequest = await kv.hgetall(assessmentBatch);
  const assessmentClaimIds = assessmentRequest.claim_ids; 

  const assessementClaims = await Promise.all(
    assessmentClaimIds.map(async (claimId) => {
      const claim = await kv.hgetall(claimId);
      claim.id = claimId;
      return claim;
    })
  );
  
  return response.status(200).json({"claims": claims,
                                    "assessmentClaims": assessementClaims, 
                                    "batchId": batchId});
}
