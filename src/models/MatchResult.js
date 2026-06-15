import mongoose from "mongoose";

const matchResultSchema = new mongoose.Schema(
  {
    poNumber: {
      type: String,
      unique: true,
      index: true,
      required: true
    },
    status: {
      type: String,
      enum: ["matched", "partially_matched", "mismatch", "insufficient_documents"],
      required: true
    },
    reasons: [String],
    itemResults: [mongoose.Schema.Types.Mixed],
    documentIds: {
      po: [mongoose.Schema.Types.ObjectId],
      grn: [mongoose.Schema.Types.ObjectId],
      invoice: [mongoose.Schema.Types.ObjectId]
    }
  },
  { timestamps: true }
);

export const MatchResult = mongoose.model("MatchResult", matchResultSchema);
