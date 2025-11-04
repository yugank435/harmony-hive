import { useState, useRef, useEffect } from "react";
import { LogOut, Music, Crown } from "lucide-react";
import AdminPlayer from "../components/room/AdminPlayer";
import MemberPlayer from "../components/room/MemberPlayer";
import QueueList from "../components/room/QueueList";

export default function Room() {
  const [queue, setQueue] = useState([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [currentSong, setCurrentSong] = useState(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAddingSong, setIsAddingSong] = useState(false);
  const [roomInfo, setRoomInfo] = useState({ id: null, password: "" });
  const [isLeavingRoom, setIsLeavingRoom] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const playerRef = useRef(null);
  const progressIntervalRef = useRef(null); // used by admin to poll player
  const adminProgressSenderRef = useRef(null); // used by admin to send PROGRESS_UPDATE
  const endMonitorRef = useRef(null);
  const wsRef = useRef(null);
  const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

  // Get current room ID
  async function getCurrentRoomId() {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE_URL}/api/user/current-room`, {
      method: "GET",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || "Failed to get current room");
    }
    const data = await res.json();
    return data.roomId;
  }

  // Fetch queue helper
  const fetchQueue = async (roomIdParam) => {
    if (!roomIdParam) return [];
    const token = localStorage.getItem("token");
    const queueRes = await fetch(`${API_BASE_URL}/api/room/queue?id=${roomIdParam}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!queueRes.ok) {
      const errBody = await queueRes.json().catch(() => ({}));
      throw new Error(errBody.message || "Failed to fetch queue");
    }
    const q = await queueRes.json();
    setQueue(q);
    return q;
  };

  // CHECK ADMIN endpoint still available when needed, but we will accept server-sent ROOM_STATE as source-of-truth
  const checkAdminStatus = async (roomId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/room/is-admin/${roomId}`, {
        method: "GET",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        const data = await res.json();
        setIsAdmin(data.isAdmin);
        return data.isAdmin;
      }
      return false;
    } catch (error) {
      console.error("Error checking admin status:", error);
      return false;
    }
  };

  // WebSocket connection and listeners
  useEffect(() => {
    const connectWebSocket = async () => {
      try {
        const roomId = await getCurrentRoomId();
        if (!roomId) return;

        const token = localStorage.getItem("token");
        const wsUrl = `ws://localhost:3000/ws?roomId=${roomId}&token=${token}`;
        wsRef.current = new WebSocket(wsUrl);

        wsRef.current.onopen = () => {
          console.log("WebSocket connected");
        };

        wsRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            handleWebSocketMessage(data);
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
          }
        };

        wsRef.current.onclose = () => {
          console.log("WebSocket disconnected");
        };

        wsRef.current.onerror = (error) => {
          console.error("WebSocket error:", error);
        };
      } catch (error) {
        console.error("Failed to connect WebSocket:", error);
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Handle WebSocket messages 
  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case "ROOM_STATE":
        // SERVER authoritative: includes queue and isAdmin
        if (data.queue) setQueue(data.queue);
        if (typeof data.isAdmin === "boolean") {
          // set isAdmin first, so player logic that depends on it can act accordingly
          setIsAdmin(data.isAdmin);
        }
        if (data.roomId) setRoomInfo((r) => ({ ...r, id: data.roomId }));
        break;

      case "QUEUE_UPDATE":
        setQueue(data.queue);
        break;

      case "PLAYER_STATE":
        // only update UI playback indicator; admin will send PROGRESS_UPDATE
        setIsPlaying(data.isPlaying);
        break;

      case "SEEK_TO":
        if (isAdmin) {
          // admin seeking should be handled locally
          if (playerRef.current && playerRef.current.seekTo) {
            playerRef.current.seekTo(data.currentTime, true);
          }
        } else {
          // members adjust UI progress to new time
          if (data.currentTime !== undefined && data.duration) {
            const percent = data.duration > 0 ? (data.currentTime / data.duration) * 100 : 0;
            setProgress(percent);
            setDuration(data.duration);
          } else if (data.currentTime !== undefined && duration > 0) {
            setProgress((data.currentTime / duration) * 100);
          }
        }
        break;

      case "SONG_CHANGED":
        setCurrentSong(data.song);
        // If admin, load in player; members do not create player so just update UI
        if (isAdmin && playerRef.current && playerRef.current.loadVideoById) {
          playerRef.current.loadVideoById(data.song.ytVideoId || data.song.videoId);
        }
        break;

      case "SONG_ENDED":
        handleSongEnd();
        break;

      case "PROGRESS_UPDATE":
        // Members receive this from admin to update UI
        if (!isAdmin) {
          if (typeof data.progress === "number") setProgress(data.progress);
          if (typeof data.duration === "number") setDuration(data.duration);
          // Optional: if currentTime included, keep a separate small display or compute from progress
        }
        break;
      case 'ROOM_CLOSED':
        alert('Room was closed by the owner. You have been removed from the room.');
        stopAdminProgressSender();

        // clear any monitoring intervals
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        if (endMonitorRef.current) {
          clearInterval(endMonitorRef.current);
          endMonitorRef.current = null;
        }

        // cleanup local state
        setQueue([]);
        setCurrentSong(null);
        setIsAdmin(false);
        setRoomInfo({ id: null, password: '' });
        if (wsRef.current) {
          wsRef.current.close();
        }
        window.location.href = '/dashboard';
        break;
      default:
        console.log("Unknown message type:", data.type);
    }
  };

  const sendWebSocketMessage = (message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  };

  // Load YT Iframe API only for ADMIN
  useEffect(() => {
    // Only load YT player when this client is admin
    if (!isAdmin) {
      // If user was admin and became non-admin, ensure player removed
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {}
        playerRef.current = null;
      }
      return;
    }

    // If player already loaded, don't re-add script
    if (playerRef.current) return;

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
          autoplay: 1,
        },
        events: {
          onReady: () => console.log("YT Player ready"),
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              sendWebSocketMessage({
                type: "PLAYER_STATE",
                isPlaying: true,
              });
              // start admin progress sender
              startAdminProgressSender();
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false);
              sendWebSocketMessage({
                type: "PLAYER_STATE",
                isPlaying: false,
              });
              stopAdminProgressSender();
            } else if (event.data === window.YT.PlayerState.ENDED) {
              console.log("Song ended - playing next");
              sendWebSocketMessage({ type: "SONG_ENDED" });
              handleSongEnd();
              stopAdminProgressSender();
            }
          },
        },
      });
    };

    return () => {
      // cleanup when component unmounts or admin flips
      stopAdminProgressSender();
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (endMonitorRef.current) {
        clearInterval(endMonitorRef.current);
      }
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {}
        playerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  // Admin: poll player for progress to update local UI and send PROGRESS_UPDATE to members
  const startAdminProgressSender = () => {
    if (!isAdmin || !playerRef.current) return;
    // Clear any existing
    if (adminProgressSenderRef.current) {
      clearInterval(adminProgressSenderRef.current);
    }
    adminProgressSenderRef.current = setInterval(() => {
      try {
        if (
          playerRef.current &&
          playerRef.current.getCurrentTime &&
          playerRef.current.getDuration
        ) {
          const currentTime = playerRef.current.getCurrentTime();
          const totalDuration = playerRef.current.getDuration();
          if (totalDuration > 0) {
            const newProgress = (currentTime / totalDuration) * 100;
            setProgress(newProgress);
            setDuration(totalDuration);

            // Send progress to members
            sendWebSocketMessage({
              type: "PROGRESS_UPDATE",
              progress: newProgress,
              duration: totalDuration,
              currentTime,
            });
          }
        }
      } catch (err) {
        console.warn("Admin progress sender error:", err);
      }
    }, 1000);
  };

  const stopAdminProgressSender = () => {
    if (adminProgressSenderRef.current) {
      clearInterval(adminProgressSenderRef.current);
      adminProgressSenderRef.current = null;
    }
  };

  // Monitor end as fallback (admin only)
  useEffect(() => {
    if (!isAdmin || !playerRef.current || !currentSong) return;

    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    progressIntervalRef.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime && playerRef.current.getDuration) {
        try {
          const currentTime = playerRef.current.getCurrentTime();
          const totalDuration = playerRef.current.getDuration();

          if (totalDuration > 0) {
            const newProgress = (currentTime / totalDuration) * 100;
            setProgress(newProgress);
            setDuration(totalDuration);

            if (newProgress >= 99.5 && playerRef.current.getPlayerState) {
              const state = playerRef.current.getPlayerState();
              if (state === window.YT.PlayerState.PLAYING || state === window.YT.PlayerState.BUFFERING) {
                console.log("Fallback: Song reached end, playing next");
                sendWebSocketMessage({ type: "SONG_ENDED" });
                handleSongEnd();
              }
            }
          }
        } catch (error) {
          console.warn("Error monitoring progress:", error);
        }
      }
    }, 1000);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [currentSong, isAdmin]);

  const handleSongEnd = async () => {
    console.log("Handling song end");

    if (endMonitorRef.current === "processing") {
      return;
    }

    endMonitorRef.current = "processing";

    try {
      await playNext();
    } catch (error) {
      console.error("Error in handleSongEnd:", error);
    } finally {
      setTimeout(() => {
        endMonitorRef.current = null;
      }, 2000);
    }
  };

  // Add song to queue
  const addToQueue = async () => {
    const videoId = extractVideoId(videoUrl);
    if (!videoId) return alert("Invalid YouTube link");

    if (isAddingSong) return;
    setIsAddingSong(true);

    try {
      const ytRes = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${API_KEY}`
      );
      const ytData = await ytRes.json();
      if (!ytData.items || ytData.items.length === 0) {
        return alert("No video found for this link");
      }
      const snippet = ytData.items[0].snippet;
      const songPayload = {
        ytVideoId: videoId,
        title: snippet.title,
        channel: snippet.channelTitle,
        thumbnail: snippet.thumbnails.medium.url,
      };

      const token = localStorage.getItem("token");
      const addRes = await fetch(`${API_BASE_URL}/api/room/addsong`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(songPayload),
      });

      if (!addRes.ok) {
        const err = await addRes.json().catch(() => ({}));
        throw new Error(err.message || "Failed to add song to queue");
      }

      // Request queue refresh
      sendWebSocketMessage({
        type: "QUEUE_UPDATE",
      });

      const rid = await getCurrentRoomId();
      if (!rid) {
        alert("You are not in a room. Join or create a room first.");
        return;
      }
      const updatedQueue = await fetchQueue(Number(rid));
      if (!currentSong && updatedQueue.length > 0) {
        // Only admin should auto-play; for safety ensure only admin calls playSong
        if (isAdmin) {
          setCurrentSong(updatedQueue[0]);
          playSong(updatedQueue[0]);
        } else {
          setCurrentSong(updatedQueue[0]);
        }
      }
    } catch (err) {
      console.error("Error adding song:", err);
      alert(err.message || "Could not add song. Try again!");
    } finally {
      setIsAddingSong(false);
      setVideoUrl("");
    }
  };

  // Extract YT video ID
  const extractVideoId = (url) => {
    try {
      const regex =
        /(?:youtube\.com\/(?:.*v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
      const match = url.match(regex);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  };

  const playSong = async (song) => {
    if (isAdmin && playerRef.current && playerRef.current.loadVideoById) {
      const idToLoad = song.ytVideoId || song.videoId;
      if (!idToLoad) return console.warn("No video id found for song", song);

      console.log("Playing song:", song.title);
      playerRef.current.loadVideoById(idToLoad);
      setCurrentSong(song);
      setIsPlaying(true);

      // Broadcast song change
      sendWebSocketMessage({
        type: "SONG_CHANGED",
        song: song,
      });

      try {
        const token = localStorage.getItem("token");
        const queueRes = await fetch(
          `${API_BASE_URL}/api/room/queue?id=${roomInfo.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (queueRes.ok) {
          const data = await queueRes.json();
          setQueue(data);
        }
      } catch (err) {
        console.warn("Failed to refresh queue after song change:", err);
      }
    } else {
      // Non-admin only updates UI
      setCurrentSong(song);
    }
  };

  const playNext = async () => {
    if (!currentSong) return;

    try {
      const token = localStorage.getItem("token");
      let updatedQueue = [];

      let delRes;
      try {
        delRes = await fetch(`${API_BASE_URL}/api/room/removesong`, {
          method: "DELETE",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        });
      } catch (networkErr) {
        console.warn("Network error while deleting song:", networkErr);
        return;
      }

      if (delRes && delRes.ok) {
        const data = await delRes.json();
        updatedQueue = data.queue || [];
      } else {
        console.warn("Failed to delete song from backend");
        return;
      }

      // Broadcast queue update
      sendWebSocketMessage({
        type: "QUEUE_UPDATE",
      });

      if (updatedQueue.length > 0) {
        const nextSong = updatedQueue[0];
        console.log("Playing next song:", nextSong.title);
        setCurrentSong(nextSong);
        if (isAdmin) {
          await playSong(nextSong);
        }
        setQueue(updatedQueue);
      } else {
        console.log("Queue is empty, stopping playback");
        setCurrentSong(null);
        setIsPlaying(false);
        setQueue([]);
        if (isAdmin && playerRef.current && playerRef.current.stopVideo) {
          playerRef.current.stopVideo();
        }
      }
    } catch (err) {
      console.error("Error in playNext:", err);
    }
  };

  // Admin-only controls
  const handleTogglePlay = () => {
    if (!isAdmin || !playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
    setIsPlaying(!isPlaying);

    sendWebSocketMessage({
      type: "PLAYER_STATE",
      isPlaying: !isPlaying,
    });

    // ensure admin sender is running/stopped based on new state
    if (!isPlaying) {
      startAdminProgressSender();
    } else {
      stopAdminProgressSender();
    }
  };

  const handleSeek = (newTime) => {
    if (!isAdmin || !playerRef.current) return;
    playerRef.current.seekTo(newTime, true);

    sendWebSocketMessage({
      type: "SEEK_TO",
      currentTime: newTime,
      duration,
    });
  };

  const handleNext = () => {
    if (!isAdmin) return;
    playNext();
  };

  const moveSongToTop = async (songId) => {
    if (!isAdmin) {
      alert("Only room admin can reorder the queue");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/room/move-to-top`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ songId }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to move song to top");
      }

      sendWebSocketMessage({
        type: "ADMIN_ACTION",
        action: "MOVED_TO_TOP",
        songId: songId,
      });

      const rid = await getCurrentRoomId();
      if (rid) {
        await fetchQueue(rid);
      }
    } catch (error) {
      console.error("Error moving song to top:", error);
      alert(error.message || "Failed to move song to top");
    }
  };

  // Fetch room info on mount: room details + rely on ROOM_STATE from WS for isAdmin
  useEffect(() => {
    async function fetchRoomInfo() {
      try {
        const token = localStorage.getItem("token");
        const roomId = await getCurrentRoomId();
        if (roomId) {
          const roomRes = await fetch(`${API_BASE_URL}/api/room/details/${roomId}`, {
            method: "GET",
            headers: {
              Authorization: token ? `Bearer ${token}` : "",
              "Content-Type": "application/json",
            },
          });

          if (roomRes.ok) {
            const roomData = await roomRes.json();
            setRoomInfo({
              id: roomId,
              password: roomData.password || "****",
            });

            // still fetch queue for UI; isAdmin will be set by ROOM_STATE too
            await fetchQueue(roomId);
          }
        }
      } catch (err) {
        console.error("Error fetching room info:", err);
      }
    }

    fetchRoomInfo();
  }, []);

  const leaveRoom = async () => {
    if (isLeavingRoom) return;
    setIsLeavingRoom(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/room/leave`, {
        method: "PUT",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        alert("Left room successfully!");
        window.location.href = "/dashboard";
      } else {
        const errBody = await res.json().catch(() => ({}));
        alert(errBody.message || "Failed to leave room");
      }
    } catch (err) {
      console.error("Error leaving room:", err);
      alert("Something went wrong while leaving the room.");
    } finally {
      setIsLeavingRoom(false);
    }
  };

 return (
  <div className="flex min-h-screen bg-gradient-to-br from-gray-900 to-purple-900">
    <div id="player" style={{ display: "none" }}></div>

    {/* Left: Queue & Add Song */}
    <div className="w-1/2 p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Room #{roomInfo.id}
          </h1>
          <p className="text-gray-400 mt-1">Sync your music with friends</p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2 bg-yellow-500/20 border border-yellow-400/30 px-4 py-2 rounded-full text-sm font-semibold">
            <Crown size={16} className="text-yellow-400" />
            <span className="text-yellow-300">Room Admin</span>
          </div>
        )}
      </div>

      {/* Add Song Section */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl shadow-2xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Music size={20} className="text-purple-400" />
          Add Song to Queue
        </h3>
        <div className="flex gap-3">
          <input
            type="text"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="Paste YouTube link here..."
            className="flex-grow bg-white/5 border border-white/20 rounded-xl p-4 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm"
          />
          <button
            onClick={addToQueue}
            disabled={isAddingSong}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shadow-lg"
          >
            {isAddingSong ? "Adding..." : "Add Song"}
          </button>
        </div>
      </div>

      {/* Queue List */}
      <QueueList
        queue={queue}
        currentSong={currentSong}
        isAdmin={isAdmin}
        onMoveToTop={moveSongToTop}
      />
    </div>

    {/* Right: Player & Room Info */}
    <div className="w-1/2 p-6 bg-gradient-to-br from-purple-900/30 to-pink-900/20 backdrop-blur-sm">
      {/* Room Info Section */}
      <div className="w-full max-w-md mx-auto bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl shadow-2xl p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-sm text-gray-400">Room ID</p>
            <p className="text-2xl font-bold text-purple-400">{roomInfo.id || "Loading..."}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">Password</p>
            <p className="text-lg font-mono font-semibold text-white">{roomInfo.password}</p>
          </div>
        </div>
        <button
          onClick={leaveRoom}
          disabled={isLeavingRoom}
          className="w-full bg-red-600/20 border border-red-400/30 text-red-300 px-4 py-3 rounded-xl font-semibold hover:bg-red-600/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 backdrop-blur-sm"
        >
          <LogOut size={18} />
          {isLeavingRoom ? "Leaving..." : "Leave Room"}
        </button>
      </div>

      {/* Player Section */}
      <div className="flex flex-col items-center">
        {currentSong ? (
          isAdmin ? (
            <AdminPlayer
              currentSong={currentSong}
              progress={progress}
              duration={duration}
              isPlaying={isPlaying}
              onTogglePlay={handleTogglePlay}
              onSeek={handleSeek}
              onNext={handleNext}
            />
          ) : (
            <MemberPlayer
              currentSong={currentSong}
              progress={progress}
              duration={duration}
              isPlaying={isPlaying}
            />
          )
        ) : (
          <div className="w-full max-w-md bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl shadow-2xl p-8 text-center">
            <Music size={64} className="mx-auto text-purple-400/50 mb-4" />
            
            {isAdmin && queue && queue.length > 0 ? (
              <div className="flex flex-col items-center gap-4">
                <p className="text-white text-lg font-semibold">Songs waiting in queue</p>
                <p className="text-gray-400 text-sm">Start playing the next song for everyone</p>
                <button
                  onClick={async () => {
                    const first = queue[0];
                    if (!first) return;
                    
                    const maxAttempts = 6;
                    let attempts = 0;
                    const tryPlay = async () => {
                      attempts += 1;
                      if (isAdmin && playerRef.current && playerRef.current.loadVideoById) {
                        try {
                          await playSong(first);
                          return;
                        } catch (err) {
                          console.warn("Error trying to play song:", err);
                        }
                      }
                      
                      if (attempts < maxAttempts) {
                        setTimeout(tryPlay, 500);
                      } else {
                        alert("Player is not ready yet. Please try again in a moment.");
                      }
                    };
                    
                    tryPlay();
                  }}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  Start Queue
                </button>
              </div>
            ) : (
              <>
                <p className="text-gray-400 text-lg">No song playing</p>
                <p className="text-gray-500 text-sm mt-2">Add a song to get started!</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  </div>
  );
}
