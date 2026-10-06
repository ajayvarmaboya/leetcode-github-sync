console.log("LeetCode GitHub Sync service worker started.");

chrome.runtime.onMessage.addListener((message,sender)=>{
    console.log("Message received:",message);

    if(message.type==="LEETCODE_PAGE_LOADED"){

        console.log("LeetCode page detected.");
        console.log("URL:",message.payload.url);
        console.log("Title:",message.payload.title);
    }

    if(message.type==="LEETCODE_SUBMISSION_ACCEPTED"){
        console.log("🎉 ACCEPTED SUBMISSION!");

        console.log("Submission ID:",message.payload.submissionId);
        console.log("Submission URL:",message.payload.submissionUrl);
        console.log("Source Code:");
        console.log(message.payload.code);



    }
});