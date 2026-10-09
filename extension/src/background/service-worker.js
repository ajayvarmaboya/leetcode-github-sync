
import { authenticateWithGitHub } from "../github/github-auth.js";

import {
  getAuthenticatedUser,
  getRepository,
  saveSolution
} from "../github/github-api.js";

console.log("LeetCode GitHub Sync service worker started.");

const extensionByLanguage = {
  java: "java",
  python: "py",
  python3: "py",
  javascript: "js",
  javascript8: "js",
  typescript: "ts",
  cpp: "cpp",
  c: "c",
  csharp: "cs",
  golang: "go",
  go: "go",
  rust: "rs",
  kotlin: "kt",
  swift: "swift",
  ruby: "rb",
  mysql: "sql",
  mssql: "sql",
  oraclesql: "sql",
  php: "php",
  scala: "scala"
};

function getProblemSlug(payload) {
  if (payload.problemSlug) {
    return payload.problemSlug;
  }

  if (!payload.submissionUrl) {
    return null;
  }

  const url = new URL(payload.submissionUrl);
  const segments = url.pathname.split("/").filter(Boolean);
  const problemIndex = segments.indexOf("problems");

  return problemIndex >= 0
    ? segments[problemIndex + 1]
    : null;
}

async function syncAcceptedSubmission(payload = {}) {
  const {
    code,
    language,
    submissionId,
    submissionUrl
  } = payload;

  if (typeof code !== "string" || !code.trim()) {
    throw new Error("Submission source code is missing.");
  }

  if (!language) {
    throw new Error("Programming language is missing.");
  }

  const slug = getProblemSlug(payload);

  if (!slug) {
    throw new Error("Could not determine the LeetCode problem slug.");
  }

  const languageKey = language
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  const extension = extensionByLanguage[languageKey];

  if (!extension) {
    throw new Error(`Unsupported programming language: ${language}`);
  }

  const user = await getAuthenticatedUser();
  const owner = user.login;
  const repo = "leetcode";

  // Verify that the target repository exists and is accessible.
  await getRepository(owner, repo);

  const filePath = `${slug}/${slug}.${extension}`;

  const result = await saveSolution({
    owner,
    repo,
    path: filePath,
    code,
    message: `Add/update LeetCode solution: ${slug} (${language})`
  });

  const syncResult = {
    success: true,
    submissionId: submissionId || null,
    problem: slug,
    language,
    repository: `${owner}/${repo}`,
    path: filePath,
    url: result.content?.html_url || null,
    syncedAt: Date.now()
  };

  await chrome.storage.local.set({
    lastSyncResult: syncResult
  });

  console.log("Solution synced successfully:", syncResult);

  return syncResult;
}

chrome.runtime.onMessage.addListener(
  (message, sender, sendResponse) => {
    console.log("Message received:", message);

    if (message.type === "CONNECT_GITHUB") {
      authenticateWithGitHub()
        .then((tokenResponse) => {
          sendResponse({
            success: true,
            expiresIn: tokenResponse.expires_in
          });
        })
        .catch((error) => {
          console.error("GitHub authentication failed:", error);

          sendResponse({
            success: false,
            error: error.message
          });
        });

      return true;
    }

    if (message.type === "TEST_GITHUB_API") {
      (async () => {
        try {
          const user = await getAuthenticatedUser();
          const repository = await getRepository(
            user.login,
            "leetcode"
          );

          sendResponse({
            success: true,
            user: user.login,
            repository: repository.full_name
          });
        } catch (error) {
          console.error("GitHub API test failed:", error);

          sendResponse({
            success: false,
            error: error.message
          });
        }
      })();

      return true;
    }

    if (message.type === "LEETCODE_PAGE_LOADED") {
      console.log("LeetCode page detected:", message.payload);
      return;
    }

    if (message.type === "LEETCODE_SUBMISSION_ACCEPTED") {
      syncAcceptedSubmission(message.payload)
        .then((result) => {
          console.log("GitHub sync completed:", result);
        })
        .catch(async (error) => {
          console.error("Automatic GitHub sync failed:", error);

          await chrome.storage.local.set({
            lastSyncResult: {
              success: false,
              error: error.message,
              syncedAt: Date.now()
            }
          });
        });

      return;
    }
  }
);
