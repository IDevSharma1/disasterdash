import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';

export default function Admin() {
  const [reports, setReports] = useState([]);
  const { getToken } = useAuth();

  useEffect(() => {
    async function fetchReports() {
      try {
        const token = await getToken();
        const res = await fetch('http://localhost:8000/api/admin/incidents', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setReports(data);
      } catch (err) {
        console.error('Failed to fetch reports:', err);
      }
    }
    fetchReports();
  }, [getToken]);

  async function validate(id) {
    try {
      const token = await getToken();
      await fetch(`http://localhost:8000/api/admin/incidents/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'validated' })
      });
      setReports((prev) => prev.map(r => r._id === id ? { ...r, status: 'validated' } : r));
    } catch (err) {
      console.error('Failed to validate report:', err);
    }
  }

  async function remove(id) {
    try {
      const token = await getToken();
      await fetch(`http://localhost:8000/api/admin/incidents/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setReports((prev) => prev.filter(r => r._id !== id));
    } catch (err) {
      console.error('Failed to delete report:', err);
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-xl mb-4">Admin Panel</h2>
      <ul>
        {reports.map(r => (
          <li key={r._id || r.id} className="p-2 border rounded mb-2">
            <div className="flex justify-between">
              <div>
                <strong>{r.title || r.description}</strong>
                <p>{r.description}</p>
                <div className="text-xs text-gray-500">Status: {r.status}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => validate(r._id || r.id)} className="px-3 py-1 bg-green-500 text-white rounded">Validate</button>
                <button onClick={() => remove(r._id || r.id)} className="px-3 py-1 bg-red-500 text-white rounded">Delete</button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}