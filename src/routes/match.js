import express from "express";
import { Document } from "../models/Document.js";
import { MatchResult } from "../models/MatchResult.js";
import { recomputeMatch } from "../services/recomputeMatch.js";

const router = express.Router();

router.get("/:poNumber", async (req, res, next) => {
  try {
    const poNumber = req.params.poNumber;
    const documents = await Document.find({ poNumber }).sort({ createdAt: 1 });
    if (documents.length === 0) {
      return res.status(404).json({ error: "No documents found for poNumber" });
    }

    const match = await MatchResult.findOne({ poNumber }) || await recomputeMatch(poNumber);
    res.json({ poNumber, documents, match });
  } catch (err) {
    next(err);
  }
});

export default router;
