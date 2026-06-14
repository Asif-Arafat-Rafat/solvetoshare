// Inside banner.js

async function check() {
    const storage = await chrome.storage.session.get(["ApiStatus"]);
    if (storage.ApiStatus == 429 || storage.ApiStatus == 401 || storage.ApiStatus == 503 || storage.ApiStatus == 400) {
        showCustomError(`Previous request failed with status ${storage.ApiStatus}. Please try again later.`);
        alert(`Previous request failed with status ${storage.ApiStatus}. Banner will not display.`);
        return false;
    }
    return true;
}

// Utility to display status messaging cleanly inside the overlay bar without breaking with alert prompts
function showCustomError(message) {
    const loadingText = document.querySelector("#loadingText");
    const loader = document.querySelector(".loader");
    const banner = document.querySelector("#extension_banner");
    console.log("Removing banner:");
    if(banner) banner.remove(); // Ensure banner is visible to show the error message
    // if (loader) loader.style.display = 'none';
    // if (loadingText) {
    //     loadingText.textContent = message;
    //     loadingText.style.color = '#f87171'; // Red Error Alert Accent
    // }
    // if (banner) {
    //     banner.style.border = '1px solid rgba(239, 68, 68, 0.4)';
    // }
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
        postResponse.style.display = "flex";
    }

    if (!responseResult) return;

    let evaluationData = null;

    try {
        evaluationData =
            typeof aiCodeData === "string"
                ? JSON.parse(aiCodeData)
                : aiCodeData;
    } catch (e) {
        evaluationData = aiCodeData;
    }

    if (
        !evaluationData ||
        typeof evaluationData !== "object"
    ) {
        responseResult.innerHTML = `
            <div class="section-title">Evaluation Result</div>
            <pre class="raw-text-fallback">${escapeHtml(
                String(aiCodeData)
            )}</pre>
        `;
        return;
    }

    let htmlBuilder = "";

    /* =========================================
       METRICS
    ========================================= */

    if (evaluationData.metrics?.ratings) {
        const ratings = evaluationData.metrics.ratings;

        htmlBuilder += `
            <div class="section-title metrics-title">
                📊 Performance Metrics
            </div>

            <div class="metrics-grid">
                ${createMetricCard(
                    "Correctness",
                    ratings.correctness || "-"
                )}

                ${createMetricCard(
                    "Time Complexity",
                    ratings.time_complexity || "-"
                )}

                ${createMetricCard(
                    "Space Complexity",
                    ratings.space_complexity || "-"
                )}

                ${createMetricCard(
                    "Readability",
                    ratings.readability || "-"
                )}
            </div>
        `;
    }

    /* =========================================
       STRENGTHS
    ========================================= */

    if (
        evaluationData.profile?.strengths &&
        evaluationData.profile.strengths.length > 0
    ) {
        htmlBuilder += `
            <div class="section-title" style="color:#4ade80;">
                ✅ Strengths
            </div>
        `;

        evaluationData.profile.strengths.forEach((st) => {
            htmlBuilder += `
                <div class="strength-card">
                    <div class="card-header-badge badge-strength">
                        <svg width="14" height="14" viewBox="0 0 24 24"
                             fill="none"
                             stroke="currentColor"
                             stroke-width="2.5">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>

                        ${escapeHtml(st.point)}
                    </div>

                    <p class="card-detail">
                        ${escapeHtml(st.detail)}
                    </p>
                </div>
            `;
        });
    }

    /* =========================================
       IMPROVEMENTS
    ========================================= */

    if (
        evaluationData.profile?.areas_for_improvement &&
        evaluationData.profile.areas_for_improvement.length > 0
    ) {
        htmlBuilder += `
            <div class="section-title"
                 style="color:#f87171;margin-top:20px;">
                 ⚠️ Areas for Improvement
            </div>
        `;

        evaluationData.profile.areas_for_improvement.forEach((imp) => {
            const lineSection = imp.line
                ? `
                    <div class="code-snippet">
                        ${escapeHtml(imp.line)}
                    </div>
                `
                : "";

            const suggestionSection = imp.suggestion
                ? `
                    <div class="suggestion-box">
                        💡 ${escapeHtml(imp.suggestion)}
                    </div>
                `
                : "";

            htmlBuilder += `
                <div class="improvement-card">

                    <div class="card-header-badge badge-improvement">
                        <svg width="14"
                             height="14"
                             viewBox="0 0 24 24"
                             fill="none"
                             stroke="currentColor"
                             stroke-width="2.5">

                            <circle cx="12"
                                    cy="12"
                                    r="10">
                            </circle>

                            <line x1="12"
                                  y1="8"
                                  x2="12"
                                  y2="12">
                            </line>

                            <line x1="12"
                                  y1="16"
                                  x2="12.01"
                                  y2="16">
                            </line>
                        </svg>

                        ${escapeHtml(imp.point)}
                    </div>

                    <p class="card-detail">
                        ${escapeHtml(imp.detail)}
                    </p>

                    ${lineSection}
                    ${suggestionSection}

                </div>
            `;
        });
    }

    /* =========================================
       COMPLEXITY ANALYSIS
    ========================================= */

    if (evaluationData.metrics?.complexity_analysis) {
        const complexity =
            evaluationData.metrics.complexity_analysis;

        htmlBuilder += `
            <div class="section-title"
                 style="margin-top:20px;color:#60a5fa;">
                ⏱ Complexity Analysis
            </div>

            <div class="complexity-card">

                <div>
                    <strong>Time:</strong>
                    ${escapeHtml(complexity.time || "-")}
                </div>

                <div style="margin-top:10px;">
                    <strong>Space:</strong>
                    ${escapeHtml(complexity.space || "-")}
                </div>

            </div>
        `;
    }

    /* =========================================
       OPTIMIZED IMPLEMENTATION
    ========================================= */

    if (evaluationData.optimized_implementation) {
        const optimized =
            evaluationData.optimized_implementation;

        htmlBuilder += `
            <div class="section-title"
                 style="margin-top:20px;color:#fbbf24;">
                🚀 Optimized Solution
            </div>

            <div class="optimized-container" style="height: 400px;">

                <div class="code-header">

                    <span>
                        ${escapeHtml(
                            optimized.language || "Code"
                        )}
                    </span>

                    <button id="copyOptimizedCode">
                        Copy Code
                    </button>

                </div>

                <pre class="optimized-code"><code>${escapeHtml(
                    optimized.code || ""
                )}</code></pre>

            </div>
        `;
    }

    responseResult.innerHTML = htmlBuilder;

    /* =========================================
       COPY BUTTON
    ========================================= */

    const copyBtn =
        document.querySelector("#copyOptimizedCode");

    if (
        copyBtn &&
        evaluationData.optimized_implementation?.code
    ) {
        copyBtn.addEventListener("click", async () => {
            try {
                await navigator.clipboard.writeText(
                    evaluationData.optimized_implementation.code
                );

                copyBtn.textContent = "Copied ✓";

                setTimeout(() => {
                    copyBtn.textContent = "Copy Code";
                }, 2000);
            } catch (err) {
                console.error(err);
            }
        });
    }
}

/* =========================================
   HELPER
========================================= */

function createMetricCard(title, score) {
    return `
        <div class="metric-card">
            <div class="metric-label">
                ${title}
            </div>

            <div class="metric-score">
                ${score}
            </div>
        </div>
    `;
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
        console.log("Status code  1:", message.status);
        // Vaporize the loading banner instantly before displaying the actions container
        const loadingBanner = document.querySelector('#preResponse');
        if (loadingBanner) {
            loadingBanner.style.display = 'none';
        }
        if (message.status == 400) {
            showCustomError("Recheck Api Key");
            sendResponse({ status: "acknowledged" });
            return;
        }
        else if (message.status == 503) {
            showCustomError("⚠️ Gemini API is currently overloaded (503 Service Unavailable). Please try again shortly.");
            sendResponse({ status: "acknowledged" });
            return;
        }
        else if (message.status == 429) {
            showCustomError("⚠️ You exceeded your current API quota limit.");
            sendResponse({ status: "acknowledged" });
            return;
        }

        // Populate results securely
        else {
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
    }
});

async function runPipeline() {
    if (await check()) {
        await showSuccess(document.body);
    }
    return null;
}