import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase_url = Deno.env.get("SUPABASE_URL")!
const supabase_anon_key = Deno.env.get("SUPABASE_ANON_KEY")!

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

  const { playlistName, trackUris } = await req.json();

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

  // 1. Get user's Spotify ID
  const userResponse = await fetch("https://api.spotify.com/v1/me", {
    headers: {
      "Authorization": `Bearer ${tokenData.access_token}`,
    },
  });
  const userData = await userResponse.json();
  const userId = userData.id;

  // 2. Create a new playlist
  const playlistResponse = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${tokenData.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: playlistName,
      description: "Created with Blink's Spotify Liked Songs to Playlist app",
      public: false,
    }),
  });
  const playlistData = await playlistResponse.json();
  const playlistId = playlistData.id;

  // 3. Add tracks to the playlist
  await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${tokenData.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ uris: trackUris }),
  });

  return new Response(JSON.stringify({ playlistUrl: playlistData.external_urls.spotify }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
});