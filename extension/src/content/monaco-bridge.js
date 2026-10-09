
console.log("LeetCode GitHub Sync: Monaco bridge started.");

function getSubmittedCode() {
    if (
        !window.monaco?.editor ||
        typeof window.monaco.editor.getModels !== "function"
    ) {
        return null;
    }

    const models = window.monaco.editor.getModels();

    // Prefer a non-empty model with a real programming language.
    const model = models.find((candidate) => {
        const code = candidate.getValue();
        const language = candidate.getLanguageId();

        return (
            typeof code === "string" &&
            code.trim().length > 0 &&
            language &&
            language !== "plaintext"
        );
    });

    if (!model) {
        return null;
    }

    return {
        code: model.getValue(),
        language: model.getLanguageId(),
        lineCount: model.getLineCount()
    };
}

function sendCodeToExtension() {
    const result = getSubmittedCode();

    if (!result) {
        return false;
    }

    window.postMessage(
        {
            source: "leetcode-github-sync",
            type: "MONACO_SOURCE_CODE",
            payload: result
        },
        window.location.origin
    );

    console.log("Monaco source code sent successfully.", {
        language: result.language,
        lineCount: result.lineCount,
        characters: result.code.length
    });

    return true;
}

let attempts = 0;

const interval = setInterval(() => {
    attempts++;

    if (sendCodeToExtension()) {
        clearInterval(interval);
        return;
    }

    if (attempts >= 40) {
        clearInterval(interval);
        console.warn(
            "Monaco source code unavailable after 20 seconds."
        );
    }
}, 500);
