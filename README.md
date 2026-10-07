# JobTrack — Intelligent Job Application Tracker

A premium, privacy-conscious Chrome Extension for tracking job applications across any job site with intelligent structured extraction and an organized application pipeline.

Built with **Manifest V3**, **TypeScript**, **React**, **Vite**, and **Tailwind CSS**.

---

## Key Features

1. **Explicit, User-Initiated Tracking Only**:
   - Never auto-tracks or monitors arbitrary pages.
   - You stay in complete control: tracking happens **only** when you click **"Track this application"**, press `Alt+Shift+J`, or choose it from the context menu.
2. **Semantic & Structured Extraction**:
   - Parses `JSON-LD` (`schema.org/JobPosting`), page metadata, OpenGraph tags, and main semantic content.
   - Cleans noise (scripts, styles, navigation, footer, advertisements) before sending to LLM.
3. **Multi-Provider LLM Abstraction**:
   - **Google Gemini** (`gemini-1.5-flash`, `gemini-2.0-flash`, etc.)
   - **OpenAI / OpenAI-Compatible** (`gpt-4o-mini`, `gpt-4o`, Groq, Ollama, OpenRouter)
   - **Anthropic** (`claude-3-5-haiku-latest`, `claude-3-5-sonnet-latest`)
   - **Custom / Local Proxy**
   - **Offline Heuristic Engine**: Zero API key required! Extracts company, role, salary, and location locally with high accuracy.
4. **Anti-Hallucination & Factual Grounding**:
   - Unknown values remain `"Not specified"` or `null`. Never fabricates CTC, interview dates, or recruiter contacts.
   - Generates a concise, factual 2-line job summary (nature of work + core requirements, zero generic marketing hype).
5. **Pre-Save Confirmation Surface**:
   - Review and edit every detected field before saving to your pipeline.
6. **Smart Duplicate Detection**:
   - Matches candidate applications by normalized URL or Company + Role.
   - Alerts you if an application already exists with options to open it or update existing details.
7. **Actionable Application Pipeline & Timeline**:
   - 10 status stages: Applied, Screening, Assessment, Interview, Technical Interview, HR Interview, Offer, Rejected, Withdrawn, On Hold.
   - High-visibility **Next Step** tracking with date indicators.
   - Lightweight stage timeline with manual event logging.
8. **Power User Controls**:
   - Command Palette (`Ctrl/Cmd + K`) for instant navigation and actions.
   - Keyboard shortcuts (`Alt+Shift+J` to track, `Alt+Shift+P` for side panel).
   - Fast instant search across company, role, skills, and personal notes.
9. **Full Backup & Portability**:
   - One-click export to **JSON** (full record schema) and **CSV** (spreadsheet-ready).
   - JSON import with pre-flight analysis (new, updated, and duplicate counts).
   - Sample data loader for instant feature exploration.
10. **Triple Surface Experience**:
    - **Extension Popup**: Compact quick action surface with 1-click active tab tracking and pipeline snapshot.
    - **Chrome Side Panel**: Persistent docked workflow alongside job boards.
    - **Dedicated Dashboard Tab**: Full-screen workspace for reviewing and organizing applications.

---

## Visual Design Discipline

- **No AI Slop**: Strict policy against gratuitous purple/blue gradients, glowing neon borders, glassmorphism overload, and decorative robot/sparkle illustrations.
- **Restrained Typography & Tokens**: Refined slate/charcoal monochrome palette with semantic status indicators (Emerald for Offers, Amber for Assessments/Next steps, Sky for Interviews, Rose for Rejections).
- **Subtle Microinteractions**: 120–200ms transitions, accessible focus rings, and reduced-motion support (`prefers-reduced-motion`).

---

## Installation & Setup

### Prerequisites
- Node.js (v18 or newer)
- Google Chrome or Chromium-based browser (Brave, Edge, Arc)

### 1. Build the Extension
```bash
# Install dependencies
npm install

# Build production bundle
npm run build
```
The output directory will be created at `dist/`.

### 2. Load into Chrome
1. Open Chrome and navigate to `chrome://extensions/`.
2. Toggle on **Developer mode** in the top right corner.
3. Click **Load unpacked**.
4. Select the `dist` folder located inside the project:
   `...\jobtrack\dist`
5. The **JobTrack** icon will appear in your Chrome toolbar. Pin it for quick access!

---

## Configuring AI Extraction

