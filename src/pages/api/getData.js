import { kv } from "@vercel/kv";

const getAssessmentBatch = (batchId) => {
  if (batchId?.includes("vitc")) return "assess_vitc";
  else if (batchId?.includes("cl")) return "assess_clfever";
  else if (batchId?.includes("ph")) return "assess_phemeplus";
  else return "";
};


export default async function handler(request, response) {
  // Get parameters
  const { participant } = request.body;

  // Get data from id
  const dataRequest = await kv.hgetall(participant);

  // If no data found, return error
  if (!dataRequest) {
    return response.status(404).json({ error: "No data found for this ID" });
  }

  // Get workpackage stage
  const stage = dataRequest.stage;

  // Check if participant has already completed the task
  if (stage === "completed") {
    return response
      .status(204)
      .json({ error: "This ID has already completed the task" });
  }

  // Get dict that matches stages to batch names
  const stage_to_batch = dataRequest.stage_to_batch;

  // Get progress
  const progress = dataRequest[`${stage}_progress`];

  // Get claim data from batch id
  const batchId = stage_to_batch[stage];
  const claimIdsRequest = await kv.hgetall(batchId);
  const claimIds = claimIdsRequest.claim_ids;

  const claims = await Promise.all(
    claimIds.map(async (claimId) => {
      const claim = await kv.hgetall(claimId);
      claim.id = claimId;
      return claim;
    })
  );

  // Get assessement claims
  let assessmentClaims = [];
  if ("assessment" in Object.keys(dataRequest)) {
      const assessmentBatch = getAssessmentBatch(batchId);
      const assessmentRequest = await kv.hgetall(assessmentBatch);
      const assessmentClaimIds = assessmentRequest.claim_ids;

      assessmentClaims = await Promise.all(
        assessmentClaimIds.map(async (claimId) => {
          const claim = await kv.hgetall(claimId);
          claim.id = claimId;
          return claim;
        })
      );
  }

  return response.status(200).json({
    stage: stage,
    progress: progress,
    batchId: batchId,
    assessmentClaims: assessmentClaims,
    claims: claims,
  });
}
