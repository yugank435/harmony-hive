import { useState } from "react";

function showPopup(message, redirect = false) {
  const popup = document.createElement("div");
  popup.textContent = message;
  popup.className =
    "fixed top-6 left-1/2 -translate-x-1/2 bg-green-500 text-white text-lg font-medium px-5 py-2 rounded-xl shadow-lg opacity-0 transition-opacity duration-300 z-50";

  document.body.appendChild(popup);

  requestAnimationFrame(() => {
    popup.classList.remove("opacity-0");
    popup.classList.add("opacity-100");
  });

  setTimeout(() => {
    popup.classList.remove("opacity-100");
    popup.classList.add("opacity-0");

    setTimeout(() => {
      popup.remove();
      window.location.href = "/dashboard";
    }, 300);
  }, 1000);
}

export default function AuthCard() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const endpoint = isSignUp ? "/user/signup" : "/user/signin";
    const body = isSignUp
      ? { email, password, name: username }
      : { email, password };

    try {
      const res = await fetch(`http://localhost:3000${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Something went wrong");
        return;
      }

      if (data.token) localStorage.setItem("token", data.token);

      showPopup(isSignUp ? "Account created!" : "Logged in!");
    } catch (err) {
      console.error(err);
      alert("Network error");
    }
  };

  return (
    <div className="w-full max-w-md p-8 rounded-2xl shadow-2xl backdrop-blur-sm bg-white/10 border border-white/20">
      <div className="text-center mb-2">
        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-3">
          <span className="text-white text-xl">🎵</span>
        </div>
        <h2 className="text-2xl font-bold text-white">
          {isSignUp ? "Join Harmony" : "Welcome Back"}
        </h2>
        <p className="text-gray-300 text-sm mt-1">
          {isSignUp ? "Start your musical journey" : "Continue your musical journey"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 mt-6">
        {isSignUp && (
          <div>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-white/90 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              required
            />
          </div>
        )}

        <div>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-white/90 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
            required
          />
        </div>

        <div>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-white/90 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
        >
          {isSignUp ? "Create Account" : "Sign In"}
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-white/20">
        <p className="text-center text-gray-300 text-sm">
          {isSignUp ? "Already have an account?" : "New to Harmony?"}{" "}
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-white font-semibold hover:text-purple-300 transition-colors duration-200 underline"
          >
            {isSignUp ? "Sign In" : "Create Account"}
          </button>
        </p>
      </div>

      {/* Quick demo hint */}
      <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10">
        <p className="text-xs text-gray-400 text-center">
          💡 Demo: Use any email & password to test
        </p>
      </div>
    </div>
  );
}