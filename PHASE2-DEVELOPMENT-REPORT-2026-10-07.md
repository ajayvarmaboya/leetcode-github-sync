# LeetCode GitHub Sync --- Development Report

## Date

**7 October 2026**

## Executive summary

Today's development moved the project from a working LeetCode detection
prototype to a working GitHub-integrated Chrome extension foundation.

The following path is now verified:

``` text
Chrome Extension
      ↓
GitHub OAuth
      ↓
Spring Boot token exchange
      ↓
GitHub access token
      ↓
GitHub REST API
      ↓
Authenticated user
      ↓
ajayvarmaboya/leetcode
```

The original project specification identifies the final MVP as automatic
accepted LeetCode submission → solution extraction → GitHub
authentication → file creation/update → commit. Today's work completed
the authentication and repository-access portion of that workflow.

## 1. Objectives completed today

-   Implement GitHub authentication.
-   Protect the GitHub App client secret with a Spring Boot backend.
-   Configure OAuth callback handling.
-   Implement PKCE.
-   Validate OAuth state.
-   Install the GitHub App.
-   Grant repository access.
-   Store the returned access token.
-   Add GitHub REST API helpers.
-   Verify the authenticated GitHub user.
-   Verify the target `leetcode` repository.

## 2. Existing LeetCode foundation

The project already contained these content modules:

``` text
extension/src/content/
├── extractor.js
├── leetcode.js
├── monaco-bridge.js
└── submission-detector.js
```

The service worker already received:

``` text
LEETCODE_PAGE_LOADED
LEETCODE_SUBMISSION_ACCEPTED
```

The LeetCode page detection was verified before the GitHub work began.

## 3. Final development architecture

``` text
┌──────────────────────────────┐
│           LeetCode           │
│ Problem / Editor / Submit    │
└──────────────┬───────────────┘
               ↓
┌──────────────────────────────┐
│      Chrome Extension        │
│                              │
│ Content Scripts              │
│ Popup                        │
│ Service Worker               │
│ GitHub auth/API modules      │
└──────────────┬───────────────┘
               ↓
┌──────────────────────────────┐
│      Spring Boot :8081       │
│                              │
│ OAuth token exchange         │
│ Client secret protection     │
└──────────────┬───────────────┘
               ↓
┌──────────────────────────────┐
│            GitHub            │
│ GitHub App + REST API        │
│ ajayvarmaboya/leetcode       │
└──────────────────────────────┘
```

The client secret is deliberately not stored in the extension.

## 4. GitHub App

Development App:

``` text
Name: LeetCodeGithub Sync
Slug: leetcodegithub-sync
```

Repository permissions:

``` text
Contents  → Read and write
Metadata  → Read-only
```

The App was installed for the development GitHub account and granted
access to:

``` text
ajayvarmaboya/leetcode
```

## 5. Extension identity configuration

Current extension ID:

``` text
gkcdmgbaokonhogfpfankoknkjgonden
```

Chrome Identity callback:

``` text
https://gkcdmgbaokonhogfpfankoknkjgonden.chromiumapp.org/
```

This callback was registered with the GitHub App.

## 6. OAuth implementation

The extension now uses:

``` text
chrome.identity.launchWebAuthFlow()
chrome.identity.getRedirectURL()
```

The flow includes:

-   random OAuth state
-   PKCE verifier
-   SHA-256 PKCE challenge
-   S256 method
-   callback state validation
-   authorization-code handling
-   backend token exchange

Flow:

``` text
Popup
  ↓
Service Worker
  ↓
Generate state + PKCE
  ↓
GitHub authorization
  ↓
Callback
  ↓
Validate state
  ↓
Send code + verifier to backend
```

## 7. Spring Boot backend

Backend location:

``` text
backend/leetcode-github-auth/
```

Technology:

``` text
Java
Spring Boot
Maven
```

Development port:

``` text
8081
```

The backend successfully starts with:

``` text
Tomcat started on port 8081
Started LeetcodeGithubAuthApplication
```

## 8. OAuth token-exchange debugging

The first token exchange produced:

``` text
404 Not Found
{"error":"Not Found"}
```

The failure originated in:

``` text
GithubOAuthService.exchangeCodeForToken()
```

The token-exchange implementation was revised to make the GitHub token
request explicit and to use the backend-configured redirect URI.

After that correction:

``` text
GitHub authentication successful.
```

## 9. Client secret handling

GitHub does not display the full client secret again after generation.

A new client secret was generated during development.

The secret is supplied to Spring Boot using:

``` text
GITHUB_CLIENT_SECRET
```

