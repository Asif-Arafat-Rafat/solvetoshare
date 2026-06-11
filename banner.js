// export function gotOutputFromGemini(gotResponse) {
    
// }
async function showSuccess(body) {
    const fileUrl=chrome.runtime.getURL("banner.html");
    const res= await fetch(fileUrl);
    const htmlContent= await res.text();
    body.insertAdjacentHTML('afterbegin', htmlContent);
    setTimeout(() => {
        const successBanner = body.querySelector('#extension_banner');
        if (successBanner) {
            successBanner.style.opacity = '0';
            successBanner.style.transition = "opacity 0.5s ease-in-out";
            setTimeout(() => {
                successBanner.style.opacity = '0';
                setTimeout(() => {
                    successBanner.remove();
                }, 500); 
            }, 3000);
        }
    }, 5000); // Remove after 5 seconds
}