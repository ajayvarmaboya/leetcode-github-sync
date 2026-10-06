# LeetCode GitHub Sync

> Automatically capture accepted LeetCode solutions and synchronize them to a structured GitHub repository.

LeetCode GitHub Sync is a Chrome Extension designed to automate the repetitive process of saving accepted LeetCode solutions to GitHub.

The extension monitors LeetCode submissions, detects accepted solutions, extracts the submitted source code directly from LeetCode's Monaco editor, and prepares the submission for synchronization with GitHub.

The project is being developed incrementally using an MVP-first approach.

---

## 🚧 Project Status

**Current Phase: Phase 1 — LeetCode Solution Ingestion**

### Phase 1 Status

- [x] Chrome Manifest V3 extension
- [x] LeetCode page detection
- [x] Submission detection
- [x] Accepted submission detection
- [x] Submission ID extraction
- [x] Monaco editor integration
- [x] Source-code extraction
- [x] Programming language extraction
- [x] Submission payload generation
- [x] Content Script → Service Worker communication
- [x] Duplicate event prevention
- [x] Tested with real LeetCode submission

### Upcoming

- [ ] GitHub authentication
- [ ] GitHub repository detection
- [ ] GitHub repository configuration
- [ ] GitHub file creation
- [ ] GitHub file update
- [ ] Automatic commits
- [ ] Duplicate synchronization prevention
- [ ] Sync history
- [ ] Retry mechanism
- [ ] Notifications
- [ ] Production hardening
- [ ] Chrome Web Store deployment

---

# 1. Problem Statement

Developers frequently solve programming problems on LeetCode but manually maintain their solutions in GitHub.

The traditional workflow looks like this:

```text
LeetCode
   ↓
Solve Problem
   ↓
Submit
   ↓
Accepted
   ↓
Copy Source Code
   ↓
Create File
   ↓
Open GitHub
   ↓
Paste Code
   ↓
Commit
This process becomes repetitive as the number of solved problems increases.
The goal of this project is to automate the entire workflow:
                    ┌──────────────┐
                    │   LeetCode   │
                    └──────┬───────┘
                           │
                       Submit
                           │
                           ▼
                    ┌──────────────┐
                    │   Accepted   │
                    └──────┬───────┘
                           │
                           ▼
                 ┌────────────────────┐
                 │ Submission Detector│
                 └─────────┬──────────┘
                           │
                           ▼
                 ┌────────────────────┐
                 │  Monaco Code       │
                 │  Extraction        │
                 └─────────┬──────────┘
                           │
                           ▼
                 ┌────────────────────┐
                 │  Chrome Extension  │
                 │  Service Worker    │
                 └─────────┬──────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │    GitHub    │
                    │     API      │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   leetcode   │
                    │  repository  │
                    └──────────────┘


🎯 Project Goals
The primary goal is to build a reliable developer productivity tool that connects:
- LeetCode
- Chrome Extension APIs
- Monaco Editor
- GitHub
- GitHub REST API
The completed system will allow a developer to solve a problem on LeetCode and have the accepted solution automatically saved to GitHub without manually copying the code.

| Technology | Purpose |
|---|---|
| JavaScript | Extension logic |
| HTML | Popup/UI structure |
| CSS | Extension UI styling |
| Chrome Manifest V3 | Extension platform |
| Chrome Content Scripts | LeetCode page interaction |
| Chrome Service Worker | Background processing |
| Chrome Runtime API | Component communication |
| Chrome Storage API | Configuration and state |
| Monaco Editor API | Source-code extraction |
| `window.postMessage()` | MAIN-world ↔ isolated-world communication |
| GitHub REST API | GitHub integration |
| GitHub App / OAuth | Authentication |
| Git | Version control |
| GitHub Actions | Future CI/CD |
