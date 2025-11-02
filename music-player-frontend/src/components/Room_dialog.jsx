import { useState } from "react";
import { X } from "lucide-react";

export default function RoomDialog({ isOpen, onClose }) {
  const [mode, setMode] = useState(null); // "create" | "join" | null
  const [roomId, setRoomId] = useState("");
  const [password, setPassword] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

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

  const createRoom = async () => {
    if (!/^[a-zA-Z0-9]{5,8}$/.test(password)) {
      alert("Password must be 5-8 alphanumeric characters.");
      return;
    }

    if (isCreating) return;
    setIsCreating(true);
    
    try {
      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:3000/room/create", {
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
        // Redirect to room page after successful creation
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
      const res = await fetch("http://localhost:3000/room/join", {
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
      // Redirect to room page after successful join
      window.location.href = "/room";
    } catch (err) {
      console.error(err);
      alert("Something went wrong while joining the room.");
    } finally {
      setIsJoining(false);
    }
  };

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
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          {mode === "create" ? "Create Room" : mode === "join" ? "Join Room" : "Private Room"}
        </h2>

        {/* Default view: 2 buttons */}
        {!mode && (
          <div className="space-y-3">
            <button
              onClick={() => setMode("create")}
              className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition shadow-md"
            >
              Create New Room
            </button>
            <button
              onClick={() => setMode("join")}
              className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition shadow-md"
            >
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
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Must be 5-8 characters (letters and numbers only)
              </p>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setMode(null)}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Back
              </button>
              <button
                onClick={createRoom}
                disabled={isCreating}
                className="flex-1 bg-indigo-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setMode(null)}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Back
              </button>
              <button
                onClick={joinRoom}
                disabled={isJoining}
                className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
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