# LeetCode GitHub Sync

A Chrome Extension (Manifest V3) that detects accepted LeetCode submissions, extracts solution code and language information, and synchronizes solutions to a GitHub repository.

> **Current status:** The end-to-end MVP flow was tested successfully during development. An accepted Java submission was detected and its solution was created in `ajayvarmaboya/leetcode`. Manual checks have also been reported as passing for Wrong Answer protection, repeated submissions, Java/Python file mapping, and failure reporting/recovery. These results are development validation, not a claim of comprehensive automated test coverage or production readiness.

## Features

- GitHub OAuth sign-in through a Spring Boot backend.
- GitHub API connectivity and repository lookup from the extension popup.
- LeetCode page detection.
- Accepted-submission detection and submission ID extraction.
- Source-code and language extraction through Monaco integration.
- Automatic creation or update of solution files in a GitHub repository.
- Sync result and error logging in the extension service worker.
- UTF-8-safe Base64 encoding for GitHub Contents API uploads.

## Technology Stack

- JavaScript
- Chrome Extensions Manifest V3
- Chrome Identity API and Chrome Storage API
- LeetCode content scripts and Monaco editor integration
- GitHub REST API (Contents API)
- Spring Boot OAuth token-exchange backend
- Maven

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
  - observes submission/verdict requests
  - captures submitted code and language
        |
        v
extractor.js (ISOLATED world)
  - validates bridge messages
  - forwards verified submission data
        |
        v
Chrome extension service worker
  - receives accepted-submission message
  - derives problem slug and file extension
  - coordinates GitHub synchronization
        |
        v
github-api.js
  - reads stored access token
  - checks for an existing file
  - creates or updates the file via GitHub Contents API
        |
        v
