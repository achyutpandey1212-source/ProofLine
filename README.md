# Proofline

Proofline is an AI-powered multi-document verification and inconsistency detection system designed to combat recycling fraud and streamline compliance reporting.

It processes multimodal evidence (scale photos, weighbridge slips, invoices, recycling certificates), extracts facts with AI vision, runs deterministic reconciliation algorithms and verification rules, flags discrepancies, and empowers human reviewers with structured audit trails.

## Repository Structure

```text
Proofline/
├── Docs/               # Source-of-truth project documentation & specifications
├── backend/            # Express, Node.js, TypeScript API & verification backend
├── frontend/           # React + TypeScript client (Deferred to later phases)
├── .gitignore          # Repository git ignore rules
├── .env.example        # Environment variable template
└── README.md           # Getting started and project guide
```

> **Note on Frontend**: The frontend is intentionally deferred until backend foundations, AI workflow, verification logic, and deployment services are complete and verified.

## Prerequisites

- **Node.js**: v20+ or v22+
- **npm**: v10+
- **MongoDB**: MongoDB Atlas URI or local instance
- **Firebase Project**: (Optional for local health checks, required for auth verification)

## Backend Setup

### 1. Configure Environment Variables

Copy the `.env.example` template into `backend/.env`:

```bash
cp .env.example backend/.env
```

Fill in your configuration variables in `backend/.env`:

- `PORT` (Default: `5000`)
- `MONGODB_URI` (Required: your MongoDB connection string)
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
- `GEMINI_API_KEY`, `GEMINI_MODEL`
- `GROQ_API_KEY`, `GROQ_MODEL`
- `IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`, `IMAGEKIT_URL_ENDPOINT`
- `FRONTEND_URL` (Default: `http://localhost:5173`)

### 2. Install Dependencies

```bash
cd backend
npm install
```

### 3. Run Typecheck & Lint

```bash
cd backend
npm run typecheck
npm run lint
```

### 4. Build

```bash
cd backend
npm run build
```

### 5. Start in Development Mode

```bash
cd backend
npm run dev
```

### 6. Verify Health Endpoint

Test the server health check endpoint:

```bash
curl http://localhost:5000/health
```

Expected response:

```json
{
  "status": "ok"
}
```
