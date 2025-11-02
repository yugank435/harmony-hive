import { useEffect, useRef, useState } from "react";
import RoomDialog from "../components/Room_dialog";

const songs = [
  {
    id: 1,
    title: "Pal Pal",
    artist: "Afusic",
    url: "https://www.youtube.com/watch?v=8of5w7RgcTc",
  },
  {
    id: 2,
    title: "Kangna Tera Ni",
    artist: "Abeer Arora",
    url: "https://www.youtube.com/watch?v=tA8h_exda3E",
  },
  {
    id: 3,
    title: "Jo Tere Sang",
    artist: "Kunal Khemu",
    url: "https://www.youtube.com/watch?v=ShPTaCJqeFo",
  },
  {
    id: 4,
    title: "iMdH_G4N9nY",
    artist: "iMdH_G4N9nY",
    url: "https://www.youtube.com/watch?v=iMdH_G4N9nY",
  },
  {
    id: 5,
    title: "M8vDwlHigJA",
    artist: "M8vDwlHigJA",
    url: "https://www.youtube.com/watch?v=M8vDwlHigJA",
  },
  {
    id: 6,
    title: "w5Aioq5VYF0",
    artist: "w5Aioq5VYF0",
    url: "https://www.youtube.com/watch?v=w5Aioq5VYF0",
  },
  {
    id: 7,
    title: "hV8EGTjzD2s",
    artist: "hV8EGTjzD2s",
    url: "https://www.youtube.com/watch?v=hV8EGTjzD2s",
  },
  {
    id: 8,
    title: "zIvKigQ9cVY",
    artist: "zIvKigQ9cVY",
    url: "https://www.youtube.com/watch?v=zIvKigQ9cVY",
  },
  {
    id: 9,
    title: "u5lxsBjCGc0",
    artist: "u5lxsBjCGc0",
    url: "https://www.youtube.com/watch?v=u5lxsBjCGc0",
  },
  {
    id: 10,
    title: "0FnZO-U5oHo",
    artist: "0FnZO-U5oHo",
    url: "https://www.youtube.com/watch?v=0FnZO-U5oHo",
  },
  {
    id: 11,
    title: "FS9dkwhPypY",
    artist: "FS9dkwhPypY",
    url: "https://www.youtube.com/watch?v=FS9dkwhPypY",
  },
  {
    id: 12,
    title: "T0H_LWLiOGk",
    artist: "T0H_LWLiOGk",
    url: "https://www.youtube.com/watch?v=T0H_LWLiOGk",
  },
  {
    id: 13,
    title: "UthcbjOx598",
    artist: "UthcbjOx598",
    url: "https://www.youtube.com/watch?v=UthcbjOx598",
  },
  {
    id: 14,
    title: "UyoDdroSXXs",
    artist: "UyoDdroSXXs",
    url: "https://www.youtube.com/watch?v=UyoDdroSXXs",
  },
  {
    id: 15,
    title: "4Aksl_6oEsA",
    artist: "4Aksl_6oEsA",
    url: "https://www.youtube.com/watch?v=4Aksl_6oEsA",
  },
  {
    id: 16,
    title: "Qg9LxRHLbAk",
    artist: "Qg9LxRHLbAk",
    url: "https://www.youtube.com/watch?v=Qg9LxRHLbAk",
  },
  {
    id: 17,
    title: "Xy1Pzu1yZGg",
    artist: "Xy1Pzu1yZGg",
    url: "https://www.youtube.com/watch?v=Xy1Pzu1yZGg",
  },
  {
    id: 18,
    title: "ZVgergj8Xe4",
    artist: "ZVgergj8Xe4",
    url: "https://www.youtube.com/watch?v=ZVgergj8Xe4",
  },
  {
    id: 19,
    title: "tYKrORILFOg",
    artist: "tYKrORILFOg",
    url: "https://www.youtube.com/watch?v=tYKrORILFOg",
  },
  {
    id: 20,
    title: "gcOyAwm2zp8",
    artist: "gcOyAwm2zp8",
    url: "https://www.youtube.com/watch?v=gcOyAwm2zp8",
  },
  {
    id: 21,
    title: "sB0Je5f0-9Y",
    artist: "sB0Je5f0-9Y",
    url: "https://www.youtube.com/watch?v=sB0Je5f0-9Y",
  },
  {
    id: 22,
    title: "qk2WMmiiVFE",
    artist: "qk2WMmiiVFE",
    url: "https://www.youtube.com/watch?v=qk2WMmiiVFE",
  },
  {
    id: 23,
    title: "-2RAq5o5pwc",
    artist: "-2RAq5o5pwc",
    url: "https://www.youtube.com/watch?v=-2RAq5o5pwc",
  },
  {
    id: 24,
    title: "-urTPhh7gNk",
    artist: "-urTPhh7gNk",
    url: "https://www.youtube.com/watch?v=-urTPhh7gNk",
  },
  {
    id: 25,
    title: "H6H39VUGYYw",
    artist: "H6H39VUGYYw",
    url: "https://www.youtube.com/watch?v=H6H39VUGYYw",
  },
  {
    id: 26,
    title: "q0wCFUH7WXU",
    artist: "q0wCFUH7WXU",
    url: "https://www.youtube.com/watch?v=q0wCFUH7WXU",
  },
  {
    id: 27,
    title: "NlEaUHfunMI",
    artist: "NlEaUHfunMI",
    url: "https://www.youtube.com/watch?v=NlEaUHfunMI",
  },
  {
    id: 28,
    title: "sFMRqxCexDk",
    artist: "sFMRqxCexDk",
    url: "https://www.youtube.com/watch?v=sFMRqxCexDk",
  },
  {
    id: 29,
    title: "x-KbnJ9fvJc",
    artist: "x-KbnJ9fvJc",
    url: "https://www.youtube.com/watch?v=x-KbnJ9fvJc",
  },
  {
    id: 30,
    title: "A66TYFdz8YA",
    artist: "A66TYFdz8YA",
    url: "https://www.youtube.com/watch?v=A66TYFdz8YA",
  },
];

