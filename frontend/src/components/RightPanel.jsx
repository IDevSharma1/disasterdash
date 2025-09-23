import React from 'react'

export default function RightPanel({ reports = [], onClick = ()=>{} }){
  const global = reports.slice(0,10)
  return (
    <div>
      <h3 className="font-semibold mb-2">Global Incidents</h3>
      <ul>
        {global.map(r=> (
          <li key={r.id} className="p-2 border rounded mb-2 cursor-pointer" onClick={()=>onClick(r)}>
            <div>
              <strong>{r.title}</strong>
              <div className="text-sm">{r.status}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}