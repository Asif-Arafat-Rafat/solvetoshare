// inject.js
(function() {
    const originalFetch = window.fetch;

    window.fetch = async function (...para) {
        const response = await originalFetch.apply(this, para);
        
        response.clone().json().then(data => {
            const event = new CustomEvent('LEETCODE_RESPONSE_READY', { detail: data });
            window.dispatchEvent(event);
            
        }).catch(err => {
            // Quietly swallow non-JSON assets like images/fonts
        });

        return response;
    };
})();