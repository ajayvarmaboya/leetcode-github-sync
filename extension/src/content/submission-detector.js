console.log("LeetCode GitHub Sync: submission detector initialized.");

const forwardedSubmissionIds = new Set();

window.addEventListener("leetcode-submission-accepted-verified", (event) => {
  const submission = event.detail;
  if (!submission || !submission.submissionId || submission.statusCode !== 10 || !submission.problemSlug || typeof submission.code !== "string" || !submission.code.trim() || typeof submission.language !== "string" || !submission.language.trim()) {
    console.warn("Rejected invalid or unverified submission.");
    return;
  }

  const submissionId = String(submission.submissionId);
  if (forwardedSubmissionIds.has(submissionId)) {
    console.log("Verified submission already forwarded:", submissionId);
    return;
  }
  forwardedSubmissionIds.add(submissionId);
  if (forwardedSubmissionIds.size > 100) forwardedSubmissionIds.delete(forwardedSubmissionIds.values().next().value);

  const payload = {
    submissionId,
    submissionUrl: submission.submissionUrl,
    problemSlug: submission.problemSlug,
    code: submission.code,
    language: submission.language,
    statusCode: 10
  };

  console.log("Forwarding verified Accepted submission.", {
    submissionId, problemSlug: payload.problemSlug, language: payload.language, characters: payload.code.length
  });

  chrome.runtime.sendMessage({ type: "LEETCODE_SUBMISSION_ACCEPTED", payload })
    .then((response) => {
      if (!response || response.success !== true) {
        forwardedSubmissionIds.delete(submissionId);
        console.error("Background did not confirm GitHub sync:", submissionId, response?.error || "No successful response");
        return;
      }
      console.log("Verified submission handled by background:", submissionId, response.result || "success");
    })
    .catch((error) => {
      forwardedSubmissionIds.delete(submissionId);
      console.error("Failed to forward verified submission:", submissionId, error?.message || error);
    });
});

console.log("Listening only for verified Accepted submissions.");
