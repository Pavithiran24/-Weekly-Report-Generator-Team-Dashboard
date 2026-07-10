import React from 'react'
import AppLayout from '../components/Layout/AppLayout'
import Card from '../components/ui/Card'
import { useAuth } from '../context/AuthContext'
import { UserCircle2, Mail, ShieldCheck } from 'lucide-react'

export default function Profile() {
  const { user } = useAuth()

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Profile</h1>
        <p className="text-gray-400">Manage your account details and role information.</p>
      </div>

      <Card className="max-w-2xl">
        <div className="flex items-center gap-4 border-b border-white/10 pb-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-xl font-semibold text-white">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">{user?.name}</h2>
            <p className="text-sm text-gray-400">{user?.role?.toUpperCase()}</p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
            <Mail className="text-blue-400" />
            <div>
              <p className="text-sm text-gray-400">Email</p>
              <p className="text-white">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
            <ShieldCheck className="text-purple-400" />
            <div>
              <p className="text-sm text-gray-400">Access Role</p>
              <p className="text-white capitalize">{user?.role}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
            <UserCircle2 className="text-green-400" />
            <div>
              <p className="text-sm text-gray-400">Account Status</p>
              <p className="text-white">Active</p>
            </div>
          </div>
        </div>
      </Card>
    </AppLayout>
  )
}
