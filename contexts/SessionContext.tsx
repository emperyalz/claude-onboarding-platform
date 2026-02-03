'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Id } from '../convex/_generated/dataModel';
import toast from 'react-hot-toast';

interface Session {
  _id: Id<'sessions'>;
  name: string;
  tabType: string;
  data: unknown;
  createdAt: number;
  updatedAt: number;
}

interface SessionContextType {
  currentSessionId: Id<'sessions'> | null;
  currentSessionName: string | null;
  currentTabType: string | null;
  currentData: unknown;
  isSaving: boolean;
  sessions: Session[] | undefined;
  setCurrentSession: (sessionId: Id<'sessions'> | null, name: string | null) => void;
  setCurrentTabType: (tabType: string) => void;
  setCurrentData: (data: unknown) => void;
  saveProgress: () => Promise<void>;
  saveAsNew: (name: string) => Promise<void>;
  loadSession: (session: Session) => void;
  onLoadSessionCallback: ((data: unknown) => void) | null;
  setOnLoadSessionCallback: (callback: ((data: unknown) => void) | null) => void;
  userEmail: string | null;
  setUserEmail: (email: string | null) => void;
}

const SessionContext = createContext<SessionContextType | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [currentSessionId, setCurrentSessionId] = useState<Id<'sessions'> | null>(null);
  const [currentSessionName, setCurrentSessionName] = useState<string | null>(null);
  const [currentTabType, setCurrentTabTypeState] = useState<string | null>(null);
  const [currentData, setCurrentDataState] = useState<unknown>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [onLoadSessionCallback, setOnLoadSessionCallbackState] = useState<((data: unknown) => void) | null>(null);
  const [userEmail, setUserEmailState] = useState<string | null>(null);

  const sessions = useQuery(
    api.sessions.getSessionsByTab,
    userEmail && currentTabType ? { email: userEmail, tabType: currentTabType } : 'skip'
  ) as Session[] | undefined;

  const createSession = useMutation(api.sessions.createSession);
  const updateSession = useMutation(api.sessions.updateSession);

  const setCurrentSession = useCallback((sessionId: Id<'sessions'> | null, name: string | null) => {
    setCurrentSessionId(sessionId);
    setCurrentSessionName(name);
  }, []);

  // Memoized setters to prevent infinite loops in consumers
  const setCurrentTabType = useCallback((tabType: string) => {
    setCurrentTabTypeState(tabType);
  }, []);

  const setCurrentData = useCallback((data: unknown) => {
    setCurrentDataState(data);
  }, []);

  const setUserEmail = useCallback((email: string | null) => {
    setUserEmailState(email);
  }, []);

  const setOnLoadSessionCallback = useCallback((callback: ((data: unknown) => void) | null) => {
    setOnLoadSessionCallbackState(callback);
  }, []);

  const saveProgress = useCallback(async () => {
    if (!userEmail || !currentTabType || !currentData) {
      toast.error('Unable to save - missing data');
      return;
    }

    setIsSaving(true);
    try {
      if (currentSessionId) {
        // Update existing session
        await updateSession({
          sessionId: currentSessionId,
          data: currentData,
        });
        toast.success(`Saved to "${currentSessionName}"!`);
      } else {
        // No current session - save as "Auto-save" with timestamp
        const autoName = `Auto-save ${new Date().toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}`;
        const newId = await createSession({
          email: userEmail,
          name: autoName,
          tabType: currentTabType,
          data: currentData,
        });
        setCurrentSessionId(newId as Id<'sessions'>);
        setCurrentSessionName(autoName);
        toast.success(`Progress saved as "${autoName}"!`);
      }
    } catch (error) {
      console.error('Failed to save progress:', error);
      toast.error('Failed to save progress');
    } finally {
      setIsSaving(false);
    }
  }, [userEmail, currentTabType, currentData, currentSessionId, currentSessionName, updateSession, createSession]);

  const saveAsNew = useCallback(async (name: string) => {
    if (!userEmail || !currentTabType || !currentData) {
      toast.error('Unable to save - missing data');
      return;
    }

    setIsSaving(true);
    try {
      const newId = await createSession({
        email: userEmail,
        name: name.trim(),
        tabType: currentTabType,
        data: currentData,
      });
      setCurrentSessionId(newId as Id<'sessions'>);
      setCurrentSessionName(name.trim());
      toast.success(`Session "${name}" saved!`);
    } catch (error) {
      console.error('Failed to save session:', error);
      toast.error('Failed to save session');
    } finally {
      setIsSaving(false);
    }
  }, [userEmail, currentTabType, currentData, createSession]);

  const loadSession = useCallback((session: Session) => {
    setCurrentSessionId(session._id);
    setCurrentSessionName(session.name);
    if (onLoadSessionCallback) {
      onLoadSessionCallback(session.data);
    }
    toast.success(`Loaded "${session.name}"`);
  }, [onLoadSessionCallback]);

  return (
    <SessionContext.Provider
      value={{
        currentSessionId,
        currentSessionName,
        currentTabType,
        currentData,
        isSaving,
        sessions,
        setCurrentSession,
        setCurrentTabType,
        setCurrentData,
        saveProgress,
        saveAsNew,
        loadSession,
        onLoadSessionCallback,
        setOnLoadSessionCallback,
        userEmail,
        setUserEmail,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSessionContext() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSessionContext must be used within a SessionProvider');
  }
  return context;
}
