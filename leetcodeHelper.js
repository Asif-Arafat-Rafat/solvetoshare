//service worker script that listens for outgoing web requests from the LeetCode webpage, specifically targeting POST requests to the "interpret_solution" endpoint. When such a request is detected, it attempts to decode the request body to extract the user's typed code and then calls a function to evaluate that code using Gemini.
import { evaluateMySolveGemini } from "./evaluateMySolve.js";
chrome.storage.session.setAccessLevel({ accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS' });

chrome.webRequest.onBeforeRequest.addListener(
    async function (details) {
        if (details.method === "POST" && details.url.includes("interpret_solution") && details.requestBody) {
            try {
                if (details.requestBody.raw && details.requestBody.raw[0]) {
                    const rawBytes = details.requestBody.raw[0].bytes;
                    const decoder = new TextDecoder("utf-8");
                    const payloadJson = JSON.parse(decoder.decode(rawBytes));
                    console.log("Your Code:\n", payloadJson.typed_code);
                    const text=await evaluateMySolveGemini(payloadJson.typed_code);
                    console.log("found at helper:",text);
                    try{await chrome.storage.session.set({ ApiStatus: text[1] });}
                    catch(err){console.error("Failed to set ApiStatus in session storage:", err);}
                    if(text[1]==429){
                        console.log("⚠️ Gemini API is currently overloaded (429 Too Many Requests). Please try again in a few moments.");
                        return;
                    }
                    else if(text[1]==401){
                        console.log("⚠️ Unauthorized access to Gemini API.");
                        return;
                    }
                    else{
                        chrome.tabs.sendMessage(details.tabId, { action: "AiResponse", status: text[1]||999, code: text[0]||"issue here"});
                    }
                }
            } catch (error) {
                console.error("❌ Failed to decode outgoing web request payload:", error);
            }
        }
    },
    { urls: ["*://*.leetcode.com/*"] },
    ["requestBody"]
);
