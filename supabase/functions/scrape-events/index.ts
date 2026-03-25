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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { dateDebut, dateFin, additionalInfo } = await req.json();

    const GOOGLE_AI_API_KEY = Deno.env.get('GOOGLE_AI_API_KEY');
    if (!GOOGLE_AI_API_KEY) {
      return new Response(JSON.stringify({ error: 'GOOGLE_AI_API_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Scraping events from ${dateDebut} to ${dateFin}`);

    const urls = [
      'https://www.tourisme-porteduhainaut.com/preparer/agenda',
      'https://www.agglo-porteduhainaut.fr/culture-sports-loisirs/culture/scenes-plurielles',
    ];

    const scrapedContent: string[] = [];

    for (const url of urls) {
      try {
        console.log('Fetching:', url);
        const text = await fetchPageAsText(url);
        if (text) {
          scrapedContent.push(`=== Source: ${url} ===\n${text}`);
          console.log(`Fetched ${url} successfully (${text.length} chars)`);
        }
      } catch (e) {
        console.error(`Error fetching ${url}:`, e);
      }
    }

    if (scrapedContent.length === 0) {
      return new Response(JSON.stringify({ error: 'Could not fetch any content' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = `Tu es un assistant qui structure des données d'événements touristiques pour La Porte du Hainaut Tourisme.

Le contenu fourni est du texte brut extrait de pages web — il peut contenir du bruit (menus, footers, etc.). Concentre-toi sur le contenu principal relatif aux événements.

Tu dois produire un JSON valide au format events_data.json avec la structure exacte suivante:
{
  "meta": { "titre": "Programme des Animations", "mois_debut": "...", "mois_fin": "...", "annee": "...", "date_debut": "...", "date_fin": "..." },
  "highlights": [{ "icon": "emoji", "couleur": "orange|bleu|vert", "label": "...", "texte": "..." }],
  "page2_veloroute": { "titre": "...", "date": "...", "sous_titre": "...", "sous_desc": "...", "programme": [{ "horaire": "...", "titre": "...", "desc": "...", "tags": [{ "type": "free|paid|loc", "texte": "..." }] }] },
  "page3_paris_roubaix": { "titre": "PARIS-ROUBAIX", "edition": "...", "date": "...", "sous": "...", "desc": "...", "infos": [{ "label": "...", "valeur": "..." }], "visites": [{ "dates": "...", "mois": "...", "couleur": "vert|bleu", "titre": "...", "desc": "...", "prix": "..." }] },
  "page4_culture": { "expositions": [{ "dates": "...", "couleur": "o|b|g|p|y", "titre": "...", "desc": "...", "lieu": "...", "tags": [] }], "spectacles": [...] },
  "page5_nature": { "nature": [{ "dates": "...", "titre": "...", "desc": "...", "lieu": "...", "tags": [] }], "paques": [...] },
  "page8_scenes": [{ "dates": "...", "titre": "...", "desc": "...", "lieu": "..." }],
  "page8_vie_locale": [{ "dates": "...", "couleur": "o|b|g|y", "titre": "...", "desc": "...", "lieu": "...", "tags": [] }]
}

Couleurs: o=orange, b=bleu, g=vert, p=violet, y=jaune, d=gris
Tags type: free=gratuit, paid=payant, fam=famille, loc=localisation

IMPORTANT: Retourne UNIQUEMENT le JSON, sans markdown, sans commentaire.`;

    const userPrompt = `Période couverte: du ${dateDebut} au ${dateFin}

Contenu extrait des sites touristiques:
${scrapedContent.join('\n\n')}

${additionalInfo ? `Informations supplémentaires de l'utilisateur:\n${additionalInfo}` : ''}

Structure ces informations en événements pour le guide des animations de La Porte du Hainaut. Garde les événements phares (Paris-Roubaix, Véloroute) et adapte les dates. S'il n'y a pas assez de données pour une section, invente des événements réalistes basés sur le territoire (Saint-Amand-les-Eaux, Denain, Wallers-Arenberg, Raismes).`;

    const aiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GOOGLE_AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error('AI error:', aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Limite de requêtes atteinte, réessayez dans quelques instants.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ error: 'AI error: ' + aiResponse.status }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices?.[0]?.message?.content || '';
    content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    let eventsData;
    try {
      eventsData = JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse AI response:', content.substring(0, 500));
      return new Response(JSON.stringify({ error: 'Failed to parse structured data from AI' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Successfully generated events data');

    return new Response(JSON.stringify({ eventsData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
