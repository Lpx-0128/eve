# LINKUTO — Product Requirements Document
### Ecosystem Relationship Intelligence Platform
**Version:** 2.0 (Solo Hackathon Build) | **Target:** < 24 Hours | **Judging:** Live Demo

---

## 0. What is LINKUTO?

LINKUTO is a vertical B2B SaaS platform that replaces spreadsheets and manual effort in innovation ecosystem coordination. It serves accelerators, incubators, and programme organisers who need to match participants, mentors, and sponsors — intelligently and at scale.

At its core, LINKUTO is a **living relationship graph**: every participant, mentor, sponsor, and programme is a structured entity. Every interaction becomes a scored, explainable relationship that improves over time. When a new participant joins, LINKUTO automatically builds their profile from LinkedIn, compares them against the ecosystem using AI embeddings, and returns ranked, evidence-backed match recommendations.

**The problem it solves:** At 20 participants, manual matching is manageable. At 100+, it breaks down completely. LINKUTO makes it programmable.

**The one-line pitch:** *"A self-learning ecosystem operating system that turns unstructured participant data into a continuously evolving relationship graph — powered by AI embeddings and feedback-driven intelligence."*

---

## 1. Goals

### Business Goals
| Goal | Metric |
|------|--------|
| Reduce manual matching effort for organisers | 70% reduction in coordination time |
| Improve match quality | +30% improvement in match acceptance rate |
| Handle large cohorts without degradation | 1,000+ participants per programme |

### User Goals
| Persona | Goal | Metric |
|---------|------|--------|
| Organiser | Generate matches in minutes | Match generation < 2 minutes |
| Participant | Receive relevant opportunities | >60% recommendation relevance rating |
| Mentor | See high-fit startups | Increased engagement rate vs baseline |
| Sponsor | Find quality, high-impact programmes | Self-reported fit improvement |

---

## 2. Personas

- **Programme Organiser** — manages cohorts, wants fast high-quality matching with minimal manual effort
- **Participant / Startup Founder** — wants relevant mentors, programmes, and sponsors
- **Mentor** — wants high-fit startups aligned to their domain expertise
- **Sponsor** — wants quality programmes and startups that align with their goals

---

## 3. Use Cases

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| UC-1 | Organiser uploads participant data | Profiles auto-generated via Gemini from LinkedIn or PDF |
| UC-2 | System generates matches | Ranked recommendations with scores and explanations returned |
| UC-3 | Organiser accepts a match | Relationship is created and stored in the graph |
| UC-4 | Programme registration screening | System filters applicants using RRI strength scoring |
| UC-5 | Feedback submission post-interaction | Relationship score updated based on real outcome |

---

## 4. Tech Stack

### Frontend
| Tool | Purpose |
|------|---------|
| Next.js 14 (App Router) | Full-stack framework, server components, API routes |
| TailwindCSS | Utility-first styling |
| Framer Motion | Animations and transitions |
| React Query (TanStack Query) | Server state management, caching, loading states |
| React Flow | Relationship graph visualisation (nodes = entities, edges = relationships) |
| React Hook Form | Profile form handling and validation |

### Backend (via Next.js API Routes, deployed on Cloud Run)
| Tool | Purpose |
|------|---------|
| Node.js (Next.js API routes) | All backend logic lives here — no separate server needed |
| Firebase Admin SDK | Server-side Firestore access and Auth verification |
| Playwright | Controlled LinkedIn profile extraction (user-initiated, not automated) |
| Cheerio | HTML parsing for LinkedIn scrape output |
| Zod | Schema validation for all AI-generated profile output |

### AI & Embeddings (Google Stack)
| Tool | Purpose |
|------|---------|
| Gemini 3.1 Flash Lite | Profile enrichment, structured JSON extraction, match explanations |
| Gemini Embeddings API (`text-embedding-004`) | Vector embeddings for similarity search |
| Cosine Similarity (custom scoring) | Candidate generation from embedding space |

### Database & Auth (Firebase)
| Tool | Purpose |
|------|---------|
| Firebase Auth | Google Sign-In, session management |
| Firestore | Entity store, relationship store, programme store (three collections) |
| Firestore Vector Search | Embedding similarity queries (or manual cosine in-memory for MVP) |

### Integrations (Google Stack — Hackathon Rubric)
| Tool | Purpose |
|------|---------|
| Google Calendar API | Create calendar invites after match acceptance |
| Gmail API | Send match notification emails |
| Cloud Run | Deployment target for the Next.js app |

---

## 5. System Architecture

LINKUTO has three conceptual layers:

```
┌─────────────────────────────────────────────────────┐
│  Experience Layer (Next.js UI)                      │
│  Dashboards · Graph View · Profile UI · Workflows   │
└────────────────────┬────────────────────────────────┘
                     │ API calls
┌────────────────────▼────────────────────────────────┐
│  Intelligence Layer (Next.js API Routes)            │
│  Embedding Engine · RRI Scorer · Recommendation API │
└────────────────────┬────────────────────────────────┘
                     │ read/write
┌────────────────────▼────────────────────────────────┐
│  Data Layer (Firestore)                             │
│  Entity Store · Relationship Store · Programme Store│
└─────────────────────────────────────────────────────┘
```

### API Contract (stable interface between layers)

**Recommendation Endpoint**
```
POST /api/recommend
{
  "entity_id": "string",
  "type": "mentor | programme | sponsor"
}

Response:
{
  "results": [
    {
      "id": "string",
      "score": 0.87,
      "explanation": "string",
      "confidence": "high | medium | low"
    }
  ]
}
```

**Profile Enrichment Endpoint**
```
POST /api/enrich-profile
{
  "linkedInRawHTML": "string",   // from Playwright scrape
  "linkedInPDFBase64": "string", // from PDF upload (fallback)
  "manualFormInput": "object"    // from manual form (fallback)
}

Response:
{
  "profile": {
    "name": "string",
    "roles": [],
    "skills": [],
    "company_history": [],
    "education": [],
    "summary": "string"
  }
}
```

---

## 6. Database Schema

### Collection 1: `entities`
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Auto-generated Firestore doc ID |
| `type` | enum | `participant \| mentor \| sponsor \| programme` |
| `profile_data` | object | Structured profile (name, skills, roles, etc.) |
| `embedding_vector` | number[] | 768-dim vector from Gemini embeddings |
| `last_updated` | timestamp | Last profile modification |

### Collection 2: `relationships`
| Field | Type | Description |
|-------|------|-------------|
| `relationship_id` | string | Auto-generated |
| `entity_a_id` | string | Reference to entity |
| `entity_b_id` | string | Reference to entity |
| `type` | string | e.g. `mentor-participant`, `sponsor-programme` |
| `strength_score` | number | RRI score 0–1 |
| `score_breakdown` | object | Weights per signal |
| `explanation` | string | Human-readable AI explanation |
| `interaction_history` | array | Log of past interactions |
| `feedback_score` | number | Post-interaction rating |

