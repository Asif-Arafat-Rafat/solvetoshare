//Only responsible for handling the communication between the webpage and the extension's background script. It injects a script into the webpage to listen for specific events and then processes those events to trigger UI updates or other actions.
//browser Console logs are used for debugging and to provide feedback about the extension's state and actions. They help developers understand what's happening inside the extension, especially when dealing with asynchronous events and interactions with the webpage.
const script = document.createElement('script');
script.src = chrome.runtime.getURL('inject.js');
(document.head || document.documentElement).appendChild(script);
script.onload = () => script.remove();

// 2. Listen for the wide-open event stream coming from inject.js
window.addEventListener('LEETCODE_RESPONSE_READY', (event) => {
    try {
        if (!chrome.runtime || !chrome.runtime.id) {
            console.log("🔄 Extension was reloaded! Please refresh the page to reconnect the pipeline.");
            return;
        }
        if(event.detail.state === "SUCCESS"){
                const body = document.querySelector("body");
                showSuccess(body);
        }
    } catch (error) {
        if (error.message.includes("Extension context invalidated")) {
            console.log("🔄 Extension context invalidated. A page refresh is required.");
        } else {
            console.error("❌ Message sending failed:", error);
        }
    }
});
