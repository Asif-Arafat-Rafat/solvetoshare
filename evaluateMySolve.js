// evaluateMySolve.js

async function getPromptTemplate() {
    const response = await fetch(chrome.runtime.getURL("prompt.txt"));
    if (!response.ok) {
        throw new Error(`Failed to load prompt.txt (${response.status})`);
    }
    return await response.text();
}

function getStorage(keys) {
    return new Promise((resolve) => {
        chrome.storage.local.get(keys, resolve);
    });
}

export async function evaluateMySolveGemini(solutionCode) {
    console.log("Evaluating your solution with Gemini...");

    try {
        const settings = await getStorage([
            "primaryAiModel",
            "STSgeminiApiKey",
            "STSisSuggestionCodeNeeded",
            "STSisComplexityNeeded",
            "STSisRatingNeeded"
        ]);

        // 🌟 Unified Format Fixes across all early validation checks:
        if (settings.primaryAiModel !== "gemini") {
            return ["Selected AI model is not Gemini.", 400];
        }

        const GeminiApiKey = settings.STSgeminiApiKey;
        if (!GeminiApiKey) {
            return ["⚠️ Gemini API key not found in storage.", 401];
        }

        const isSuggestionCodeNeeded = settings.STSisSuggestionCodeNeeded || false;
        const isComplexityNeeded = settings.STSisComplexityNeeded || false;
        const isRatingNeeded = settings.STSisRatingNeeded || false;

        const promptTemplate = await getPromptTemplate();

        const promptText = promptTemplate
            .replace("{user code}", solutionCode)
            .replace("{isSuggestionCodeNeeded}", String(isSuggestionCodeNeeded))
            .replace("{isComplexityNeeded}", String(isComplexityNeeded))
            .replace("{isRatingNeeded}", String(isRatingNeeded));

        const url = [`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${GeminiApiKey}`,
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GeminiApiKey}`,
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GeminiApiKey}`,
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash:generateContent?key=${GeminiApiKey}`,
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro:generateContent?key=${GeminiApiKey}`,
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${GeminiApiKey}`];
        let response = await fetch(url[0], {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }] }],
                generationConfig: {
                    responseMimeType: "application/json"
                }
            })
        });
        for(let i=1;i<url.length;i++){
        if(response.status === 200){
            break;
        }    
        response = await fetch(url[i], {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }] }],
                generationConfig: {
                    responseMimeType: "application/json"
                }
            })
        });
    }
        const data = await response.json();
        console.log("Status:", response.status);
        const ResStatus = response.status;
        // 🌟 Unified formatting for downstream API errors
        if (!response.ok) {
            const errMsg = `API ERROR ${response.status}: ${data?.error?.message || JSON.stringify(data)}`;
            return [errMsg, response.status];
        }

        if (data.error) {
            const errMsg = `GEMINI ERROR: ${data.error.message || JSON.stringify(data.error)}`;
            return [errMsg, response.status];
        }

        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        console.log("(evaluateJS)Extracted Text Response:", text || "No text returned from API.");
        
        if (!text) {
            return [`INVALID RESPONSE STRUCTURE:\n${JSON.stringify(data, null, 2)}`, 502];
        }

        try {
            const cleanJsonObj = JSON.parse(text);
            console.log("Clean Json Object:", cleanJsonObj);
            return [text, response.status]; 
        } catch (jsonErr) {
            console.log("JSON parsing fallback failure:", jsonErr);
            return [text, response.status];
        }

    } catch (error) {
        console.log("Fetch failed:", error);
        return [`NETWORK/JS ERROR: ${error.message}`, 500]; // 🌟 Clean array format fallback
    }
}
