console.log("monaco bridge loaded");

console.log("Monaco bridge loaded.");

function getSubmittedCode() {
    if (
        typeof monaco === "undefined" ||
        !monaco.editor
    ) {
        return null;
    }

    const models = monaco.editor.getModels();

    if (!models || models.length === 0) {
        return null;
    }

    /*
     * Find the model containing actual source code.
     *
     * We already verified that on the current
     * LeetCode submission page:
     *
     * Model 0 = submitted Java code
     * Model 1 = empty
     */
    const codeModel = models.find((model) => {
        const value = model.getValue();

        return value && value.trim().length > 0;
    });

    if (!codeModel) {
        return null;
    }

    return {
        code: codeModel.getValue(),
        language: codeModel.getLanguageId(),
        lineCount: codeModel.getLineCount()
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

    console.log(
        "Monaco source code sent to extension."
    );

    return true;
}
let attempts = 0;

const interval = setInterval(() => {
    attempts++;

    if (sendCodeToExtension()) {
        clearInterval(interval);
        return;
    }

    if (attempts >= 20) {
        clearInterval(interval);

        console.log(
            "Monaco editor was not available."
        );
    }
}, 500);