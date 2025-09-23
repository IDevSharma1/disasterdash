import React, { useState } from 'react'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../lib/firebaseClient'

export default function ReportForm({ user }){
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState(null)

  async function submit(e){
    e.preventDefault()
    let fileUrl = null
    if(file){
      const stRef = ref(storage, `reports/${Date.now()}_${file.name}`)
      await uploadBytes(stRef, file)
      fileUrl = await getDownloadURL(stRef)
    }

    await addDoc(collection(db, 'reports'), {
      reporterId: user?.id || 'anonymous',
      title,
      description,
      location: { lat: 20.7, lng: 77.0 },
      severity: 'pending',
      aiSeverityScore: null,
      status: 'pending',
      image: fileUrl,
      createdAt: serverTimestamp()
    })
    setTitle(''); setDescription(''); setFile(null)
    alert('Report submitted')
  }

  return (
    <form onSubmit={submit} className="max-w-xl">
      <input className="w-full p-2 border rounded mb-2" placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} />
      <textarea className="w-full p-2 border rounded mb-2" placeholder="Description" value={description} onChange={e=>setDescription(e.target.value)} />
      <input type="file" onChange={e=>setFile(e.target.files[0])} className="mb-2" />
      <button className="px-4 py-2 bg-blue-600 text-white rounded" type="submit">Submit</button>
    </form>
  )
}