1. Click the **JobTrack** icon and open **Settings** (slider icon ⚙️).
2. Select your preferred provider:
   - **OpenRouter** (e.g. `openrouter/free`, Llama 3, etc.):
     - Base URL: `https://openrouter.ai/api/v1`
     - Model: `openrouter/free` (or any model of your choice)
     - API Key: Your OpenRouter key (`sk-or-v1-...`)
   - **Google Gemini**: Get a free API key from [Google AI Studio](https://aistudio.google.com/).
   - **OpenAI**: Enter your OpenAI API key or a custom compatible endpoint.
   - **Anthropic**: Enter your Anthropic API key.
   - **Offline Heuristic Engine**: Works completely offline without an API key.
3. Click **Test Connection** to verify your credentials.
4. Click **Save Settings**. API keys are saved securely in `chrome.storage.local` on your machine.

You can also define these in a local `.env` file before building:
```env
LLM_BASE_URL=https://openrouter.ai/api/v1
LLM_API_KEY=your_key
LLM_MODEL=openrouter/free
```

---

## Development

```bash
# Run dev build or preview
npm run dev

# Re-generate PNG icons (16, 32, 48, 128)
node scripts/generate-icons.js

# Build production bundle
npm run build
```

---

## Project Structure

```text
jobtrack/
├── manifest.json              # Chrome Manifest V3 declaration
├── package.json               # Dependencies and build scripts
├── vite.config.ts             # Multi-entry Vite bundler configuration
├── tailwind.config.js         # Design tokens, neutral palette, dark mode
├── CHROMEWEBSTORE.md          # Web Store listing, permissions & privacy docs
├── public/
│   ├── manifest.json
│   └── icons/                 # Generated PNG icons (16, 32, 48, 128)
├── src/
│   ├── background/
│   │   └── service-worker.ts  # Manifest V3 service worker (ephemeral)
│   ├── content/
│   │   └── content-script.ts  # Noise-free DOM & JSON-LD extractor
│   ├── lib/
│   │   ├── storage.ts         # chrome.storage.local with localStorage fallback
│   │   ├── duplicate.ts       # URL & company/role duplicate detector
│   │   ├── normalizer.ts      # URL cleaning, relative dates, CTC parser
│   │   ├── export-import.ts   # CSV & JSON export/import engine
│   │   ├── demo-data.ts       # Realistic sample dataset
│   │   ├── extraction/
│   │   │   ├── tab-runner.ts  # Active tab execution coordinator
│   │   │   └── heuristics.ts  # Offline heuristic & JSON-LD parser
│   │   └── llm/
│   │       ├── provider.ts    # Provider abstraction & fallback orchestrator
│   │       ├── prompt.ts      # Anti-hallucination extraction prompt
│   │       ├── gemini.ts      # Gemini API implementation
│   │       ├── openai.ts      # OpenAI API implementation
│   │       ├── anthropic.ts   # Anthropic API implementation
│   │       └── json-cleaner.ts# Robust JSON repair & cleaner
│   ├── types/
│   │   ├── application.ts     # Data model & application statuses
│   │   ├── settings.ts        # Provider & user settings
│   │   └── extractor.ts       # Extraction types
│   ├── components/
│   │   ├── Header.tsx         # Top bar with controls and theme toggle
│   │   ├── StatsOverview.tsx  # Scannable pipeline counters
│   │   ├── ApplicationCard.tsx# Expandable application cards
│   │   ├── ApplicationDetail.tsx # 2-line summary, timeline, notes
│   │   ├── ApplicationFormModal.tsx # Manual add & full edit modal
│   │   ├── TrackConfirmModal.tsx    # Pre-save confirmation surface
│   │   ├── SettingsModal.tsx  # API config, export/import, danger zone
│   │   ├── CommandPalette.tsx # Cmd/Ctrl + K command launcher
│   │   └── ui/                # Tactile Button, Input, Modal primitives
│   ├── popup/                 # Compact extension popup
│   ├── sidepanel/             # Chrome side panel view
│   └── dashboard/             # Fullscreen dashboard view
```

---

## Permissions & Privacy Policy

- **`storage`**: Used exclusively to store job application records and user preferences locally on your browser.
- **`tabs`**: Used only when you trigger tracking to obtain the active tab's URL and title.
- **`scripting`**: Injects the extractor into the active tab solely upon user click.
- **`sidePanel`**: Provides the persistent side panel view for multi-tasking while browsing jobs.
- **`contextMenus`**: Adds a right-click option to track the current page.

JobTrack does **not** track your browsing history, run continuous background scrapers, or transmit your personal data to remote advertising or analytics services.
