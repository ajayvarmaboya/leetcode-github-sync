console.log("Submission Detector initialized.");

let lastDetectedSubmission = null;
let waitingForSourceSubmission = null;


/**
 * Get submission ID from the current URL.
 */
function getSubmissionId() {

    const match = window.location.pathname.match(
        /\/submissions\/(\d+)/
    );

    return match ? match[1] : null;
}


/**
 * Check whether the current submission is accepted.
 */
function isAccepted() {

    const bodyText = document.body.innerText;

    return bodyText.includes("Accepted");
}


/**
 * Process the current submission.
 */
function checkSubmission() {

    const submissionId = getSubmissionId();

    // Not a submission page.
    if (!submissionId) {
        return;
    }


    // Submission is not accepted yet.
    if (!isAccepted()) {
        return;
    }


    /*
     * Already completely processed.
     */
    if (
        lastDetectedSubmission === submissionId
    ) {
        return;
    }


    /*
     * We already detected this accepted submission
     * and are waiting for Monaco source code.
     *
     * Do not repeatedly process it.
     */
    if (
        waitingForSourceSubmission === submissionId
    ) {
        return;
    }


    console.log(
        "Accepted submission detected!"
    );

    console.log(
        "Submission ID:",
        submissionId
    );


    /*
     * Remember that we are waiting for Monaco.
     */
    waitingForSourceSubmission = submissionId;


    const code = extractSourceCode();


    /*
     * Monaco source is not available yet.
     *
     * extractor.js will dispatch:
     *
     * "leetcode-source-ready"
     *
     * when the source becomes available.
     */
    if (!code) {

        console.log(
            "Waiting for Monaco source code..."
        );

        return;
    }


    /*
     * Source code is available.
     */
    waitingForSourceSubmission = null;

    lastDetectedSubmission = submissionId;


    console.log(
        "Source code successfully extracted."
    );


    console.log(
        "Preparing submission message..."
    );


    /*
     * Send submission to service worker.
     */
    chrome.runtime.sendMessage({

        type:
            "LEETCODE_SUBMISSION_ACCEPTED",

        payload: {

            submissionId:
                submissionId,

            submissionUrl:
                window.location.href,

            code:
                code
        }

    });


    console.log(
        "Accepted submission sent to service worker."
    );
}


/**
 * Monaco source-code notification.
 *
 * extractor.js dispatches this event after
 * receiving source code from monaco-bridge.js.
 */
window.addEventListener(
    "leetcode-source-ready",
    () => {

        console.log(
            "Source code is ready."
        );

        /*
         * Allow checkSubmission() to process
         * the submission now.
         */
        waitingForSourceSubmission = null;

        checkSubmission();
    }
);


/**
 * Observe LeetCode's React DOM updates.
 *
 * We keep this because the Accepted state can
 * appear dynamically.
 */
const observer = new MutationObserver(() => {

    checkSubmission();

});


if (document.body) {

    observer.observe(
        document.body,
        {
            childList: true,
            subtree: true
        }
    );

}


/**
 * Initial check.
 */
checkSubmission();


/**
 * Small initialization fallbacks.
 *
 * These only matter before the page is fully
 * rendered. The waiting flag prevents duplicate
 * processing.
 */
setTimeout(() => {

    checkSubmission();

}, 500);


setTimeout(() => {

    checkSubmission();

}, 1000);


setTimeout(() => {

    checkSubmission();

}, 2000);


setTimeout(() => {

    checkSubmission();

}, 3000);