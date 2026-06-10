(async () => {
    const data = await chrome.storage.local.get(["primaryAiModel"]);

    const initView = document.getElementById("initView");
    const mainView = document.getElementById("mainView");
    console.log("Loaded primaryAiModel from storage:", data.primaryAiModel);
    if (!data.primaryAiModel) {
        initView.style.display = "block";
        mainView.style.display = "none";
    } else {
        initView.style.display = "none";
        mainView.style.display = "block";
        const activeModelTitle = document.getElementById("activeModelTitle");
        activeModelTitle.textContent = `Active AI Model: ${data.primaryAiModel}`;
        const logoutBtn = document.getElementById("logoutBtn");
        logoutBtn.addEventListener("click",()=>{
            chrome.storage.local.remove(["primaryAiModel","STSgeminiApiKey"],()=>{
                console.log("✅ Cleared primaryAiModel and Gemini API key from storage. Logging out.");
                location.reload();
            })
        })
    }
})();