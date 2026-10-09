console.log("LeetCode GitHub Sync content script loaded.");
console.log(
    "Current LeetCode URL:",
     window.location.href
);

chrome.runtime.sendMessage({
    type:"LEETCODE_PAGE_LOADED",
    payload: {
        url:window.location.href,
        title:document.title
    }
})