console.log("LeetCode GitHub Sync: code extractor loaded.");

let latestMonacoSource = null;
let pendingSubmissionSnapshot = null;
const MESSAGE_SOURCE = "leetcode-github-sync";

window.addEventListener("message", (event) => {
  if (event.source !== window) return;
  const message = event.data;
  if (!message || message.source !== MESSAGE_SOURCE) return;

  if (message.type === "LEETCODE_SUBMISSION_CAPTURED") {
    const p = message.payload;
    if (!p || !p.submissionId || !p.problemSlug || typeof p.code !== "string" || !p.code.trim() || typeof p.language !== "string" || !p.language.trim()) {
      console.warn("Incomplete captured submission message.");
      return;
    }
    window.dispatchEvent(new CustomEvent("leetcode-submission-captured", { detail: {
      submissionId: String(p.submissionId), submissionUrl: p.submissionUrl || "",
      problemSlug: p.problemSlug, code: p.code, language: p.language,
      questionId: p.questionId || null
    }}));
    console.log("Submission capture received.", { submissionId: String(p.submissionId), problemSlug: p.problemSlug, language: p.language, characters: p.code.length });
    return;
  }

  if (message.type === "LEETCODE_SUBMISSION_ACCEPTED_VERIFIED") {
    const p = message.payload;
    if (!p || !p.submissionId || p.statusCode !== 10 || !p.problemSlug || typeof p.code !== "string" || !p.code.trim() || typeof p.language !== "string" || !p.language.trim()) {
      console.warn("Rejected invalid or unverified Accepted event.");
      return;
    }
    window.dispatchEvent(new CustomEvent("leetcode-submission-accepted-verified", { detail: {
      submissionId: String(p.submissionId), submissionUrl: p.submissionUrl || "",
      problemSlug: p.problemSlug, code: p.code, language: p.language,
      questionId: p.questionId || null, statusCode: p.statusCode
    }}));
    console.log("Verified Accepted submission received.", { submissionId: String(p.submissionId), problemSlug: p.problemSlug, language: p.language });
    return;
  }

  if (message.type !== "MONACO_SOURCE_CODE" && message.type !== "MONACO_SUBMISSION_SNAPSHOT") return;
  if (!message.payload || typeof message.payload.code !== "string" || !message.payload.code.trim()) return;
  const source = {
    code: message.payload.code,
    language: message.payload.language || null,
    lineCount: message.payload.lineCount || 0,
    capturedAt: message.payload.capturedAt || null
  };
  if (message.type === "MONACO_SUBMISSION_SNAPSHOT") pendingSubmissionSnapshot = source;
  else latestMonacoSource = source;
  window.dispatchEvent(new CustomEvent("leetcode-source-ready"));
});

function extractSourceCode() {
  if (!pendingSubmissionSnapshot) return null;
  const source = pendingSubmissionSnapshot;
  pendingSubmissionSnapshot = null;
  return source.code && source.code.trim() ? source : null;
}

function getMonacoSource() {
  if (!latestMonacoSource) return null;
  return { code: latestMonacoSource.code, language: latestMonacoSource.language, lineCount: latestMonacoSource.lineCount, capturedAt: latestMonacoSource.capturedAt };
}

console.log("LeetCode GitHub Sync: extraction listeners installed.");
