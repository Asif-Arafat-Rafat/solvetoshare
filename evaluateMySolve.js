const GeminiApiKey = "";

export async function evaluateMySolveGemini(solutionCode) {
    console.log("Evaluating your solution with Gemini...");
  // 1. Create the prompt string using the parameter passed into the function
  const promptText = `Please review and simulate this code, check for bugs, and explain it: \n\n${solutionCode}`;
  
  // 2. Fix the template literal to use GeminiApiKey instead of API_KEY
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${GeminiApiKey}`;
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: promptText }] // Now promptText is actually defined!
        }]
      })
    });

    const data = await response.json();
    
    // 3. Extract and return the actual text string from Gemini's response structure
    console.log("Gemini's Evaluation:", data.candidates[0].content.parts[0].text);
    return data.candidates[0].content.parts[0].text;
    
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Failed to evaluate the code.";
  }
}