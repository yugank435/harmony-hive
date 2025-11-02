import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AuthCard from "../components/AuthCard";
import '../App'; 

export default function LoginPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    function showPopup(message, durationMs = 1500) {
      const popup = document.createElement("div");
      popup.textContent = message;
      popup.className =
        "fixed top-6 left-1/2 -translate-x-1/2 bg-green-500 text-white text-lg font-medium px-5 py-2 rounded-xl shadow-lg opacity-0 transition-opacity duration-300 z-50";

      document.body.appendChild(popup);

      requestAnimationFrame(() => {
        popup.classList.remove("opacity-0");
        popup.classList.add("opacity-100");
      });

      const stay = durationMs;
      const fadeOutMs = 300;
      const total = stay + fadeOutMs;

      const timeout = setTimeout(() => {
        popup.classList.remove("opacity-100");
        popup.classList.add("opacity-0");

        setTimeout(() => {
          popup.remove();
          navigate("/dashboard", { replace: true });
        }, fadeOutMs);
      }, stay);

      return () => {
        clearTimeout(timeout);
        try {
          popup.remove();
        } catch {}
      };
    }

    const cleanup = showPopup("Already logged in", 1500);
    return cleanup;
  }, [navigate]);

  return (
    <div 
      className="min-h-screen flex items-center justify-center relative bg-gray-900"
      style={{
        backgroundImage: "url('/BG2.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Dark overlay for better readability */}
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      
      <div className="relative z-10 w-full max-w-6xl mx-4 flex flex-col lg:flex-row items-center justify-between gap-8">
        {/* Left side - App Description */}
        <div className="text-center lg:text-left lg:w-1/2 text-white">
          <h1 className="text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Harmony
          </h1>
          <p className="text-2xl lg:text-3xl font-semibold mb-4">
            Where Music Brings People Together
          </p>
          <div className="space-y-4 text-lg lg:text-xl text-gray-200">
            <p className="flex items-center justify-center lg:justify-start gap-2">
              <span className="text-2xl">🎵</span> Create shared playlists with friends
            </p>
            <p className="flex items-center justify-center lg:justify-start gap-2">
              <span className="text-2xl">💫</span> Discover new music together
            </p>
            <p className="flex items-center justify-center lg:justify-start gap-2">
              <span className="text-2xl">❤️</span> Build your musical community
            </p>
          </div>
          
          {/* Feature tags */}
          <div className="mt-8 flex flex-wrap justify-center lg:justify-start gap-3">
            <span className="px-4 py-2 bg-pink-500/20 border border-pink-400/30 rounded-full text-pink-200 text-sm">
              Collaborative Playlists
            </span>
            <span className="px-4 py-2 bg-blue-500/20 border border-blue-400/30 rounded-full text-blue-200 text-sm">
              YouTube Integration
            </span>
          </div>
        </div>

        {/* Right side - Auth Card */}
        <div className="lg:w-1/2 flex justify-center lg:justify-end">
          <AuthCard />
        </div>
      </div>
    </div>
  );
}