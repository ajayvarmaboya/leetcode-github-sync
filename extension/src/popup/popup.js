const connectButton =
  document.getElementById("connectGitHub");

const testButton =
  document.getElementById("testGithub");

const status =
  document.getElementById("status");


// ==========================================
// CONNECT GITHUB
// ==========================================

connectButton.addEventListener("click", async () => {

  status.textContent =
    "Connecting to GitHub...";

  connectButton.disabled = true;

  try {

    const response =
      await chrome.runtime.sendMessage({
        type: "CONNECT_GITHUB"
      });

    if (!response?.success) {
      throw new Error(
        response?.error ||
        "GitHub authentication failed."
      );
    }

    status.textContent =
      "GitHub connected successfully.";

  } catch (error) {

    console.error(
      "GitHub connection error:",
      error
    );

    status.textContent =
      `Error: ${error.message}`;

  } finally {

    connectButton.disabled = false;

  }

});


// ==========================================
// TEST GITHUB API
// ==========================================

testButton.addEventListener("click", async () => {

  status.textContent =
    "Testing GitHub API...";

  testButton.disabled = true;

  try {

    const response =
      await chrome.runtime.sendMessage({
        type: "TEST_GITHUB_API"
      });

    if (!response?.success) {

      throw new Error(
        response?.error ||
        "GitHub API test failed."
      );

    }

    status.textContent =
      `Connected as ${response.user}. Repository found: ${response.repository}`;

  } catch (error) {

    console.error(
      "GitHub API test error:",
      error
    );

    status.textContent =
      `GitHub API failed: ${error.message}`;

  } finally {

    testButton.disabled = false;

  }

});