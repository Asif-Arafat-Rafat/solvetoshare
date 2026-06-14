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
        const ratingAdd = document.getElementById("ratingAdd");
        const complexityAdd = document.getElementById("complexityAdd");
        const suggestionCode = document.getElementById("suggestionCode");
        const settings = await chrome.storage.local.get(["STSisRatingNeeded", "STSisComplexityNeeded", "STSisSuggestionCodeNeeded"]);
        ratingAdd.checked = settings.STSisRatingNeeded || false;
        complexityAdd.checked = settings.STSisComplexityNeeded || false;
        suggestionCode.checked = settings.STSisSuggestionCodeNeeded || false;
        suggestionCode.addEventListener("change", async (e) => {
            chrome.storage.local.set({ STSisSuggestionCodeNeeded: e.target.checked });
            
        });
        ratingAdd.addEventListener("change", async (e) => {
            chrome.storage.local.set({ STSisRatingNeeded: e.target.checked });
        });
        complexityAdd.addEventListener("change", async (e) => {
            chrome.storage.local.set({ STSisComplexityNeeded: e.target.checked });
        });
        const logoutBtn = document.getElementById("logoutBtn");
        logoutBtn.addEventListener("click",()=>{
            chrome.storage.local.remove(["primaryAiModel","STSgeminiApiKey"],()=>{
                console.log("✅ Cleared primaryAiModel and Gemini API key from storage. Logging out.");
                location.reload();
            })
        })
    }
})();