const GITHUB_CLIENT_ID = "Iv23lixVgZxfAaMalXkT";

const BACKEND_URL = "http://localhost:8081";

function base64UrlEncode(buffer) {
  const bytes = new Uint8Array(buffer);

  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function generateRandomString(length = 64) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";

  const randomValues = new Uint8Array(length);

  crypto.getRandomValues(randomValues);

  return Array.from(randomValues, value =>
    characters[value % characters.length]
  ).join("");
}

async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();

  const data = encoder.encode(verifier);

  const digest = await crypto.subtle.digest(
    "SHA-256",
    data
  );

  return base64UrlEncode(digest);
}

async function authenticateWithGitHub() {
  const redirectUri = chrome.identity.getRedirectURL();

  const state = generateRandomString();

  const codeVerifier = generateRandomString(64);

  const codeChallenge =
    await generateCodeChallenge(codeVerifier);

  await chrome.storage.session.set({
    githubOAuthState: state,
    githubCodeVerifier: codeVerifier
  });

  const authorizationUrl = new URL(
    "https://github.com/login/oauth/authorize"
  );

  authorizationUrl.searchParams.set(
    "client_id",
    GITHUB_CLIENT_ID
  );

  authorizationUrl.searchParams.set(
    "redirect_uri",
    redirectUri
  );

  authorizationUrl.searchParams.set(
    "state",
    state
  );

  authorizationUrl.searchParams.set(
    "code_challenge",
    codeChallenge
  );

  authorizationUrl.searchParams.set(
    "code_challenge_method",
    "S256"
  );

  const responseUrl =
    await chrome.identity.launchWebAuthFlow({
      url: authorizationUrl.toString(),
      interactive: true
    });

  if (!responseUrl) {
    throw new Error("GitHub OAuth did not return a callback URL.");
  }

  const callbackUrl = new URL(responseUrl);

  const returnedState =
    callbackUrl.searchParams.get("state");

  const code =
    callbackUrl.searchParams.get("code");

  const error =
    callbackUrl.searchParams.get("error");

  if (error) {
    const description =
      callbackUrl.searchParams.get("error_description");

    throw new Error(
      `GitHub authorization failed: ${description || error}`
    );
  }

  const storedAuth =
    await chrome.storage.session.get([
      "githubOAuthState",
      "githubCodeVerifier"
    ]);

  if (
    !returnedState ||
    returnedState !== storedAuth.githubOAuthState
  ) {
    throw new Error("OAuth state validation failed.");
  }

  if (!code) {
    throw new Error("GitHub did not return an authorization code.");
  }

  if (!storedAuth.githubCodeVerifier) {
    throw new Error("PKCE code verifier is missing.");
  }

  const tokenResponse = await exchangeCodeForToken(
    code,
    storedAuth.githubCodeVerifier,
    redirectUri
  );

  await chrome.storage.session.remove([
    "githubOAuthState",
    "githubCodeVerifier"
  ]);

  await chrome.storage.local.set({
    githubAccessToken: tokenResponse.access_token,
    githubRefreshToken: tokenResponse.refresh_token,
    githubAccessTokenExpiresAt:
      Date.now() + tokenResponse.expires_in * 1000,
    githubRefreshTokenExpiresAt:
      Date.now() +
      tokenResponse.refresh_token_expires_in * 1000
  });

  return tokenResponse;
}

async function exchangeCodeForToken(
  code,
  codeVerifier,
  redirectUri
) {
  const response = await fetch(
    `${BACKEND_URL}/api/auth/github/exchange`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        code,
        codeVerifier,
        redirectUri
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Token exchange failed: ${errorText}`
    );
  }

  return response.json();
}

export {
  authenticateWithGitHub
};