// src/components/Navbar.jsx
import { Link, useNavigate } from "react-router-dom";
import { SignedIn, SignedOut, useClerk } from "@clerk/clerk-react";

export default function Navbar() {
  const navigate = useNavigate();
  const { openSignIn } = useClerk();

  const handleDashboardClick = () => {
    // If not signed in, show login first
    openSignIn({ redirectUrl: "/dashboard" });
  };

  return (
    <nav className="w-full h-14 bg-white/30 backdrop-blur-md fixed top-0 z-50 flex items-center justify-between px-6 shadow">
      <span className="font-bold text-gray-800">DisasterDash</span>

      <div className="flex gap-6 text-sm font-medium text-gray-700">
        <Link to="/">Home</Link>

        {/* Show dashboard with login protection */}
        <SignedIn>
          <Link to="/dashboard" className="text-blue-600">
            Dashboard
          </Link>
        </SignedIn>
        <SignedOut>
          <button onClick={handleDashboardClick} className="text-blue-600">
            Dashboard
          </button>
        </SignedOut>
      </div>
    </nav>
  );
}
