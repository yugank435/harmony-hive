import { Music, Play, Pause, SkipForward } from "lucide-react";

export default function AdminPlayer({ 
  currentSong, 
  progress, 
  duration, 
  isPlaying, 
  onTogglePlay, 
  onSeek, 
  onNext 
}) {
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const paddedSecs = secs < 10 ? `0${secs}` : secs;
    return `${mins}:${paddedSecs}`;
  };

  const handleSeek = (e) => {
    const rect = e.target.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    onSeek(newTime);
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

      {/* Progress Bar */}
      <div className="mb-6">
        <div
          className="w-full h-2 bg-white/20 rounded-full cursor-pointer mb-2"
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
      <div className="flex justify-center gap-4">
        <button
          onClick={onTogglePlay}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 transform hover:scale-105 flex items-center gap-2 shadow-lg"
        >
          {isPlaying ? (
            <>
              <Pause size={20} />
              Pause
            </>
          ) : (
            <>
              <Play size={20} />
              Play
            </>
          )}
        </button>
        <button
          onClick={onNext}
          className="bg-white/10 border border-white/20 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/20 transition-all duration-200 flex items-center gap-2 backdrop-blur-sm"
        >
          <SkipForward size={20} />
          Next
        </button>
      </div>

      {/* Admin Badge */}
      <div className="mt-4 text-center">
        <span className="inline-block bg-yellow-500/20 text-yellow-300 text-xs px-3 py-1 rounded-full border border-yellow-400/30">
          🎛️ You are controlling playback
        </span>
      </div>
    </div>
  );
}