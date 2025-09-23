// src/pages/Landing.jsx
import React from "react";
import { useClerk } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const TeamCard = ({ name, role, img }) => (
  <div className="bg-white/60 backdrop-blur-sm rounded-lg shadow p-4 flex items-center gap-4">
    <img src={img} alt={name} className="w-16 h-16 rounded-full object-cover" />
    <div>
      <div className="font-semibold">{name}</div>
      <div className="text-sm text-slate-600">{role}</div>
    </div>
  </div>
);

export default function Landing() {
  const { openSignIn, user } = useClerk();
  const navigate = useNavigate();

  const handleDiscoverClick = async () => {
    if (!user) {
      openSignIn({ redirectUrl: "/dashboard" });
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <>
      <Navbar />
      <main className="pt-16">
        {/* HERO */}
        <section className="min-h-[72vh] bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white flex items-center">
          <div className="max-w-7xl mx-auto px-6 w-full grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
                DisasterDash — AI-powered disaster awareness & response
              </h1>
              <p className="text-lg opacity-90 mb-6">
                Real-time incident overview — local first, global context. Sign in to report issues and get live updates powered by AI.
              </p>

              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={() => document.querySelector('button[data-clerk-signin]')?.click()}
                  className="px-5 py-3 bg-white text-indigo-700 font-semibold rounded shadow"
                >
                  Sign in
                </button>

                <button
                  onClick={handleDiscoverClick}
                  className="px-5 py-3 border border-white/30 rounded text-white/95 backdrop-blur-sm"
                >
                  Discover
                </button>
              </div>

              <div className="mt-6 text-sm opacity-90">
                <strong>Team:</strong> 4 members — responsive, mobile-first, and built for hackathons.
              </div>
            </div>

            <div className="hidden md:flex items-center justify-center">
              <div className="w-full max-w-md rounded-xl overflow-hidden shadow-lg bg-white/10 p-6 backdrop-blur-sm border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-2">Live Demo Map (Preview)</h3>
                <div className="h-60 bg-black/60 rounded-md flex items-center justify-center text-sm text-white/70">
                  Map preview — full map on Dashboard
                </div>
                <p className="mt-3 text-xs text-white/80">Click Discover to learn more about our mission and team.</p>
              </div>
            </div>
          </div>
        </section>

        {/* MISSION / VISION */}
        <section id="mission" className="py-16 bg-slate-50">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 bg-white rounded-lg shadow">
                <h3 className="font-semibold mb-2">Mission</h3>
                <p className="text-sm text-slate-600">
                  Empower communities with timely, actionable disaster information powered by AI and crowdsourced reports.
                </p>
              </div>
              <div className="p-6 bg-white rounded-lg shadow">
                <h3 className="font-semibold mb-2">Vision</h3>
                <p className="text-sm text-slate-600">
                  Reduce response times and improve situational awareness so that help reaches those who need it faster.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ABOUT US */}
        <section id="about" className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl font-bold mb-6">About Us</h2>
            <p className="mb-6 text-slate-700">We are a team of four building tools for better disaster response and awareness.</p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <TeamCard name="Dev Sharma" role="Frontend & Cloud" img="https://i.pravatar.cc/150?img=11" />
              <TeamCard name="Hrushikesh Chavan" role="Backend & AI" img="https://i.pravatar.cc/150?img=12" />
              <TeamCard name="Deepak Adakane" role="Data & Maps" img="https://i.pravatar.cc/150?img=13" />
              <TeamCard name="Chetan Mane" role="Product & QA" img="https://i.pravatar.cc/150?img=14" />
            </div>
          </div>
        </section>

        {/* LET'S CONNECT */}
        <section className="py-12 bg-slate-100">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h3 className="text-2xl font-bold mb-3">Let's Connect</h3>
            <p className="text-slate-700 mb-6">Reach out — we'd love to collaborate. Follow our socials or drop a message.</p>

            <div className="flex items-center justify-center gap-4">
              <a href="mailto:team@disasterdash.example" className="px-4 py-2 border rounded">Email</a>
              <a href="https://github.com/IDevSharma1" target="_blank" rel="noreferrer" className="px-4 py-2 border rounded">GitHub</a>
              <a href="#" className="px-4 py-2 border rounded">Twitter</a>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="py-8 bg-slate-800 text-white">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <div className="text-sm">&copy; {new Date().getFullYear()} DisasterDash — Built by Team</div>
          </div>
        </footer>
      </main>
    </>
  );
}
