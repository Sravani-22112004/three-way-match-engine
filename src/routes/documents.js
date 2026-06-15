import express from "express";
import { upload } from "../middleware/upload.js";
import { Document } from "../models/Document.js";
import { parseWithGemini } from "../services/parser/geminiParser.js";
import { inferPoNumber } from "../services/matchService.js";
import { recomputeMatch } from "../services/recomputeMatch.js";

const router = express.Router();
const allowedTypes = new Set(["po", "grn", "invoice"]);

router.post("/upload", upload.single("file"), async (req, res, next) => {
  try {
    const { documentType } = req.body;
    if (!allowedTypes.has(documentType)) {
      return res.status(400).json({ error: "documentType must be po, grn, or invoice" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "file is required" });
    }

    const parsedData = await parseWithGemini({ file: req.file, documentType });
    const poNumber = inferPoNumber(parsedData, documentType);
    if (!poNumber) {
      return res.status(422).json({ error: "Parsed document does not contain poNumber" });
    }

    const document = await Document.create({
      documentType,
      poNumber,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      parsedData
    });

    const match = await recomputeMatch(poNumber);
    res.status(201).json({ document, match });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) return res.status(404).json({ error: "Document not found" });
    res.json(document);
  } catch (err) {
    next(err);
  }
});

export default router;
