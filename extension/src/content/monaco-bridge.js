/*
 * LeetCode GitHub Sync — MAIN-world bridge.
 * Captures the exact body submitted to LeetCode, then verifies the verdict.
 * Only statusCode === 10 (Accepted) is allowed to produce a verified event.
 */
(() => {
  "use strict";

  console.log("LeetCode GitHub Sync: submission observer started.");

  const MESSAGE_SOURCE = "leetcode-github-sync";
  const CAPTURED_MESSAGE_TYPE = "LEETCODE_SUBMISSION_CAPTURED";
  const VERIFIED_MESSAGE_TYPE = "LEETCODE_SUBMISSION_ACCEPTED_VERIFIED";
  const MAX_ENTRIES = 100;

  const capturedSubmissionIds = new Set();
  const verifiedSubmissionIds = new Set();
  const capturedSubmissions = new Map();
  // Handle the race where the verdict query completes before submit-body parsing.
  const pendingAcceptedDetails = new Map();

  function getSubmissionRequestDetails(url, method) {
    if (String(method || "GET").toUpperCase() !== "POST") return null;
    try {
      const parsed = new URL(url, window.location.origin);
      if (parsed.origin !== window.location.origin) return null;
      const match = parsed.pathname.match(/^\/problems\/([^/]+)\/submit\/?$/);
      return match ? { problemSlug: match[1] } : null;
    } catch {
      return null;
    }
  }

  function isGraphQLRequest(url, method) {
    if (String(method || "GET").toUpperCase() !== "POST") return false;
    try {
      const parsed = new URL(url, window.location.origin);
      return parsed.origin === window.location.origin && /^\/graphql\/?$/.test(parsed.pathname);
    } catch {
      return false;
    }
  }

  async function bodyToText(body) {
    if (typeof body === "string") return body;
    if (body instanceof URLSearchParams) return body.toString();
    if (body instanceof Blob) return await body.text();
    if (body instanceof ArrayBuffer) return new TextDecoder().decode(body);
    if (ArrayBuffer.isView(body)) return new TextDecoder().decode(body);
    return null;
  }

  async function getFetchRequestBody(input, init) {
    // An explicit init.body takes precedence over a Request input body.
    if (init && Object.prototype.hasOwnProperty.call(init, "body")) {
      return bodyToText(init.body);
    }
    if (input instanceof Request) {
      try { return await input.clone().text(); } catch { return null; }
    }
    return null;
  }

  function parseRequestPayload(bodyText) {
    if (typeof bodyText !== "string" || !bodyText) return null;
    try {
      const body = JSON.parse(bodyText);
      if (typeof body.typed_code !== "string" || !body.typed_code.trim()) return null;
      if (typeof body.lang !== "string" || !body.lang.trim()) return null;
      return {
        code: body.typed_code,
        language: body.lang,
        questionId: body.question_id == null ? null : String(body.question_id)
      };
    } catch {
      return null;
    }
  }

  function postPageMessage(type, payload) {
    window.postMessage({ source: MESSAGE_SOURCE, type, payload }, window.location.origin);
  }

  function publishSubmission(requestDetails, requestPayload, responseBody) {
    if (!requestDetails || !requestPayload || !responseBody) return;
    const rawId = responseBody.submission_id;
    if (rawId === undefined || rawId === null || String(rawId).trim() === "") return;

    const id = String(rawId);
    if (capturedSubmissionIds.has(id)) return;
    capturedSubmissionIds.add(id);

    const payload = {
      submissionId: id,
      submissionUrl: `${window.location.origin}/problems/${requestDetails.problemSlug}/submissions/${id}/`,
      problemSlug: requestDetails.problemSlug,
      code: requestPayload.code,
      language: requestPayload.language,
      questionId: requestPayload.questionId
    };
    capturedSubmissions.set(id, payload);

    while (capturedSubmissions.size > MAX_ENTRIES) {
      const oldestId = capturedSubmissions.keys().next().value;
      capturedSubmissions.delete(oldestId);
      capturedSubmissionIds.delete(oldestId);
      verifiedSubmissionIds.delete(oldestId);
    }

    postPageMessage(CAPTURED_MESSAGE_TYPE, payload);
    const pendingDetails = pendingAcceptedDetails.get(id);
    if (pendingDetails) {
      pendingAcceptedDetails.delete(id);
      verifyAcceptedDetails(id, pendingDetails);
    }
    console.log("LeetCode submission captured.", {
      submissionId: id,
      problemSlug: payload.problemSlug,
      language: payload.language,
      characters: payload.code.length
    });
  }

  async function readResponseJson(response) {
    try { return await response.clone().json(); } catch { return null; }
  }

  function verifyAcceptedDetails(id, details) {
    
     if (verifiedSubmissionIds.has(id)) return;

  // Only trust a confirmed Accepted verdict with source code.
  if (details.statusCode !== 10) return;

  const captured = capturedSubmissions.get(id);
  const submittedCode =
    typeof details.code === "string" ? details.code : "";

  if (!submittedCode.trim()) {
    console.warn(
      "Accepted submission has no source code in submissionDetails:",
      id
    );
    return;
  }

  const detailsSlug = details.question?.titleSlug || "";
  const problemSlug = detailsSlug || captured?.problemSlug || "";

  if (!problemSlug) {
    console.warn("Cannot determine problem slug for submission:", id);
    return;
  }

  // If capture exists, ensure it refers to the same submission.
  if (captured) {
    if (captured.submissionId !== id) {
      console.warn("Submission ID mismatch:", id);
      return;
    }

    if (
      detailsSlug &&
      captured.problemSlug !== detailsSlug
    ) {
      console.warn("Submission problem mismatch; rejected:", id);
      return;
    }

    if (captured.code !== submittedCode) {
      console.warn(
        "Captured code differs from submissionDetails; using the exact code returned for this submission:",
        id
      );
    }
  }

  // Prefer the language returned for this exact submission.
  const detailsLanguage =
    typeof details.lang?.name === "string"
      ? details.lang.name
      : "";

  const language = (
    captured?.language || detailsLanguage
  ).toLowerCase();

  if (!language) {
    console.warn("Cannot determine language for submission:", id);
    return;
  }

  const payload = {
    submissionId: id,
    statusCode: 10,
    submissionUrl:
      captured?.submissionUrl ||
      `${window.location.origin}/problems/${problemSlug}/submissions/${id}/`,
    problemSlug,
    code: submittedCode,
    language,
    questionId: captured?.questionId ?? null
  };

  verifiedSubmissionIds.add(id);

  postPageMessage(VERIFIED_MESSAGE_TYPE, payload);

  console.log("Accepted verdict verified.", {
    submissionId: id,
    problemSlug,
    language,
    characters: submittedCode.length,
    usedCapture: Boolean(captured)
  });
}
    

  async function observeSubmissionDetails(requestBody, response) {
    if (!requestBody || !response) return;
    let request;
    try { request = JSON.parse(requestBody); } catch { return; }
    if (request.operationName !== "submissionDetails") return;

    const id = String(request.variables?.submissionId ?? "");
    if (!id) return;

    const body = await readResponseJson(response);
    const details = body?.data?.submissionDetails;
    if (!details) return;

    console.log("[LGS DEBUG] Submission details response:", {
      submissionId: id, statusCode: details.statusCode,
      hasCode: typeof details.code === "string", problemSlug: details.question?.titleSlug
    });
    if (details.statusCode !== 10) return;
    verifyAcceptedDetails(id, details);
  }

  // fetch hook: preserve LeetCode's original response and behavior.
  const originalFetch = window.fetch;
  window.fetch = function (...args) {
    const input = args[0];
    const init = args[1];
    const url = typeof input === "string" || input instanceof URL ? String(input) : input?.url;
    const method = String(init?.method || input?.method || "GET").toUpperCase();
    const submitDetails = getSubmissionRequestDetails(url, method);
    const graphQL = isGraphQLRequest(url, method);

    if (!submitDetails && !graphQL) return originalFetch.apply(this, args);

    // Read/clone request data without consuming the request used by LeetCode.
    const requestBodyPromise = getFetchRequestBody(input, init);
    const responsePromise = originalFetch.apply(this, args);

    responsePromise.then(async (response) => {
      if (!response.ok) return;
      const bodyText = await requestBodyPromise;
      if (!bodyText) {
        if (submitDetails) console.warn("Submit fetch body could not be read; submission was not captured.");
        return;
      }
      if (submitDetails) {
        const requestPayload = parseRequestPayload(bodyText);
        if (!requestPayload) {
          console.warn("Submit fetch body did not contain typed_code/lang; submission was not captured.");
          return;
        }
        const responseBody = await readResponseJson(response);
        publishSubmission(submitDetails, requestPayload, responseBody);
      } else if (graphQL) {
        await observeSubmissionDetails(bodyText, response);
      }
    }).catch((error) => {
      console.warn("Submission observer could not process fetch response:", error?.message || error);
    });

    return responsePromise;
  };

  // XHR hook, retained for versions/routes that use XMLHttpRequest.
  const originalXhrOpen = XMLHttpRequest.prototype.open;
  const originalXhrSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this.__lcSyncRequest = {
      submitDetails: getSubmissionRequestDetails(url, method),
      graphQL: isGraphQLRequest(url, method)
    };
    return originalXhrOpen.call(this, method, url, ...rest);
  };

  XMLHttpRequest.prototype.send = function (body) {
    const request = this.__lcSyncRequest;
    if (request?.submitDetails || request?.graphQL) {
      const requestBodyPromise = bodyToText(body);
      this.addEventListener("load", async () => {
        if (this.status < 200 || this.status >= 300) return;
        try {
          const requestBody = await requestBodyPromise;
          if (request.submitDetails) {
            const requestPayload = parseRequestPayload(requestBody);
            if (!requestPayload) return;
            if (this.responseType && this.responseType !== "text" && this.responseType !== "json") return;
            const responseBody = this.responseType === "json" ? this.response : JSON.parse(this.responseText);
            publishSubmission(request.submitDetails, requestPayload, responseBody);
          } else if (request.graphQL) {
            let responseText;
            if (this.responseType === "json") responseText = JSON.stringify(this.response);
            else if (!this.responseType || this.responseType === "text") responseText = this.responseText;
            else if (this.responseType === "blob" && this.response instanceof Blob) responseText = await this.response.text();
            else return;
            await observeSubmissionDetails(requestBody, new Response(responseText, {
              status: this.status,
              headers: { "Content-Type": "application/json" }
            }));
          }
        } catch (error) {
          console.warn("Submission observer could not process XHR response:", error?.message || error);
        }
      }, { once: true });
    }
    return originalXhrSend.call(this, body);
  };

  console.log("LeetCode submission and verdict observers installed.");
})();
