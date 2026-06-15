import { Document } from "../models/Document.js";
import { MatchResult } from "../models/MatchResult.js";
import { computeMatch } from "./matchService.js";

export async function recomputeMatch(poNumber) {
  const documents = await Document.find({ poNumber }).sort({ createdAt: 1 });
  const result = computeMatch(documents);

  return MatchResult.findOneAndUpdate(
    { poNumber },
    { poNumber, ...result },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}