GitHub repository: ajayvarmaboya/leetcode
```

OAuth token exchange is handled by the Spring Boot backend at `POST /api/auth/github/exchange`. The extension launches the GitHub authorization flow, validates OAuth `state`, generates a PKCE verifier/challenge, and sends the authorization code to the backend for exchange.

> Keep this diagram aligned with the current implementation if message names or responsibilities change.

## Project Structure

The local project may contain additional files. The following is a representative structure based on the implementation described during development.

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

## Prerequisites

- Google Chrome with extension Developer mode available.
- A Java Development Kit compatible with the backend's Spring Boot configuration.
- Maven Wrapper support, included in or available to the backend project.
- A GitHub account and a GitHub OAuth application configured for the extension's Chrome Identity redirect URI.
- A GitHub repository named `leetcode` under the authenticated account.
- GitHub OAuth client ID and client secret configured as backend environment variables.

**Never commit the GitHub OAuth client secret or access tokens.**

## Run the Backend

From Windows Command Prompt, run the backend from its project directory. Update the path to match your local checkout:

```cmd
cd /d C:\path\to\leetcode-github-sync\backend\leetcode-github-auth
mvnw.cmd spring-boot:run
```

The current development setup uses port `8081`.

Set environment variables in the same terminal session before starting the backend if they are not already configured:

```cmd
set "GITHUB_CLIENT_ID=YOUR_CLIENT_ID"
set "GITHUB_CLIENT_SECRET=YOUR_CLIENT_SECRET"
mvnw.cmd spring-boot:run
```

Replace the placeholders locally. Do not paste credentials into source code or commit them. If you use `setx`, open a new terminal afterward because existing terminals do not automatically inherit newly saved environment variables.

## Load the Extension in Chrome

1. Start the backend and leave it running.
2. Open `chrome://extensions` in Chrome.
3. Enable **Developer mode**.
4. Select **Load unpacked**.
5. Choose the directory containing `manifest.json` (for example, the project's `extension/` directory).
6. Open the extension popup and click **Connect GitHub**.
7. Click **Test GitHub API**. During development, the successful test reported the authenticated user and the `leetcode` repository.

After changing extension files or the manifest, reload the extension and refresh the LeetCode tab so the updated content scripts are injected.

## Usage

1. Connect GitHub from the extension popup.
2. Open a LeetCode problem and submit a solution.
3. Wait for LeetCode to mark the submission **Accepted**.
4. The extension observes the submission and obtains the relevant source code and language.
5. The service worker coordinates synchronization through the GitHub API module.
6. The module creates a new file or updates an existing file at a path derived from the problem slug and language.
7. Check the service worker console and the GitHub repository for the result.

Example Java file path:

```text
find-minimum-in-rotated-sorted-array/
└── find-minimum-in-rotated-sorted-array.java
```

The exact path is generated from the detected problem slug and language.

## Language-to-File Mapping

The service worker currently maps a set of language identifiers to file extensions. The mapping described during development includes:

| Language | Extension |
|---|---|
| Java | `.java` |
| Python | `.py` |
| JavaScript | `.js` |
| TypeScript | `.ts` |
| C++ | `.cpp` |
| C | `.c` |
| C# | `.cs` |
| Go | `.go` |
| Rust | `.rs` |
| Kotlin | `.kt` |
| Swift | `.swift` |
| Ruby | `.rb` |
| SQL | `.sql` |
| PHP | `.php` |
| Scala | `.scala` |

Actual coverage depends on the identifiers emitted by LeetCode and the mapping in the current source code. Verify a language before relying on it.

## Testing

The following manual checks were reported as passing during development:

| Test | Reported result | Notes |
|---|---|---|
| Accepted submission upload | Pass | A solution file was created in the GitHub repository. |
| Wrong Answer protection | Pass | A non-Accepted submission was not uploaded. |
| Repeated submissions | Pass | No unintended duplicate files were observed. |
| Java/Python mapping | Pass | File extensions and source-code contents were checked. |
| Failure reporting and recovery | Pass, as reported | Confirm that the test exercised the production API helper before treating it as an integration test. |

These are reported development checks. They do not establish comprehensive automated coverage of `service-worker.js` or `github-api.js`. Add automated tests against the actual production modules before claiming automated coverage.

### Suggested regression checks

- Accepted submission creates a file.
- Updating an existing file uses the correct GitHub Contents API SHA.
- Wrong Answer and other non-Accepted statuses do not upload.
- Repeated submissions do not create unintended files or commits.
- Java and Python filenames and contents are correct.
- GitHub HTTP errors are surfaced as failures rather than successes.
- Expired/revoked authorization and insufficient repository permissions are handled clearly.
- A normal sync succeeds after a recoverable failure.
- Extension reload and LeetCode tab refresh do not break the flow.

## Security Notes

- The GitHub OAuth client secret belongs only in the backend environment; it must not be embedded in the extension.
- Do not log or share access tokens, refresh tokens, authorization codes, or client secrets.
- The extension stores token data in Chrome storage. Review token expiration, refresh, and revocation handling before broader use.
- Validate OAuth `state` and use PKCE as implemented in the authentication flow.
- Limit OAuth permissions to the minimum required for repository operations.
- Do not assume the editor's current contents are identical to the exact code evaluated by a past submission unless that behavior is verified for the submission being synchronized.

## Known Limitations and Future Work

- Add stronger duplicate-submission and duplicate-commit prevention.
- Ensure uploaded code is the exact source associated with the accepted submission, not a later editor modification.
- Add clear synchronization status and error reporting to the popup.
- Test create and update paths, empty repositories, network failures, expired/revoked tokens, and insufficient repository permissions.
- Verify every supported language and its file extension.
- Add automated tests for the actual production modules and maintain a manual regression checklist.
- Improve token refresh and lifecycle handling.
- Review GitHub API version support and keep the selected API version consistent across requests.
- Consider retry behavior for transient network and GitHub API failures.

## Development Verification Notes

During development, the following were observed:

- GitHub OAuth connection succeeded.
- The extension authenticated as `ajayvarmaboya`.
- The `ajayvarmaboya/leetcode` repository lookup succeeded.
- Monaco exposed a non-empty Java model in one test (565 characters and 28 lines).
- The extension detected an Accepted submission.
- The service worker logged `Solution synced successfully`.
- A solution file was created in the GitHub repository.

These observations establish that the MVP workflow worked for the tested cases. They do not establish production readiness or complete support for every language and edge case.

## Contributing

Contributions and bug reports are welcome. Before opening a pull request:

1. Describe the behavior being changed.
2. Include reproduction steps for bugs.
3. Run the available tests and manual regression checks.
4. Do not include credentials, tokens, or personal data in commits or logs.

## License

No license has been specified yet. Add a `LICENSE` file before distributing the project as open source.
