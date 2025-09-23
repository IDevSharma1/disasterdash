// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useUser, useAuth, UserButton } from "@clerk/clerk-react";

// Helper for zooming map
function FlyTo({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 10, { animate: true, duration: 1.5 });
    }
  }, [position, map]);
  return null;
}

// 🌟 Dashboard Navbar with Clerk UserButton
function DashboardNavbar() {
  const { user } = useUser();
  return (
    <nav className="fixed top-0 left-0 w-full bg-white/30 backdrop-blur-md shadow-lg z-50">
      <div className="flex justify-between items-center px-6 py-3">
        {/* Brand */}
        <div className="text-xl font-bold text-gray-800 tracking-wide">
          DisasterDash
        </div>

        {/* Search Bar */}
        <div className="hidden md:flex flex-1 mx-6 max-w-lg">
          <input
            type="text"
            placeholder="Search incidents, cities..."
            className="w-full px-4 py-2 rounded-full bg-white/70 shadow-inner border focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
          />
        </div>

        {/* Clerk User Profile */}
        <div className="flex items-center gap-3">
          {user && (
            <span className="hidden sm:block text-gray-800 font-medium">
              {user.firstName || user.username || "User"}
            </span>
          )}
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox:
                  "w-10 h-10 rounded-full border-2 border-gray-300 shadow-md",
              },
            }}
          />
        </div>
      </div>
    </nav>
  );
}

// 🌟 Main Dashboard Component
function Dashboard() {
  const [time, setTime] = useState(new Date());
  const [city] = useState("Mumbai, Maharashtra, India");
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const { user } = useUser();
  const { getToken } = useAuth();

  // Sync user with backend on login/signin
  useEffect(() => {
    async function syncUser() {
      if (user) {
        try {
          const token = await getToken();
          await fetch("http://localhost:8000/api/users", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              id: user.id,
              email: user.emailAddresses[0]?.emailAddress,
              firstName: user.firstName,
              lastName: user.lastName,
            }),
          });
        } catch (err) {
          console.error("User sync failed:", err);
        }
      }
    }
    syncUser();
  }, [user, getToken]);

  // Fetch incidents from backend
  useEffect(() => {
    async function fetchIncidents() {
      try {
        const res = await fetch("http://localhost:8000/api/incidents/global");
        const data = await res.json();
        // Deduplicate by description + coords
        const seen = new Set();
        const deduped = data.filter(i => {
          const key = `${i.description}-${i.location?.lat || i.latitude}-${i.location?.lng || i.longitude}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setIncidents(
          deduped.map((i, idx) => ({
            id: i._id || idx,
            title: i.title || i.description,
            desc: i.description,
            coords: [i.location?.lat || i.latitude || 0, i.location?.lng || i.longitude || 0],
            severity: i.severity,
            status: i.status,
            location: i.location,
            type: i.type || i.eventtype || "Incident",
            country: i.country || (i.location?.country || ""),
            city: i.city || (i.location?.city || ""),
            state: i.state || "",
          }))
        );
      } catch (err) {
        console.error("Incident fetch failed:", err);
      }
    }
    fetchIncidents();
  }, []);

  // WebSocket for real-time updates
  useEffect(() => {
    const ws = new window.WebSocket("ws://localhost:8000/ws/incidents");
    ws.onmessage = (event) => {
      try {
        const newIncident = JSON.parse(event.data);
        setIncidents((prev) => {
          // Deduplicate
          const key = `${newIncident.description}-${newIncident.location?.lat || newIncident.latitude}-${newIncident.location?.lng || newIncident.longitude}`;
          if (prev.some(i => `${i.desc}-${i.coords[0]}-${i.coords[1]}` === key)) return prev;
          return [
            {
              id: newIncident._id || prev.length,
              title: newIncident.title || newIncident.description,
              desc: newIncident.description,
              coords: [newIncident.location?.lat || newIncident.latitude || 0, newIncident.location?.lng || newIncident.longitude || 0],
              severity: newIncident.severity,
              status: newIncident.status,
              location: newIncident.location,
              type: newIncident.type || newIncident.eventtype || "Incident",
              country: newIncident.country || (newIncident.location?.country || ""),
              city: newIncident.city || (newIncident.location?.city || ""),
              state: newIncident.state || "",
            },
            ...prev,
          ];
        });
      } catch (err) {
        console.error("WebSocket incident parse failed:", err);
      }
    };
    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
    };
    return () => ws.close();
  }, []);

  // Clock updater
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter local/global incidents
  const localIncidents = incidents.filter(i =>
    i.country?.toLowerCase() === "india"
  );
  const globalIncidents = incidents.filter(i => i.country?.toLowerCase() !== "india");

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      {/* 🌟 Custom Dashboard Navbar */}
      <DashboardNavbar />

      {/* Content */}
      <div className="flex flex-1 pt-20 px-4 gap-4 flex-col md:flex-row">
        {/* Left Panel */}
  <aside className="w-full md:w-72 bg-white/40 backdrop-blur-md shadow-lg rounded-xl p-4 overflow-y-auto max-h-[70vh]">
          <h3 className="font-semibold mb-3 text-gray-800">Local Incidents</h3>
          {localIncidents.map((i) => (
            <div
              key={i.id}
              onClick={() => setSelectedPosition(i.coords)}
              className={`p-3 mb-3 rounded-lg cursor-pointer shadow text-sm transition hover:scale-[1.02] ${
                i.severity === "critical"
                  ? "bg-red-100 border-l-4 border-red-500"
                  : i.severity === "moderate"
                  ? "bg-yellow-100 border-l-4 border-yellow-500"
                  : "bg-green-100 border-l-4 border-green-500"
              }`}
            >
              <div className="font-medium">{i.type}</div>
              <div className="text-gray-600">{i.desc}</div>
            </div>
          ))}
        </aside>

        {/* Map */}
        <main className="flex-1 relative rounded-xl overflow-hidden shadow-lg">
          <MapContainer
            center={[19.076, 72.8777]}
            zoom={6}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
            {incidents.map((i) => (
              <Marker key={i.id} position={i.coords}>
                <Popup>
                  <strong>{i.type}</strong>
                  <br />
                  {i.desc}
                </Popup>
              </Marker>
            ))}
            <FlyTo position={selectedPosition} />
          </MapContainer>

          {/* Bottom Bubble */}
          <div
            className="absolute bottom-4 left-1/2 -translate-x-1/2 px-6 py-2 
              bg-white/80 backdrop-blur-md rounded-full shadow-lg flex gap-3 text-sm font-medium"
          >
            <span>📍 {city}</span>
            <span className="text-gray-700">{time.toLocaleTimeString()}</span>
          </div>
        </main>

        {/* Right Panel */}
  <aside className="w-full md:w-72 bg-white/40 backdrop-blur-md shadow-lg rounded-xl p-4 overflow-y-auto max-h-[70vh]">
          <h3 className="font-semibold mb-3 text-gray-800">Global Incidents</h3>
          {globalIncidents.map((i) => (
            <div
              key={i.id}
              onClick={() => setSelectedPosition(i.coords)}
              className={`p-3 mb-3 rounded-lg cursor-pointer shadow text-sm transition hover:scale-[1.02] ${
                i.severity === "critical"
                  ? "bg-red-100 border-l-4 border-red-500"
                  : i.severity === "moderate"
                  ? "bg-yellow-100 border-l-4 border-yellow-500"
                  : "bg-green-100 border-l-4 border-green-500"
              }`}
            >
              <div className="font-medium">{i.type}</div>
              <div className="text-gray-600">{i.desc}</div>
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}

export default Dashboard;
