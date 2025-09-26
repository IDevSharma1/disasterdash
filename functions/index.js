const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Clerk JWT middleware stub (replace with real validation)
function verifyClerkJWT(req, res, next) {
  // TODO: Validate Clerk JWT from req.headers.authorization
  next();
}

// Incident CRUD endpoints
exports.createIncident = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  // verifyClerkJWT(req, res, () => {}); // Uncomment for real auth
  const data = req.body;
  const docRef = await db.collection('incidents').add(data);
  res.json({ id: docRef.id });
});

exports.getIncidents = functions.https.onRequest(async (req, res) => {
  const snapshot = await db.collection('incidents').get();
  const incidents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  res.json(incidents);
});

exports.updateIncident = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'PUT') return res.status(405).send('Method Not Allowed');
  const { id, ...data } = req.body;
  await db.collection('incidents').doc(id).update(data);
  res.json({ success: true });
});

exports.deleteIncident = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'DELETE') return res.status(405).send('Method Not Allowed');
  const { id } = req.body;
  await db.collection('incidents').doc(id).delete();
  res.json({ success: true });
});

// Real-time update stub (Firebase handles real-time via Firestore listeners)
// For WebSocket, use a separate server or Firebase Realtime Database triggers

// External data fetch (USGS example)
exports.fetchUSGSIncidents = functions.pubsub.schedule('every 1 hours').onRun(async (context) => {
  const url = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson';
  const resp = await axios.get(url);
  const features = resp.data.features || [];
  for (const f of features) {
    const incident = {
      title: f.properties.title,
      description: f.properties.place,
      severity: f.properties.mag,
      location: {
        lat: f.geometry.coordinates[1],
        lng: f.geometry.coordinates[0],
        country: '',
        city: '',
        state: '',
      },
      type: 'Earthquake',
      status: 'live',
      timestamp: f.properties.time,
    };
    // Deduplicate by title+location
    const existing = await db.collection('incidents').where('title', '==', incident.title).where('location.lat', '==', incident.location.lat).get();
    if (existing.empty) {
      await db.collection('incidents').add(incident);
    }
  }
  return null;
});

// Function to score report severity (Gemini)
exports.scoreReportWithAI = functions.https.onCall(async (data, context) => {
  const { reportId } = data;
  const reportSnap = await db.collection('reports').doc(reportId).get();
  if (!reportSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'Report not found');
  }
  const report = reportSnap.data();
  // Ask Gemini to analyze severity
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = `\n  Analyze the following disaster report and give a severity score (0-100):\n  Title: ${report.title}\n  Description: ${report.description}\n  `;
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  // Extract numeric severity score from Gemini's response
  const match = text.match(/\d+/);
  const aiSeverity = match ? parseInt(match[0]) : 50;
  await db.collection('reports').doc(reportId).update({ aiSeverityScore: aiSeverity });
  return { aiSeverity };
});
