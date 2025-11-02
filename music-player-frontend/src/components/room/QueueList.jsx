import { Music, ListMusic, ArrowUp } from "lucide-react";

export default function QueueList({ queue, currentSong, isAdmin, onMoveToTop }) {
  if (queue.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-2xl shadow-2xl p-8 text-center">
        <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Music size={24} className="text-purple-400" />
        </div>
        <p className="text-white text-lg font-semibold mb-2">Queue is Empty</p>
        <p className="text-gray-400 text-sm">Add songs to start the party! 🎉</p>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-2xl shadow-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <ListMusic size={20} className="text-purple-400" />
          Queue ({queue.length})
        </h3>
        {isAdmin && (
          <span className="text-xs text-gray-400 bg-white/10 px-2 py-1 rounded">
            Admin Controls
          </span>
        )}
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {queue.map((song, index) => (
          <div
            key={song.id || index}
            className={`p-4 rounded-xl border transition-all duration-200 ${
              currentSong?.id === song.id
                ? 'bg-purple-500/20 border-purple-400/50 shadow-lg'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-4">
              {/* Song Thumbnail */}
              <div className="relative">
                <img
                  src={song.thumbnail || "https://via.placeholder.com/60"}
                  alt={song.title}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                {currentSong?.id === song.id && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  </div>
                )}
              </div>

              {/* Song Info */}
              <div className="flex-1 min-w-0">
                <p className={`font-medium truncate ${
                  currentSong?.id === song.id ? 'text-purple-300' : 'text-white'
                }`}>
                  {song.title}
                </p>
                <p className="text-sm text-gray-400 truncate">
                  {song.channel || song.artist}
                </p>
                {index === 0 && currentSong?.id !== song.id && (
                  <span className="inline-block mt-1 text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                    Next Up
                  </span>
                )}
              </div>

              {/* Admin Controls */}
              {isAdmin && index > 0 && (
                <button
                  onClick={() => onMoveToTop(song.id)}
                  className="p-2 bg-purple-600/20 border border-purple-400/30 rounded-lg hover:bg-purple-600/30 transition-all duration-200 group"
                  title="Move to top"
                >
                  <ArrowUp size={16} className="text-purple-400 group-hover:text-purple-300" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}