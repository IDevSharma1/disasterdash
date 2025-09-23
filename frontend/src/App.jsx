// src/App.jsx
import { Routes, Route } from "react-router-dom";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";

import LandingPage from "./pages/Landing";
import Dashboard  from "./pages/Dashboard";

function App() {
  return (
    <Routes>
      {/* Public Landing Page */}
      <Route path="/" element={<LandingPage />} />

      {/* Protected Dashboard Route */}
      <Route
        path="/dashboard"
        element={
          <>
            <SignedIn>
              <Dashboard />
            </SignedIn>
            <SignedOut>
              <RedirectToSignIn redirectUrl="/dashboard" />
            </SignedOut>
          </>
        }
      />
    </Routes>
  );
}

export default App;
