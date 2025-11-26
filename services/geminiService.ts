
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

    const apiKey = process.env.VVEAI_API_KEY;
    if (!apiKey) {
      throw new Error("API key not configured");
    }

    const response = await fetch('https://api.vveai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gemini-2.5-flash-nothinking',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Invalid response from API");
    }

    // Parse JSON from content
    let result: AIAnalysis;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, content];
      const jsonString = jsonMatch[1] || content;
      result = JSON.parse(jsonString.trim());
    } catch (parseError) {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse JSON from response');
      }
    }

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
