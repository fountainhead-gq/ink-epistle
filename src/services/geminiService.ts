
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { RhythmData, SpectrumData, QuizQuestion, Scenario } from '../types';

// Initialize Gemini Client
// The API key must be obtained exclusively from the environment variable.
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GOOGLE_API_KEY });

const MODEL_NAME = "gemini-2.5-flash";

// Safety Settings
const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

/**
 * Helper to clean Markdown code blocks from JSON strings before parsing.
 */
const cleanAndParseJSON = (text: string): any => {
  try {
    return JSON.parse(text);
  } catch (e) {
    // Try to extract JSON from code blocks
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match) {
      try {
        return JSON.parse(match[1]);
      } catch (e2) { /* continue */ }
    }
    
    // Fallback: Try to find the first { or [ and the last } or ]
    const firstOpenBrace = text.indexOf('{');
    const firstOpenBracket = text.indexOf('[');
    let startIdx = -1;
    let endIdx = -1;

    if (firstOpenBrace !== -1 && (firstOpenBracket === -1 || firstOpenBrace < firstOpenBracket)) {
       startIdx = firstOpenBrace;
       endIdx = text.lastIndexOf('}');
    } else if (firstOpenBracket !== -1) {
       startIdx = firstOpenBracket;
       endIdx = text.lastIndexOf(']');
    }

    if (startIdx !== -1 && endIdx !== -1) {
        const jsonCandidate = text.substring(startIdx, endIdx + 1);
        try {
            return JSON.parse(jsonCandidate);
        } catch (e3) {
             console.error("Failed to parse extracted JSON candidate", jsonCandidate);
        }
    }
    
    console.error("JSON Parse Error on text:", text);
    throw new Error("Failed to parse AI response.");
  }
};

export const polishText = async (text: string, style: 'elegant' | 'simple' = 'elegant'): Promise<string> => {
  try {
    const systemInstruction = `
      Role: You are a master of Classical Chinese literature and epistolary forms.
      Task: Rewrite text into Classical Chinese (文言文) for a letter (尺牍).
      Style Target: ${style === 'elegant' ? 'Highly elegant, using classical idioms (典雅)' : 'Simple but classical (平实)'}.
    `;

    const prompt = `Input Text: "${text}"\n\nOutput: Return ONLY the rewritten classical text.`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: { systemInstruction, safetySettings }
    });

    return response.text || "AI 响应为空";
  } catch (error) {
    console.error("Gemini Polish Error:", error);
    return "AI 服务暂时不可用，请检查 API Key 或网络。";
  }
};

export const generateLetter = async (scene: string, recipient: string, intent: string): Promise<string> => {
  try {
    const systemInstruction = `
      Role: Classical Chinese Scholar.
      Task: Draft a complete classical Chinese letter (尺牍).
      Requirements:
      1. Follow standard epistolary structure: Opening (提称), Greeting (寒暄), Main Content (正文), Closing (结语), Signature (落款).
      2. Use appropriate honorifics based on the recipient.
      Output: Return ONLY the letter content.
    `;

    const prompt = `
      Context:
      - Scene: ${scene}
      - Recipient Relationship: ${recipient}
      - Intent/Purpose: ${intent}
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: { systemInstruction, safetySettings }
    });

    return response.text || "AI 响应为空";
  } catch (error) {
    console.error("Gemini Generate Error:", error);
    return "无法生成信件，请稍后再试。";
  }
};

export const checkGrammar = async (text: string): Promise<string> => {
  try {
    const systemInstruction = `
      Role: Classical Chinese Editor.
      Task: Analyze text for style, grammar, and flow.
      Output: Concise feedback in **Simplified Chinese (简体中文) ONLY**. Do NOT use Traditional Chinese or English.
    `;
    
    const prompt = `Text to analyze: "${text}"`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: { systemInstruction, safetySettings }
    });

    return response.text || "无反馈";
  } catch (error) {
    return "无法获取反馈。";
  }
};

export const replyToLetter = async (figureName: string, userContent: string, history: {sender: string, content: string}[]): Promise<string> => {
  try {
    const historyText = history.map(h => `${h.sender === 'user' ? 'User' : figureName}: ${h.content}`).join('\n');
    
    const systemInstruction = `
      Role: You are playing the role of ${figureName} (historical figure).
      Task: Reply to the user's letter in authentic Classical Chinese (文言文).
      Character Persona: Adhere strictly to the historical figure's known personality and writing style.
      Requirements:
      1. Use Classical Chinese appropriate for the character's era.
      2. Respond directly to the user's content.
      3. Keep it relatively concise (under 150 words).
    `;

    const prompt = `
      Context (Conversation History):
      ${historyText}
      User's latest letter: "${userContent}"
      Output: Return ONLY the body of the reply letter.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: { systemInstruction, safetySettings }
    });

    return response.text || "（沉默不语）";
  } catch (error) {
    console.error("Gemini Simulator Error:", error);
    return "网络受阻，雁信难传。";
  }
};