### Collection 3: `programmes`
| Field | Type | Description |
|-------|------|-------------|
| `programme_id` | string | Auto-generated |
| `participants` | string[] | Entity IDs |
| `mentors` | string[] | Entity IDs |
| `sponsors` | string[] | Entity IDs |
| `status` | enum | `draft \| active \| completed` |
| `outcomes` | object | Post-programme outcome data |

---

## 7. Core Algorithm: Relationship Relevance Index (RRI)

Every match is scored using the RRI formula:

```
RRI = 0.4 × embedding_similarity
    + 0.3 × engagement_score
    + 0.2 × profile_match
    + 0.1 × feedback_score
```

- **embedding_similarity** — cosine similarity between entity embedding vectors
- **engagement_score** — derived from past interaction history
- **profile_match** — Gemini-evaluated keyword/domain alignment
- **feedback_score** — post-interaction rating fed back from the UI

Every recommendation includes a human-readable explanation generated by Gemini, e.g.: *"Mentor's fintech expertise directly aligns with this startup's Series A focus on payment infrastructure."*

---

## 8. LinkedIn Ingestion (Playwright Approach)

LINKUTO uses controlled, user-initiated profile extraction — not unauthorised scraping. The user triggers extraction themselves and is in full control.

**Flow:**
1. User provides their LinkedIn profile URL in the UI
2. Backend spins up a Playwright browser session on the server
3. Playwright navigates to the URL and captures the page HTML
4. Cheerio parses the HTML into structured fields (name, headline, experience, education, skills)
5. Gemini normalises the parsed output into the canonical profile schema (validated via Zod)
6. User sees their auto-generated profile and can edit before saving

**Fallback options (in order):**
- User exports LinkedIn PDF → uploaded and parsed by Gemini Vision
- User pastes "About + Experience" text manually → Gemini extracts structure
- User fills a manual form directly

**Framing for judges:** *"User-authorised profile extraction via structured parsing — not automated unauthorised scraping."*

---

## 9. UX Flow

```
1. User signs in (Google Auth via Firebase)
2. Profile auto-generated (LinkedIn scrape → Gemini → Zod validation)
3. User joins a programme / organiser uploads cohort
4. System generates embeddings for each entity (Gemini Embeddings API)
5. RRI scored for all candidate pairs
6. Recommendations displayed with scores + explanations
7. Organiser accepts matches
8. Gmail notification + Google Calendar invite sent automatically
9. Feedback collected post-interaction
10. Relationship scores updated in Firestore graph
```

---

## 10. Solo Build Plan (< 24 Hours)

This is the recommended order of implementation for a single developer. Each phase produces something demo-able.

---

### Phase 0 — Project Setup (Hour 0–1)
**Goal:** Running app with auth, routing, and Firebase connected.

- [ ] `npx create-next-app@latest linkuto --typescript --tailwind --app`
- [ ] Install dependencies:
  ```bash
  npm install firebase firebase-admin @google/generative-ai
  npm install react-query @tanstack/react-query framer-motion
  npm install reactflow react-hook-form zod
  npm install playwright cheerio
  ```
- [ ] Set up Firebase project → enable Firestore + Google Auth
- [ ] Create `.env.local`:
  ```
  NEXT_PUBLIC_FIREBASE_API_KEY=
  NEXT_PUBLIC_FIREBASE_PROJECT_ID=
  FIREBASE_ADMIN_KEY=
  GEMINI_API_KEY=
  GOOGLE_CALENDAR_CLIENT_ID=
  GMAIL_CLIENT_ID=
  ```
- [ ] Configure Firebase Admin SDK in `lib/firebase-admin.ts`
- [ ] Set up Google Auth sign-in page
- [ ] Create three Firestore collections: `entities`, `relationships`, `programmes`
- [ ] Basic layout with navbar and route skeleton

**Demo checkpoint:** Login page → Google sign-in → lands on dashboard shell

#### 🧪 Phase 0 Self-Test Suite
> **AI IDE instruction:** After completing Phase 0, run ALL tests below. If any test fails, fix the issue and re-run that test before proceeding. Do not move to Phase 1 until all tests in this suite pass.

**Test P0-1 — Firebase connection**
```typescript
// tests/phase0/firebase.test.ts
import { db } from '@/lib/firebase-admin';

describe('P0-1: Firebase Admin connection', () => {
  it('should connect to Firestore and write/read a test document', async () => {
    const ref = db.collection('_test').doc('connectivity');
    await ref.set({ ping: true, ts: Date.now() });
    const snap = await ref.get();
    expect(snap.exists).toBe(true);
    expect(snap.data()?.ping).toBe(true);
    await ref.delete(); // cleanup
  });
});
```
**Pass criteria:** Document written and read back without error. Cleanup succeeds.

**Test P0-2 — Environment variables loaded**
```typescript
// tests/phase0/env.test.ts
describe('P0-2: Required env vars present', () => {
  const required = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'FIREBASE_ADMIN_KEY',
    'GEMINI_API_KEY',
  ];
  required.forEach(key => {
    it(`should have ${key} defined`, () => {
      expect(process.env[key]).toBeDefined();
      expect(process.env[key]!.length).toBeGreaterThan(0);
    });
  });
});
```
**Pass criteria:** All four env vars present and non-empty.

**Test P0-3 — Three Firestore collections exist and are writable**
```typescript
// tests/phase0/collections.test.ts
import { db } from '@/lib/firebase-admin';

describe('P0-3: Firestore collections writable', () => {
  const collections = ['entities', 'relationships', 'programmes'];
  collections.forEach(col => {
    it(`should write to ${col} collection`, async () => {
      const ref = db.collection(col).doc('__test__');
      await expect(ref.set({ test: true })).resolves.not.toThrow();
      await ref.delete();
    });
  });
});
```
**Pass criteria:** All three collections writable without permission errors.

**Test P0-4 — App serves on localhost**
```bash
# Run in terminal — AI IDE should execute this and check exit code
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
# Expected output: 200
```
**Pass criteria:** HTTP 200 returned from root route. If not, check `npm run dev` is running.

