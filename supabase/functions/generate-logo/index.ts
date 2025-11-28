import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Logo generation requested - returning placeholder (image generation not available with free text model)');

    const placeholderSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#0EA5E9"/>
          <stop offset="100%" style="stop-color:#84CC16"/>
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="80" fill="url(#bg)"/>
      <text x="256" y="300" font-family="Arial, sans-serif" font-size="200" font-weight="bold" fill="white" text-anchor="middle">V</text>
      <rect x="180" y="130" width="152" height="20" rx="4" fill="white" opacity="0.9"/>
      <rect x="180" y="160" width="152" height="12" rx="3" fill="white" opacity="0.7"/>
      <rect x="180" y="180" width="100" height="12" rx="3" fill="white" opacity="0.7"/>
    </svg>`;

    const svgBase64 = btoa(placeholderSvg);
    const imageUrl = `data:image/svg+xml;base64,${svgBase64}`;

    return new Response(JSON.stringify({ 
      imageUrl,
      note: "Placeholder logo generated. Image AI generation requires a paid model like DALL-E 3."
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating logo:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
