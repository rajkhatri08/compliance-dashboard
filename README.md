# Compliance Dashboard

Frontend for [Source-Governed RAG](https://github.com/rajkhatri08/source-governed-rag) — a retrieval system for regulatory compliance documents where source governance overrides similarity ranking.

**Live:** https://compliance-dashboard-omega-amber.vercel.app

> The backend runs on a free tier that sleeps after 15 minutes of inactivity. The first query may take 30–50 seconds; everything after that is fast.

---

## Pages

**Query** — Ask a compliance question. Returns the answer with a gold/silver/bronze tier, a stated reason for that tier, and named warnings for any expired or unapproved source that contributed.

Try: *"how long do we have to report a data breach"* — the corpus contains three sources that disagree, and the governance layer flags which ones shouldn't be trusted.

**Documents** — Inventory of indexed documents showing owner, version, review date and computed governance status. Approval can be granted or revoked from here, which writes through to Postgres.

**Audit** — Every query recorded with its tier, reason, top retrieval distance and warnings, newest first, with a bar chart showing the tier distribution across all logged queries.

---

## Stack

Next.js 16 (App Router) · React · Tailwind CSS · Recharts

Client components throughout, since every page fetches from the API at runtime. State is held with `useState`; document and audit pages fetch on mount with `useEffect`.

---

## Running locally

```bash
npm install
npm run dev
```

Create `.env.local`:
