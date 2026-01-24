'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import {
  FileText,
  Brain,
  Settings,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  Download,
} from 'lucide-react';

type DataTab = 'preferences' | 'memories' | 'skills' | 'projects';

export default function ResponsesPage() {
  const { data: session } = useSession();
  const userEmail = session?.user?.email || '';

  const [activeTab, setActiveTab] = useState<DataTab>('preferences');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['phase1', 'phase2']));

  // Convex queries
  const preferences = useQuery(api.preferences.getPreferences, userEmail ? { email: userEmail } : 'skip');
  const memories = useQuery(api.memories.getMemories, userEmail ? { email: userEmail } : 'skip');
  const skills = useQuery(api.skills.getSkills, userEmail ? { email: userEmail } : 'skip');
  const projects = useQuery(api.projects.getProjects, userEmail ? { email: userEmail } : 'skip');

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const exportAllData = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      user: {
        name: session?.user?.name,
        email: session?.user?.email,
      },
      preferences: preferences?.answers || {},
      memories: memories || [],
      skills: skills || [],
      projects: projects?.map((p: { name: string; sections: { title: string; content: string }[] }) => ({
        name: p.name,
        sections: p.sections,
      })) || [],
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `claude-onboarding-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const tabs = [
    { id: 'preferences', label: 'Questionnaire Responses', icon: FileText, count: Object.keys(preferences?.answers || {}).length },
    { id: 'memories', label: 'Memories', icon: Brain, count: memories?.length || 0 },
    { id: 'skills', label: 'Custom Skills', icon: Settings, count: skills?.filter((s: { isCustom: boolean }) => s.isCustom).length || 0 },
    { id: 'projects', label: 'Projects', icon: FolderOpen, count: projects?.length || 0 },
  ];

  // Separate phase 1 and phase 2 answers
  const phase1Questions = [
    'role', 'experience', 'industry', 'tasks', 'tone', 'format', 'detail',
    'feedback', 'codeStyle', 'goals', 'challenges', 'tools', 'timezone',
    'availability', 'other',
  ];

  const phase1Answers = Object.entries(preferences?.answers || {}).filter(([key]) =>
    phase1Questions.includes(key)
  );

  const phase2Answers = Object.entries(preferences?.answers || {}).filter(([key]) =>
    !phase1Questions.includes(key)
  );

  const questionLabels: Record<string, string> = {
    role: 'Primary Role',
    experience: 'AI Experience Level',
    industry: 'Industry',
    tasks: 'Common Tasks',
    tone: 'Communication Style',
    format: 'Response Format',
    detail: 'Detail Level',
    feedback: 'Clarifying Questions',
    codeStyle: 'Programming Languages',
    goals: 'Main Goals',
    challenges: 'Work Challenges',
    tools: 'Daily Tools',
    timezone: 'Timezone',
    availability: 'Work Hours',
    other: 'Additional Info',
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-claude-dark">Saved Data</h1>
          <p className="text-gray-600 mt-1">View and export all your saved information</p>
        </div>
        <button
          onClick={exportAllData}
          className="btn-secondary flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export All Data
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as DataTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-claude-orange text-white'
                : 'bg-white border border-gray-200 hover:border-gray-300'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            <span
              className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === tab.id ? 'bg-white/20' : 'bg-gray-100'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <div className="space-y-4">
          {/* Phase 1 */}
          <div className="card">
            <button
              onClick={() => toggleSection('phase1')}
              className="w-full flex items-center justify-between"
            >
              <h2 className="text-lg font-semibold flex items-center gap-2">
                {expandedSections.has('phase1') ? (
                  <ChevronDown className="w-5 h-5" />
                ) : (
                  <ChevronRight className="w-5 h-5" />
                )}
                Phase 1: Core Questions
              </h2>
              <span className="text-sm text-gray-500">
                {phase1Answers.length} responses
              </span>
            </button>
            {expandedSections.has('phase1') && (
              <div className="mt-4 space-y-4">
                {phase1Answers.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No responses yet. Complete the questionnaire to see your answers.
                  </p>
                ) : (
                  phase1Answers.map(([key, value]) => (
                    <div key={key} className="border-b border-gray-100 pb-3 last:border-0">
                      <p className="text-sm font-medium text-gray-700">
                        {questionLabels[key] || key}
                      </p>
                      <p className="text-gray-900 mt-1">
                        {Array.isArray(value) ? value.join(', ') : String(value || '-')}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Phase 2 */}
          {phase2Answers.length > 0 && (
            <div className="card">
              <button
                onClick={() => toggleSection('phase2')}
                className="w-full flex items-center justify-between"
              >
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  {expandedSections.has('phase2') ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                  Phase 2: Role-Specific Questions
                </h2>
                <span className="text-sm text-gray-500">
                  {phase2Answers.length} responses
                </span>
              </button>
              {expandedSections.has('phase2') && (
                <div className="mt-4 space-y-4">
                  {phase2Answers.map(([key, value]) => (
                    <div key={key} className="border-b border-gray-100 pb-3 last:border-0">
                      <p className="text-sm font-medium text-gray-700">
                        {key.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())}
                      </p>
                      <p className="text-gray-900 mt-1">
                        {Array.isArray(value) ? value.join(', ') : String(value || '-')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Memories Tab */}
      {activeTab === 'memories' && (
        <div className="space-y-3">
          {!memories || memories.length === 0 ? (
            <div className="card text-center py-12">
              <Brain className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No memories saved yet.</p>
            </div>
          ) : (
            memories.map((memory: { category: string; content: string; createdAt?: number }, index: number) => (
              <div key={index} className="card">
                <div className="flex items-start gap-4">
                  <span className="px-2 py-1 text-xs font-medium bg-claude-orange/10 text-claude-orange rounded">
                    {memory.category}
                  </span>
                  <div className="flex-1">
                    <p className="text-gray-900">{memory.content}</p>
                    {memory.createdAt && (
                      <p className="text-xs text-gray-400 mt-2">
                        Added {new Date(memory.createdAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Skills Tab */}
      {activeTab === 'skills' && (
        <div className="grid md:grid-cols-2 gap-4">
          {!skills || skills.filter((s: { isCustom: boolean }) => s.isCustom).length === 0 ? (
            <div className="card text-center py-12 md:col-span-2">
              <Settings className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No custom skills created yet.</p>
            </div>
          ) : (
            skills
              .filter((s: { isCustom: boolean }) => s.isCustom)
              .map((skill: { name: string; description: string; template: string; isCustom: boolean }, index: number) => (
                <div key={index} className="card">
                  <h3 className="font-semibold text-lg mb-2">{skill.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{skill.description}</p>
                  <details className="text-sm">
                    <summary className="cursor-pointer text-claude-orange hover:underline">
                      View template
                    </summary>
                    <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-x-auto">
                      {skill.template}
                    </pre>
                  </details>
                </div>
              ))
          )}
        </div>
      )}

      {/* Projects Tab */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          {!projects || projects.length === 0 ? (
            <div className="card text-center py-12">
              <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No projects created yet.</p>
            </div>
          ) : (
            projects.map((project: { name: string; sections: { title: string; content: string }[]; createdAt?: number; updatedAt?: number }, index: number) => (
              <div key={index} className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <FolderOpen className="w-5 h-5 text-claude-orange" />
                    {project.name}
                  </h3>
                  {project.updatedAt && (
                    <span className="text-xs text-gray-400">
                      Updated {new Date(project.updatedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <div className="space-y-3">
                  {project.sections
                    .filter((s) => s.content.trim())
                    .map((section, sIndex) => (
                      <div key={sIndex} className="border-l-2 border-claude-orange/30 pl-4">
                        <p className="text-sm font-medium text-gray-700">{section.title}</p>
                        <p className="text-gray-600 text-sm mt-1 whitespace-pre-wrap">
                          {section.content.length > 200
                            ? `${section.content.slice(0, 200)}...`
                            : section.content}
                        </p>
                      </div>
                    ))}
                  {project.sections.filter((s) => s.content.trim()).length === 0 && (
                    <p className="text-gray-400 text-sm italic">No content added yet</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
