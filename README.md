# LeetCode GitHub Sync

A Chrome Extension (Manifest V3) that detects accepted LeetCode submissions, extracts the solution code and language from the LeetCode editor, and synchronizes the solution to a GitHub repository.

> **Current status:** The end-to-end MVP flow was tested successfully on October 9, 2026. The extension detected an accepted Java submission, extracted its code, and created a file in `ajayvarmaboya/leetcode`. Duplicate-upload protection, source/submission consistency checks, broader language testing, and automated tests remain future work.

## Features

- GitHub OAuth sign-in through a Spring Boot backend.
- GitHub API connectivity and repository lookup from the extension popup.
- LeetCode page detection.
- Accepted-submission detection and submission ID extraction.
- Source-code and language extraction from Monaco.
- Automatic creation or update of solution files in a GitHub repository.
- Sync result/error logging in the extension service worker.
- UTF-8-safe Base64 encoding for GitHub Contents API file uploads.

## Technology Stack

- JavaScript
- Chrome Extensions Manifest V3
- Chrome Identity API and Chrome Storage API
- LeetCode page content scripts and Monaco editor integration
- GitHub REST API (Contents API)
- Spring Boot OAuth token-exchange backend
- Maven for the backend

## Architecture

```text
LeetCode submission page
        |
        v
submission-detector.js
  - detects Accepted status
  - extracts submission ID and URL
        |
        v
monaco-bridge.js (MAIN world)
  - reads Monaco editor model
  - sends code and language via window.postMessage
        |
        v
extractor.js (ISOLATED world)
  - validates bridge message
  - stores latest code/language
  - dispatches leetcode-source-ready
        |
        v
Chrome extension service worker
  - receives LEETCODE_SUBMISSION_ACCEPTED
  - derives problem slug and file extension
  - calls GitHub API module
        |
        v
github-api.js
  - reads stored access token
  - checks existing file
  - creates or updates file via GitHub Contents API
        |
        v
GitHub repository: ajayvarmaboya/leetcode
```

OAuth token exchange is handled by the Spring Boot backend at `POST /api/auth/github/exchange`. The extension launches the GitHub authorization flow, validates OAuth `state`, generates a PKCE verifier/challenge, and sends the authorization code to the backend for exchange.

## Project Structure

The exact local layout may include an `extension/` directory around the extension files.

```text
leetcode-github-sync/
├── README.md
├── extension/
│   ├── manifest.json
│   └── src/
│       ├── background/
│       │   └── service-worker.js
│       ├── content/
│       │   ├── monaco-bridge.js
│       │   ├── extractor.js
│       │   ├── submission-detector.js
│       │   └── leetcode.js
│       ├── github/
│       │   ├── github-auth.js
│       │   └── github-api.js
│       └── popup/
│           ├── popup.html
│           └── popup.js
└── backend/
    └── leetcode-github-auth/
        └── src/main/java/com/ajay/leetcodegithubauth/
            ├── controller/
            │   └── GitHubOAuthController.java
            ├── service/
            │   └── GithubOAuthService.java
            ├── config/
            └── dto/
```

This is a representative structure based on the files currently in use; additional project files may exist locally.

## Prerequisites

- Google Chrome with extension developer mode available.
- Java and Maven Wrapper support for the Spring Boot backend.
- A GitHub account and a GitHub OAuth application configured for the extension's Chrome Identity redirect URI.
- A GitHub repository named `leetcode` under the authenticated account.
- GitHub OAuth client ID and client secret configured as backend environment variables. **Never commit the client secret or access tokens.**

## Run the Backend

From Windows CMD, start the backend from its project directory:

```cmd
cd /d C:\Users\User1\Desktop\leetcode-github-sync\backend\leetcode-github-auth
mvnw.cmd spring-boot:run
```

The backend is configured to run on port `8081` in the current development setup.

Set the environment variables in the same terminal session before starting the backend if they are not already available:

```cmd
set "GITHUB_CLIENT_ID=YOUR_CLIENT_ID"
set "GITHUB_CLIENT_SECRET=YOUR_CLIENT_SECRET"
mvnw.cmd spring-boot:run
```

Replace placeholders locally; do not paste credentials into source code or commit them. If using `setx`, open a new terminal afterward because existing terminals do not automatically inherit newly saved environment variables.

## Load the Extension

1. Start the backend and leave it running.
2. Open `chrome://extensions` in Chrome.
3. Enable **Developer mode**.
4. Select **Load unpacked**.
5. Choose the directory containing `manifest.json` (for example, the project's `extension/` directory).
6. Open the extension popup and click **Connect GitHub**.
7. Click **Test GitHub API**. The current successful test reports the authenticated user and the `leetcode` repository.

After changing extension files or the manifest, reload the extension and refresh the LeetCode tab so the new content scripts are injected.

## Usage

1. Connect GitHub from the extension popup.
2. Open a LeetCode problem and submit a solution.
3. Wait for the submission to be marked **Accepted**.
4. The content scripts detect the submission and read the Monaco source model.
5. The service worker sends the source and language to the GitHub API module.
6. The module creates a new file or updates an existing file at a path derived from the problem slug and language.
7. Check the service worker console and the GitHub repository for the result.

Example path for a Java solution:

```text
find-minimum-in-rotated-sorted-array/
└── find-minimum-in-rotated-sorted-array.java
```

The exact path is generated from the detected problem slug and language.

## Current Language Mapping

The service worker currently maps a set of language identifiers to file extensions, including Java (`.java`), Python (`.py`), JavaScript (`.js`), TypeScript (`.ts`), C++ (`.cpp`), C (`.c`), C# (`.cs`), Go (`.go`), Rust (`.rs`), Kotlin (`.kt`), Swift (`.swift`), Ruby (`.rb`), SQL (`.sql`), PHP (`.php`), and Scala (`.scala`). Actual coverage depends on the identifiers emitted by LeetCode and the mapping in the current source.

## Security Notes

- The GitHub OAuth client secret belongs only in the backend environment; it must not be embedded in the extension.
- Do not log or share access tokens, refresh tokens, authorization codes, or client secrets.
- The extension stores token data in Chrome storage. Review token expiration, refresh, and revocation handling before broader use.
- Validate OAuth `state` and use PKCE as implemented in the authentication flow.
- Limit OAuth permissions to the minimum required for the repository operations.
- Do not treat the editor's current contents as guaranteed to be identical to the exact code evaluated by a past submission until that behavior is verified.

## Known Limitations / Next Work

- Add duplicate-submission/duplicate-commit prevention.
- Ensure the uploaded code is the exact source associated with the accepted submission, not a later editor modification.
- Add clear sync status and error reporting to the popup.
- Test create and update paths, empty repositories, network failures, expired/revoked tokens, and insufficient repository permissions.
- Test each supported language and verify correct file extensions.
- Add automated tests and a manual regression checklist.
- Improve token refresh and lifecycle handling.
- Review GitHub API version support and keep the chosen API version consistent in all requests.

## Verified on October 9, 2026

The following were observed during development testing:

- GitHub OAuth connection succeeded.
- The extension authenticated as `ajayvarmaboya`.
- The `ajayvarmaboya/leetcode` repository lookup succeeded.
- Monaco exposed a non-empty Java model (565 characters and 28 lines in one test).
- The detector emitted `LEETCODE_SUBMISSION_ACCEPTED`.
- The service worker logged `Solution synced successfully`.
- A file for `find-minimum-in-rotated-sorted-array` appeared in the GitHub repository.

These checks establish that the current MVP workflow works for the tested Java case; they do not yet establish production readiness or complete support for every language and edge case.
