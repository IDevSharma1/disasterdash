
import React, { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebaseClient';

export default function ReportForm({ user, onIncidentAdded }) {
  const [incidentName, setIncidentName] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('India');
  const [severity, setSeverity] = useState('normal');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  async function getCoordinates(city, state, country) {
    const query = `${city},${state},${country}`;
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      }
    } catch (err) {}
    return { lat: 0, lng: 0 };
  }

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    let fileUrl = null;
    if (file) {
      const stRef = ref(storage, `reports/${Date.now()}_${file.name}`);
      await uploadBytes(stRef, file);
      fileUrl = await getDownloadURL(stRef);
    }
    const coords = await getCoordinates(city, state, country);
    const incident = {
      id: undefined, // will be set after addDoc
      title: incidentName,
      description,
      location: { lat: coords.lat, lng: coords.lng, city, state, country },
      severity,
      status: 'pending',
      image: fileUrl,
      reporterId: user?.id || 'anonymous',
    };
    const docRef = await addDoc(collection(db, 'reports'), {
      ...incident,
      aiSeverityScore: null,
      createdAt: serverTimestamp(),
    });
    incident.id = docRef.id;
    setIncidentName(''); setDescription(''); setCity(''); setState(''); setCountry('India'); setSeverity('normal'); setFile(null); setLoading(false);
    window.alert(`Incident added! ID: ${docRef.id}`);
    if (onIncidentAdded) onIncidentAdded(incident);
  }

  return (
    <form
      onSubmit={submit}
      className="max-w-xl glassmorphism p-6 rounded-2xl shadow-xl"
      style={{
        background: 'rgba(255,255,255,0.25)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.18)',
      }}
    >
      <h2 className="text-xl font-bold mb-4">Report Incident</h2>
      <input
        className="w-full p-2 rounded mb-2 bg-white/60 border border-gray-300"
        placeholder="Incident Name"
        value={incidentName}
        onChange={e => setIncidentName(e.target.value)}
        required
      />
      <textarea
        className="w-full p-2 rounded mb-2 bg-white/60 border border-gray-300"
        placeholder="Description"
        value={description}
        onChange={e => setDescription(e.target.value)}
        required
      />
      <div className="flex gap-2 mb-2">
        <input
          className="flex-1 p-2 rounded bg-white/60 border border-gray-300"
          placeholder="City"
          value={city}
          onChange={e => setCity(e.target.value)}
          required
        />
        <input
          className="flex-1 p-2 rounded bg-white/60 border border-gray-300"
          placeholder="State"
          value={state}
          onChange={e => setState(e.target.value)}
          required
        />
        <input
          className="flex-1 p-2 rounded bg-white/60 border border-gray-300"
          placeholder="Country"
          value={country}
          onChange={e => setCountry(e.target.value)}
          required
        />
      </div>
      <select
        className="w-full p-2 rounded mb-2 bg-white/60 border border-gray-300"
        value={severity}
        onChange={e => setSeverity(e.target.value)}
        required
      >
        <option value="critical">Critical</option>
        <option value="moderate">Moderate</option>
        <option value="normal">Normal</option>
      </select>
      <input type="file" onChange={e => setFile(e.target.files[0])} className="mb-2" />
      <button
        className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition"
        type="submit"
        disabled={loading}
      >
        {loading ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
}