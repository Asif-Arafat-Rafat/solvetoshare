// Inside banner.js

async function check(){
    const storage = await chrome.storage.session.get(["ApiStatus"]);
    if (storage.ApiStatus == 429 || storage.ApiStatus == 401 || storage.ApiStatus == 503) {
        alert(`Previous request failed with status ${storage.ApiStatus}. Please try again later.`);
        console.log(`Previous request failed with status ${storage.ApiStatus}. Banner will not display.`);
        return false; 
    } 
    return true;
}


async function showSuccess(body) {
    const fileUrl = chrome.runtime.getURL("banner.html");
    const res = await fetch(fileUrl);
    const htmlContent = await res.text();

    body.insertAdjacentHTML('afterbegin', htmlContent);

    const successBanner = body.querySelector('#extension_banner');

    if (successBanner) {
        successBanner.style.transition = "opacity 0.5s ease-in-out";
    }

    return successBanner;
}
async function successFullyResponded(body, aiCodeData) {
    const postResponse = document.querySelector("#postResponse");
    if (postResponse) {
        postResponse.style.display = "flex"; // Immediate cleanup of loading banner to prevent collisions
    }
    if (htmlContent.includes("{ai_output}")) {
        htmlContent = htmlContent.replace("{ai_output}", aiCodeData);
    }
    const responseBanner = body.querySelector('#extension_banner');
    if (responseBanner) {
        responseBanner.style.transition = "opacity 0.5s ease-in-out";
        
        // Alternative fallback: If no template token exists, insert it into a container class
        const codeContainer = responseBanner.querySelector('.ai-code-output');
        if (codeContainer) codeContainer.textContent = aiCodeData;
    }
}

// Fixed Message Listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "AiResponse") {
        console.log("Got AI Response payload.");

        // 🌟 FIX 1: Vaporize the loading banner instantly BEFORE injecting new nodes
        // This eliminates DOM selector collisions completely
        const loadingBanner = document.querySelector('#preResponse');
        if(loadingBanner) {
                    loadingBanner.style.display='none'; // Immediate visual hide
        }
        
        if (message.status == 503) {
            document.body.querySelector('#extension_banner')?.remove(); // Ensure any existing banner is removed to prevent collisions
            alert("⚠️ Gemini API is currently overloaded (503 Service Unavailable). Please try again in a few moments.");
            sendResponse({ status: "acknowledged" });
            // successFullyResponded(document.body, "Gemini API is currently overloaded. Please try again later.");
            return;
        }
        if (message.status == 429) {
            document.body.querySelector('#extension_banner')?.remove(); // Ensure any existing banner is removed to prevent collisions
            alert("You exceeded your current quota.");
            sendResponse({ status: "acknowledged" });
            return;
        }
        // 🌟 FIX 2: Correctly pass and map the AI payload text data
        successFullyResponded(document.body, message.code);
        const showResponseBtn = document.querySelector("#seeEvaluationBtn");
        const responseBanner = document.querySelector('#response_banner');
        showResponseBtn.addEventListener("click", () => {
            responseBanner.style.display = 'flex';
        });
        sendResponse({ status: "rendered" });
    }
});

async function runPipeline() {
    if(await check()) {
        showSuccess(document.body);
    }
    return null;
}