export const evaluateExercise = async (dayTopic: string, userSubmission: string): Promise<{pass: boolean, feedback: string}> => {
  try {
    const systemInstruction = `
      Role: Classical Chinese Teacher.
      Task: Evaluate a student's submission.
      Requirements:
      1. Check if the submission matches the topic.
      2. Check if the language is Classical Chinese (not Modern).
      3. Provide brief feedback in Modern Chinese.
      Output Format: JSON { "pass": boolean, "feedback": "string" }
    `;

    const prompt = `Topic: "${dayTopic}"\nStudent Submission: "${userSubmission}"`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: { 
        systemInstruction,
        responseMimeType: "application/json",
        safetySettings
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response");
    return cleanAndParseJSON(text);
  } catch (error) {
    return { pass: false, feedback: "AI 暂时无法评阅，请稍后再试。" };
  }
};

export const continueStory = async (role: string, scenario: string, history: any[], userLetter: string): Promise<{narrative: string, replyLetter: string}> => {
  try {
    const historyText = history.map(h => `[${h.type.toUpperCase()}] ${h.content}`).join('\n');
    const systemInstruction = `
      Role: Interactive Fiction Master (Classical Chinese Theme).
      Scenario: ${scenario}. User Role: ${role}.
      Task: Advance plot, generate NPC reply (Classical), provide narrative (Modern).
      Output Format: JSON { "narrative": "string", "replyLetter": "string" }
    `;
    const prompt = `History:\n${historyText}\nUser's Latest Letter:\n"${userLetter}"`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: { systemInstruction, responseMimeType: "application/json", safetySettings }
    });
    
    const text = response.text;
    if (!text) throw new Error("Empty response");
    return cleanAndParseJSON(text);
  } catch (error) {
    return { narrative: "系统繁忙，剧情暂时中断。", replyLetter: "（信件遗失在途中……）" };
  }
};

export const chatWithTutor = async (userMessage: string, history: any[], userStats: any, currentDraft: string = ""): Promise<string> => {
  try {
    const historyText = history.map((h: any) => `${h.sender === 'user' ? 'Student' : 'Tutor'}: ${h.content}`).join('\n');
    const systemInstruction = `
      Role: Classical Chinese Writing Tutor. Persona: Wise, encouraging mentor.
      Student Context: Study Minutes: ${userStats.minutes}, Words: ${userStats.words}.
      Instructions: Analyze style, reference current draft if relevant, support but strict on standards.
    `;
    const prompt = `Draft: "${currentDraft}"\nHistory:\n${historyText}\nLatest: "${userMessage}"`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: { systemInstruction, safetySettings }
    });
    return response.text || "（导师正在沉思...）";
  } catch (error) {
    return "导师暂时有事离开，请稍后请教。";
  }
};

