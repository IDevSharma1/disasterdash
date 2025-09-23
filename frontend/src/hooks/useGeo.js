import { useState, useEffect } from 'react'

export default function useGeo(){
  const [pos, setPos] = useState(null)
  useEffect(()=>{
    if(!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(p=>{ setPos({ lat: p.coords.latitude, lng: p.coords.longitude }) }, ()=>{ setPos(null) })
  },[])
  return pos
}