'use client';

import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Id } from '../convex/_generated/dataModel';
import toast from 'react-hot-toast';
import {
  Save,
  FolderOpen,
  Trash2,
  Edit3,
  Copy,
  ChevronDown,
  Plus,
  X,
  Check,
  Loader2,
} from 'lucide-react';

interface Session {
  _id: Id<'sessions'>;
  name: string;
  tabType: string;
  data: unknown;
  createdAt: number;
  updatedAt: number;
}

interface SessionSelectorProps {
  userEmail: string;
  tabType: string;
  currentData: unknown;
  onLoadSession: (data: unknown) => void;
  tabLabel?: string;
  currentSessionId?: Id<'sessions'> | null;
  onSessionChange?: (sessionId: Id<'sessions'> | null) => void;
}

export default function SessionSelector({
  userEmail,
  tabType,
  currentData,
  onLoadSession,
  tabLabel = 'session',
  currentSessionId,
  onSessionChange,
}: SessionSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showSaveAsModal, setShowSaveAsModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [editingSessionId, setEditingSessionId] = useState<Id<'sessions'> | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveDropdown, setShowSaveDropdown] = useState(false);

  // Convex queries and mutations
  const sessions = useQuery(
    api.sessions.getSessionsByTab,
    userEmail ? { email: userEmail, tabType } : 'skip'
  ) as Session[] | undefined;

  const createSession = useMutation(api.sessions.createSession);
  const updateSession = useMutation(api.sessions.updateSession);
  const renameSession = useMutation(api.sessions.renameSession);
  const deleteSession = useMutation(api.sessions.deleteSession);
  const duplicateSession = useMutation(api.sessions.duplicateSession);

  // Get current session details if we have a currentSessionId
  const currentSession = currentSessionId
    ? sessions?.find(s => s._id === currentSessionId)
    : null;

  const handleSaveNew = async () => {
    if (!newSessionName.trim()) {
      toast.error('Please enter a session name');
      return;
    }
    setIsSaving(true);
    try {
      const newId = await createSession({
        email: userEmail,
        name: newSessionName.trim(),
        tabType,
        data: currentData,
      });
      toast.success(`Session "${newSessionName}" saved!`);
      setNewSessionName('');
      setShowSaveModal(false);
      setShowSaveAsModal(false);
      // Track the new session as current
      if (onSessionChange && newId) {
        onSessionChange(newId as Id<'sessions'>);
      }
    } catch (error) {
      console.error('Failed to save session:', error);
      toast.error('Failed to save session');
    } finally {
      setIsSaving(false);
    }
  };

  // Save Progress - autosave to current session or prompt for new
  const handleSaveProgress = async () => {
    if (currentSessionId) {
      // Autosave to current session
      setIsSaving(true);
      try {
        await updateSession({
          sessionId: currentSessionId,
          data: currentData,
        });
        toast.success(`Progress saved to "${currentSession?.name || 'session'}"!`);
      } catch (error) {
        console.error('Failed to save progress:', error);
        toast.error('Failed to save progress');
      } finally {
        setIsSaving(false);
      }
    } else {
      // No current session, prompt for new
      setShowSaveModal(true);
    }
    setShowSaveDropdown(false);
  };

  const handleLoadSession = (session: Session) => {
    onLoadSession(session.data);
    toast.success(`Loaded "${session.name}"`);
    setIsOpen(false);
    // Track this as the current session
    if (onSessionChange) {
      onSessionChange(session._id);
    }
  };

  const handleUpdateCurrent = async (sessionId: Id<'sessions'>) => {
    try {
      await updateSession({
        sessionId,
        data: currentData,
      });
      toast.success('Session updated!');
    } catch (error) {
      console.error('Failed to update session:', error);
      toast.error('Failed to update session');
    }
  };

  const handleRename = async (sessionId: Id<'sessions'>) => {
    if (!editingName.trim()) return;
    try {
      await renameSession({
        sessionId,
        name: editingName.trim(),
      });
      toast.success('Session renamed!');
      setEditingSessionId(null);
      setEditingName('');
    } catch (error) {
      console.error('Failed to rename session:', error);
      toast.error('Failed to rename session');
    }
  };

  const handleDelete = async (sessionId: Id<'sessions'>, name: string) => {
    if (!confirm(`Delete session "${name}"? This cannot be undone.`)) return;
    try {
      await deleteSession({ sessionId });
      toast.success('Session deleted');
    } catch (error) {
      console.error('Failed to delete session:', error);
      toast.error('Failed to delete session');
    }
  };

  const handleDuplicate = async (sessionId: Id<'sessions'>, originalName: string) => {
    try {
      await duplicateSession({
        sessionId,
        newName: `${originalName} (Copy)`,
      });
      toast.success('Session duplicated!');
    } catch (error) {
      console.error('Failed to duplicate session:', error);
      toast.error('Failed to duplicate session');
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="relative">
      {/* Main Button Group */}
      <div className="flex items-center gap-2">
        {/* Save Button with Dropdown */}
        <div className="relative">
          <div className="flex">
            {/* Main Save Button */}
            <button
              onClick={handleSaveProgress}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-l-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">
                {currentSession ? `Save to "${currentSession.name}"` : 'Save Progress'}
              </span>
              <span className="sm:hidden">Save</span>
            </button>
            {/* Dropdown Toggle */}
            <button
              onClick={() => setShowSaveDropdown(!showSaveDropdown)}
              className="px-2 py-2 bg-orange-600 text-white rounded-r-lg hover:bg-orange-700 transition-colors border-l border-orange-500"
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${showSaveDropdown ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Save Dropdown Menu */}
          {showSaveDropdown && (
            <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border z-50">
              <button
                onClick={handleSaveProgress}
                disabled={isSaving}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b"
              >
                <Save className="w-4 h-4 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">Save Progress</p>
                  <p className="text-xs text-gray-500">
                    {currentSession
                      ? `Overwrite "${currentSession.name}"`
                      : 'Save to a new session'}
                  </p>
                </div>
              </button>
              <button
                onClick={() => {
                  setShowSaveDropdown(false);
                  setShowSaveAsModal(true);
                }}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3"
              >
                <Plus className="w-4 h-4 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">Save New/As</p>
                  <p className="text-xs text-gray-500">Save as a new named session</p>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Sessions Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FolderOpen className="w-4 h-4 text-gray-600" />
            <span className="text-gray-700">
              {sessions?.length || 0} Saved {tabLabel}s
            </span>
            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {isOpen && (
            <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
              <div className="p-3 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Saved Sessions</h3>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      setShowManageModal(true);
                    }}
                    className="text-xs text-orange-600 hover:text-orange-700"
                  >
                    Manage All
                  </button>
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto">
                {sessions && sessions.length > 0 ? (
                  sessions.map((session) => (
                    <div
                      key={session._id}
                      className="p-3 hover:bg-gray-50 border-b last:border-b-0 cursor-pointer"
                      onClick={() => handleLoadSession(session)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{session.name}</p>
                          <p className="text-xs text-gray-500">
                            Updated {formatDate(session.updatedAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateCurrent(session._id);
                            }}
                            className="p-1 text-gray-400 hover:text-orange-600"
                            title="Save current progress to this session"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    <FolderOpen className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No saved sessions yet</p>
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        setShowSaveModal(true);
                      }}
                      className="mt-2 text-sm text-orange-600 hover:text-orange-700"
                    >
                      Save your first session
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Save Session</h3>
              <button
                onClick={() => setShowSaveModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Save your current progress so you can return to it later.
            </p>
            <input
              type="text"
              placeholder="Enter session name (e.g., 'Work Profile Draft')"
              value={newSessionName}
              onChange={(e) => setNewSessionName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveNew()}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-orange-600 focus:border-orange-600"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={handleSaveNew}
                disabled={isSaving || !newSessionName.trim()}
                className="flex-1 px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Session
              </button>
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Sessions Modal */}
      {showManageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Manage Sessions</h3>
              <button
                onClick={() => setShowManageModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {sessions && sessions.length > 0 ? (
                <div className="space-y-2">
                  {sessions.map((session) => (
                    <div
                      key={session._id}
                      className="p-4 border rounded-lg hover:border-orange-300"
                    >
                      {editingSessionId === session._id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleRename(session._id)}
                            className="flex-1 px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-orange-600"
                            autoFocus
                          />
                          <button
                            onClick={() => handleRename(session._id)}
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
                          <div
                            className="flex-1 cursor-pointer"
                            onClick={() => {
                              handleLoadSession(session);
                              setShowManageModal(false);
                            }}
                          >
                            <p className="font-medium text-gray-900">{session.name}</p>
                            <p className="text-xs text-gray-500">
                              Created {formatDate(session.createdAt)} | Updated{' '}
                              {formatDate(session.updatedAt)}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
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
                              onClick={() => handleDuplicate(session._id, session.name)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                              title="Duplicate"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(session._id, session.name)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FolderOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No saved sessions for this tab</p>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t">
              <button
                onClick={() => {
                  setShowManageModal(false);
                  setShowSaveModal(true);
                }}
                className="w-full px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Save New Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save As Modal */}
      {showSaveAsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Save As New Session</h3>
              <button
                onClick={() => setShowSaveAsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Save your current progress as a new named session.
            </p>
            <input
              type="text"
              placeholder="Enter session name (e.g., 'Work Profile Draft')"
              value={newSessionName}
              onChange={(e) => setNewSessionName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveNew()}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-orange-600 focus:border-orange-600"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={handleSaveNew}
                disabled={isSaving || !newSessionName.trim()}
                className="flex-1 px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Save New Session
              </button>
              <button
                onClick={() => setShowSaveAsModal(false)}
                className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close dropdowns */}
      {(isOpen || showSaveDropdown) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsOpen(false);
            setShowSaveDropdown(false);
          }}
        />
      )}
    </div>
  );
}
