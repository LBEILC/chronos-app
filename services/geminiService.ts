
import { AIAnalysis, Mood } from "../types";

export const analyzeNote = async (text: string, lang: 'en' | 'zh' = 'zh'): Promise<AIAnalysis> => {
  try {
    const prompt = lang === 'zh'
      ? `分析以下个人笔记/日记。
         提取一个非常简短的摘要（最多6个字），识别潜在的情绪，并生成最多3个相关标签。
         
         笔记内容: "${text}"
         
         请以JSON格式返回，包含以下字段：
         - summary: 简短的标题或摘要，最多6个字
         - mood: 情绪，必须是以下之一：NEUTRAL, HAPPY, SAD, FOCUSED, EXCITED, ANXIOUS
         - tags: 最多3个相关标签的数组`
      : `Analyze the following personal note/journal entry. 
         Extract a very short summary (max 6 words), identify the underlying mood, and generate up to 3 relevant tags.
         
         Note content: "${text}"
         
         Return in JSON format with the following fields:
         - summary: A concise title or summary, max 6 words
         - mood: The emotional tone, must be one of: NEUTRAL, HAPPY, SAD, FOCUSED, EXCITED, ANXIOUS
         - tags: An array of up to 3 relevant concise tags`;

    // Call Vercel serverless function instead of direct API
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: prompt }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const result = await response.json() as AIAnalysis;
    
    // Validate the response structure
    if (!result.summary || !result.mood || !Array.isArray(result.tags)) {
      throw new Error("Invalid response structure from API");
    }
    
    return result;

  } catch (error) {
    console.error("Analysis failed:", error);
    // Fallback on error
    return {
      summary: lang === 'zh' ? "新记录" : "New Entry",
      tags: lang === 'zh' ? ["未处理"] : ["Unprocessed"],
      mood: Mood.NEUTRAL
    };
  }
};
