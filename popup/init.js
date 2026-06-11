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
    
    if (!actionButton) return;

    actionButton.addEventListener('click', async () => {
        console.log("Popup button clicked. Current model:", selectModel.value, "API Key length:", apiKeyInput.value.length);
        
        if (selectModel.value === "gemini") {
            setLoadingState(true);
            
            // Wait for the key validation and storage to FULLY complete
            const isSuccess = await checkGApiKey(apiKeyInput.value);
            
            setLoadingState(false);

            // ONLY reload if validation and saving actually succeeded
            if (isSuccess) {
                location.reload();
            }
        } else {
            // Fallback reload for other models if they don't require async verification
            location.reload();
        }
    });
});

function setLoadingState(isLoading) {
    const loadingDiv = document.getElementById('loading');
    const mainBody = document.getElementById('mainBody');
    if (isLoading) {
        loadingDiv.style.display = 'flex';
        mainBody.style.filter = 'blur(5px)';
    } else {
        loadingDiv.style.display = 'none';
        mainBody.style.filter = 'none';
    }
}

// Returns true if verification and saving succeeded; false otherwise
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

        console.log("STATUS:", response.status);
        console.log("OK:", response.ok);
        console.log("RAW RESPONSE:", data);

        if (!response.ok) {
            // console.error("❌ Gemini API FAILED");
            const errorDiv = document.getElementById('errors');
            errorDiv.style.display = 'flex';
            errorDiv.textContent = "❌ Gemini API FAILED";
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 5000);
            
            // console.error("Status Code:", response.status);
            // console.error("Error Details:", JSON.stringify(data, null, 2));
            return false; 
        }

        console.log("✅ Gemini API SUCCESS");
        
        // Wrap the Chrome storage asynchronous operation in a Promise so we can await it
        await new Promise((resolve) => {
            chrome.storage.local.get(["solveToShare"], (storageData) => {
                const existing = storageData.solveToShare || [];
                const updated = [...existing, key];

                chrome.storage.local.set({
                    primaryAiModel: "gemini",
                    solveToShare: updated,
                    STSgeminiApiKey: key
                }, () => {
                    console.log("💾 Storage successfully written!");
                    resolve(); // Let the execution proceed now that saving is done
                });
            });
        });

        console.log("Response:", data);
        return true; 

    } catch (error) {
        console.error("🔥 NETWORK / FETCH ERROR:", error);
        
        const errorDiv = document.getElementById('errors');
        if (errorDiv) {
            errorDiv.style.display = 'flex';
            errorDiv.textContent = "❌ Network Error. Check your connection.";
            setTimeout(() => { errorDiv.style.display = 'none'; }, 5000);
        }
        return false;
    }
}