**Test P0-5 — Login route renders**
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/login
# Expected output: 200
```
**Pass criteria:** `/login` returns 200 (page exists, no 404 or 500).

**🔁 Loop condition:** If any test above fails, the AI IDE must diagnose the failure output, apply a fix, restart the dev server if needed, and re-run only the failing test. Repeat until all five pass before proceeding to Phase 1.

---

### Phase 1 — Profile Ingestion Engine (Hour 1–4)
**Goal:** LinkedIn → structured profile stored in Firestore.

- [ ] Create `app/api/enrich-profile/route.ts`
- [ ] Playwright scraper function:
  ```typescript
  // lib/scraper.ts
  import { chromium } from 'playwright';
  import * as cheerio from 'cheerio';

  export async function scrapeLinkedIn(url: string) {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle' });
    const html = await page.content();
    await browser.close();
    const $ = cheerio.load(html);
    return {
      name: $('.top-card-layout__title').text().trim(),
      headline: $('.top-card-layout__headline').text().trim(),
      about: $('.core-section-container__content p').first().text().trim(),
      // parse experience, education, skills sections
    };
  }
  ```
- [ ] Gemini extraction call:
  ```typescript
  // lib/gemini.ts
  import { GoogleGenerativeAI } from '@google/generative-ai';
  const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

  export async function enrichProfile(rawData: object) {
    const model = genai.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });
    const prompt = `Convert this raw LinkedIn data into structured JSON:
    ${JSON.stringify(rawData)}
    Return ONLY valid JSON with: name, roles[], skills[], company_history[], education[], summary`;
    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
  }
  ```
- [ ] Zod schema validation for profile output
- [ ] Store enriched profile as entity in Firestore with `type: 'participant'`
- [ ] Build profile UI: LinkedIn URL input → loading state → editable preview → save

**Demo checkpoint:** Paste LinkedIn URL → see auto-generated structured profile in < 10 seconds

---

### Phase 2 — Embedding Engine (Hour 4–6)
**Goal:** Every entity gets an embedding vector stored in Firestore.

- [ ] Create `app/api/generate-embedding/route.ts`
- [ ] Gemini embeddings call:
  ```typescript
  export async function generateEmbedding(profile: object): Promise<number[]> {
    const model = genai.getGenerativeModel({ model: 'text-embedding-004' });
    const text = `${profile.name} ${profile.skills.join(' ')} ${profile.summary}`;
    const result = await model.embedContent(text);
    return result.embedding.values;
  }
  ```
- [ ] Trigger embedding generation on profile save
- [ ] Store `embedding_vector` field on entity document in Firestore
- [ ] Cosine similarity utility function:
  ```typescript
  export function cosineSimilarity(a: number[], b: number[]): number {
    const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dot / (magA * magB);
  }
  ```

**Demo checkpoint:** Console log showing embedding vector generated for a profile

#### 🧪 Phase 2 Self-Test Suite
> **AI IDE instruction:** Run ALL tests below after completing Phase 2. Fix and re-run failing tests before moving to Phase 3.

**Test P2-1 — Gemini embedding returns a vector of the correct dimension**
```typescript
// tests/phase2/embedding.test.ts
import { generateEmbedding } from '@/lib/embeddings';

describe('P2-1: Embedding vector shape', () => {
  it('should return a non-empty number array', async () => {
    const vector = await generateEmbedding({ name: 'Ada', skills: ['Computing'], summary: 'Pioneer.' });
    expect(Array.isArray(vector)).toBe(true);
    expect(vector.length).toBeGreaterThan(0);
    expect(typeof vector[0]).toBe('number');
  }, 15000);

  it('should return values between -1 and 1', async () => {
    const vector = await generateEmbedding({ name: 'Test', skills: ['AI'], summary: 'Test.' });
    vector.forEach(v => {
      expect(v).toBeGreaterThanOrEqual(-1);
      expect(v).toBeLessThanOrEqual(1);
    });
  }, 15000);
});
```
**Pass criteria:** Non-empty number array; all values within [-1, 1].

**Test P2-2 — Cosine similarity returns correct values for known inputs**
```typescript
// tests/phase2/cosine.test.ts
import { cosineSimilarity } from '@/lib/embeddings';

describe('P2-2: Cosine similarity correctness', () => {
  it('should return 1.0 for identical vectors', () => {
    const v = [0.1, 0.5, 0.3, 0.8];
    expect(cosineSimilarity(v, v)).toBeCloseTo(1.0, 5);
  });
  it('should return 0.0 for orthogonal vectors', () => {
    expect(cosineSimilarity([1, 0, 0], [0, 1, 0])).toBeCloseTo(0.0, 5);
  });
  it('should return -1.0 for opposite vectors', () => {
    expect(cosineSimilarity([1, 0, 0], [-1, 0, 0])).toBeCloseTo(-1.0, 5);
  });
});
```
**Pass criteria:** All three similarity assertions pass exactly.

**Test P2-3 — Similar profiles score higher than dissimilar ones**
```typescript
// tests/phase2/similarity-order.test.ts
import { generateEmbedding, cosineSimilarity } from '@/lib/embeddings';

describe('P2-3: Embedding semantic ordering', () => {
  it('should score fintech mentor higher against fintech startup than biotech', async () => {
    const mentor = await generateEmbedding({ name: 'Alice', skills: ['Fintech', 'Payments'], summary: 'Fintech operator.' });
    const fintech = await generateEmbedding({ name: 'PayX', skills: ['Fintech', 'API Banking'], summary: 'Payment startup.' });
    const biotech = await generateEmbedding({ name: 'BioGen', skills: ['Genomics'], summary: 'Drug discovery.' });
    expect(cosineSimilarity(mentor, fintech)).toBeGreaterThan(cosineSimilarity(mentor, biotech));
  }, 30000);
});
```
**Pass criteria:** Fintech-to-fintech similarity strictly greater than fintech-to-biotech.

**Test P2-4 — Embedding stored on Firestore entity**
```typescript
// tests/phase2/persistence.test.ts
import { db } from '@/lib/firebase-admin';
import { generateEmbedding } from '@/lib/embeddings';

describe('P2-4: Embedding persisted to Firestore', () => {
  it('should store embedding_vector on an entity document', async () => {
    const vector = await generateEmbedding({ name: 'Embed Test', skills: ['AI'], summary: 'Test.' });
    const ref = await db.collection('entities').add({
      type: 'participant', profile_data: { name: 'Embed Test' },
      embedding_vector: vector, last_updated: new Date(),
    });
    const snap = await db.collection('entities').doc(ref.id).get();
    expect(Array.isArray(snap.data()?.embedding_vector)).toBe(true);
    expect(snap.data()?.embedding_vector.length).toBeGreaterThan(0);
    await ref.delete();
  }, 20000);
});
```
**Pass criteria:** Entity document contains a non-empty `embedding_vector` array after save.

**🔁 Loop condition:** If P2-3 fails, expand the text fed to `generateEmbedding` to include `roles` and `company_history`. Re-run P2-3 after each fix. Do not proceed to Phase 3 until all four tests pass.

---

### Phase 3 — Recommendation Engine (Hour 6–9)
**Goal:** POST /api/recommend returns ranked, scored, explained matches.

- [ ] Create `app/api/recommend/route.ts`
- [ ] Fetch all candidate entities of target type from Firestore
- [ ] Compute cosine similarity between source entity and all candidates
- [ ] Take top 20 by embedding similarity (candidate generation)
- [ ] Score each with RRI formula:
  ```typescript
  function computeRRI(embeddingSim: number, engagementScore: number,
                      profileMatch: number, feedbackScore: number): number {
    return (0.4 * embeddingSim) + (0.3 * engagementScore)
         + (0.2 * profileMatch) + (0.1 * feedbackScore);
  }
  ```
- [ ] Gemini explanation generation:
  ```typescript
  const explanation = await model.generateContent(
    `In one sentence, explain why this mentor is a good match for this startup:
     Mentor: ${JSON.stringify(mentor.profile_data)}
     Startup: ${JSON.stringify(participant.profile_data)}`
  );
  ```
- [ ] Return top 10 ranked results with score, explanation, confidence level
- [ ] Build recommendation card UI:
  - Entity name + avatar
  - Match score badge (colour-coded by confidence: green = high, amber = medium, red = low)
  - One-line explanation
  - Accept / Decline buttons

**Demo checkpoint:** Click "Generate Matches" → see 10 ranked mentor cards with scores and explanations

#### 🧪 Phase 3 Self-Test Suite
> **AI IDE instruction:** Run ALL tests below after Phase 3. Seed Firestore with at least one participant entity and one mentor entity before running. Clean up after.

**Test P3-1 — RRI formula is mathematically correct**
```typescript
// tests/phase3/rri.test.ts
import { computeRRI } from '@/lib/rri';

