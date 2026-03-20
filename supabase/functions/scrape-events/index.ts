const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { dateDebut, dateFin, additionalInfo } = await req.json();

    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    if (!FIRECRAWL_API_KEY) {
      return new Response(JSON.stringify({ error: 'FIRECRAWL_API_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Scraping events from ${dateDebut} to ${dateFin}`);

    // Scrape tourism websites
    const urls = [
      'https://www.tourisme-porteduhainaut.com/preparer/agenda',
      'https://www.agglo-porteduhainaut.fr/culture-sports-loisirs/culture/scenes-plurielles',
    ];

    const scrapedContent: string[] = [];

    for (const url of urls) {
      try {
        const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url,
            formats: ['markdown'],
            onlyMainContent: true,
          }),
        });

        const data = await response.json();
        if (response.ok && (data.data?.markdown || data.markdown)) {
          scrapedContent.push(`=== Source: ${url} ===\n${data.data?.markdown || data.markdown}`);
          console.log(`Scraped ${url} successfully`);
        } else {
          console.error(`Failed to scrape ${url}:`, data);
        }
      } catch (e) {
        console.error(`Error scraping ${url}:`, e);
      }
    }

    if (scrapedContent.length === 0) {
      return new Response(JSON.stringify({ error: 'Could not scrape any content' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use AI to structure the scraped data
    const systemPrompt = `Tu es un assistant qui structure des données d'événements touristiques pour La Porte du Hainaut Tourisme.

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

Contenu scrapé des sites touristiques:
${scrapedContent.join('\n\n')}

${additionalInfo ? `Informations supplémentaires de l'utilisateur:\n${additionalInfo}` : ''}

Structure ces informations en événements pour le guide des animations de La Porte du Hainaut. Garde les événements phares (Paris-Roubaix, Véloroute) et adapte les dates. S'il n'y a pas assez de données pour une section, invente des événements réalistes basés sur le territoire (Saint-Amand-les-Eaux, Denain, Wallers-Arenberg, Raismes).`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
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
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'Crédits IA épuisés. Ajoutez des crédits dans Settings > Workspace > Usage.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ error: 'AI gateway error' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices?.[0]?.message?.content || '';
    
    // Clean potential markdown wrapping
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
