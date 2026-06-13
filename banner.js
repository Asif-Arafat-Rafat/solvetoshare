// Inside banner.js

async function check(){
    const storage = await chrome.storage.session.get(["ApiStatus"]);
    if (storage.ApiStatus == 429 || storage.ApiStatus == 401 || storage.ApiStatus == 503) {
        showCustomError(`Previous request failed with status ${storage.ApiStatus}. Please try again later.`);
        console.log(`Previous request failed with status ${storage.ApiStatus}. Banner will not display.`);
        return false; 
    } 
    return true;
}

// Utility to display status messaging cleanly inside the overlay bar without breaking with alert prompts
function showCustomError(message) {
    const loadingText = document.querySelector("#loadingText");
    const loader = document.querySelector(".loader");
    const banner = document.querySelector("#extension_banner");
    
    if (loader) loader.style.display = 'none';
    if (loadingText) {
        loadingText.textContent = message;
        loadingText.style.color = '#f87171'; // Red Error Alert Accent
    }
    if (banner) {
        banner.style.border = '1px solid rgba(239, 68, 68, 0.4)';
    }
}

async function showSuccess(body) {
    const fileUrl = chrome.runtime.getURL("banner.html");
    const res = await fetch(fileUrl);
    const htmlContent = await res.text();

    body.insertAdjacentHTML('afterbegin', htmlContent);

    const successBanner = body.querySelector('#extension_banner');

    if (successBanner) {
        successBanner.style.transition = "opacity 0.5s ease-in-out";
        successBanner.style.opacity = "1";
    }

    return successBanner;
}

async function successFullyResponded(body, aiCodeData) {
    const postResponse = document.querySelector("#postResponse");
    const responseResult = document.querySelector("#evaluationResult");
    
    if (postResponse) {
        postResponse.style.display = "flex"; // Swap pre-response view cleanly
    }

    if (!responseResult) return;

    // Check if aiCodeData is already parsed or if we need to try parsing it
    let evaluationData = null;
    try {
        evaluationData = typeof aiCodeData === 'string' ? JSON.parse(aiCodeData) : aiCodeData;
    } catch (e) {
        evaluationData = aiCodeData; // Fallback to raw string text
    }

    // Build responsive visually rich display for parsed JSON evaluation
    if (evaluationData && (evaluationData.profile || (Array.isArray(evaluationData) && evaluationData[0]?.profile))) {
        const profile = Array.isArray(evaluationData) ? evaluationData[0].profile : evaluationData.profile;
        let htmlBuilder = '';

        // Render Strengths
        if (profile.strengths && profile.strengths.length > 0) {
            htmlBuilder += `<div class="section-title" style="color: #4ade80;">Strengths</div>`;
            profile.strengths.forEach(st => {
                htmlBuilder += `
                    <div class="strength-card">
                        <div class="card-header-badge badge-strength">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            ${st.point}
                        </div>
                        <p class="card-detail">${st.detail}</p>
                    </div>
                `;
            });
        }

        // Render Areas for Improvement
        if (profile.areas_for_improvement && profile.areas_for_improvement.length > 0) {
            htmlBuilder += `<div class="section-title" style="color: #f87171; margin-top: 20px;">Areas for Improvement</div>`;
            profile.areas_for_improvement.forEach(imp => {
                const lineSection = imp.line ? `<div class="code-snippet">${escapeHtml(imp.line)}</div>` : '';
                const suggestionSection = imp.suggestion ? `<div class="suggestion-box">💡 Suggestion: ${escapeHtml(imp.suggestion)}</div>` : '';
                
                htmlBuilder += `
                    <div class="improvement-card">
                        <div class="card-header-badge badge-improvement">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                            ${imp.point}
                        </div>
                        <p class="card-detail">${imp.detail}</p>
                        ${lineSection}
                        ${suggestionSection}
                    </div>
                `;
            });
        }

        responseResult.innerHTML = htmlBuilder;
    } else {
        // Fallback: Display as clean text block if it is not structured data
        responseResult.innerHTML = `
            <div class="section-title" style="color: #9ca3af;">Detailed Evaluation</div>
            <pre class="raw-text-fallback">${escapeHtml(String(aiCodeData))}</pre>
        `;
    }
}

// Simple HTML escaping helper for display safety
function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Fixed Message Listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "AiResponse") {
        console.log("Got AI Response payload.", message);

        // Vaporize the loading banner instantly before displaying the actions container
        const loadingBanner = document.querySelector('#preResponse');
        if (loadingBanner) {
            loadingBanner.style.display = 'none'; 
        }
        
        if (message.status == 503) {
            showCustomError("⚠️ Gemini API is currently overloaded (503 Service Unavailable). Please try again shortly.");
            sendResponse({ status: "acknowledged" });
            return;
        }
        if (message.status == 429) {
            showCustomError("⚠️ You exceeded your current API quota limit.");
            sendResponse({ status: "acknowledged" });
            return;
        }

        // Populate results securely
        successFullyResponded(document.body, message.code);

        const showResponseBtn = document.querySelector("#seeEvaluationBtn");
        const responseBanner = document.querySelector('#response_banner');
        const cancelBtn = document.querySelector("#notInterestedBtn");
        const closeModalBtn = document.querySelector("#closeModalBtn");

        if (showResponseBtn && responseBanner) {
            showResponseBtn.addEventListener("click", () => {
                responseBanner.style.display = 'flex'; // Triggers smooth overlay block
            });
        }

        if (closeModalBtn && responseBanner) {
            closeModalBtn.addEventListener("click", () => {
                responseBanner.style.display = 'none';
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener("click", () => {
                // Instantly remove bottom bar wrapper
                document.querySelector('#extension_banner')?.remove();
                if (responseBanner) responseBanner.style.display = 'none';
            });
        }

        sendResponse({ status: "rendered" });
    }
});

async function runPipeline() {
    if (await check()) {
        await showSuccess(document.body);
    }
    return null;
}