describe('P3-1: RRI formula correctness', () => {
  it('should compute as weighted sum', () => {
    const result = computeRRI(0.8, 0.6, 0.7, 0.5);
    expect(result).toBeCloseTo((0.4*0.8)+(0.3*0.6)+(0.2*0.7)+(0.1*0.5), 6);
  });
  it('should return 1.0 for all-perfect inputs', () => {
    expect(computeRRI(1, 1, 1, 1)).toBeCloseTo(1.0, 6);
  });
  it('should return 0.0 for all-zero inputs', () => {
    expect(computeRRI(0, 0, 0, 0)).toBeCloseTo(0.0, 6);
  });
});
```
**Pass criteria:** All three RRI arithmetic assertions pass exactly.

**Test P3-2 — /api/recommend returns correct response shape**
```typescript
// tests/phase3/api-shape.test.ts
describe('P3-2: /api/recommend response shape', () => {
  it('should return 200 and results array with required fields', async () => {
    const res = await fetch('http://localhost:3000/api/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity_id: process.env.TEST_PARTICIPANT_ID, type: 'mentor' }),
    });
    expect(res.status).toBe(200);
    const { results } = await res.json();
    expect(Array.isArray(results)).toBe(true);
    if (results.length > 0) {
      expect(results[0]).toHaveProperty('id');
      expect(results[0]).toHaveProperty('score');
      expect(results[0]).toHaveProperty('explanation');
      expect(['high', 'medium', 'low']).toContain(results[0].confidence);
    }
  }, 20000);
});
```
**Pass criteria:** 200 status; `results` has all four required fields with valid confidence value.

**Test P3-3 — Results are sorted in descending score order**
```typescript
// tests/phase3/ranking.test.ts
describe('P3-3: Results ranked highest-first', () => {
  it('should return scores in descending order', async () => {
    const res = await fetch('http://localhost:3000/api/recommend', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity_id: process.env.TEST_PARTICIPANT_ID, type: 'mentor' }),
    });
    const { results } = await res.json();
    for (let i = 0; i < results.length - 1; i++) {
      expect(results[i].score).toBeGreaterThanOrEqual(results[i + 1].score);
    }
  }, 20000);
});
```
**Pass criteria:** Each consecutive score pair satisfies `scores[i] >= scores[i+1]`.

**Test P3-4 — Explanation is a non-empty string on every result**
```typescript
// tests/phase3/explanation.test.ts
describe('P3-4: Explanations are non-empty strings', () => {
  it('should return a human-readable explanation per result', async () => {
    const res = await fetch('http://localhost:3000/api/recommend', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity_id: process.env.TEST_PARTICIPANT_ID, type: 'mentor' }),
    });
    const { results } = await res.json();
    results.forEach((r: any) => {
      expect(typeof r.explanation).toBe('string');
      expect(r.explanation.trim().length).toBeGreaterThan(10);
    });
  }, 20000);
});
```
**Pass criteria:** Every explanation is a string with more than 10 characters.

**Test P3-5 — /api/recommend returns 400/404 for invalid input**
```typescript
// tests/phase3/validation.test.ts
describe('P3-5: Input validation', () => {
  it('should return 400 when entity_id is missing', async () => {
    const res = await fetch('http://localhost:3000/api/recommend', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'mentor' }),
    });
    expect(res.status).toBe(400);
  });
  it('should return 404 when entity_id does not exist', async () => {
    const res = await fetch('http://localhost:3000/api/recommend', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity_id: 'nonexistent_abc123', type: 'mentor' }),
    });
    expect(res.status).toBe(404);
  });
});
```
**Pass criteria:** Missing `entity_id` → 400; unknown ID → 404. No 500 errors.

**🔁 Loop condition:** If P3-3 fails, check that results are sorted by `rri_score` descending before slicing. If P3-4 fails, increase Gemini `max_tokens` or simplify the explanation prompt. Re-run only the failing test after each fix.

---

### Phase 4 — Dashboards (Hour 9–13)
**Goal:** Role-specific dashboards that look great for the live demo.

- [ ] **Organiser Dashboard:**
  - Cohort overview (participant count, match completion %)
  - "Generate Matches" action button
  - Pending matches list with Accept / Decline
  - Active programme summary cards

- [ ] **Participant Dashboard:**
  - Profile completion status
  - Recommended mentors (top 3)
  - Recommended programmes (top 3)
  - Accepted matches list

- [ ] **Mentor Dashboard:**
  - Incoming match requests
  - Profile + expertise display
  - Accepted startups list

- [ ] **Sponsor/Partner Dashboard:**
  - Incoming startup matches
  - Feedback & progress from mentee
  - Company profile 
  - Accepted startups 

- [ ] Use Framer Motion for:
  - Page load stagger animations
  - Card hover states
  - Accept/Decline interaction feedback

**Demo checkpoint:** Full organiser → participant → mentor flow walkable in live demo

#### 🧪 Phase 4 Self-Test Suite
> **AI IDE instruction:** These tests verify dashboard routes exist, render without crashing, and surface correct data. Run with seeded Firestore data.

**Test P4-1 — All three dashboard routes return 200**
```bash
for route in organiser participant mentor; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/dashboard/$route)
  echo "$route: $STATUS"
  [ "$STATUS" = "200" ] || echo "FAIL: $route returned $STATUS"
done
```
**Pass criteria:** All three print `200`. No 404 or 500.

**Test P4-2 — Organiser dashboard renders participant count and action button**
```typescript
// tests/phase4/organiser.test.ts
import { render, screen } from '@testing-library/react';
import OrganiserDashboard from '@/app/dashboard/organiser/page';

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn().mockReturnValue({
    data: { participants: ['id1', 'id2', 'id3'], mentors: ['m1'], sponsors: [] },
    isLoading: false,
  }),
}));

