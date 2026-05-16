# eve — Product Requirements Document
### Ecosystem Relationship Intelligence Platform
**Version:** 2.0 (Solo Hackathon Build) | **Target:** < 24 Hours | **Judging:** Live Demo

---

## 0. What is eve?

Eve is a vertical B2B SaaS platform that replaces spreadsheets and manual effort in innovation ecosystem coordination. It serves accelerators, incubators, and programme organisers who need to match participants, mentors, and sponsors — intelligently and at scale.

At its core, eve is a **living relationship graph**: every participant, mentor, sponsor, and programme is a structured entity. Every interaction becomes a scored, explainable relationship that improves over time. When a new participant joins, eve automatically builds their profile from LinkedIn, compares them against the ecosystem using AI embeddings, and returns ranked, evidence-backed match recommendations.

**The problem it solves:** At 20 participants, manual matching is manageable. At 100+, it breaks down completely. Eve makes it programmable.

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
| Gemini 2.5 Flash | Profile enrichment, structured JSON extraction, match explanations |
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

Eve has three conceptual layers:

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

Eve uses controlled, user-initiated profile extraction — not unauthorised scraping. The user triggers extraction themselves and is in full control.

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

- [ ] `npx create-next-app@latest eve --typescript --tailwind --app`
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
    const model = genai.getGenerativeModel({ model: 'gemini-2.5-flash' });
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

- [ ] Use Framer Motion for:
  - Page load stagger animations
  - Card hover states
  - Accept/Decline interaction feedback

**Demo checkpoint:** Full organiser → participant → mentor flow walkable in live demo

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
      summary: `Eve Match: ${mentorName} × ${startupName}`,
      start: { dateTime: new Date(Date.now() + 86400000).toISOString() },
      end: { dateTime: new Date(Date.now() + 90000000).toISOString() },
      attendees: [{ email: mentorEmail }, { email: participantEmail }]
    }
  });
  ```
- [ ] Store match as relationship document in Firestore
- [ ] Update programme document with accepted match

**Demo checkpoint:** Click "Accept Match" → judge sees a real Gmail + Calendar invite appear live

---

### Phase 7 — Feedback Loop (Hour 19–21)
**Goal:** Post-interaction feedback that updates the relationship score.

- [ ] Simple feedback form (1–5 star rating + optional note)
- [ ] `POST /api/feedback` endpoint updates:
  - `feedback_score` on relationship document
  - Triggers RRI recomputation
  - Updates entity engagement scores
- [ ] Show updated score on relationship card

---

### Phase 8 — Polish & Demo Prep (Hour 21–24)
**Goal:** Everything looks flawless for the live demo.

- [ ] Seed realistic demo data (3–5 participants, 3 mentors, 2 sponsors, 1 programme)
- [ ] Write a demo script (see Section 11 below)
- [ ] Fix loading states and error boundaries
- [ ] Add empty states for all lists
- [ ] Deploy to Cloud Run:
  ```bash
  gcloud run deploy eve --source . --platform managed --region asia-southeast1 --allow-unauthenticated
  ```
- [ ] Final walkthrough: sign-in → profile → match → graph → accept → email → done

---

## 11. Demo Script (Live Judging)

Run this script during the live demo. Total time: ~4 minutes.

1. **[0:00]** Open the app. Sign in with Google. Show the Organiser dashboard with a pre-seeded programme of 10 participants.
2. **[0:30]** Click "Add Participant". Paste a LinkedIn URL. Watch the profile auto-generate in ~8 seconds.
3. **[1:00]** Click "Generate Matches". Watch ranked mentor cards appear with scores and explanations.
4. **[1:30]** Click into a match card. Read the explanation aloud. Highlight the score breakdown.
5. **[2:00]** Click "Accept Match". Show the Gmail notification that arrives in real time. Show the Calendar invite.
6. **[2:30]** Navigate to the Relationship Graph. Show the animated graph. Click a node. Click an edge to show RRI breakdown.
7. **[3:00]** Switch to Participant view. Show their recommendation feed.
8. **[3:30]** Wrap up: *"Eve replaces spreadsheets with a self-learning ecosystem graph. Every match is scored, explained, and improves over time."*

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
eve/
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
