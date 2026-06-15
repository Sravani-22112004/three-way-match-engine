import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    documentType: {
      type: String,
      enum: ["po", "grn", "invoice"],
      required: true
    },
    poNumber: {
      type: String,
      index: true,
      required: true
    },
    originalName: String,
    mimeType: String,
    parsedData: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    }
  },
  { timestamps: true }
);

export const Document = mongoose.model("Document", documentSchema);
