import { Music } from "lucide-react";

export default function MemberPlayer({ 
  currentSong, 
  progress, 
  duration, 
  isPlaying 
}) {
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const paddedSecs = secs < 10 ? `0${secs}` : secs;
    return `${mins}:${paddedSecs}`;
  };

  return (
    <div className="w-full max-w-md bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl shadow-2xl p-6">
      {/* Song Artwork */}
      <div className="relative mb-6">
        <img
          src={currentSong.thumbnail}
          alt={currentSong.title}
          className="w-full h-64 object-cover rounded-2xl shadow-2xl"
        />
        <div className="absolute -bottom-3 -right-3 w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
          <Music size={20} className="text-white" />
        </div>
      </div>

      {/* Song Info */}
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-white mb-2">{currentSong.title}</h3>
        <p className="text-gray-300">{currentSong.channel}</p>
      </div>

      {/* Progress Bar (Read-only) */}
      <div className="mb-6">
        <div className="w-full h-2 bg-white/20 rounded-full mb-2">
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

      {/* Status Display */}
      <div className="text-center">
        <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-xl border backdrop-blur-sm ${
          isPlaying 
            ? 'bg-green-500/20 border-green-400/30 text-green-300' 
            : 'bg-yellow-500/20 border-yellow-400/30 text-yellow-300'
        }`}>
          <div className={`w-3 h-3 rounded-full ${
            isPlaying ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'
          }`}></div>
          <span className="font-semibold">
            {isPlaying ? 'Now Playing' : 'Paused'}
          </span>
        </div>
        <p className="text-sm text-gray-400 mt-4">
          🎵 Sync with room admin
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Controls are managed by room host
        </p>
      </div>
    </div>
  );
}