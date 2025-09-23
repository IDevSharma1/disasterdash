export default {
  local: [
    {
      title: "Flood in Mumbai",
      severity: "Critical",
      location: "Mumbai, India",
      timestamp: Date.now() - 1000 * 60 * 10,
    },
    {
      title: "Heatwave Alert",
      severity: "Moderate",
      location: "Maharashtra, India",
      timestamp: Date.now() - 1000 * 60 * 30,
    },
    {
      title: "Heatwave Alert",
      severity: "Moderate",
      location: "Akola, Maharashtra",
      timestamp: Date.now() - 1000 * 60 * 20,
    },
  ],
  global: [
    {
      title: "Earthquake in Japan",
      severity: "Critical",
      location: "Tokyo, Japan",
      timestamp: Date.now() - 1000 * 60 * 50,
    },
    {
      title: "Wildfire in California",
      severity: "Moderate",
      location: "Los Angeles, USA",
      timestamp: Date.now() - 1000 * 60 * 90,
    },
  ],
};
