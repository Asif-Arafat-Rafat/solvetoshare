// Inside banner.js
async function showSuccess(body) {
    const storage = await chrome.storage.session.get(["ApiStatus"]);
    
    // 2. Guard Clause: If a blocked status is already cached from a recent error, stop!
    if (storage.ApiStatus == 429 || storage.ApiStatus == 401) {
        alert(`Banner canceled: Previous request failed with status ${storage.ApiStatus}`);
        console.log(`Banner canceled: Previous request failed with status ${storage.ApiStatus}`);
        return null; 
    }
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
    const fileUrl = chrome.runtime.getURL("bannerResponse.html");
    const res = await fetch(fileUrl);
    let htmlContent = await res.text();
    
    // Inject your UI code content dynamically into the template payload string
    // Assumes your bannerResponse.html template has an explicit placeholder like {ai_output}
    if (htmlContent.includes("{ai_output}")) {
        htmlContent = htmlContent.replace("{ai_output}", aiCodeData);
    }

    body.insertAdjacentHTML('afterbegin', htmlContent);
    
    const responseBanner = body.querySelector('#extension_banner');
    if (responseBanner) {
        responseBanner.style.transition = "opacity 0.5s ease-in-out";
        
        // Alternative fallback: If no template token exists, insert it into a container class
        const codeContainer = responseBanner.querySelector('.ai-code-output');
        if (codeContainer) codeContainer.textContent = aiCodeData;
    }
    
    setTimeout(() => {
        if (responseBanner) {
            responseBanner.style.opacity = '0';
            setTimeout(() => {
                responseBanner.remove();
            }, 500); 
        }
    }, 5000); 
}

// Fixed Message Listener
// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//     if (message.action === "AiResponse") {
//         console.log("Got AI Response payload.");

//         // 🌟 FIX 1: Vaporize the loading banner instantly BEFORE injecting new nodes
//         // This eliminates DOM selector collisions completely
//         const loadingBanner = document.querySelector('#extension_banner');
//         if(loadingBanner) {
//             loadingBanner.style.display='none'; // Immediate visual hide
//         }
        
//         if (message.status == 503) {
//             alert("⚠️ Gemini API is currently overloaded (503 Service Unavailable). Please try again in a few moments.");
//             sendResponse({ status: "acknowledged" });
//             return;
//         }
//         if (message.status == 429) {
//             alert("You exceeded your current quota.");
//             sendResponse({ status: "acknowledged" });
//             return;
//         }
        
//         // 🌟 FIX 2: Correctly pass and map the AI payload text data
//         successFullyResponded(document.body, message.code);
        
//         sendResponse({ status: "rendered" });
//     }
// });

async function runPipeline() {
    await showSuccess(document.body);
}