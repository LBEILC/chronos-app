import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: 'http://localhost:3000',
            changeOrigin: true,
            configure: (proxy, _options) => {
              proxy.on('proxyReq', (proxyReq, req, res) => {
                // Handle API requests in development
                if (req.url?.startsWith('/api/analyze')) {
                  // This will be handled by our dev server middleware
                }
              });
            },
          },
        },
      },
      plugins: [
        react(),
        // Development API handler plugin
        {
          name: 'dev-api-handler',
          configureServer(server) {
            server.middlewares.use('/api/analyze', async (req, res, next) => {
              if (req.method !== 'POST') {
                res.writeHead(405, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Method not allowed' }));
                return;
              }

              let body = '';
              req.on('data', chunk => { body += chunk.toString(); });
              req.on('end', async () => {
                try {
                  const { text } = JSON.parse(body);
                  const apiKey = env.VVEAI_API_KEY || process.env.VVEAI_API_KEY;

                  if (!apiKey) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'API key not configured' }));
                    return;
                  }

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
                    res.writeHead(apiResponse.status, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'API request failed', details: errorText }));
                    return;
                  }

                  const data = await apiResponse.json();
                  const content = data.choices?.[0]?.message?.content;
                  
                  if (!content) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Invalid response from API' }));
                    return;
                  }

                  // Parse JSON from content
                  let result;
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

                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify(result));
                } catch (error) {
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ 
                    error: 'Internal server error',
                    message: error instanceof Error ? error.message : 'Unknown error'
                  }));
                }
              });
            });
          },
        },
      ],
      define: {
        'process.env.VVEAI_API_KEY': JSON.stringify(env.VVEAI_API_KEY),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
