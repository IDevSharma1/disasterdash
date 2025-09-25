// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Home, Briefcase, GraduationCap, Utensils } from "lucide-react";
import { useUser, useAuth, UserButton } from "@clerk/clerk-react";
import ReportForm from "../components/ReportForm";

// 🌟 Navbar
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

// Helper to fly to selected marker
function FlyTo({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 10, { animate: true, duration: 1.5 });
    }
  }, [position, map]);
  return null;
}

function Dashboard() {
  const [showReportForm, setShowReportForm] = useState(false);
  const [time, setTime] = useState(new Date());
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const { user } = useUser();
  const { getToken } = useAuth();

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync user
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

  // Fetch incidents
  useEffect(() => {
    async function fetchIncidents() {
      try {
        const res = await fetch("http://localhost:8000/api/incidents/global");
        const data = await res.json();
        const seen = new Set();
        const deduped = data.filter((i) => {
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

  // WebSocket updates
  useEffect(() => {
    const ws = new window.WebSocket("ws://localhost:8000/ws/incidents");
    ws.onmessage = (event) => {
      try {
        const newIncident = JSON.parse(event.data);
        setIncidents((prev) => {
          const key = `${newIncident.description}-${newIncident.location?.lat || newIncident.latitude}-${newIncident.location?.lng || newIncident.longitude}`;
          if (prev.some((i) => `${i.desc}-${i.coords[0]}-${i.coords[1]}` === key)) return prev;
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
        console.error("WebSocket parse failed:", err);
      }
    };
    return () => ws.close();
  }, []);

  return (
    <div className="h-screen w-screen relative overflow-hidden">
      {/* 🌟 Navbar */}
      <DashboardNavbar />

      {/* 🌍 Fullscreen Map Background (Realistic) */}
      <div className="absolute inset-0 z-0">
        <MapContainer center={[23.5937, 80.9629]} zoom={4} style={{ height: "100%", width: "100%" }}>
          {/* Esri World Imagery Satellite Layer for realism */}
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
          />
          {/* Optionally overlay roads/labels for hybrid look */}
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
            opacity={0.4}
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
      </div>

      {/* 📌 Left Sticky Panel */}
      <aside className="absolute top-20 left-4 w-72 bg-white/30 backdrop-blur-md shadow-lg rounded-2xl p-4 z-40">
        <input
          type="text"
          placeholder="Search saved places"
          className="w-full px-3 py-2 mb-4 rounded-lg bg-white/50 text-sm focus:outline-none"
        />

        <div className="space-y-3 text-gray-700">
          <div className="flex items-center gap-3">
            <Home className="text-blue-600" />
            <div>
              <div className="font-semibold">Home</div>
              <div className="text-xs">123 Main St, San Francisco</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Briefcase className="text-blue-600" />
            <div>
              <div className="font-semibold">Work</div>
              <div className="text-xs">456 Oak Ave, San Francisco</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <GraduationCap className="text-blue-600" />
            <div>
              <div className="font-semibold">University</div>
              <div className="text-xs">789 Pine Rd, Berkeley</div>
            </div>
          </div>
        </div>

        {/* Report Incident */}
        <button
          className="mt-6 w-full bg-blue-600 text-white font-medium py-2 rounded-lg shadow hover:bg-blue-700 transition"
          onClick={() => setShowReportForm(true)}
        >
          Report Incident
        </button>
      </aside>
      {/* Report Form Modal */}
      {showReportForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-lg w-full relative">
            <button
              className="absolute top-2 right-3 text-gray-400 hover:text-gray-700 text-2xl"
              onClick={() => setShowReportForm(false)}
            >
              &times;
            </button>
            <ReportForm user={user} />
          </div>
        </div>
      )}

      {/* 📌 Right Sticky Panel */}
      <aside className="absolute top-20 right-4 w-72 bg-white/30 backdrop-blur-md shadow-lg rounded-2xl p-4 z-40">
        <h3 className="font-semibold mb-4">Explore</h3>
        <input
          type="text"
          placeholder="Search the map"
          className="w-full px-3 py-2 mb-4 rounded-lg bg-white/50 text-sm focus:outline-none"
        />

        {/* <div className="flex items-center gap-3 text-gray-700 mb-3">
          <Utensils className="text-blue-600" />
          <span>Restaurants</span>
        </div> */}

        {/* 🔴 Live Incidents */}
        <h4 className="font-semibold mt-4 mb-2">Live Incidents</h4>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {incidents.map((i) => (
            <div
              key={i.id}
              onClick={() => setSelectedPosition(i.coords)}
              className={`p-2 rounded-lg cursor-pointer text-sm shadow transition hover:scale-[1.02] ${
                i.severity === "critical"
                  ? "bg-red-100 border-l-4 border-red-500"
                  : i.severity === "moderate"
                  ? "bg-yellow-100 border-l-4 border-yellow-500"
                  : "bg-green-100 border-l-4 border-green-500"
              }`}
            >
              <div className="font-medium">{i.type}</div>
              <div className="text-gray-600 text-xs">{i.desc}</div>
            </div>
          ))}
        </div>
      </aside>

      {/* ⏰ Bottom Clock */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-white/70 backdrop-blur-md rounded-full shadow text-sm font-medium z-50">
        {time.toLocaleTimeString()}
      </div>
    </div>
  );
}

export default Dashboard;
