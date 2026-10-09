console.log("Code extractor loaded.");

let latestMonacoSource = null;

/**
 * Listen for source code sent by the Monaco bridge.
 *
 * monaco-bridge.js runs in the MAIN world.
 * extractor.js runs in the extension's isolated world.
 *
 * Communication:
 *
 * Monaco Bridge
 *      ↓
 * window.postMessage()
 *      ↓
 * extractor.js
 */
window.addEventListener("message", (event) => {

    // Only accept messages from this page.
    if (event.source !== window) {
        return;
    }

    const message = event.data;

    // Ignore unrelated page messages.
    if (!message) {
        return;
    }

    // Make sure the message belongs to our extension.
    if (
        message.source !==
        "leetcode-github-sync"
    ) {
        return;
    }

    // We only care about Monaco source-code messages.
    if (
        message.type !==
        "MONACO_SOURCE_CODE"
    ) {
        return;
    }

    // Validate the payload.
    if (
        !message.payload ||
        !message.payload.code
    ) {
        console.log(
            "Monaco message received, but no source code was provided."
        );

        return;
    }

    // Store the latest source code.
    latestMonacoSource = {
        code: message.payload.code,
        language: message.payload.language || null,
        lineCount: message.payload.lineCount || 0
    };

    console.log(
        "Received source code from Monaco bridge."
    );

    console.log(
        "Language:",
        latestMonacoSource.language
    );

    console.log(
        "Lines:",
        latestMonacoSource.lineCount
    );

    console.log(
        "Source code:"
    );

    console.log(
        latestMonacoSource.code
    );

    /*
     * Tell submission-detector.js that the source
     * code is now available.
     */
    window.dispatchEvent(
        new CustomEvent(
            "leetcode-source-ready"
        )
    );
});


/**
 * Return the latest source code received
 * from the Monaco bridge.
 *
 * Returns:
 *     string -> source code
 *     null   -> source code not available yet
 */

function extractSourceCode() {
    const source = getMonacoSource();

    if (
        !source ||
        !source.code ||
        !source.code.trim()
    ) {
        console.log("Monaco source code not available yet.");
        return null;
    }

    return source;
}



/**
 * Return the complete Monaco source object.
 *
 * This will be useful later when we build the
 * complete Submission object.
 */
function getMonacoSource() {

    if (!latestMonacoSource) {
        return null;
    }

    return {
        code: latestMonacoSource.code,
        language: latestMonacoSource.language,
        lineCount: latestMonacoSource.lineCount
    };
}