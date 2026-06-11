
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

        if (settings.primaryAiModel !== "gemini") {
            return "Selected AI model is not Gemini.";
        }

        const GeminiApiKey = settings.STSgeminiApiKey;

        if (!GeminiApiKey) {
            return "⚠️ Gemini API key not found in storage.";
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

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GeminiApiKey}`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: promptText
                            }
                        ]
                    }
                ],
                // 🔥 FIX 1: Enforce strict application/json output mode from Gemini
                generationConfig: {
                    responseMimeType: "application/json"
                }
            })
        });

        const data = await response.json();
        console.log("Status:", response.status);

        if (!response.ok) {
            return `API ERROR ${response.status}: ${
                data?.error?.message || JSON.stringify(data)
            }`;
        }

        if (data.error) {
            return `GEMINI ERROR: ${
                data.error.message || JSON.stringify(data.error)
            }`;
        }

        // 🔥 FIX 2: Fixed the syntax crash. Extracted text once, safely.
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        console.log("(evaluateJS)Extracted Text Response:", text || "No text returned from API.");
        // chrome.runtime.sendMessage({
        //     action:"AiResponse",
        //     code:text
        // })
        if (!text) {
            return `INVALID RESPONSE STRUCTURE:\n${JSON.stringify(data, null, 2)}`;
        }

        try {
            // Because of responseMimeType, this will parse perfectly!
            const cleanJsonObj = JSON.parse(text);
            console.log("Clean Json Object:", cleanJsonObj);
            
            // Return either the stringified clean JSON or return the parsed object based on UI requirements
            return text; 
        } catch (jsonErr) {
            console.error("JSON parsing fallback failure:", jsonErr);
            return text;
        }

    } catch (error) {
        console.error("Fetch failed:", error);
        return `NETWORK/JS ERROR: ${error.message}`;
    }
}