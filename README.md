# Three-Way Match Engine

Backend Developer Assignment: a Node.js + Express + MongoDB service that uploads Purchase Order, GRN, and Invoice documents, extracts structured JSON with Gemini, stores each document independently, and calculates a three-way match by `poNumber`.

## Stack

- Node.js
- Express
- MongoDB with Mongoose
- Gemini API
- Multer for file uploads

## Run Locally

```bash
npm install
cp .env.example .env
npm run dev
```

MongoDB must be running locally, or `MONGODB_URI` should point to a reachable MongoDB instance.

Without `GEMINI_API_KEY`, the API accepts JSON uploads and includes a small filename-based fallback for the sample `PO`, `GRN`, and `Invoice` PDFs so reviewers can exercise the flow locally.

## Approach

Each uploaded document is parsed into a normalized JSON shape and saved immediately. After every upload, the service finds all documents with the same `poNumber` and recomputes the latest match result. This means PO, GRN, and Invoice files can arrive in any order.

## Data Model

`Document`

- `documentType`: `po`, `grn`, or `invoice`
- `poNumber`: common linking key
- `originalName`, `mimeType`
- `parsedData`: extracted document JSON

`MatchResult`

- `poNumber`
- `status`: `matched`, `partially_matched`, `mismatch`, or `insufficient_documents`
- `reasons`
- `itemResults`
- linked `documentIds`

## Parsing Flow

`src/services/parser/geminiParser.js` sends the uploaded PDF/image to Gemini with a strict JSON prompt. The required extracted fields are:

PO: `poNumber`, `poDate`, `vendorName`, `items[]`.

GRN: `grnNumber`, `poNumber`, `grnDate`, `items[]`.

Invoice: `invoiceNumber`, `poNumber`, `invoiceDate`, `items[]`.

## Matching Logic

Matching runs at item level. The item key preference is:

1. `itemCode`
2. `sku`
3. normalized `description`

I chose this because item/SKU codes are more stable than product names across PO, GRN, and invoice PDFs. Description matching is only a fallback for documents where codes are missing.

Rules implemented:

- only one PO per `poNumber`
- GRN quantity must not exceed PO quantity
- Invoice quantity must not exceed total GRN quantity
- Invoice quantity must not exceed PO quantity
- Invoice date must not be after PO date
- item must exist in PO

## APIs

### Upload Document

```bash
curl -X POST http://localhost:3000/documents/upload \
  -F "documentType=po" \
  -F "file=@./PO.pdf"
```

`documentType` must be `po`, `grn`, or `invoice`.

### Get Parsed Document

```bash
curl http://localhost:3000/documents/<documentId>
```

### Get Match Result

```bash
curl http://localhost:3000/match/CI40PO578
```

## Out-of-Order Uploads

Documents are stored independently first. The service recomputes the match after every upload by querying all documents linked to the same `poNumber`. If only one or two document types are present, the status is `insufficient_documents`; once the missing documents arrive, the same endpoint returns the updated result.

## Assumptions

- `poNumber` can be extracted from every document.
- Multiple GRNs and invoices can exist for one PO.
- Quantity comparison is performed using summed quantities per item key.
- If quantities are below PO but no rule is violated, the result is `partially_matched`.

## Tradeoffs

- This project stores parsed JSON, not original files. In production I would store the original PDF in object storage and keep a file URL in MongoDB.
- Gemini output is validated structurally at the service boundary, but a production system should add stricter schema validation with Zod or Joi.
- Description fallback matching is intentionally conservative and may require human review for ambiguous items.

## Improvements With More Time

- Add schema validation and confidence scores for parser output.
- Add item alias mapping for vendor-specific descriptions.
- Add asynchronous parsing jobs and retry handling.
- Add authentication and audit logs.
- Add integration tests with an in-memory MongoDB.

## Tests

```bash
npm test
```
