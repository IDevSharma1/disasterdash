import React from 'react'
import ReportForm from '../components/ReportForm'
import { useUser } from '@clerk/clerk-react'

export default function Report(){
  const { user } = useUser ? useUser() : { user: null }
  return (
    <div className="p-6">
      <h2 className="text-xl mb-4">Report an Issue</h2>
      <ReportForm user={user} />
    </div>
  )
}