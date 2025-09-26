// ...existing code...
// src/pages/Dashboard.jsx
import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Home, Briefcase, GraduationCap, Utensils } from "lucide-react";
import { useUser, useAuth, UserButton } from "@clerk/clerk-react";
import DashboardNavbar from "../components/Navbar";
import ReportForm from "../components/ReportForm";
import axios from "axios";

function Dashboard() {
  // ...existing state and handlers...

  // Fetch Indian incidents from Sachet backend
  useEffect(() => {
    async function fetchIndiaIncidents() {
      try {
        const res = await axios.get("http://localhost:8000/incidents/india");
        if (res.data && Array.isArray(res.data.incidents)) {
          setIncidents(prev => {
            // Avoid duplicates by title+timestamp
            const existingKeys = new Set(prev.map(i => `${i.title}-${i.timestamp || ''}`));
            const newIncidents = res.data.incidents.filter(i => !existingKeys.has(`${i.title}-${i.timestamp || ''}`)).map(i => ({
              id: `india-${i.title}-${i.timestamp}`,
              title: i.title,
              desc: i.description,
              coords: [i.location?.lat || 22, i.location?.lng || 78],
              severity: "moderate",
              status: "live",
              location: {},
              type: "India Alert",
              country: "India",
              city: "",
              state: "",
              timestamp: i.timestamp || i.published,
            }));
            return [...newIncidents, ...prev];
          });
        }
      } catch (err) {
        // Ignore fetch errors for now
      }
    }
    fetchIndiaIncidents();
  }, []);

  // ...rest of Dashboard component code...
}

// src/pages/Dashboard.jsx
import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Home, Briefcase, GraduationCap, Utensils } from "lucide-react";
import { useUser, useAuth, UserButton } from "@clerk/clerk-react";
import DashboardNavbar from "../components/Navbar";
import ReportForm from "../components/ReportForm";

function Dashboard() {
  // Add incident to list after report
  function handleIncidentAdded(newIncident) {
    setIncidents((prev) => [
      {
        id: newIncident.id || prev.length,
        title: newIncident.title,
        desc: newIncident.description,
        coords: [newIncident.location.lat, newIncident.location.lng],
        severity: newIncident.severity,
        status: newIncident.status || 'pending',
        location: newIncident.location,
        type: newIncident.type || 'Incident',
        country: newIncident.location.country || '',
        city: newIncident.location.city || '',
        state: newIncident.location.state || '',
      },
      ...prev,
    ]);
  }

  // Custom marker icons for severity
  const markerIcons = {
    critical: L.icon({
      iconUrl:
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      shadowSize: [41, 41],
    }),
    moderate: L.icon({
      iconUrl:
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      shadowSize: [41, 41],
    }),
    normal: L.icon({
      iconUrl:
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-white.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      shadowSize: [41, 41],
    }),
  };

  // Gemini stub: fetch images/videos for incident
  async function fetchGeminiMedia(incident) {
    // Replace with Gemini API call for real implementation
    // For now, return static demo assets
    return {
      images: [
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80",
        "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80",
      ],
      videos: [
        "https://www.w3schools.com/html/mov_bbb.mp4"
      ]
    };
  }

  const [incidents, setIncidents] = useState([]);
  const [activeIncident, setActiveIncident] = useState(null);
  const [media, setMedia] = useState({ images: [], videos: [] });
  const [showReportForm, setShowReportForm] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [time, setTime] = useState(new Date());
  const { user } = useUser();

  // When activeIncident changes, fetch media
  useEffect(() => {
    if (activeIncident) {
      fetchGeminiMedia(activeIncident).then(setMedia);
    } else {
      setMedia({ images: [], videos: [] });
    }
  }, [activeIncident]);

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // WebSocket for live incidents
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
            <Marker
              key={i.id}
              position={i.coords}
              icon={markerIcons[i.severity?.toLowerCase() || "normal"]}
              eventHandlers={{
                click: () => setActiveIncident(i),
                mouseover: () => setActiveIncident(i),
              }}
            />
          ))}
          <FlyTo position={selectedPosition} />
        </MapContainer>
        {/* Incident Details Popup */}
        {activeIncident && (
          <div
            className="fixed top-1/2 left-1/2 z-50 bg-white/90 rounded-2xl shadow-xl p-6 min-w-[340px] max-w-[90vw]"
            style={{ transform: "translate(-50%, -50%)", backdropFilter: "blur(12px)" }}
          >
            <button
              className="absolute top-2 right-3 text-gray-400 hover:text-gray-700 text-2xl"
              onClick={() => setActiveIncident(null)}
            >
              &times;
            </button>
            <h2 className="text-xl font-bold mb-2">{activeIncident.title || activeIncident.type}</h2>
            <div className="mb-2 text-gray-700">{activeIncident.desc}</div>
            <div className="mb-2 text-sm text-gray-600">
              <strong>Location:</strong> {activeIncident.city}, {activeIncident.state}, {activeIncident.country}
            </div>
            <div className="mb-2 text-sm text-gray-600">
              <strong>Severity:</strong> {activeIncident.severity}
            </div>
            <div className="mb-2 text-sm text-gray-600">
              <strong>Deaths:</strong> {activeIncident.deaths || "Unknown"} <br />
              <strong>Loss Worth:</strong> {activeIncident.lossWorth ? `₹${activeIncident.lossWorth}` : "Unknown"}
            </div>
            <div className="mb-2">
              <strong>Images:</strong>
              <div className="flex gap-2 mt-1">
                {media.images.map((img, idx) => (
                  <img key={idx} src={img} alt="Incident" className="w-24 h-16 object-cover rounded shadow" />
                ))}
              </div>
            </div>
            <div className="mb-2">
              <strong>Videos:</strong>
              <div className="flex gap-2 mt-1">
                {media.videos.map((vid, idx) => (
                  <video key={idx} src={vid} controls className="w-32 h-20 rounded shadow" />
                ))}
              </div>
            </div>
          </div>
        )}
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
            <ReportForm user={user} onIncidentAdded={handleIncidentAdded} />
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
