const indicator = document.querySelector('.status-indicator');
const statusText = document.getElementById('statusText');
if(!chrome.runtime || !chrome.runtime.id){
    statusText.textContent = "Extension not connected. Please refresh the page.";
    indicator.classList.remove('connected');
    indicator.classList.add('disconnected');
}

document.addEventListener('DOMContentLoaded', async () => {
	const actionButton = document.getElementById('actionButton');
    const selectModel = document.getElementById('modelSelect');
    const apiKeyInput = document.getElementById('apiKeyInput');
	if (!actionButton) {
		return;
	}
	actionButton.addEventListener('click', async () => {
		// actionButton.textContent =selectModel.value;
        if(selectModel.value === "gemini"){
            setLoadingState(true);
            await checkGApiKey(apiKeyInput.value);
            setLoadingState(false);
        }

        console.log("Popup button clicked. Current model:", selectModel.value, "API Key length:", apiKeyInput.value.length);
        location.reload();
	});
});

function setLoadingState(isLoading) {
    const loadingDiv = document.getElementById('loading');
    const mainBody = document.getElementById('mainBody');
    if (isLoading) {
        loadingDiv.style.display = 'flex';
        mainBody.style.filter = 'blur(5px)';
    }
    else{
        loadingDiv.style.display = 'none';
        mainBody.style.filter = 'none';
    }
}


async function checkGApiKey(key) {
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: "Hello" }]
                }]
            })
        });

        const data = await response.json();

        // 🔥 ALWAYS log raw response first
        console.log("STATUS:", response.status);
        console.log("OK:", response.ok);
        console.log("RAW RESPONSE:", data);

        if (!response.ok) {
            console.error("❌ Gemini API FAILED");
            document.getElementById('errors').style.display = 'flex';
            document.getElementById('errors').textContent = "❌ Gemini API FAILED";
            setTimeout(() => {
                document.getElementById('errors').style.display = 'none';
            }, 2000);
            console.error("Status Code:", response.status);
            console.error("Error Details:", JSON.stringify(data, null, 2));
            return;
        }

        console.log("✅ Gemini API SUCCESS");
        chrome.storage.local.get(["solveToShare"], (data) => {
            const existing = data.solveToShare || [];

            const updated = [...existing, key]; // or whatever value you want to push

            chrome.storage.local.set({
                primaryAiModel: "gemini",
                solveToShare: updated,
                STSgeminiApiKey: key
            });
        });
        console.log("Response:", data);

    } catch (error) {
        // 🔥 THIS is what you were missing
        console.error("🔥 NETWORK / FETCH ERROR:");
        console.error(error);

        // extra debugging info
        console.error("Message:", error.message);
        console.error("Stack:", error.stack);
    }
}
