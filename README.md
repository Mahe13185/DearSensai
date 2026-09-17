# DEARSENSAI (ディア・センセイ)
> **Tagline:** *"Learn. Recall. Improve."*  
> **Mission:** A personal, offline-first active recall & revision engine built for daily high-retention mastery across Mobile (bus, 1-handed, touch-first) and Laptop (deep study, content authoring).

---

## ⚡ Core Value Proposition & UX Flow

Traditional note apps store information you read once and forget. **DEARSENSAI** is an active recall test companion that keeps concepts fresh in your long-term memory:

```
LEARN ──> RECALL ──> TEST ──> MAKE MISTAKES ──> REVIEW ──> REMEMBER ──> REPEAT
```

- **Zero-Friction Revision**: Open app $\rightarrow$ Tap **"5 Min Sprint"** or **"10 Min Bus Mode"** $\rightarrow$ Immediate active recall.
- **Offline-First (Dexie.js / IndexedDB)**: Runs 100% locally with zero network requirement. Answers, attempts, and schedules update instantly in $< 5\text{ms}$.
- **Spaced Repetition Scheduler**: Pluggable SM-2 algorithm predicting optimal recall intervals (`Again`, `Hard`, `Good`, `Easy`).
- **Diverse Revision Formats**:
  - **Flashcards**: Front prompt with flip/reveal mechanics.
  - **Concept Questions**: "Think first & recall" before revealing the conceptual model.
  - **Logic Questions**: Testing algorithmic invariants, pointer strategies, and time/space trade-offs.
  - **Why Questions**: Deep understanding (e.g. *Why does binary search require a sorted space?*).
  - **Code Recall (Level 1–4)**: Interactive blank-filling and skeleton completions for DSA and Java.
  - **Mistakes Vault**: Automatically aggregates lapsed items for targeted drills.
  - **Sensai Quick Tips**: Bite-sized high-leverage mental models.

---

## 📱 Mobile vs 💻 Laptop Experience

| Feature | 📱 Mobile Phone ("Bus Mode") | 💻 Laptop / Desktop Workbench |
| :--- | :--- | :--- |
| **Navigation** | Bottom navigation bar (`Home`, `Review`, `Library`, `Mistakes`, `Settings`) | Collapsible left sidebar with full hierarchy explorer |
| **Touch Optimization** | Large 48px+ thumb targets, quick 1-tap option tokens for code blanks | Full keyboard shortcuts (`1`, `2`, `3`, `4` to rate, `Space` to flip) |
| **Primary Action** | 1-tap **5m Sprint** / **10m Bus Mode** | Deep 30m study sessions, split-pane library browsing |
| **Offline Resilience** | IndexedDB cache with background sync outbox queue | IndexedDB + full JSON export/backup manager |

---

## 🚀 Getting Started

### Prerequisites
- Node.js `v18+` or `v20+`
- npm `v9+` or `v10+`

### Running the Development Server
```bash
# Install dependencies (if not already installed)
cd frontend
npm install

# Start local dev server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 📦 Project Architecture

```
DearSensai/
├── README.md
├── package.json                   # Root monorepo scripts
│
├── frontend/                      # Web / PWA Client (Vite + React + TypeScript)
│   ├── public/
│   │   ├── icon.svg               # Vector brand icon
│   │   └── manifest.webmanifest   # PWA manifest
│   └── src/
│       ├── core/                  # Core domain models & SRS engine
│       │   ├── types/             # Subject, Topic, RevisionItem, Attempt, Rating
│       │   └── scheduler/srs.ts   # SM-2 interval & ease factor calculation
│       ├── storage/               # Offline-First Persistence Layer
│       │   ├── db.ts              # Dexie.js IndexedDB schema
│       │   ├── seed.ts            # Realistic starter data (DSA, Java, Spring Boot)
│       │   └── repositories/      # Local repository abstractions & JSON backup
│       ├── sync/                  # Outbox Queue & Network status monitor
│       ├── components/            # Layout (Mobile & Desktop) & Card Viewers
│       │   ├── layout/AppShell.tsx
│       │   └── revision/          # Flashcard, Concept, Logic, CodeRecall, Rating bar
│       ├── screens/               # Dashboard, RevisionSession, Library, Mistakes, Progress, Settings
│       ├── index.css              # Japanese slate minimalist design system
│       └── App.tsx                # App root coordinator
│
└── backend/                       # (Phase 2) Spring Boot 3 + JPA REST Sync Service
```

---

## 🔒 Data Portability & Privacy

DEARSENSAI is built for **private, personal daily use**.
- Export your entire knowledge base, attempts history, and schedules as clean JSON from the **Settings** screen.
- Restore from a backup at any time. You are never locked in.