describe('P4-2: Organiser dashboard content', () => {
  it('should render a participant count', () => {
    render(<OrganiserDashboard />);
    expect(screen.getByText(/participant/i)).toBeInTheDocument();
  });
  it('should render a "Generate Matches" button', () => {
    render(<OrganiserDashboard />);
    expect(screen.getByRole('button', { name: /generate matches/i })).toBeInTheDocument();
  });
});
```
**Pass criteria:** Participant text visible; "Generate Matches" button present.

**Test P4-3 — Participant dashboard renders recommendation cards**
```typescript
// tests/phase4/participant.test.ts
import { render, screen } from '@testing-library/react';
import ParticipantDashboard from '@/app/dashboard/participant/page';

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn().mockReturnValue({
    data: {
      recommendations: [
        { id: 'm1', score: 0.92, explanation: 'Domain alignment in fintech.', confidence: 'high' },
      ],
    },
    isLoading: false,
  }),
}));

describe('P4-3: Participant dashboard recommendations', () => {
  it('should render at least one recommendation card', () => {
    render(<ParticipantDashboard />);
    const cards = screen.getAllByTestId('recommendation-card');
    expect(cards.length).toBeGreaterThan(0);
  });
  it('should render a score badge', () => {
    render(<ParticipantDashboard />);
    expect(screen.getByText('0.92')).toBeInTheDocument();
  });
});
```
**Pass criteria:** At least one card with `data-testid="recommendation-card"` renders; score visible.

**Test P4-4 — Loading and empty states render without crash**
```typescript
// tests/phase4/states.test.ts
import { render, screen } from '@testing-library/react';
import OrganiserDashboard from '@/app/dashboard/organiser/page';

const mockUseQuery = jest.fn();
jest.mock('@tanstack/react-query', () => ({ useQuery: mockUseQuery }));

describe('P4-4: Loading and empty states', () => {
  it('should render a loading indicator when isLoading is true', () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: true });
    render(<OrganiserDashboard />);
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
  });
  it('should render an empty state when there is no data', () => {
    mockUseQuery.mockReturnValue({ data: { participants: [], mentors: [], sponsors: [] }, isLoading: false });
    render(<OrganiserDashboard />);
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });
});
```
**Pass criteria:** Both `data-testid` elements render without throwing.

**🔁 Loop condition:** If P4-2 or P4-3 fail due to missing `data-testid` attributes, add them to the relevant components and re-run. Fix the component, not the test.

---

### Phase 5 — Relationship Graph (Hour 13–16)
**Goal:** Visual relationship graph that wows judges.

- [ ] Fetch all relationships from Firestore for the active programme
- [ ] Map to React Flow nodes (entities) and edges (relationships)
- [ ] Edge thickness = RRI score (thin = low, thick = high)
- [ ] Node colour coding: blue = participant, green = mentor, amber = sponsor
- [ ] Click node → panel slides in showing entity profile + relationships
- [ ] Click edge → shows RRI breakdown and explanation

```typescript
// Example node/edge mapping
const nodes = entities.map(e => ({
  id: e.id,
  type: 'entityNode',
  data: { label: e.profile_data.name, type: e.type },
  position: { x: Math.random() * 600, y: Math.random() * 400 }
}));

const edges = relationships.map(r => ({
  id: r.relationship_id,
  source: r.entity_a_id,
  target: r.entity_b_id,
  style: { strokeWidth: r.strength_score * 6 },
  label: r.strength_score.toFixed(2)
}));
```

**Demo checkpoint:** Animated graph rendering with clickable nodes showing profiles

#### 🧪 Phase 5 Self-Test Suite
> **AI IDE instruction:** Graph tests verify data mapping and React Flow construction, not visual rendering. Run with seeded relationship data.

**Test P5-1 — Entities and relationships correctly mapped to nodes and edges**
```typescript
// tests/phase5/graph-mapping.test.ts
import { mapEntitiesToNodes, mapRelationshipsToEdges } from '@/lib/graph';

const mockEntities = [
  { id: 'e1', type: 'participant', profile_data: { name: 'Startup A' } },
  { id: 'e2', type: 'mentor', profile_data: { name: 'Mentor B' } },
];
const mockRelationships = [
  { relationship_id: 'r1', entity_a_id: 'e1', entity_b_id: 'e2', strength_score: 0.87 },
];

describe('P5-1: Graph data mapping', () => {
  it('should map entities to nodes with correct id and label', () => {
    const nodes = mapEntitiesToNodes(mockEntities);
    expect(nodes).toHaveLength(2);
    expect(nodes[0].id).toBe('e1');
    expect(nodes[0].data.label).toBe('Startup A');
  });
  it('should map relationships to edges with correct source and target', () => {
    const edges = mapRelationshipsToEdges(mockRelationships);
    expect(edges[0].source).toBe('e1');
    expect(edges[0].target).toBe('e2');
  });
  it('should encode strength_score as strokeWidth (higher = thicker)', () => {
    const lowEdges = mapRelationshipsToEdges([{ relationship_id: 'r1', entity_a_id: 'e1', entity_b_id: 'e2', strength_score: 0.3 }]);
    const highEdges = mapRelationshipsToEdges([{ relationship_id: 'r2', entity_a_id: 'e1', entity_b_id: 'e2', strength_score: 0.9 }]);
    expect(highEdges[0].style.strokeWidth).toBeGreaterThan(lowEdges[0].style.strokeWidth);
  });
});
```
**Pass criteria:** Nodes have correct `id`/`label`; edges have correct `source`/`target`; higher score = higher `strokeWidth`.

**Test P5-2 — Graph route returns 200**
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/graph
# Expected: 200
```
**Pass criteria:** `/graph` returns 200.

**Test P5-3 — EntityGraph component renders node labels from props**
```typescript
// tests/phase5/graph-render.test.ts
import { render, screen } from '@testing-library/react';
import EntityGraph from '@/components/EntityGraph';

jest.mock('reactflow', () => ({
  ReactFlow: ({ nodes }: any) => (
    <div data-testid="react-flow">
      {nodes.map((n: any) => <div key={n.id} data-testid="graph-node">{n.data.label}</div>)}
    </div>
  ),
  Background: () => null,
  Controls: () => null,
}));

const nodes = [
  { id: 'e1', type: 'entityNode', data: { label: 'Startup A', type: 'participant' }, position: { x: 0, y: 0 } },
  { id: 'e2', type: 'entityNode', data: { label: 'Mentor B', type: 'mentor' }, position: { x: 200, y: 0 } },
];
const edges = [{ id: 'r1', source: 'e1', target: 'e2', style: { strokeWidth: 5 }, label: '0.87' }];

describe('P5-3: EntityGraph renders nodes', () => {
  it('should render one node per entity', () => {
    render(<EntityGraph nodes={nodes} edges={edges} />);
    expect(screen.getAllByTestId('graph-node')).toHaveLength(2);
  });
  it('should render node labels correctly', () => {
    render(<EntityGraph nodes={nodes} edges={edges} />);
    expect(screen.getByText('Startup A')).toBeInTheDocument();
    expect(screen.getByText('Mentor B')).toBeInTheDocument();
  });
});
```
**Pass criteria:** Both node labels render in the mocked ReactFlow container.

