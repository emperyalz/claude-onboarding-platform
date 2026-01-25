'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  User,
  Mail,
  Lock,
  Save,
  Loader2,
  Shield,
  Database,
  FileText,
  ChevronRight,
  FolderOpen,
  Trash2,
  Edit3,
  X,
  Check,
} from 'lucide-react';

interface Session {
  _id: Id<'sessions'>;
  name: string;
  tabType: string;
  data: unknown;
  createdAt: number;
  updatedAt: number;
}

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const userEmail = session?.user?.email || '';

  const [name, setName] = useState(session?.user?.name || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Session management state
  const [editingSessionId, setEditingSessionId] = useState<Id<'sessions'> | null>(null);
  const [editingName, setEditingName] = useState('');
  const [sessionFilter, setSessionFilter] = useState<string>('all');

  // Convex queries
  const userData = useQuery(api.users.getUser, userEmail ? { email: userEmail } : 'skip');
  const preferences = useQuery(api.preferences.getPreferences, userEmail ? { email: userEmail } : 'skip');
  const memories = useQuery(api.memories.getMemories, userEmail ? { email: userEmail } : 'skip');
  const skills = useQuery(api.skills.getSkills, userEmail ? { email: userEmail } : 'skip');
  const projects = useQuery(api.projects.getProjects, userEmail ? { email: userEmail } : 'skip');
  const sessions = useQuery(api.sessions.getSessions, userEmail ? { email: userEmail } : 'skip') as Session[] | undefined;

  // Convex mutations
  const updateUser = useMutation(api.users.updateUser);
  const renameSession = useMutation(api.sessions.renameSession);
  const deleteSession = useMutation(api.sessions.deleteSession);

  const handleRenameSession = async (sessionId: Id<'sessions'>) => {
    if (!editingName.trim()) return;
    try {
      await renameSession({ sessionId, name: editingName.trim() });
      toast.success('Session renamed!');
      setEditingSessionId(null);
      setEditingName('');
    } catch (error) {
      console.error('Failed to rename session:', error);
      toast.error('Failed to rename session');
    }
  };

  const handleDeleteSession = async (sessionId: Id<'sessions'>, name: string) => {
    if (!confirm(`Delete session "${name}"? This cannot be undone.`)) return;
    try {
      await deleteSession({ sessionId });
      toast.success('Session deleted');
    } catch (error) {
      console.error('Failed to delete session:', error);
      toast.error('Failed to delete session');
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTabLabel = (tabType: string) => {
    const labels: Record<string, string> = {
      preferences: 'Personal Preferences',
      memory: 'Manage Memory',
      skills: 'Claude Skills',
      files: 'Memory Files',
      projects: 'Develop Projects',
    };
    return labels[tabType] || tabType;
  };

  const filteredSessions = sessions?.filter(s =>
    sessionFilter === 'all' || s.tabType === sessionFilter
  );

  const isGoogleUser = userData?.provider === 'google';

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsUpdatingProfile(true);
    try {
      await updateUser({ email: userEmail, name: name.trim() });
      await updateSession({ name: name.trim() });
      toast.success('Profile updated!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      // Note: In a real app, you'd verify the current password server-side
      const response = await fetch('/api/auth/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          currentPassword,
          newPassword,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update password');
      }

      toast.success('Password updated!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Failed to update password:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const stats = [
    {
      label: 'Questionnaire',
      value: preferences?.complete ? 'Complete' : 'In Progress',
      icon: FileText,
      href: '/dashboard',
    },
    {
      label: 'Memories',
      value: memories?.length || 0,
      icon: Database,
      href: '/responses',
    },
    {
      label: 'Custom Skills',
      value: skills?.filter((s: { isCustom: boolean }) => s.isCustom).length || 0,
      icon: Shield,
      href: '/responses',
    },
    {
      label: 'Projects',
      value: projects?.length || 0,
      icon: FileText,
      href: '/responses',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-claude-dark mb-8">Profile Settings</h1>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Main Settings */}
        <div className="md:col-span-2 space-y-6">
          {/* Profile Information */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-claude-orange" />
              Profile Information
            </h2>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">{userEmail}</span>
                  {isGoogleUser && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      Google Account
                    </span>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isUpdatingProfile || !name.trim()}
                className="btn-primary flex items-center gap-2"
              >
                {isUpdatingProfile ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Changes
              </button>
            </form>
          </div>

          {/* Password Change (only for credentials users) */}
          {!isGoogleUser && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5 text-claude-orange" />
                Change Password
              </h2>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="input-field"
                    placeholder="Enter current password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input-field"
                    placeholder="Enter new password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-field"
                    placeholder="Confirm new password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isUpdatingPassword || !currentPassword || !newPassword || !confirmPassword}
                  className="btn-primary flex items-center gap-2"
                >
                  {isUpdatingPassword ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                  Update Password
                </button>
              </form>
            </div>
          )}

          {isGoogleUser && (
            <div className="card bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Signed in with Google</p>
                  <p className="text-sm text-gray-600">
                    Password is managed through your Google account.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Session Management */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-claude-orange" />
              Saved Sessions
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Manage your saved progress across all tabs. Load any session to continue where you left off.
            </p>

            {/* Filter */}
            <div className="flex gap-2 mb-4 flex-wrap">
              <button
                onClick={() => setSessionFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-sm ${
                  sessionFilter === 'all'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All ({sessions?.length || 0})
              </button>
              {['preferences', 'memory', 'skills', 'files', 'projects'].map((tab) => {
                const count = sessions?.filter(s => s.tabType === tab).length || 0;
                if (count === 0) return null;
                return (
                  <button
                    key={tab}
                    onClick={() => setSessionFilter(tab)}
                    className={`px-3 py-1.5 rounded-lg text-sm ${
                      sessionFilter === tab
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {getTabLabel(tab)} ({count})
                  </button>
                );
              })}
            </div>

            {/* Sessions List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredSessions && filteredSessions.length > 0 ? (
                filteredSessions.map((session) => (
                  <div
                    key={session._id}
                    className="p-4 border rounded-lg hover:border-orange-300 transition-colors"
                  >
                    {editingSessionId === session._id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleRenameSession(session._id)}
                          className="flex-1 px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-orange-600"
                          autoFocus
                        />
                        <button
                          onClick={() => handleRenameSession(session._id)}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingSessionId(null);
                            setEditingName('');
                          }}
                          className="p-1.5 text-gray-400 hover:bg-gray-100 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{session.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                              {getTabLabel(session.tabType)}
                            </span>
                            <span className="text-xs text-gray-500">
                              Updated {formatDate(session.updatedAt)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Link
                            href="/dashboard"
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded"
                            title="Go to Dashboard"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => {
                              setEditingSessionId(session._id);
                              setEditingName(session.name);
                            }}
                            className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded"
                            title="Rename"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSession(session._id, session.name)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FolderOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No saved sessions yet</p>
                  <p className="text-sm mt-1">
                    Use the "Save Progress" button on any tab to save your work.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Stats */}
        <div className="space-y-4">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Your Data</h2>
            <div className="space-y-3">
              {stats.map((stat, index) => (
                <Link
                  key={index}
                  href={stat.href}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <stat.icon className="w-5 h-5 text-claude-orange" />
                    <span className="text-gray-700">{stat.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-claude-dark">{stat.value}</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <Link href="/responses" className="btn-secondary w-full text-center">
            View All Saved Data
          </Link>
        </div>
      </div>
    </div>
  );
}
