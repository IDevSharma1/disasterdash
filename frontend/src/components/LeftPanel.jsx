import React from 'react'

export default function LeftPanel({ reports = [], onClick = ()=>{} }){
  const local = reports.slice(0,10)
  return (
    <div>
      <h3 className="font-semibold mb-2">Local Incidents</h3>
      <ul>
        {local.map(r=> (
          <li key={r.id} className="p-2 border rounded mb-2 cursor-pointer" onClick={()=>onClick(r)}>
            <div className="flex justify-between">
              <div>
                <strong>{r.title}</strong>
                <div className="text-sm">{r.severity || 'unknown'}</div>
              </div>
              <div className="text-xs">{r.location?.lat?.toFixed ? r.location.lat.toFixed(2) : ''}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}