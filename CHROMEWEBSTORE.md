# Chrome Web Store Listing — JobTrack

> Last Updated: 2026-10-06

## Store Listing

**Extension Name** [REQUIRED]
JobTrack - Intelligent Job Application Tracker

**Short Description** [REQUIRED]
Manually track job applications from any job board with intelligent structured extraction and an organized pipeline.

**Detailed Description** [REQUIRED]
JobTrack is a fast, privacy-focused productivity tool for job seekers. While browsing jobs across LinkedIn, Indeed, Naukri, Greenhouse, Lever, or company career portals, track your applications directly into a unified dashboard with a single click.

Key Features:
- Explicit, user-initiated tracking: Never auto-scrapes or monitors your browsing history. Only captures data when you explicitly click "Track this application".
- Intelligent extraction: Reads job titles, company names, locations, CTC / salary compensation, and application deadlines from the active page using structured metadata and AI.
- Anti-hallucination guarantee: Does not guess missing information. Unknown salaries and dates remain unstated until you update them.
- Pre-save confirmation surface: Review and edit all extracted details before saving into your dashboard.
- Duplicate detection: Prevents duplicate records if you browse a previously tracked job listing.
- Application status & timeline: Track each stage—from Applied and Screening to Assessment, Interview, and Offer.
- Actionable next steps: Keep critical dates, upcoming online assessments, and interview schedules visible at a glance.
- Fast search & filters: Instant search by role, company, skills, or personal notes.
- Data export & import: Export your entire pipeline anytime in spreadsheet-friendly CSV or structured JSON.
- Works offline: Features a built-in heuristic extraction engine that requires no external API key.

How to use JobTrack:
1. Open any job listing on the web.
2. Click the JobTrack extension icon, press Alt+Shift+J, or right-click to choose "Track application with JobTrack".
3. Review the extracted company, role, salary, and status in the confirmation modal.
4. Click "Track Application" to save it to your pipeline.
5. Open the Side Panel or Full Dashboard anytime to track your progress and manage interviews.

Privacy & Permissions:
JobTrack stores all job applications locally in your browser storage. It does not sell user data, track web history, or send background requests without your explicit action.

**Category** [REQUIRED]
Productivity

**Single Purpose** [REQUIRED]
Enables job seekers to track and organize job applications from web listings into a personal application dashboard.

**Primary Language** [REQUIRED]
English

---

## Graphics & Assets

| Asset | Dimensions | Status | Filename |
|-------|-----------|--------|----------|
| Store Icon [REQUIRED] | 128×128 PNG | ✅ Ready | `public/icons/icon-128.png` |
| Screenshot 1 [REQUIRED] | 1280×800 | 🟡 Prepared | `dashboard-view.png` |
| Screenshot 2 [RECOMMENDED] | 1280×800 | 🟡 Prepared | `sidepanel-track.png` |
| Screenshot 3 [RECOMMENDED] | 1280×800 | 🟡 Prepared | `popup-view.png` |

---

## Permissions Justification

| Permission | Type | Justification |
|------------|------|---------------|
| `storage` | permissions | Stores application records, stage timelines, user notes, and configuration locally on the user device. |
| `tabs` | permissions | Reads the URL and page title of the active tab to extract job listing metadata when the user chooses to track an application. |
| `scripting` | permissions | Executes the page content extraction script on the active tab solely upon the user explicitly clicking 'Track this application'. |
| `sidePanel` | permissions | Renders the JobTrack side panel interface alongside job browsing tabs. |
| `contextMenus` | permissions | Provides a right-click context menu shortcut to track the active job listing. |
| `http://*/*`, `https://*/*` | host_permissions | Required to analyze job descriptions and structured JSON-LD across arbitrary company career portals and job sites when user initiates tracking. |

---

## Privacy & Data Use

### Data Collection

**Does the extension collect user data?** No remote tracking. All application records remain stored locally on the user's browser via chrome.storage.local unless the user explicitly configures an AI API key for text extraction.

| Data Type | Collected? | Transmitted Off-Device? | Purpose | Shared with Third Parties? |
|-----------|-----------|------------------------|---------|---------------------------|
| Personally identifiable info | No | No | N/A | No |
| Health info | No | No | N/A | No |
| Financial info | No | No | N/A | No |
| Authentication info | No | Only to configured LLM endpoint if user enters an API key | AI extraction | No |
| Personal communications | No | No | N/A | No |
| Location | No | No | N/A | No |
| Web history | No | No | N/A | No |
| User activity | No | No | N/A | No |
| Website content | Only on user click | Only to user's configured LLM API for job extraction | Job parsing | No |

### Data Use Certification
- [x] Data is NOT sold to third parties
- [x] Data is NOT used for purposes unrelated to the extension's core functionality
- [x] Data is NOT used for creditworthiness or lending purposes

---

## Version History

| Version | Date | Changes | Status |
|---------|------|---------|--------|
| 1.0.0 | 2026-10-06 | Initial production release with side panel, popup, dashboard, LLM provider abstraction, and CSV/JSON export. | Ready |
