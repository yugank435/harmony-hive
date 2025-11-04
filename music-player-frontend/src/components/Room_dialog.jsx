import { useState, useEffect } from "react";
import { X, Music, Plus, LogIn } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export default function RoomDialog({ isOpen, onClose }) {
  const [mode, setMode] = useState(null); // "create" | "join" | null
  const [roomId, setRoomId] = useState("");
  const [password, setPassword] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [currentRoomId, setCurrentRoomId] = useState(null);

  // Check if user is already in a room
  useEffect(() => {
    const checkCurrentRoom = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await fetch(`${API_BASE_URL}/api/user/current-room`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (res.ok) {
          const data = await res.json();
          setCurrentRoomId(data.roomId);
        }
      } catch (error) {
        console.error("Error checking current room:", error);
      }
    };

    if (isOpen) {
      checkCurrentRoom();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const resetDialog = () => {
    setMode(null);
    setRoomId("");
    setPassword("");
    setIsJoining(false);
    setIsCreating(false);
  };

  const handleClose = () => {
    resetDialog();
    onClose();
  };

  // If user is already in a room, redirect to room page
  const handleRoomAction = () => {
    if (currentRoomId && currentRoomId !== -1) {
      window.location.href = "/room";
      return true;
    }
    return false;
  };

  const createRoom = async () => {
    // Check if already in a room
    if (handleRoomAction()) return;

    if (!/^[a-zA-Z0-9]{5,8}$/.test(password)) {
      alert("Password must be 5-8 alphanumeric characters.");
      return;
    }

    if (isCreating) return;
    setIsCreating(true);
    
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE_URL}/api/room/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password }),
      });

      const body = await res.json().catch(() => ({}));
      
      if (res.ok) {
        alert(`Room ${body.room?.id || "created"} created successfully!`);
        window.location.href = "/room";
      } else {
        alert(body.message || "Failed to create room.");
      }
    } catch (err) {
      console.error("Error creating room:", err);
      alert("Something went wrong while creating the room.");
    } finally {
      setIsCreating(false);
    }
  };

  const joinRoom = async () => {
    // Check if already in a room
    if (handleRoomAction()) return;

    const token = localStorage.getItem("token");
    if (!token) {
      alert("You must be signed in first!");
      return;
    }

    if (!roomId || !password) {
      alert("Please enter both Room ID and Password.");
      return;
    }

    if (isJoining) return;
    setIsJoining(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/room/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ roomId: Number(roomId), password }),
      });

      const data = await res.json().catch(() => ({}));
      
      if (!res.ok) {
        alert(data.message || "Failed to join room");
        return;
      }
      
      alert(`Joined room ${roomId} successfully!`);
      window.location.href = "/room";
    } catch (err) {
      console.error(err);
      alert("Something went wrong while joining the room.");
    } finally {
      setIsJoining(false);
    }
  };

  // If user is already in a room, show different content
  if (currentRoomId && currentRoomId !== -1) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
          >
            <X size={24} />
          </button>

          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Music className="text-indigo-600" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Already in a Room</h2>
            <p className="text-gray-600 mt-2">You're currently in Room #{currentRoomId}</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => window.location.href = "/room"}
              className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition shadow-md flex items-center justify-center gap-2"
            >
              <Music size={20} />
              Go to Room
            </button>
            <button
              onClick={handleClose}
              className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
        >
          <X size={24} />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Music className="text-white" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">
            {mode === "create" ? "Create Room" : mode === "join" ? "Join Room" : "Private Room"}
          </h2>
          <p className="text-gray-600 mt-2">
            {!mode 
              ? "Start or join a synchronized music experience" 
              : mode === "create" 
                ? "Create a new room for your friends to join"
                : "Enter room details to join an existing room"
            }
          </p>
        </div>

        {/* Default view: 2 buttons */}
        {!mode && (
          <div className="space-y-3">
            <button
              onClick={() => setMode("create")}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
            >
              <Plus size={20} />
              Create New Room
            </button>
            <button
              onClick={() => setMode("join")}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
            >
              <LogIn size={20} />
              Join Existing Room
            </button>
          </div>
        )}

        {/* Create mode */}
        {mode === "create" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Room Password
              </label>
              <input
                type="text"
                placeholder="Enter Password (5-8 alphanumeric)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
              <p className="text-xs text-gray-500 mt-1">
                Must be 5-8 characters (letters and numbers only)
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setMode(null)}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Back
              </button>
              <button
                onClick={createRoom}
                disabled={isCreating}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? "Creating..." : "Create Room"}
              </button>
            </div>
          </div>
        )}

        {/* Join mode */}
        {mode === "join" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Room ID
              </label>
              <input
                type="text"
                placeholder="Enter Room ID"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                placeholder="Enter Room Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setMode(null)}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Back
              </button>
              <button
                onClick={joinRoom}
                disabled={isJoining}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-3 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isJoining ? "Joining..." : "Join Room"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}