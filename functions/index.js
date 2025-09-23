const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(functions.config().gemini.key);

// Function to score report severity
exports.scoreReportWithAI = functions.https.onCall(async (data, context) => {
  const { reportId } = data;
  const reportSnap = await db.collection('reports').doc(reportId).get();

  if (!reportSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'Report not found');
  }

  const report = reportSnap.data();

  // Ask Gemini to analyze severity
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = `
  Analyze the following disaster report and give a severity score (0-100):
  Title: ${report.title}
  Description: ${report.description}
  `;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  // Extract numeric severity score from Gemini's response
  const match = text.match(/\d+/);
  const aiSeverity = match ? parseInt(match[0]) : 50;

  await db.collection('reports').doc(reportId).update({ aiSeverityScore: aiSeverity });
  return { aiSeverity };
});
