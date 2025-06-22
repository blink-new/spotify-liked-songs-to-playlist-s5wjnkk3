import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Music, Heart, Plus, CheckCircle, Loader2, Play } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { supabase } from './lib/supabase'

interface Track {
  id: string
  name: string
  artists: Array<{ name: string }>
  album: { name: string; images: Array<{ url: string }> }
  duration_ms: number
  uri: string
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [likedSongs, setLikedSongs] = useState<Track[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [transferProgress, setTransferProgress] = useState(0)
  const [playlistName, setPlaylistName] = useState('My Liked Songs Collection')
  const [isTransferring, setIsTransferring] = useState(false)
  const [transferComplete, setTransferComplete] = useState(false)
  const [user, setUser] = useState<{ id: string; display_name: string; images: Array<{ url: string }> } | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsAuthenticated(true)
        fetchLikedSongs()
        fetchUser()
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setIsAuthenticated(true)
        fetchLikedSongs()
        fetchUser()
      } else {
        setIsAuthenticated(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: tokenData } = await supabase.from('spotify_tokens').select('access_token').eq('user_id', user.id).single()
      if (tokenData) {
        try {
          const response = await fetch("https://api.spotify.com/v1/me", {
            headers: {
              "Authorization": `Bearer ${tokenData.access_token}`
            }
          })
          const spotifyUser: { id: string; display_name: string; images: Array<{ url: string }> } = await response.json()
          setUser(spotifyUser)
        } catch (error) {
          console.error("Error fetching Spotify user:", error)
          toast.error("Failed to fetch Spotify user data.")
        }
      }
    }
  }

  const handleSpotifyLogin = async () => {
    setIsLoading(true);
    const client_id = "9855b2dd07164c7ab99987d0c99a98b4";
    const redirect_uri = "https://spotify-liked-songs-to-playlist-s5wjnkk3.live.blink.new";
    const scope = "user-read-private user-read-email user-library-read playlist-modify-public playlist-modify-private";
    
    const params = new URLSearchParams({
      response_type: "code",
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
    });

    const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;
    window.location.href = authUrl;
  };

  const fetchLikedSongs = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await fetch(
        `https://pncuzekgrvvqthltifjx.supabase.co/functions/v1/get-liked-songs`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch liked songs');
      }
      setLikedSongs(data);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransferToPlaylist = async () => {
    if (!playlistName.trim()) {
      toast.error('Please enter a playlist name');
      return;
    }

    setIsTransferring(true);
    setTransferProgress(0);

    const trackUris = likedSongs.map(song => song.uri);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await fetch(
        `https://pncuzekgrvvqthltifjx.supabase.co/functions/v1/create-playlist`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ playlistName, trackUris }),
        }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create playlist');
      }

      for (let i = 0; i <= 100; i += 10) {
        setTransferProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setTransferComplete(true);
      toast.success(
        (t) => (
          <span>
            Successfully created playlist!
            <Button
              variant="link"
              className="text-white"
              onClick={() => {
                window.open(data.playlistUrl, '_blank');
                toast.dismiss(t.id);
              }}
            >
              Open Playlist
            </Button>
          </span>
        ),
        { duration: 10000 }
      );
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsTransferring(false);
    }
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-black/20 backdrop-blur-md border-white/10 text-white">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
              <Music className="w-8 h-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Spotify Playlist Creator</CardTitle>
              <CardDescription className="text-gray-300 mt-2">
                Transfer all your liked songs into a custom playlist
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleSpotifyLogin}
              disabled={isLoading}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Connect to Spotify
                </>
              )}
            </Button>
            <p className="text-xs text-gray-400 text-center">
              We'll only access your liked songs and create playlists
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-black/20 backdrop-blur-md border-white/10 text-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {user?.images?.[0] && (
                  <img 
                    src={user.images[0].url} 
                    alt="Profile" 
                    className="w-12 h-12 rounded-full"
                  />
                )}
                <div>
                  <CardTitle className="text-xl">Welcome back, {user?.display_name || 'Music Lover'}!</CardTitle>
                  <CardDescription className="text-gray-300">
                    {likedSongs.length} liked songs found
                  </CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                <Heart className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Create Playlist Section */}
        {!transferComplete && (
          <Card className="bg-black/20 backdrop-blur-md border-white/10 text-white">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="w-5 h-5 mr-2 text-green-400" />
                Create New Playlist
              </CardTitle>
              <CardDescription className="text-gray-300">
                Give your new playlist a name and we'll transfer all your liked songs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="playlist-name">Playlist Name</Label>
                <Input
                  id="playlist-name"
                  value={playlistName}
                  onChange={(e) => setPlaylistName(e.target.value)}
                  placeholder="Enter playlist name..."
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                />
              </div>
              
              {isTransferring && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Creating playlist...</span>
                    <span>{transferProgress}%</span>
                  </div>
                  <Progress value={transferProgress} className="bg-white/10" />
                </div>
              )}

              <Button
                onClick={handleTransferToPlaylist}
                disabled={isTransferring || !playlistName.trim()}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold"
              >
                {isTransferring ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Playlist...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Playlist ({likedSongs.length} songs)
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Success Message */}
        {transferComplete && (
          <Card className="bg-green-500/10 backdrop-blur-md border-green-500/30 text-white">
            <CardHeader>
              <CardTitle className="flex items-center text-green-400">
                <CheckCircle className="w-5 h-5 mr-2" />
                Playlist Created Successfully!
              </CardTitle>
              <CardDescription className="text-gray-300">
                Your playlist "{playlistName}" has been created with all {likedSongs.length} liked songs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => {
                  setTransferComplete(false)
                  setTransferProgress(0)
                  setPlaylistName('My Liked Songs Collection')
                }}
                variant="outline"
                className="border-green-500/30 text-green-400 hover:bg-green-500/10"
              >
                Create Another Playlist
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Liked Songs Preview */}
        <Card className="bg-black/20 backdrop-blur-md border-white/10 text-white">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Heart className="w-5 h-5 mr-2 text-red-400" />
              Your Liked Songs
            </CardTitle>
            <CardDescription className="text-gray-300">
              Preview of songs that will be added to your playlist
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {likedSongs.slice(0, 5).map((track) => (
                <div key={track.id} className="flex items-center space-x-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <img
                    src={track.album.images[0]?.url}
                    alt={track.album.name}
                    className="w-12 h-12 rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{track.name}</p>
                    <p className="text-sm text-gray-400 truncate">
                      {track.artists.map(artist => artist.name).join(', ')}
                    </p>
                  </div>
                  <span className="text-sm text-gray-400">
                    {formatDuration(track.duration_ms)}
                  </span>
                </div>
              ))}
              {likedSongs.length > 5 && (
                <div className="text-center py-2">
                  <span className="text-gray-400">
                    ... and {likedSongs.length - 5} more songs
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default App