export default function Dashboard() {
  const [currentSong, setCurrentSong] = useState(songs[0]);
  const [videoDataMap, setVideoDataMap] = useState({});
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false);
  const playerRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const API_KEY = "AIzaSyAoDCmUTp5jny93d007vDDZj8zOmmQjV9U"; 
  
  // Extract video ID
  const extractVideoId = (url) => {
    const regex = /(?:youtube\.com.*(?:\?|&)v=|youtu\.be\/)([^&#]+)/;
    const match = url.match(regex);
    console.log(match[1]);
    return match ? match[1] : null;
  };

  // Fetch metadata for all songs
  useEffect(() => {
    async function fetchMetadata() {
      const newMap = {};
      for (const song of songs) {
        const videoId = extractVideoId(song.url);
        if (!videoId) continue;

        try {
          const res = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${API_KEY}`
          );
          const data = await res.json();
          if (data.items.length > 0) {
            newMap[song.id] = data.items[0].snippet;
          }
        } catch (err) {
          console.error("Error fetching metadata:", err);
        }
      }
      setVideoDataMap(newMap);
    }
    fetchMetadata();
  }, []);

  // Load YouTube IFrame API
  useEffect(() => {
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(tag);

    window.onYouTubeIframeAPIReady = () => {
      playerRef.current = new window.YT.Player("player", {
        height: "0",
        width: "0",
        videoId: "",
        playerVars: {
          controls: 0,
          modestbranding: 1,
        },
        events: {
          onReady: () => console.log("YT Player ready"),
          onError: (err) => console.error("YT Player Error:", err),
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              setDuration(playerRef.current.getDuration());
              setIsPlaying(true);
            }
            if (event.data === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false);
            }
          },
        },
      });
    };
  }, []);

  // Load and play new song when user clicks
  const playSong = (song) => {
    setCurrentSong(song);
    const videoId = extractVideoId(song.url);
    if (videoId && playerRef.current) {
      playerRef.current.loadVideoById(videoId);
    }
  };

  // Track progress
  useEffect(() => {
    const interval = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        const current = playerRef.current.getCurrentTime();
        const total = playerRef.current.getDuration();
        if (total > 0) {
          setProgress((current / total) * 100);
          setDuration(total);
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const togglePlay = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleSeek = (e) => {
    if (!playerRef.current) return;
    const rect = e.target.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    playerRef.current.seekTo(newTime, true);
  };

  // Navigation functions
  const playPreviousSong = () => {
    const currentIndex = songs.findIndex(song => song.id === currentSong.id);
    if (currentIndex > 0) {
      const previousSong = songs[currentIndex - 1];
      playSong(previousSong);
    }
    // If at the beginning, do nothing (no wrap-around)
  };

  const playNextSong = () => {
    const currentIndex = songs.findIndex(song => song.id === currentSong.id);
    if (currentIndex < songs.length - 1) {
      const nextSong = songs[currentIndex + 1];
      playSong(nextSong);
    }
    // If at the end, do nothing (no wrap-around)
  };

  return (
    <div className="min-h-screen flex bg-gray-900">
      {/* Hidden YT player */}
      <div id="player" style={{ display: "none" }}></div>

      {/* Room Dialog */}
      <RoomDialog 
        isOpen={isRoomDialogOpen} 
        onClose={() => setIsRoomDialogOpen(false)} 
      />

      {/* Left: Song Grid */}
      <div className="w-2/3 p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Harmony
            </h1>
            <p className="text-gray-400 mt-2">Your personal music collection</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-purple-500/20 border border-purple-400/30 rounded-full px-4 py-2">
              <span className="text-purple-300 text-sm font-semibold">
                {songs.length} Songs
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {songs.map((song) => {
            const metadata = videoDataMap[song.id];
            return (
              <div
                key={song.id}
                onClick={() => playSong(song)}
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl shadow-2xl hover:shadow-purple-500/20 hover:scale-105 transition-all duration-300 cursor-pointer group"
              >
                <div className="relative overflow-hidden rounded-t-2xl">
                  <img
                    src={
                      metadata?.thumbnails?.medium?.url ||
                      "https://via.placeholder.com/150"
                    }
                    alt={song.title}
                    className="w-full h-40 object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <div className="p-4">
                  <p className="font-semibold text-white truncate">
                    {metadata ? metadata.title : song.title}
                  </p>
                  <p className="text-sm text-gray-300 truncate mt-1">
                    {metadata ? metadata.channelTitle : song.artist}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Music Player */}
      <div className="w-1/3 p-6 bg-gradient-to-br from-purple-900/30 to-pink-900/20 backdrop-blur-sm">
        <div className="sticky top-6">
          {/* Header with Room and Logout buttons */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setIsRoomDialogOpen(true)}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl shadow-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 transform hover:scale-105 font-semibold"
            >
              🎵 Create / Join Room
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('token');
                window.location.href = '/';
              }}
              className="px-6 py-3 bg-white/10 border border-white/20 text-white rounded-xl shadow-lg hover:bg-white/20 transition-all duration-200 backdrop-blur-sm font-semibold"
            >
              Log out
            </button>
          </div>
          
          {/* Player Card */}
          <div className="w-full max-w-md bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl shadow-2xl p-6 flex flex-col items-center">
            <div className="relative mb-6">
              <img
                src={
                  videoDataMap[currentSong.id]?.thumbnails?.medium?.url ||
                  "https://via.placeholder.com/200"
                }
                alt={currentSong.title}
                className="w-48 h-48 rounded-2xl object-cover shadow-2xl"
              />
              <div className="absolute -bottom-3 -right-3 w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white text-lg">🎵</span>
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-white text-center mb-2">
              {videoDataMap[currentSong.id]?.title || currentSong.title}
            </h3>
            <p className="text-gray-300 mb-6 text-center">
              {videoDataMap[currentSong.id]?.channelTitle || currentSong.artist}
            </p>

            {/* Progress Bar */}
            <div className="w-full mb-6">
              <div
                className="w-full h-2 bg-white/20 rounded-full mb-2 cursor-pointer"
                onClick={handleSeek}
              >
                <div
                  className="h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-200"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-gray-300">
                <span>{formatTime((progress / 100) * duration)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-4 items-center justify-center">
              <button 
                onClick={playPreviousSong}
                className="bg-white/10 border border-white/20 p-3 rounded-full hover:bg-white/20 transition-all duration-200 text-white shadow-lg backdrop-blur-sm disabled:opacity-30 disabled:cursor-not-allowed"
                disabled={songs.findIndex(song => song.id === currentSong.id) === 0}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="19 20 9 12 19 4 19 20"/>
                </svg>
              </button>
              
              <button
                onClick={togglePlay}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-full hover:from-purple-600 hover:to-pink-600 transition-all duration-200 transform hover:scale-110 shadow-2xl flex items-center justify-center"
              >
                {isPlaying ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="6" y="4" width="4" height="16"/>
                    <rect x="14" y="4" width="4" height="16"/>
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                )}
              </button>
              
              <button 
                onClick={playNextSong}
                className="bg-white/10 border border-white/20 p-3 rounded-full hover:bg-white/20 transition-all duration-200 text-white shadow-lg backdrop-blur-sm disabled:opacity-30 disabled:cursor-not-allowed"
                disabled={songs.findIndex(song => song.id === currentSong.id) === songs.length - 1}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5 4 15 12 5 20 5 4"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
              <p className="text-2xl font-bold text-purple-400">{songs.length}</p>
              <p className="text-xs text-gray-400">Songs</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
              <p className="text-2xl font-bold text-pink-400">24/7</p>
              <p className="text-xs text-gray-400">Available</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
              <p className="text-2xl font-bold text-purple-400">∞</p>
              <p className="text-xs text-gray-400">Vibes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}