export const analyzeRhythm = async (text: string): Promise<RhythmData> => {
  try {
    const systemInstruction = `Task: Analyze Classical Chinese rhythm. Output JSON: { "sentences": [{"text":"", "tones":[]}], "varianceScore": number, "rhymeScheme": [] }`;
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Input: "${text}"`,
      config: { systemInstruction, responseMimeType: "application/json", safetySettings }
    });
    return cleanAndParseJSON(response.text || "{}");
  } catch (error) {
    return { sentences: [{ text: text, tones: [] }], varianceScore: 50, rhymeScheme: [] };
  }
};

export const generateSpectrum = async (text: string): Promise<SpectrumData> => {
  try {
    const systemInstruction = `Task: Generate "Writing Spectrum" (5 dims 0-100): Temperature, Style, Emotion, Rhythm, Structure. Output JSON with 'summary' in **Simplified Chinese**.`;
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Input: "${text}"`,
      config: { systemInstruction, responseMimeType: "application/json", safetySettings }
    });
    return cleanAndParseJSON(response.text || "{}");
  } catch (error) {
    return { temperature: 50, style: 50, emotion: 50, rhythm: 50, structure: 50, summary: "无法分析" };
  }
};

export const generateQuiz = async (count: number = 5, masteredTopics: string[] = []): Promise<QuizQuestion[]> => {
  try {
    const systemInstruction = `
      Role: Classical Chinese Teacher. Task: Generate ${count} quiz questions.
      Avoid topics: ${masteredTopics.join(', ')}.
      Output: JSON Array of {id, type, question, options, correctAnswer, explanation, tags}.
    `;
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: "Generate questions.",
      config: { systemInstruction, responseMimeType: "application/json", safetySettings }
    });
    return cleanAndParseJSON(response.text || "[]");
  } catch (error) {
    return [];
  }
};

export const generateScenario = async (): Promise<Scenario> => {
    try {
        const systemInstruction = `
          Role: Historical Fiction Writer (Ancient China).
          Task: Generate a roleplay scenario in JSON format: {id, title, role, desc, npcName, openingNarrative, initialLetter}.
          CRITICAL REQUIREMENT:
          1. ALL Content MUST be in **Simplified Chinese (简体中文)**.
          2. The 'initialLetter' must be in Classical Chinese (文言文).
          3. The 'openingNarrative' and 'desc' should be in Modern Chinese.
        `;
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: "Generate a new historical roleplay scenario.",
            config: { systemInstruction, responseMimeType: "application/json", safetySettings }
        });
        const scenario = cleanAndParseJSON(response.text || "{}");
        scenario.id = `gen_${Date.now()}`;
        return scenario;
    } catch (error) { throw error; }
};

export const annotatePinyin = async (text: string): Promise<string> => {
  try {
    const systemInstruction = `Task: Annotate Classical Chinese with Pinyin in <ruby> tags. Return ONLY HTML.`;
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Input: "${text}"`,
      config: { systemInstruction, safetySettings }
    });
    return response.text || text;
  } catch (error) { return text; }
};

export const judgePoem = async (keyword: string, userVerse: string, history: string[]): Promise<{valid: boolean, reason: string, aiReply: string}> => {
  try {
    const systemInstruction = `
      Role: Judge of Flying Flower Order. Keyword: "${keyword}".
      Task: Verify user verse, check history ${JSON.stringify(history)}, counter with new verse.
      Output JSON: { "valid": boolean, "reason": string, "aiReply": string }
    `;
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `User Verse: "${userVerse}"`,
      config: { systemInstruction, responseMimeType: "application/json", safetySettings }
    });
    return cleanAndParseJSON(response.text || "{}");
  } catch (error) { return { valid: false, reason: "裁判走神了", aiReply: "" }; }
};

export const getPoemHint = async (keyword: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: `Provide a famous Classical Chinese poem line containing "${keyword}". Only the line.`,
            config: { safetySettings }
        });
        return response.text || "无提示";
    } catch (e) { return "暂无提示"; }
};
