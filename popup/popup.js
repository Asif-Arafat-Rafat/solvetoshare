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
    }
})();