const GITHUB_API_BASE = "https://api.github.com";

async function getAccessToken() {
  const result = await chrome.storage.local.get("githubAccessToken");

  if (!result.githubAccessToken) {
    throw new Error("GitHub is not connected.");
  }

  return result.githubAccessToken;
}

async function githubRequest(path, options = {}) {
  const token = await getAccessToken();

  const response = await fetch(
    `${GITHUB_API_BASE}${path}`,
    {
      ...options,
      headers: {
        "Accept": "application/vnd.github+json",
        "Authorization": `Bearer ${token}`,
        "X-GitHub-Api-Version": "2026-03-10",
        ...(options.headers || {})
      }
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `GitHub API ${response.status}: ${errorText}`
    );
  }

  return response.json();
}

async function getAuthenticatedUser() {
  return githubRequest("/user");
}

async function getRepository(owner, repo) {
  return githubRequest(`/repos/${owner}/${repo}`);
}

function base64EncodeUtf8(text){
  const bytes=new TextEncoder().encode(text);
  let binary="";

  for(let i=0;i<bytes.length;i+=0x8000){
    binary+=String.fromCharCode(...bytes.subarray(i,i+0x8000));

  }
  return btoa(binary);
}

function base64DecodeUtf8(base64) {
  const binary = atob(base64.replace(/\s/g, ""));
  const bytes = Uint8Array.from(
    binary,
    (character) => character.charCodeAt(0)
  );

  return new TextDecoder("utf-8").decode(bytes);
}



async function saveSolution({
  owner,
  repo,
  path,
  code,
  message
}) {
  if (
    !owner ||
    !repo ||
    !path ||
    typeof code !== "string" ||
    !code.trim()
  ) {
    throw new Error(
      "Missing repository, file path, or solution code."
    );
  }

  const endpoint =
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}` +
    `/contents/${path
      .split("/")
      .map(encodeURIComponent)
      .join("/")}`;

  const payload = {
    message: message || `Add LeetCode solution: ${path}`,
    content: base64EncodeUtf8(code)
  };

  // Try to retrieve the existing file.
  // A 404 means it needs to be created.
  try {
    const existing = await githubRequest(endpoint);
    payload.sha = existing.sha;

    const existingCode = base64DecodeUtf8(existing.content);

    if (existingCode === code) {
      console.log(
        "Solution unchanged. Skipping GitHub update:",
        path
      );

      return {
        skipped: true,
        reason: "identical_content",
        path,
        html_url: existing.html_url
      };
    }
  } catch (error) {
    if (!error.message.includes("GitHub API 404")) {
      throw error;
    }

    console.log(
      "File does not exist yet. Creating:",
      path
    );
  }

  // Creating the first file also initializes an empty repository.
  return githubRequest(endpoint, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}


export {
  getAccessToken,
  githubRequest,
  getAuthenticatedUser,
  getRepository,
  saveSolution
};