import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase_url = Deno.env.get("SUPABASE_URL")!
const supabase_anon_key = Deno.env.get("SUPABASE_ANON_KEY")!

interface SpotifyTrack {
  track: {
    album: {
      images: {
        url: string
      }[]
    },
    artists: {
      name: string
    }[],
    name: string,
    popularity: number,
    uri: string,
    external_urls: {
      spotify: string
    },
    href: string,
    id: string,
    type: string,
    uri: string,
    is_local: boolean
  }
}

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

  const supabase = createClient(supabase_url, supabase_anon_key, {
    global: { headers: { Authorization: req.headers.get('Authorization')! } },
  });

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new Response("User not found", { status: 401 });
  }

  const { data: tokenData, error: tokenError } = await supabase
    .from('spotify_tokens')
    .select('access_token')
    .eq('user_id', user.id)
    .single();

  if (tokenError || !tokenData) {
    return new Response("Spotify token not found", { status: 404 });
  }

  const response = await fetch("https://api.spotify.com/v1/me/tracks", {
    headers: {
      "Authorization": `Bearer ${tokenData.access_token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    return new Response(JSON.stringify(data), { status: 500 });
  }

  return new Response(JSON.stringify(data.items.map((item: SpotifyTrack) => item.track)), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
});