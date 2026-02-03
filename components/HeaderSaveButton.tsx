'use client';

import { useState } from 'react';
import { useSessionContext } from '../contexts/SessionContext';
import {
  Save,
  ChevronDown,
  Plus,
  X,
  Loader2,
  FolderOpen,
} from 'lucide-react';

export default function HeaderSaveButton() {
  const {
    currentSessionName,
    isSaving,
    sessions,
    saveProgress,
    saveAsNew,
    loadSession,
    currentTabType,
  } = useSessionContext();

  const [showSaveDropdown, setShowSaveDropdown] = useState(false);
  const [showSaveAsModal, setShowSaveAsModal] = useState(false);
  const [showSessionsDropdown, setShowSessionsDropdown] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');

  const handleSaveNew = async () => {
    if (!newSessionName.trim()) return;
    await saveAsNew(newSessionName);
    setNewSessionName('');
    setShowSaveAsModal(false);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Don't render if no tab type is set (not on a tab that supports sessions)
  if (!currentTabType) return null;

  return (
    <div className="relative flex items-center gap-2">
      {/* Save Button with Dropdown */}
      <div className="relative">
        <div className="flex">
          {/* Main Save Button */}
          <button
            onClick={saveProgress}
            disabled={isSaving}
            className="flex items-center gap-2 px-3 py-1.5 bg-orange-600 text-white text-sm rounded-l-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span className="hidden md:inline">
              {currentSessionName ? `Save` : 'Save Progress'}
            </span>
          </button>
          {/* Dropdown Toggle */}
          <button
            onClick={() => {
              setShowSaveDropdown(!showSaveDropdown);
              setShowSessionsDropdown(false);
            }}
            className="px-1.5 py-1.5 bg-orange-600 text-white text-sm rounded-r-lg hover:bg-orange-700 transition-colors border-l border-orange-500"
          >
            <ChevronDown className={`w-3 h-3 transition-transform ${showSaveDropdown ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Save Dropdown Menu */}
        {showSaveDropdown && (
          <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border z-50">
            <button
              onClick={() => {
                saveProgress();
                setShowSaveDropdown(false);
              }}
              disabled={isSaving}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b"
            >
              <Save className="w-4 h-4 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900 text-sm">Save Progress</p>
                <p className="text-xs text-gray-500">
                  {currentSessionName
                    ? `Overwrite "${currentSessionName}"`
                    : 'Auto-save current work'}
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
                <p className="font-medium text-gray-900 text-sm">Save New/As</p>
                <p className="text-xs text-gray-500">Save as a new named session</p>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Sessions Dropdown */}
      <div className="relative">
        <button
          onClick={() => {
            setShowSessionsDropdown(!showSessionsDropdown);
            setShowSaveDropdown(false);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-sm rounded-lg hover:bg-gray-50 transition-colors"
        >
          <FolderOpen className="w-4 h-4 text-gray-600" />
          <span className="hidden md:inline text-gray-700">{sessions?.length || 0}</span>
          <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${showSessionsDropdown ? 'rotate-180' : ''}`} />
        </button>

        {/* Sessions Dropdown Menu */}
        {showSessionsDropdown && (
          <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border z-50">
            <div className="p-3 border-b">
              <h3 className="font-semibold text-gray-900 text-sm">Saved Sessions</h3>
              {currentSessionName && (
                <p className="text-xs text-gray-500 mt-1">Current: {currentSessionName}</p>
              )}
            </div>

            <div className="max-h-64 overflow-y-auto">
              {sessions && sessions.length > 0 ? (
                sessions.map((session) => (
                  <div
                    key={session._id}
                    className={`p-3 hover:bg-gray-50 border-b last:border-b-0 cursor-pointer ${
                      currentSessionName === session.name ? 'bg-orange-50' : ''
                    }`}
                    onClick={() => {
                      loadSession(session);
                      setShowSessionsDropdown(false);
                    }}
                  >
                    <p className="font-medium text-gray-900 text-sm">{session.name}</p>
                    <p className="text-xs text-gray-500">
                      Updated {formatDate(session.updatedAt)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500">
                  <FolderOpen className="w-6 h-6 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No saved sessions</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

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
      {(showSaveDropdown || showSessionsDropdown) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowSaveDropdown(false);
            setShowSessionsDropdown(false);
          }}
        />
      )}
    </div>
  );
}
