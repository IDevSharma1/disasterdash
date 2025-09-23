
export default function IncidentList({ incidents }) {
  return (
    <div className="space-y-3">
      {incidents.map((incident, idx) => (
        <div
          key={idx}
          className={`rounded-lg p-3 shadow-md border-l-4 ${
            incident.severity === "critical"
              ? "border-red-500 bg-red-50"
              : incident.severity === "moderate"
              ? "border-yellow-500 bg-yellow-50"
              : "border-gray-400 bg-gray-50"
          }`}
        >
          <h3 className="font-bold">{incident.description}</h3>
          <p className="text-sm text-gray-600">{incident.city} {incident.country ? `(${incident.country})` : ""}</p>
          <p className="text-xs text-gray-500">
            Type: {incident.type || "Earthquake"} | Severity: {incident.severity}
            {incident.magnitude !== undefined && ` | Magnitude: ${incident.magnitude}`}
          </p>
          <p className="text-xs text-gray-400">
            {incident.latitude}, {incident.longitude} • {incident.time ? new Date(incident.time).toLocaleString() : incident.date ? new Date(incident.date).toLocaleString() : ""}
          </p>
        </div>
      ))}
    </div>
  );
}
