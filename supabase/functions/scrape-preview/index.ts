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
    body: JSON.stringify({ url, formats: ['markdown'], onlyMainContent: true, waitFor: 3000 }),
  });
  const data = await res.json();
  return data.data?.markdown || data.markdown || '';
}

async function fetchFileContent(fileUrl: string): Promise<string> {
  const res = await fetch(fileUrl);
  const contentType = res.headers.get('content-type') || '';
  
  if (contentType.includes('image')) {
    return `[IMAGE FILE: ${fileUrl}]`;
  }
  
  const text = await res.text();
  return text.substring(0, 15000);
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

    const combinedContent = contentParts.join('\n\n---\n\n').substring(0, 20000);

    // Build strong directive section
    let directiveSection = '';
    if (categoryLabel) {
      directiveSection += `\n\n## CATÉGORIE CIBLE\nTu extrais UNIQUEMENT les événements qui correspondent à la catégorie "${categoryLabel}". Ignore tout événement hors catégorie.`;
    }
    if (directives && directives.trim()) {
      directiveSection += `\n\n## DIRECTIVES UTILISATEUR (À RESPECTER IMPÉRATIVEMENT)\n${directives.trim()}\n\nCes directives ont PRIORITÉ sur tout le reste. Si l'utilisateur demande de filtrer, exclure, ou se concentrer sur certains types d'événements, tu DOIS respecter ces instructions.`;
    }

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
            content: `Tu es un extracteur d'événements expert. Tu analyses du contenu (pages web, PDF, documents) et tu en extrais des événements structurés.

RÈGLES STRICTES:
1. N'invente JAMAIS d'informations. Extrais UNIQUEMENT ce qui est explicitement présent dans le texte source.
2. Si un champ n'est pas trouvé dans le texte, mets une chaîne vide "".
3. Extrais TOUS les événements pertinents trouvés dans le contenu, sans en omettre.
4. La description doit être COMPLÈTE et DÉTAILLÉE : reprends le maximum d'informations utiles (programme, intervenants, horaires, conditions, public cible). Ne résume PAS en une seule phrase si le contenu est riche.
5. Pour les dates, utilise le format le plus complet possible (ex: "Samedi 15 mars 2025 de 14h à 18h").
6. Pour les prix, indique "Gratuit" si c'est gratuit, sinon le tarif exact.
7. Pour la localisation, sois précis : nom du lieu + adresse/ville si disponible.
8. Les tags doivent refléter les caractéristiques clés : "gratuit", "famille", "plein air", "accessible PMR", etc.
${directiveSection}

FORMAT DE SORTIE (JSON strict, sans markdown, sans backticks):
{ "events": [ { "title": "...", "date": "...", "location": "...", "description": "...", "price": "...", "tags": ["..."] } ] }`
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