**🔁 Loop condition:** If P5-1 fails on stroke width ordering, verify `strokeWidth` is computed as `score * constant` (not inverted). If P5-3 fails, ensure `EntityGraph` accepts `nodes` and `edges` as props rather than fetching internally.

---

### Phase 6 — Google Integrations (Hour 16–19)
**Goal:** Real Gmail + Calendar triggers on match acceptance (big demo moment).

- [ ] Set up Google OAuth2 client for Calendar + Gmail APIs
- [ ] On match acceptance, call `POST /api/accept-match`:
  ```typescript
  // Send Gmail notification
  await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: btoa(`To: ${mentorEmail}\nSubject: New Match: ${startupName}\n\n${matchExplanation}`)
    }
  });

  // Create Calendar invite
  await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary: `LINKUTO Match: ${mentorName} × ${startupName}`,
      start: { dateTime: new Date(Date.now() + 86400000).toISOString() },
      end: { dateTime: new Date(Date.now() + 90000000).toISOString() },
      attendees: [{ email: mentorEmail }, { email: participantEmail }]
    }
  });
  ```
- [ ] Store match as relationship document in Firestore
- [ ] Update programme document with accepted match

**Demo checkpoint:** Click "Accept Match" → judge sees a real Gmail + Calendar invite appear live

#### 🧪 Phase 6 Self-Test Suite
> **AI IDE instruction:** Live Gmail/Calendar tests require valid OAuth tokens. If tokens are unavailable, run `[MOCK]` variants only and skip the live tests — do not block on them.

**Test P6-1 — /api/accept-match returns 200 and creates a relationship [MOCK]**
```typescript
// tests/phase6/accept-match.test.ts
import { db } from '@/lib/firebase-admin';

jest.mock('@/lib/google-apis', () => ({
  sendMatchEmail: jest.fn().mockResolvedValue({ id: 'mock-email-id' }),
  createCalendarInvite: jest.fn().mockResolvedValue({ id: 'mock-event-id' }),
}));

describe('P6-1: Accept match endpoint [MOCK]', () => {
  let relationshipId: string;

  it('should return 200 and a relationship_id', async () => {
    const res = await fetch('http://localhost:3000/api/accept-match', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entity_a_id: 'test-participant-001', entity_b_id: 'test-mentor-001',
        score: 0.88, explanation: 'Strong fintech alignment.',
      }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.relationship_id).toBeDefined();
    relationshipId = data.relationship_id;
  });

  it('should persist the relationship to Firestore', async () => {
    const snap = await db.collection('relationships').doc(relationshipId).get();
    expect(snap.exists).toBe(true);
    expect(snap.data()?.strength_score).toBe(0.88);
    await db.collection('relationships').doc(relationshipId).delete();
  });
});
```
**Pass criteria:** 200 response; `relationship_id` returned; Firestore document with correct `strength_score`.

**Test P6-2 — Google API wrappers callable without throwing [MOCK]**
```typescript
// tests/phase6/google-apis.test.ts
jest.mock('@/lib/google-apis', () => ({
  sendMatchEmail: jest.fn().mockResolvedValue({ id: 'email-123' }),
  createCalendarInvite: jest.fn().mockResolvedValue({ id: 'event-456' }),
}));
import { sendMatchEmail, createCalendarInvite } from '@/lib/google-apis';

describe('P6-2: Google API wrappers [MOCK]', () => {
  it('sendMatchEmail should resolve with an id', async () => {
    const result = await sendMatchEmail({ to: 'mentor@test.com', subject: 'Match', body: 'You have a match.' });
    expect(result.id).toBeDefined();
  });
  it('createCalendarInvite should resolve with an id', async () => {
    const result = await createCalendarInvite({ summary: 'Eve Match', attendees: ['a@b.com'], startTime: new Date().toISOString() });
    expect(result.id).toBeDefined();
  });
});
```
**Pass criteria:** Both wrappers resolve without throwing; IDs returned.

**Test P6-3 — Programme document updated after match acceptance [MOCK]**
```typescript
// tests/phase6/programme-update.test.ts
import { db } from '@/lib/firebase-admin';

jest.mock('@/lib/google-apis', () => ({
  sendMatchEmail: jest.fn().mockResolvedValue({}),
  createCalendarInvite: jest.fn().mockResolvedValue({}),
}));

describe('P6-3: Programme updated on match acceptance', () => {
  it('should add the match to the programme accepted_matches list', async () => {
    const progRef = await db.collection('programmes').add({
      status: 'active', participants: ['test-participant-001'], mentors: ['test-mentor-001'],
      sponsors: [], accepted_matches: [],
    });
    await fetch('http://localhost:3000/api/accept-match', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entity_a_id: 'test-participant-001', entity_b_id: 'test-mentor-001',
        programme_id: progRef.id, score: 0.88, explanation: 'Test match.',
      }),
    });
    const snap = await progRef.get();
    expect(snap.data()?.accepted_matches?.length).toBeGreaterThan(0);
    await progRef.delete();
  }, 20000);
});
```
**Pass criteria:** `accepted_matches` array grows by at least one entry.

**🔁 Loop condition:** If P6-1 fails with 500, verify the Google API mock intercepts before the route executes. If persistence fails, confirm the route writes the relationship before returning the response.

---

### Phase 7 — Feedback Loop (Hour 19–21)
**Goal:** Post-interaction feedback that updates the relationship score.

- [ ] Simple feedback form (1–5 star rating + optional note)
- [ ] `POST /api/feedback` endpoint updates:
  - `feedback_score` on relationship document
  - Triggers RRI recomputation
  - Updates entity engagement scores
- [ ] Show updated score on relationship card

#### 🧪 Phase 7 Self-Test Suite
> **AI IDE instruction:** Run ALL tests below after Phase 7. These verify the complete feedback → score update loop end-to-end.

**Test P7-1 — /api/feedback updates feedback_score on relationship**
```typescript
// tests/phase7/feedback.test.ts
import { db } from '@/lib/firebase-admin';

describe('P7-1: Feedback score persistence', () => {
  let relId: string;

  beforeAll(async () => {
    const ref = await db.collection('relationships').add({
      entity_a_id: 'p1', entity_b_id: 'm1', strength_score: 0.75,
      feedback_score: 0,
      score_breakdown: { embedding_similarity: 0.8, engagement_score: 0.7, profile_match: 0.6 },
      interaction_history: [],
    });
    relId = ref.id;
  });
  afterAll(async () => { await db.collection('relationships').doc(relId).delete(); });

  it('should return 200 and update feedback_score', async () => {
    const res = await fetch('http://localhost:3000/api/feedback', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ relationship_id: relId, rating: 4, note: 'Very useful.' }),
    });
    expect(res.status).toBe(200);
    const snap = await db.collection('relationships').doc(relId).get();
    expect(snap.data()?.feedback_score).toBeGreaterThan(0);
  });
});
```
**Pass criteria:** 200 response; `feedback_score` is non-zero after the call.