It is not stored in extension source code.

The secret must never be pasted into chat, committed to Git, or logged.

## 10. GitHub App authorization vs installation

An important issue was discovered:

The GitHub App was authorized but initially was not installed on an
account.

The GitHub page reported that the App had not been installed on any
accessible account.

This caused the repository API request to return:

``` text
404 Not Found
```

The App was subsequently installed and given access to the target
repository.

This established the important distinction:

``` text
Authorization
    =
permission for the application to act on the user's behalf

Installation
    =
repository/resource access granted to the GitHub App
```

## 11. GitHub API module

A new module was added:

``` text
extension/src/github/github-api.js
```

It provides:

``` text
getAccessToken()
githubRequest()
getAuthenticatedUser()
getRepository()
```

A temporary service-worker message was added:

``` text
TEST_GITHUB_API
```

The popup contains:

``` text
Test GitHub API
```

This allows the GitHub integration to be tested independently of the
LeetCode synchronization pipeline.

## 12. Chrome messaging debugging

A messaging issue was encountered because an asynchronous `onMessage`
listener was being used together with `sendResponse()`.

The listener was changed to remain synchronous and return:

``` javascript
return true;
```

for asynchronous operations.

The API test uses an asynchronous function inside the listener.

This fixed the popup/service-worker response handling.

## 13. Final successful test

The final test passed.

Popup:

``` text
Connected as ajayvarmaboya.
Repository found: ajayvarmaboya/leetcode
```

Service worker:

``` text
Testing GitHub API...
GitHub user: ajayvarmaboya
GitHub repository: ajayvarmaboya/leetcode
```

This proves:

``` text
OAuth                  PASS
PKCE                   PASS
State validation       PASS
Backend token exchange PASS
GitHub App installation PASS
GitHub user API        PASS
Repository API         PASS
```

## 14. Current status

### Completed

``` text
[x] Manifest V3
[x] LeetCode page detection
[x] Submission event pipeline
[x] GitHub App
[x] GitHub OAuth
[x] PKCE
[x] OAuth state
[x] Spring Boot backend
[x] Server-side client secret
[x] Token exchange
[x] GitHub App installation
[x] Repository access
[x] GitHub /user verification
[x] Repository verification
```

### Pending

``` text
[ ] GitHub create-file API
[ ] GitHub update-file API
[ ] Solution path generation
[ ] Language mapping
[ ] Duplicate detection
[ ] Commit-message generation
[ ] Accepted-submission-to-GitHub sync
[ ] Notifications
[ ] Retry handling
[ ] Token refresh lifecycle
[ ] Automated tests
[ ] CI/CD
[ ] Production backend
[ ] Chrome Web Store release
```

## 15. Next session plan

The next session should begin with a controlled GitHub write test.

Create:

``` text
ajayvarmaboya/leetcode
└── test/
    └── github-sync-test.txt
```

Then verify the commit appears in GitHub.

After that:

``` text
LEETCODE_SUBMISSION_ACCEPTED
        ↓
extract metadata
        ↓
extract source code
        ↓
map language to extension
        ↓
generate deterministic path
        ↓
check existing file
        ↓
create/update file
        ↓
commit
        ↓
notify user
```

## 16. Proposed production file structure

``` text
extension/src/github/
├── github-auth.js
├── github-api.js
├── repository.js
└── github-sync.js
```

Responsibilities:

-   `github-auth.js` --- authentication and token lifecycle
-   `github-api.js` --- generic GitHub REST requests
-   `repository.js` --- repository/file operations
-   `github-sync.js` --- LeetCode-to-GitHub business workflow

## 17. Security checklist

``` text
[x] Client secret kept out of extension
[x] OAuth state validation
[x] PKCE
[x] Limited GitHub permissions
[x] Secret excluded from source control
[ ] HTTPS production backend
[ ] Production secret manager
[ ] Token refresh/revocation handling
[ ] Security-focused logging policy
[ ] Input validation
[ ] Rate-limit handling
```

## 18. End-of-day conclusion

The most important achievement today is that the extension can now
authenticate with GitHub and verify the exact target repository.

The project has reached this stable checkpoint:

``` text
LeetCode detection
        +
Chrome Extension
        +
GitHub OAuth
        +
Spring Boot backend
        +
GitHub App installation
        +
GitHub API
        +
leetcode repository
```

The next major milestone is no longer authentication.

It is the actual write operation:

``` text
Accepted LeetCode solution
        ↓
GitHub file
        ↓
GitHub commit
```

**End-of-day status: Authentication and repository integration complete;
automatic solution synchronization is the next phase.**
