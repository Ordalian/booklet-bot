const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

async function fetchMarkdown(url: string, firecrawlKey: string): Promise<string> {
  const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${firecrawlKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url, formats: ['markdown'], onlyMainContent: true }),
  });
  const data = await res.json();
  return data.data?.markdown || data.markdown || '';
}

async function fetchFileContent(fileUrl: string): Promise<string> {
  // Download file and extract text
  const res = await fetch(fileUrl);
  const contentType = res.headers.get('content-type') || '';
  
  if (contentType.includes('image')) {
    // For images, return a marker — AI will process via vision
    return `[IMAGE FILE: ${fileUrl}]`;
  }
  
  // For PDF/doc, get raw text
  const text = await res.text();
  return text.substring(0, 10000);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { url, fileUrls, directives, categoryLabel } = body;

    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let contentParts: string[] = [];

    // Handle URL scraping
    if (url) {
      if (!FIRECRAWL_API_KEY) {
        return new Response(JSON.stringify({ error: 'FIRECRAWL_API_KEY not configured' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      console.log('Scraping URL:', url);
      const markdown = await fetchMarkdown(url, FIRECRAWL_API_KEY);
      if (markdown) contentParts.push(`## Contenu du lien: ${url}\n${markdown}`);
    }

    // Handle file URLs
    if (fileUrls && Array.isArray(fileUrls)) {
      for (const fUrl of fileUrls) {
        console.log('Processing file:', fUrl);
        try {
          const content = await fetchFileContent(fUrl);
          if (content) contentParts.push(`## Fichier: ${fUrl}\n${content}`);
        } catch (e) {
          console.warn('Error processing file:', fUrl, e);
        }
      }
    }

    if (contentParts.length === 0) {
      return new Response(JSON.stringify({ events: [], raw: 'Aucun contenu trouvé' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const combinedContent = contentParts.join('\n\n---\n\n').substring(0, 12000);

    // Build directive context
    let directiveText = '';
    if (directives) {
      directiveText = `\n\nDirectives utilisateur à respecter: "${directives}"`;
    }
    if (categoryLabel) {
      directiveText += `\nCatégorie cible: ${categoryLabel}`;
    }

    // Extract events via AI
    const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Tu extrais des événements à partir de contenu (web, PDF, fichiers). Retourne un JSON strict:
{ "events": [ { "title": "...", "date": "...", "location": "...", "description": "...", "price": "...", "tags": ["..."] } ] }
Règles STRICTES:
- N'invente RIEN. Extrais uniquement ce qui est présent dans le texte.
- Si un champ n'est pas trouvé, mets une chaîne vide "".
- Extrais TOUS les événements trouvés.
- La description doit être informative et détaillée (2-3 phrases) si le contenu le permet.
- Retourne UNIQUEMENT le JSON, sans markdown ni backticks.${directiveText}`
          },
          { role: 'user', content: `Extrais les événements de ce contenu:\n\n${combinedContent}` }
        ],
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error('AI error:', aiRes.status, errText);
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit, réessayez' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ events: [], raw: combinedContent.substring(0, 500) }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiRes.json();
    let content = aiData.choices?.[0]?.message?.content || '';
    content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    let result;
    try {
      result = JSON.parse(content);
    } catch {
      console.error('Parse error:', content.substring(0, 300));
      result = { events: [] };
    }

    console.log(`Extracted ${result.events?.length || 0} events`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
