const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

async function fetchPageAsText(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BookletBot/1.0)' },
    });
    const text = await res.text();
    // Strip HTML tags for a rough text extraction
    return text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
               .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
               .replace(/<[^>]+>/g, ' ')
               .replace(/\s+/g, ' ')
               .trim()
               .substring(0, 30000);
  } catch (e) {
    console.warn('Failed to fetch URL:', url, e);
    return '';
  }
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

    const GOOGLE_AI_API_KEY = Deno.env.get('GOOGLE_AI_API_KEY');
    if (!GOOGLE_AI_API_KEY) {
      return new Response(JSON.stringify({ error: 'GOOGLE_AI_API_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let contentParts: string[] = [];

    if (url) {
      console.log('Fetching URL:', url);
      const text = await fetchPageAsText(url);
      if (text) contentParts.push(`## Contenu du lien: ${url}\n${text}`);
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

    const combinedContent = contentParts.join('\n\n---\n\n').substring(0, 30000);

    let directiveSection = '';
    if (categoryLabel) {
      directiveSection += `\n\n## CATÉGORIE CIBLE\nTu extrais UNIQUEMENT les événements qui correspondent à la catégorie "${categoryLabel}". Ignore tout événement hors catégorie.`;
    }
    if (directives && directives.trim()) {
      directiveSection += `\n\n## DIRECTIVES UTILISATEUR (À RESPECTER IMPÉRATIVEMENT)\n${directives.trim()}\n\nCes directives ont PRIORITÉ sur tout le reste. Si l'utilisateur demande de filtrer, exclure, ou se concentrer sur certains types d'événements, tu DOIS respecter ces instructions.`;
    }

    const aiRes = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GOOGLE_AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Tu es un extracteur d'événements expert. Tu analyses du contenu brut (pages web, PDF, documents) et tu en extrais des événements structurés.

Le contenu fourni est du texte brut extrait de pages web — il peut contenir du bruit (menus, footers, etc.). Concentre-toi sur le contenu principal.

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