**Test P7-2 — RRI is recomputed and persisted after feedback**
```typescript
// tests/phase7/rri-recompute.test.ts
import { db } from '@/lib/firebase-admin';

describe('P7-2: Strength score recomputed after feedback', () => {
  let relId: string;

  beforeAll(async () => {
    const ref = await db.collection('relationships').add({
      entity_a_id: 'p1', entity_b_id: 'm1', strength_score: 0.60, feedback_score: 0,
      score_breakdown: { embedding_similarity: 0.6, engagement_score: 0.5, profile_match: 0.6 },
      interaction_history: [],
    });
    relId = ref.id;
  });
  afterAll(async () => { await db.collection('relationships').doc(relId).delete(); });

  it('should update strength_score after a 5-star rating', async () => {
    const original = 0.60;
    await fetch('http://localhost:3000/api/feedback', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ relationship_id: relId, rating: 5 }),
    });
    const snap = await db.collection('relationships').doc(relId).get();
    expect(snap.data()?.strength_score).not.toBe(original);
    expect(typeof snap.data()?.strength_score).toBe('number');
  });
});
```
**Pass criteria:** `strength_score` changes from its original value after 5-star rating.

**Test P7-3 — Feedback endpoint returns 400 for invalid inputs**
```typescript
// tests/phase7/validation.test.ts
describe('P7-3: Feedback validation', () => {
  it('should return 400 for rating = 0', async () => {
    const res = await fetch('http://localhost:3000/api/feedback', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ relationship_id: 'some-id', rating: 0 }),
    });
    expect(res.status).toBe(400);
  });
  it('should return 400 for rating = 6', async () => {
    const res = await fetch('http://localhost:3000/api/feedback', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ relationship_id: 'some-id', rating: 6 }),
    });
    expect(res.status).toBe(400);
  });
  it('should return 400 when relationship_id is missing', async () => {
    const res = await fetch('http://localhost:3000/api/feedback', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating: 3 }),
    });
    expect(res.status).toBe(400);
  });
});
```
**Pass criteria:** All three invalid inputs return 400. No 500 errors.

**🔁 Loop condition:** If P7-2 fails and the score doesn't change, the RRI recompute step is missing or not persisting. Check that `/api/feedback` calls `computeRRI` and then calls `doc.update({ strength_score: newRRI })` before responding.

---

### Phase 8 — Polish & Demo Prep (Hour 21–24)
**Goal:** Everything looks flawless for the live demo.

- [ ] Seed realistic demo data (3–5 participants, 3 mentors, 2 sponsors, 1 programme)
- [ ] Write a demo script (see Section 11 below)
- [ ] Fix loading states and error boundaries
- [ ] Add empty states for all lists
- [ ] Deploy to Cloud Run:
  ```bash
  gcloud run deploy linkuto --source . --platform managed --region asia-southeast1 --allow-unauthenticated
  ```
- [ ] Final walkthrough: sign-in → profile → match → graph → accept → email → done

#### 🧪 Phase 8 — Full End-to-End Integration Test Suite
> **AI IDE instruction:** This is the final gate. Run the complete E2E suite against the deployed Cloud Run URL (set `E2E_BASE_URL`) or localhost with seeded data. Every test must pass before the project is demo-ready. This suite simulates the exact judge demo flow from Section 11. Do NOT skip any test group. Fix, re-deploy if needed, and re-run until the full suite is green.

**Pre-flight: seed demo data**
```typescript
// tests/e2e/seed.ts — run once: npx ts-node tests/e2e/seed.ts
import { db } from '@/lib/firebase-admin';

async function seedDemoData() {
  const participant = await db.collection('entities').add({
    type: 'participant',
    profile_data: { name: 'PayX Startup', skills: ['Fintech', 'API Banking', 'B2B SaaS'], roles: ['Founder'], company_history: [], education: [], summary: 'B2B payment infrastructure startup raising Series A.' },
    embedding_vector: null, last_updated: new Date(),
  });
  const mentor = await db.collection('entities').add({
    type: 'mentor',
    profile_data: { name: 'Alice Chen', skills: ['Fintech', 'Payments', 'Fundraising'], roles: ['Partner'], company_history: [], education: [], summary: 'Fintech operator with 15 years in payments.' },
    embedding_vector: null, last_updated: new Date(),
  });
  const programme = await db.collection('programmes').add({
    status: 'active', participants: [participant.id], mentors: [mentor.id],
    sponsors: [], accepted_matches: [], outcomes: {},
  });
  console.log('Seed complete:', { participantId: participant.id, mentorId: mentor.id, programmeId: programme.id });
}
seedDemoData();
```

**E2E-1 — Profile ingestion returns complete profile**
```typescript
// tests/e2e/e2e.test.ts
const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

describe('E2E-1: Profile ingestion', () => {
  it('should enrich a manual profile with all required fields', async () => {
    const res = await fetch(`${BASE}/api/enrich-profile`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ manualFormInput: { name: 'E2E Founder', headline: 'CEO', skills: ['B2B SaaS'], experience: ['CEO (2022–present)'], education: ['NUS 2021'] } }),
    });
    expect(res.status).toBe(200);
    const { profile } = await res.json();
    ['name', 'roles', 'skills', 'company_history', 'education', 'summary'].forEach(f => {
      expect(profile[f]).toBeDefined();
    });
  }, 20000);
});
```
**Pass criteria:** All 6 profile fields defined; response in < 20s.

**E2E-2 — Embedding generated and persisted**
```typescript
describe('E2E-2: Embedding pipeline', () => {
  it('should generate and persist an embedding for the seeded participant', async () => {
    const res = await fetch(`${BASE}/api/generate-embedding`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity_id: process.env.E2E_PARTICIPANT_ID }),
    });
    expect(res.status).toBe(200);
    const { vector_length } = await res.json();
    expect(vector_length).toBeGreaterThan(0);
  }, 20000);
});
```
**Pass criteria:** 200 response; `vector_length > 0`.

**E2E-3 — Recommendation engine returns ranked results**
```typescript
describe('E2E-3: Recommendation engine', () => {
  it('should return at least one ranked mentor match', async () => {
    const res = await fetch(`${BASE}/api/recommend`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity_id: process.env.E2E_PARTICIPANT_ID, type: 'mentor' }),
    });
    expect(res.status).toBe(200);
    const { results } = await res.json();
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].score).toBeGreaterThan(0);
    expect(results[0].explanation.length).toBeGreaterThan(5);
    for (let i = 0; i < results.length - 1; i++) {
      expect(results[i].score).toBeGreaterThanOrEqual(results[i + 1].score);
    }
  }, 25000);
});
```
**Pass criteria:** Results non-empty; sorted descending; each has explanation.

