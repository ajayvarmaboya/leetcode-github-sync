# LeetCode GitHub Sync

Automatically sync accepted LeetCode solutions to a GitHub repository
from a Chrome Manifest V3 extension.

> **Status (7 October 2026):** Active development. GitHub OAuth, GitHub
> App installation, repository access, and GitHub API read verification
> are working. Automatic solution-file creation is the next milestone.

## Current workflow

``` text
LeetCode
   ↓
Content scripts detect accepted submission
   ↓
Chrome service worker
   ↓
GitHub OAuth + PKCE
   ↓
Spring Boot backend (:8081)
   ↓
GitHub access token
   ↓
GitHub REST API
   ↓
ajayvarmaboya/leetcode
```

## Completed

-   [x] Chrome Manifest V3 extension
-   [x] Popup UI
-   [x] Background service worker
-   [x] LeetCode page detection
-   [x] Accepted-submission event pipeline
-   [x] GitHub App
-   [x] Contents: Read and write permission
-   [x] Metadata: Read-only permission
-   [x] Chrome Identity API
-   [x] GitHub OAuth
-   [x] PKCE S256
-   [x] OAuth state validation
-   [x] Spring Boot authentication backend
-   [x] Backend running on port 8081
-   [x] Server-side GitHub client secret
-   [x] GitHub token exchange
-   [x] GitHub App installation
-   [x] Access to `ajayvarmaboya/leetcode`
-   [x] `/user` API verification
-   [x] Repository API verification

## Not yet implemented

-   [ ] GitHub file creation
-   [ ] GitHub file update
-   [ ] Duplicate protection
-   [ ] Language-to-extension mapping
-   [ ] Deterministic solution paths
-   [ ] Commit-message generation
-   [ ] Sync notifications
-   [ ] Retry queue
-   [ ] Token refresh lifecycle
-   [ ] Automated tests
-   [ ] CI/CD
-   [ ] Production deployment
-   [ ] Chrome Web Store release

## Repository structure

``` text
leetcode-github-sync/
├── backend/
│   └── leetcode-github-auth/
├── extension/
│   ├── manifest.json
│   └── src/
│       ├── background/
│       ├── content/
│       ├── github/
│       ├── popup/
│       ├── storage/
│       └── utils/
├── icons/
├── tests/
├── .gitignore
└── PHASE-1-DEVELOPMENT-REPORT.md
```

## Extension modules

### Content scripts

``` text
extractor.js
leetcode.js
monaco-bridge.js
submission-detector.js
```

### GitHub

``` text
github-auth.js
github-api.js
```

### Popup

``` text
popup.html
popup.js
```

## Backend

``` text
Java
Spring Boot
Maven
Port: 8081
```

Environment variables:

``` text
GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET
```

The real client secret must never be committed to Git or included in
extension JavaScript.

## OAuth architecture

``` text
Popup
  ↓
Service Worker
  ↓
chrome.identity.launchWebAuthFlow()
  ↓
GitHub authorization
  ↓
Chrome extension callback
  ↓
Validate state
  ↓
PKCE code_verifier
  ↓
POST /api/auth/github/exchange
  ↓
Spring Boot
  ↓
GitHub access-token endpoint
  ↓
Store token in Chrome storage
```

## Current verified result

The development API test currently produces:

``` text
GitHub user: ajayvarmaboya
GitHub repository: ajayvarmaboya/leetcode
```

This proves authentication and repository read access. It does not yet
prove that the extension can write a solution file.

## Next milestone

First implement a controlled GitHub write test:

``` text
ajayvarmaboya/leetcode
└── test/
    └── github-sync-test.txt
```

Then connect the write operation to:

``` text
LEETCODE_SUBMISSION_ACCEPTED
        ↓
extract code + metadata
        ↓
generate path
        ↓
create/update GitHub file
        ↓
commit
        ↓
notify user
```

## Security

-   Keep the GitHub client secret in the backend.
-   Use OAuth state validation.
-   Use PKCE.
-   Request only required GitHub permissions.
-   Never log tokens, secrets, or authorization codes.
-   Keep `.env` and other secret files out of Git.
-   Use HTTPS in production.
-   Add token refresh/revocation handling before production release.

## Technology stack

  Layer                Technology
  -------------------- -------------------------
  Browser Extension    Chrome Manifest V3
  Language             JavaScript
  UI                   HTML + CSS
  Background           Chrome Service Worker
  Storage              Chrome Storage API
  Authentication       GitHub App + OAuth/PKCE
  Backend              Java + Spring Boot
  GitHub integration   GitHub REST API
  Build                Maven
  Testing              Jest + Chrome E2E
  CI/CD                GitHub Actions
  Distribution         Chrome Web Store

## Long-term success criteria

``` text
Solve on LeetCode
      ↓
Submit
      ↓
Accepted ✓
      ↓
Extension detects acceptance
      ↓
Extract solution
      ↓
Create/update GitHub file
      ↓
Commit
      ↓
Notify user
```

The original project specification defines this automatic
accepted-submission-to-GitHub-commit workflow as the final target.
