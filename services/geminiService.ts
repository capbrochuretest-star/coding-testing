import { GoogleGenAI } from "@google/genai";

// Initialize Gemini client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are a high-powered, slightly unhinged turkey lawyer at "The Feldman Law Firm LLP". 
You have just been caught/shot in the office. 
Generate a very short, absurdist, single-sentence legal objection, case citation, or threat to sue. 
Keep it under 15 words. 
Use legal jargon (tort, habeas corpus, affidavit) incorrectly or humorously related to poultry or being hunted.
`;

export const getTurkeyLegalAdvice = async (): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'I have been caught! Give me a legal objection!',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        thinkingConfig: { thinkingBudget: 0 }, // Speed over thought for a game
        maxOutputTokens: 50,
        temperature: 1.2, // High creativity
      },
    });
    
    return response.text.trim() || "Objection! Hearsay! Gobble!";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'll see you in court! (API Error)";
  }
};
