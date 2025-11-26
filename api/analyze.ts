import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  // Only allow POST requests
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text } = request.body;

    if (!text || typeof text !== 'string') {
      return response.status(400).json({ error: 'Text is required' });
    }

    const apiKey = process.env.VVEAI_API_KEY;
    if (!apiKey) {
      return response.status(500).json({ error: 'API key not configured' });
    }

    // Call the third-party API
    const apiResponse = await fetch('https://api.vveai.com/v1/chat/completions', {
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
            content: text,
          },
        ],
        temperature: 0.7,
      }),
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error('API Error:', errorText);
      return response.status(apiResponse.status).json({ 
        error: 'API request failed',
        details: errorText 
      });
    }

    const data = await apiResponse.json();
    
    // Extract the content from the response
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return response.status(500).json({ error: 'Invalid response from API' });
    }

    // Try to parse JSON from the content
    let result;
    try {
      // The content might be wrapped in markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, content];
      const jsonString = jsonMatch[1] || content;
      result = JSON.parse(jsonString.trim());
    } catch (parseError) {
      // If parsing fails, try to extract JSON from the text
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse JSON from response');
      }
    }

    // Validate and return the result
    return response.status(200).json(result);

  } catch (error) {
    console.error('Error in analyze handler:', error);
    return response.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}



