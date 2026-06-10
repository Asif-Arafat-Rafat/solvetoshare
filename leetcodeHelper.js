//service worker script that listens for outgoing web requests from the LeetCode webpage, specifically targeting POST requests to the "interpret_solution" endpoint. When such a request is detected, it attempts to decode the request body to extract the user's typed code and then calls a function to evaluate that code using Gemini.
import { evaluateMySolveGemini } from "./evaluateMySolve.js";
chrome.webRequest.onBeforeRequest.addListener(
    function (details) {
        if (details.method === "POST" && details.url.includes("interpret_solution") && details.requestBody) {
            try {
                if (details.requestBody.raw && details.requestBody.raw[0]) {
                    const rawBytes = details.requestBody.raw[0].bytes;
                    const decoder = new TextDecoder("utf-8");
                    const payloadJson = JSON.parse(decoder.decode(rawBytes));
                    console.log("Your Code:\n", payloadJson.typed_code);
                    evaluateMySolveGemini(payloadJson.typed_code);
                }
            } catch (error) {
                console.error("❌ Failed to decode outgoing web request payload:", error);
            }
        }
    },
    { urls: ["*://*.leetcode.com/*"] },
    ["requestBody"]
);