**E2E-4 — Match acceptance creates relationship**
```typescript
describe('E2E-4: Match acceptance', () => {
  it('should accept a match and return a relationship_id', async () => {
    const res = await fetch(`${BASE}/api/accept-match`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entity_a_id: process.env.E2E_PARTICIPANT_ID,
        entity_b_id: process.env.E2E_MENTOR_ID,
        programme_id: process.env.E2E_PROGRAMME_ID,
        score: 0.88, explanation: 'E2E test match.',
      }),
    });
    expect(res.status).toBe(200);
    const { relationship_id } = await res.json();
    expect(relationship_id).toBeDefined();

    const { db } = await import('@/lib/firebase-admin');
    const snap = await db.collection('relationships').doc(relationship_id).get();
    expect(snap.exists).toBe(true);
    expect(snap.data()?.strength_score).toBe(0.88);
  }, 20000);
});
```
**Pass criteria:** 200 response; Firestore doc with `strength_score: 0.88`.

**E2E-5 — Feedback loop updates relationship score**
```typescript
describe('E2E-5: Feedback loop', () => {
  it('should update strength_score after a 5-star feedback', async () => {
    const { db } = await import('@/lib/firebase-admin');
    const snap = await db.collection('relationships')
      .where('entity_a_id', '==', process.env.E2E_PARTICIPANT_ID).limit(1).get();
    const relId = snap.docs[0]?.id;
    const originalScore = snap.docs[0]?.data().strength_score;

    const res = await fetch(`${BASE}/api/feedback`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ relationship_id: relId, rating: 5, note: 'Excellent match.' }),
    });
    expect(res.status).toBe(200);
    const updated = await db.collection('relationships').doc(relId).get();
    expect(updated.data()?.feedback_score).toBeGreaterThan(0);
    expect(updated.data()?.strength_score).not.toBe(originalScore);
  }, 20000);
});
```
**Pass criteria:** `feedback_score > 0`; `strength_score` changes from original.

**E2E-6 — All routes accessible**
```typescript
describe('E2E-6: Route accessibility', () => {
  const routes = ['/dashboard/organiser', '/dashboard/participant', '/dashboard/mentor', '/graph'];
  routes.forEach(route => {
    it(`should return 200 for ${route}`, async () => {
      const res = await fetch(`${BASE}${route}`);
      expect(res.status).toBe(200);
    });
  });
});
```
**Pass criteria:** All four routes return 200.

**E2E-7 — API response times within SLA**
```typescript
describe('E2E-7: Performance SLA', () => {
  it('recommendations respond in < 2000ms', async () => {
    const start = Date.now();
    await fetch(`${BASE}/api/recommend`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity_id: process.env.E2E_PARTICIPANT_ID, type: 'mentor' }),
    });
    expect(Date.now() - start).toBeLessThan(2000);
  });
  it('profile enrichment completes in < 10000ms', async () => {
    const start = Date.now();
    await fetch(`${BASE}/api/enrich-profile`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ manualFormInput: { name: 'Speed Test', headline: 'Eng', skills: ['TS'], experience: [], education: [] } }),
    });
    expect(Date.now() - start).toBeLessThan(10000);
  });
});
```
**Pass criteria:** Recommendation < 2s; enrichment < 10s.

**E2E-8 — No unhandled 500 errors on invalid inputs**
```typescript
describe('E2E-8: No unhandled 500 errors', () => {
  const endpoints = [
    '/api/enrich-profile', '/api/recommend', '/api/accept-match', '/api/feedback',
  ];
  endpoints.forEach(url => {
    it(`${url} returns 4xx (not 500) for empty body`, async () => {
      const res = await fetch(`${BASE}${url}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      expect(res.status).not.toBe(500);
    });
  });
});
```
**Pass criteria:** All four routes return 400/422 — never 500 — for empty input.

**🏁 Final gate:** All 8 E2E test groups must be green before the project is demo-ready.
1. If any group fails, identify which phase introduced the regression using its phase-specific test suite
2. Fix in isolation, then re-run only the failing E2E group
3. Once green, run the full E2E suite one final time to confirm no regressions
4. Deploy to Cloud Run and re-run E2E-6 and E2E-7 against the live URL before walking on stage

Run this script during the live demo. Total time: ~4 minutes.

1. **[0:00]** Open the app. Sign in with Google. Show the Organiser dashboard with a pre-seeded programme of 10 participants.
2. **[0:30]** Click "Add Participant". Paste a LinkedIn URL. Watch the profile auto-generate in ~8 seconds.
3. **[1:00]** Click "Generate Matches". Watch ranked mentor cards appear with scores and explanations.
4. **[1:30]** Click into a match card. Read the explanation aloud. Highlight the score breakdown.
5. **[2:00]** Click "Accept Match". Show the Gmail notification that arrives in real time. Show the Calendar invite.
6. **[2:30]** Navigate to the Relationship Graph. Show the animated graph. Click a node. Click an edge to show RRI breakdown.
7. **[3:00]** Switch to Participant view. Show their recommendation feed.
8. **[3:30]** Wrap up: *"LINKUTO replaces spreadsheets with a self-learning ecosystem graph. Every match is scored, explained, and improves over time."*

---

## 12. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Recommendation API response time | < 2 seconds |
| Profile enrichment time | < 10 seconds |
| Uptime (Cloud Run) | 99% |
| Auth | Firebase Google Sign-In |
| Data privacy | User can edit or delete their profile at any time |
| Explainability | Every AI-generated match includes a plain-English explanation |

---

## 13. Out of Scope (Hackathon Build)

- Mobile apps (web only)
- Real-time chat or social feeds
- Fully autonomous decision-making without organiser approval
- Advanced financial tracking for sponsors
- Blockchain identity layer
- Large-scale distributed ML training

---

## 14. File Structure

```
linkuto/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── dashboard/
│   │   ├── organiser/page.tsx
│   │   ├── participant/page.tsx
│   │   └── mentor/page.tsx
│   ├── programme/
│   │   └── [id]/page.tsx
│   ├── graph/page.tsx
│   └── api/
│       ├── enrich-profile/route.ts
│       ├── generate-embedding/route.ts
│       ├── recommend/route.ts
│       ├── accept-match/route.ts
│       └── feedback/route.ts
├── lib/
│   ├── firebase-admin.ts
│   ├── gemini.ts
│   ├── scraper.ts          ← Playwright + Cheerio
│   ├── embeddings.ts
│   ├── rri.ts              ← RRI scoring formula
│   └── google-apis.ts      ← Calendar + Gmail
├── components/
│   ├── MatchCard.tsx
│   ├── EntityGraph.tsx      ← React Flow wrapper
│   ├── ProfileForm.tsx
│   └── DashboardLayout.tsx
├── .env.local
└── package.json
```
