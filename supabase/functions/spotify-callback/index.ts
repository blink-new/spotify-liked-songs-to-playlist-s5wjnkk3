import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const client_id = Deno.env.get("SPOTIFY_CLIENT_ID")!
const client_secret = Deno.env.get("SPOTIFY_CLIENT_SECRET")!
const supabase_url = Deno.env.get("SUPABASE_URL")!
const supabase_service_role_key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const redirect_uri = `${supabase_url}/functions/v1/spotify-callback`

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return new Response("Authorization code not found", { status: 400 });
  }

  // Exchange code for tokens
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": "Basic " + btoa(client_id + ":" + client_secret),
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: redirect_uri,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    return new Response(JSON.stringify(data), { status: 500 });
  }

  const { access_token, refresh_token, expires_in } = data;

  // Get Spotify user info
  const spotifyUserResponse = await fetch("https://api.spotify.com/v1/me", {
    headers: {
      "Authorization": `Bearer ${access_token}`
    }
  });

  const spotifyUser = await spotifyUserResponse.json();

  // Use service role key to bypass RLS
  const supabase = createClient(supabase_url, supabase_service_role_key);

  // Check if user exists with this Spotify ID
  const { data: existingUser } = await supabase
    .from('spotify_tokens')
    .select('user_id')
    .eq('spotify_id', spotifyUser.id)
    .single();

  let userId;
  
  if (existingUser) {
    // User exists, update their tokens
    userId = existingUser.user_id;
  } else {
    // Create a new user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: spotifyUser.email || `${spotifyUser.id}@spotify.user`,
      email_confirm: true,
      user_metadata: {
        spotify_id: spotifyUser.id,
        display_name: spotifyUser.display_name,
        avatar_url: spotifyUser.images?.[0]?.url
      }
    });

    if (authError) {
      console.error('Error creating user:', authError);
      return new Response(JSON.stringify(authError), { status: 500 });
    }

    userId = authData.user.id;
  }

  // Save or update Spotify tokens
  const { error: tokenError } = await supabase.from('spotify_tokens').upsert({
    user_id: userId,
    spotify_id: spotifyUser.id,
    access_token,
    refresh_token,
    expires_at: new Date(Date.now() + expires_in * 1000),
  });

  if (tokenError) {
    console.error('Error saving tokens:', tokenError);
    return new Response(JSON.stringify(tokenError), { status: 500 });
  }

  // Generate a magic link for the user to log in
  const { data: magicLinkData, error: magicLinkError } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: spotifyUser.email || `${spotifyUser.id}@spotify.user`,
    options: {
      redirectTo: Deno.env.get("VITE_APP_URL") || 'http://localhost:3000'
    }
  });

  if (magicLinkError) {
    console.error('Error generating magic link:', magicLinkError);
    return new Response(JSON.stringify(magicLinkError), { status: 500 });
  }

  // Redirect to the magic link
  return Response.redirect(magicLinkData.properties.action_link, 302);
})