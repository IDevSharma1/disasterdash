import React, { useEffect, useState } from 'react'

export default function FooterBar(){
  const [now, setNow] = useState(new Date())
  useEffect(()=>{
    const t = setInterval(()=> setNow(new Date()), 1000)
    return ()=> clearInterval(t)
  },[])

  return (
    <footer className="p-4 border-t flex justify-between items-center">
      <div>Live: {now.toLocaleTimeString()}</div>
      <div>Place: Unknown</div>
      <div>AI last update: — <button className="ml-2 px-2 py-1 border rounded">Refresh</button></div>
    </footer>
  )
}