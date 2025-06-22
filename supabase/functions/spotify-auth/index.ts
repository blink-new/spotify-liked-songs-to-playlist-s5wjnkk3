import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const client_id = Deno.env.get("SPOTIFY_CLIENT_ID")
    const supabase_url = Deno.env.get("SUPABASE_URL")
    
    if (!client_id) {
      throw new Error("SPOTIFY_CLIENT_ID not configured")
    }
    
    if (!supabase_url) {
      throw new Error("SUPABASE_URL not configured")
    }
    
    const redirect_uri = `${supabase_url}/functions/v1/spotify-callback`
    const scope = "user-read-private user-read-email user-library-read playlist-modify-public playlist-modify-private";
    
    const params = new URLSearchParams({
      response_type: "code",
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
    });

    const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;

    return new Response(
      JSON.stringify({ authUrl }),
      { 
        headers: { 
          "Content-Type": "application/json", 
          "Access-Control-Allow-Origin": "*" 
        } 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          "Access-Control-Allow-Origin": "*" 
        } 
      }
    )
  }
})