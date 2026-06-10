chrome.storage.local.get(["primaryAiModel"],(data)=>{
    if(data.primaryAiModel === "gemini"){
        chrome.storage.local.get(["STSgeminiApiKey"],(data)=>{
            const GeminiApiKey = data.STSgeminiApiKey;
            if(!GeminiApiKey){
                console.warn("⚠️ Gemini API key not found in storage. Please set it in the popup.");
            } else {
                console.log("✅ Gemini API key loaded successfully from storage.");
            }
        })
    }
})


export async function evaluateMySolveGemini(solutionCode) {
    console.log("Evaluating your solution with Gemini...");

    const promptText = `Please review and simulate this code, check for bugs, and explain it:\n\n${solutionCode}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GeminiApiKey}`;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [{ text: promptText }]
                    }
                ]
            })
        });

        const data = await response.json();

        // ✅ ALWAYS log full response first
        console.log("Status:", response.status);
        console.log("Full Gemini Response:", JSON.stringify(data, null, 2));

        // ❌ Handle HTTP-level errors
        if (!response.ok) {
            return `API ERROR ${response.status}: ${data?.error?.message || JSON.stringify(data)}`;
        }

        // ❌ Handle Gemini error format
        if (data.error) {
            return `GEMINI ERROR: ${data.error.message || JSON.stringify(data.error)}`;
        }

        // ❌ Validate structure safely
        const text =
            data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            return `INVALID RESPONSE STRUCTURE:\n${JSON.stringify(data, null, 2)}`;
        }

        return text;

    } catch (error) {
        console.error("Fetch failed:", error);
        return `NETWORK/JS ERROR: ${error.message}`;
    }
}