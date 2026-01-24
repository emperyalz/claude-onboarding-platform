'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../convex/_generated/api'
import { User, Settings, Brain, FileText, FolderOpen, Sparkles, Download, Plus, Trash2, Edit3, ChevronRight, Check } from 'lucide-react'

type Tab = 'preferences' | 'memory' | 'skills' | 'files' | 'projects'

interface UserData {
  id?: string
  name: string
  email: string
}

interface MemoryEntry {
  _id?: string
  category: string
  content: string
  createdAt?: number
}

interface Skill {
  _id?: string
  name: string
  description: string
  template: string
  isCustom: boolean
}

interface ProjectSection {
  title: string
  content: string
}

interface Project {
  _id?: string
  name: string
  sections: ProjectSection[]
}

// Questions for Personal Preferences
const discoveryQuestions = [
  { id: 'role', question: 'What is your primary role?', type: 'select', options: ['Developer', 'Designer', 'Product Manager', 'Data Analyst', 'Marketing', 'Operations', 'Executive', 'Other'] },
  { id: 'experience', question: 'How experienced are you with AI assistants?', type: 'select', options: ['Beginner', 'Intermediate', 'Advanced', 'Expert'] },
  { id: 'industry', question: 'What industry do you work in?', type: 'text' },
  { id: 'tasks', question: 'What tasks do you most commonly need help with?', type: 'multiselect', options: ['Writing', 'Coding', 'Analysis', 'Research', 'Brainstorming', 'Planning', 'Communication', 'Learning'] },
  { id: 'tone', question: 'What communication style do you prefer?', type: 'select', options: ['Formal', 'Casual', 'Technical', 'Simple', 'Detailed', 'Concise'] },
  { id: 'format', question: 'How do you prefer responses formatted?', type: 'select', options: ['Bullet points', 'Paragraphs', 'Step-by-step', 'Tables', 'Mix of formats'] },
  { id: 'detail', question: 'How much detail do you typically want?', type: 'select', options: ['Brief overview', 'Moderate detail', 'Comprehensive', 'As much as possible'] },
  { id: 'feedback', question: 'Do you want Claude to ask clarifying questions?', type: 'select', options: ['Yes, always', 'Only when necessary', 'Rarely', 'No, just proceed'] },
  { id: 'codeStyle', question: 'If coding, what languages do you primarily use?', type: 'text' },
  { id: 'goals', question: 'What are your main goals using Claude?', type: 'textarea' },
  { id: 'challenges', question: 'What challenges do you face in your work?', type: 'textarea' },
  { id: 'tools', question: 'What tools/software do you use daily?', type: 'text' },
  { id: 'timezone', question: 'What timezone are you in?', type: 'text' },
  { id: 'availability', question: 'When do you typically work with Claude?', type: 'select', options: ['Morning', 'Afternoon', 'Evening', 'Night', 'Varies'] },
  { id: 'other', question: 'Anything else Claude should know about you?', type: 'textarea' }
]

// Default skill templates
const defaultSkills: Skill[] = [
  { name: 'Web Scraping Expert', description: 'Specialized in extracting data from websites', template: 'You are an expert web scraper. Help me extract data from websites using Python, Beautiful Soup, Selenium, and other tools. Always provide clean, well-commented code.', isCustom: false },
  { name: 'Data Analyst', description: 'Analyze and visualize data', template: 'You are a data analysis expert. Help me analyze datasets, create visualizations, and derive insights. Use Python, pandas, and visualization libraries.', isCustom: false },
  { name: 'API Developer', description: 'Build and integrate APIs', template: 'You are an API development expert. Help me design, build, and integrate REST and GraphQL APIs. Focus on best practices, security, and documentation.', isCustom: false },
  { name: 'Content Writer', description: 'Create engaging content', template: 'You are a professional content writer. Help me create engaging, well-structured content for various platforms. Focus on clarity, engagement, and SEO.', isCustom: false },
  { name: 'Code Reviewer', description: 'Review and improve code quality', template: 'You are a code review expert. Analyze code for bugs, performance issues, security vulnerabilities, and suggest improvements. Be thorough but constructive.', isCustom: false },
  { name: 'Project Planner', description: 'Plan and organize projects', template: 'You are a project planning expert. Help me break down projects into tasks, create timelines, identify dependencies, and manage resources effectively.', isCustom: false }
]

// Project section templates
const projectSectionTemplates = [
  { title: 'Context', placeholder: 'Describe the project background, goals, and stakeholders...' },
  { title: 'Tech Stack', placeholder: 'List technologies, frameworks, and tools used...' },
  { title: 'Architecture', placeholder: 'Describe the system architecture and key components...' },
  { title: 'Database Schema', placeholder: 'Document database tables, relationships, and key fields...' },
  { title: 'API Endpoints', placeholder: 'List API routes, methods, and expected payloads...' },
  { title: 'UI/UX Guidelines', placeholder: 'Describe design system, components, and user flows...' },
  { title: 'Deployment', placeholder: 'Document deployment process, environments, and CI/CD...' },
  { title: 'Known Issues', placeholder: 'List current bugs, limitations, and technical debt...' }
]

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('preferences')
  const [user, setUser] = useState<UserData | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loginForm, setLoginForm] = useState({ name: '', email: '' })
  
  // Preferences state
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [preferencesComplete, setPreferencesComplete] = useState(false)
  
  // Memory state
  const [memories, setMemories] = useState<MemoryEntry[]>([])
  const [newMemory, setNewMemory] = useState({ category: 'Work', content: '' })
  const [editingMemory, setEditingMemory] = useState<string | null>(null)
  
  // Skills state
  const [skills, setSkills] = useState<Skill[]>(defaultSkills)
  const [newSkill, setNewSkill] = useState({ name: '', description: '', template: '' })
  const [showSkillForm, setShowSkillForm] = useState(false)
  
  // Files state
  const [generatedFile, setGeneratedFile] = useState('')
  const [fileType, setFileType] = useState<'global' | 'project'>('global')
  
  // Projects state
  const [projects, setProjects] = useState<Project[]>([])
  const [activeProject, setActiveProject] = useState<Project | null>(null)
  const [newProjectName, setNewProjectName] = useState('')

  // Convex mutations and queries
  const saveUser = useMutation(api.users.saveUser)
  const getUser = useQuery(api.users.getUser, user?.email ? { email: user.email } : 'skip')
  const savePreferences = useMutation(api.preferences.savePreferences)
  const getPreferences = useQuery(api.preferences.getPreferences, user?.email ? { email: user.email } : 'skip')
  const saveMemories = useMutation(api.memories.saveMemories)
  const getMemories = useQuery(api.memories.getMemories, user?.email ? { email: user.email } : 'skip')

  // Load user data from Convex
  useEffect(() => {
    if (getUser) {
      setUser(getUser)
      setIsLoggedIn(true)
    }
  }, [getUser])

  useEffect(() => {
    if (getPreferences) {
      setAnswers(getPreferences.answers || {})
      setPreferencesComplete(getPreferences.complete || false)
    }
  }, [getPreferences])

  useEffect(() => {
    if (getMemories) {
      setMemories(getMemories)
    }
  }, [getMemories])

  const handleLogin = async () => {
    if (loginForm.name && loginForm.email) {
      const userData = { name: loginForm.name, email: loginForm.email }
      await saveUser(userData)
      setUser(userData)
      setIsLoggedIn(true)
    }
  }

  const handleAnswerChange = (questionId: string, value: string | string[]) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  const handleNextQuestion = async () => {
    if (currentQuestion < discoveryQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1)
    } else {
      setPreferencesComplete(true)
      if (user?.email) {
        await savePreferences({ email: user.email, answers, complete: true })
      }
    }
  }

  const handlePrevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1)
    }
  }

  const addMemory = async () => {
    if (newMemory.content.trim()) {
      const updated = [...memories, { ...newMemory, createdAt: Date.now() }]
      setMemories(updated)
      setNewMemory({ category: 'Work', content: '' })
      if (user?.email) {
        await saveMemories({ email: user.email, memories: updated })
      }
    }
  }

  const deleteMemory = async (index: number) => {
    const updated = memories.filter((_, i) => i !== index)
    setMemories(updated)
    if (user?.email) {
      await saveMemories({ email: user.email, memories: updated })
    }
  }

  const addSkill = () => {
    if (newSkill.name && newSkill.template) {
      setSkills([...skills, { ...newSkill, isCustom: true }])
      setNewSkill({ name: '', description: '', template: '' })
      setShowSkillForm(false)
    }
  }

  const deleteSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index))
  }

  const generateClaudeFile = () => {
    let content = `# CLAUDE.md - ${user?.name || 'User'}'s Configuration\n\n`
    content += `Generated: ${new Date().toISOString()}\n\n`
    
    content += `## Personal Preferences\n\n`
    Object.entries(answers).forEach(([key, value]) => {
      const question = discoveryQuestions.find(q => q.id === key)
      if (question && value) {
        content += `**${question.question}**\n${Array.isArray(value) ? value.join(', ') : value}\n\n`
      }
    })
    
    content += `## Memory Bank\n\n`
    const groupedMemories = memories.reduce((acc, mem) => {
      if (!acc[mem.category]) acc[mem.category] = []
      acc[mem.category].push(mem.content)
      return acc
    }, {} as Record<string, string[]>)
    
    Object.entries(groupedMemories).forEach(([category, items]) => {
      content += `### ${category}\n`
      items.forEach(item => content += `- ${item}\n`)
      content += '\n'
    })
    
    if (skills.filter(s => s.isCustom).length > 0) {
      content += `## Custom Skills\n\n`
      skills.filter(s => s.isCustom).forEach(skill => {
        content += `### ${skill.name}\n${skill.description}\n\n\`\`\`\n${skill.template}\n\`\`\`\n\n`
      })
    }
    
    setGeneratedFile(content)
  }

  const createProject = () => {
    if (newProjectName.trim()) {
      const newProject: Project = {
        name: newProjectName,
        sections: projectSectionTemplates.map(t => ({ title: t.title, content: '' }))
      }
      setProjects([...projects, newProject])
      setActiveProject(newProject)
      setNewProjectName('')
    }
  }

  const updateProjectSection = (sectionIndex: number, content: string) => {
    if (activeProject) {
      const updated = {
        ...activeProject,
        sections: activeProject.sections.map((s, i) => 
          i === sectionIndex ? { ...s, content } : s
        )
      }
      setActiveProject(updated)
      setProjects(projects.map(p => p.name === updated.name ? updated : p))
    }
  }

  const exportProject = () => {
    if (!activeProject) return
    
    let content = `# ${activeProject.name} - Project Documentation\n\n`
    content += `Generated: ${new Date().toISOString()}\n\n`
    
    activeProject.sections.forEach(section => {
      if (section.content.trim()) {
        content += `## ${section.title}\n\n${section.content}\n\n`
      }
    })
    
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${activeProject.name.toLowerCase().replace(/\s+/g, '-')}-docs.md`
    a.click()
  }

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
  }

  // Login screen
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-claude-orange rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-claude-dark">Claude Onboarding</h1>
            <p className="text-gray-600 mt-2">Personalize your Claude experience</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                className="input-field"
                placeholder="Your name"
                value={loginForm.name}
                onChange={(e) => setLoginForm({ ...loginForm, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                className="input-field"
                placeholder="your@email.com"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
              />
            </div>
            <button
              className="btn-primary w-full"
              onClick={handleLogin}
              disabled={!loginForm.name || !loginForm.email}
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'preferences', label: 'Personal Preferences', icon: User },
    { id: 'memory', label: 'Manage Memory', icon: Brain },
    { id: 'skills', label: 'Claude Skills', icon: Settings },
    { id: 'files', label: 'Memory Files', icon: FileText },
    { id: 'projects', label: 'Develop Projects', icon: FolderOpen },
  ]

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-claude-orange rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-claude-dark">Claude Onboarding</h1>
              <p className="text-xs text-gray-500">Welcome, {user?.name}</p>
            </div>
          </div>
          <button 
            className="text-sm text-gray-500 hover:text-gray-700"
            onClick={() => setIsLoggedIn(false)}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Tabs */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id ? 'tab-active' : 'tab-inactive'
                }`}
                onClick={() => setActiveTab(tab.id as Tab)}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Personal Preferences Tab */}
        {activeTab === 'preferences' && (
          <div className="max-w-2xl mx-auto">
            {!preferencesComplete ? (
              <div className="card">
                <div className="mb-6">
                  <div className="flex justify-between text-sm text-gray-500 mb-2">
                    <span>Question {currentQuestion + 1} of {discoveryQuestions.length}</span>
                    <span>{Math.round(((currentQuestion + 1) / discoveryQuestions.length) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div 
                      className="h-2 bg-claude-orange rounded-full transition-all"
                      style={{ width: `${((currentQuestion + 1) / discoveryQuestions.length) * 100}%` }}
                    />
                  </div>
                </div>

                <h2 className="text-xl font-semibold mb-4">{discoveryQuestions[currentQuestion].question}</h2>

                {discoveryQuestions[currentQuestion].type === 'select' && (
                  <div className="space-y-2">
                    {discoveryQuestions[currentQuestion].options?.map(option => (
                      <button
                        key={option}
                        className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                          answers[discoveryQuestions[currentQuestion].id] === option
                            ? 'border-claude-orange bg-orange-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleAnswerChange(discoveryQuestions[currentQuestion].id, option)}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}

                {discoveryQuestions[currentQuestion].type === 'multiselect' && (
                  <div className="space-y-2">
                    {discoveryQuestions[currentQuestion].options?.map(option => {
                      const selected = (answers[discoveryQuestions[currentQuestion].id] as string[] || []).includes(option)
                      return (
                        <button
                          key={option}
                          className={`w-full text-left px-4 py-3 rounded-lg border transition-colors flex items-center gap-3 ${
                            selected
                              ? 'border-claude-orange bg-orange-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => {
                            const current = (answers[discoveryQuestions[currentQuestion].id] as string[] || [])
                            const updated = selected
                              ? current.filter(v => v !== option)
                              : [...current, option]
                            handleAnswerChange(discoveryQuestions[currentQuestion].id, updated)
                          }}
                        >
                          <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                            selected ? 'bg-claude-orange border-claude-orange' : 'border-gray-300'
                          }`}>
                            {selected && <Check className="w-3 h-3 text-white" />}
                          </div>
                          {option}
                        </button>
                      )
                    })}
                  </div>
                )}

                {discoveryQuestions[currentQuestion].type === 'text' && (
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Type your answer..."
                    value={answers[discoveryQuestions[currentQuestion].id] as string || ''}
                    onChange={(e) => handleAnswerChange(discoveryQuestions[currentQuestion].id, e.target.value)}
                  />
                )}

                {discoveryQuestions[currentQuestion].type === 'textarea' && (
                  <textarea
                    className="input-field min-h-[120px]"
                    placeholder="Type your answer..."
                    value={answers[discoveryQuestions[currentQuestion].id] as string || ''}
                    onChange={(e) => handleAnswerChange(discoveryQuestions[currentQuestion].id, e.target.value)}
                  />
                )}

                <div className="flex justify-between mt-6">
                  <button
                    className="btn-secondary"
                    onClick={handlePrevQuestion}
                    disabled={currentQuestion === 0}
                  >
                    Previous
                  </button>
                  <button
                    className="btn-primary"
                    onClick={handleNextQuestion}
                  >
                    {currentQuestion === discoveryQuestions.length - 1 ? 'Complete' : 'Next'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="card text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Preferences Complete!</h2>
                <p className="text-gray-600 mb-6">Your personalization is ready. Generate your CLAUDE.md file in the Memory Files tab.</p>
                <button
                  className="btn-secondary"
                  onClick={() => { setPreferencesComplete(false); setCurrentQuestion(0) }}
                >
                  Edit Preferences
                </button>
              </div>
            )}
          </div>
        )}

        {/* Memory Tab */}
        {activeTab === 'memory' && (
          <div className="max-w-3xl mx-auto">
            <div className="card mb-6">
              <h2 className="text-lg font-semibold mb-4">Add Memory Entry</h2>
              <div className="flex gap-4 mb-4">
                <select
                  className="input-field w-40"
                  value={newMemory.category}
                  onChange={(e) => setNewMemory({ ...newMemory, category: e.target.value })}
                >
                  <option>Work</option>
                  <option>Personal</option>
                  <option>Projects</option>
                  <option>Preferences</option>
                  <option>Context</option>
                </select>
                <input
                  type="text"
                  className="input-field flex-1"
                  placeholder="What should Claude remember?"
                  value={newMemory.content}
                  onChange={(e) => setNewMemory({ ...newMemory, content: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && addMemory()}
                />
                <button className="btn-primary" onClick={addMemory}>
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {memories.length === 0 ? (
                <div className="card text-center py-12">
                  <Brain className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No memories yet. Add something for Claude to remember!</p>
                </div>
              ) : (
                memories.map((memory, index) => (
                  <div key={index} className="card flex items-start gap-4">
                    <span className="px-2 py-1 text-xs font-medium bg-claude-orange/10 text-claude-orange rounded">
                      {memory.category}
                    </span>
                    <p className="flex-1 text-gray-700">{memory.content}</p>
                    <button
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      onClick={() => deleteMemory(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Skills Tab */}
        {activeTab === 'skills' && (
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold">Claude Skills Library</h2>
              <button
                className="btn-primary flex items-center gap-2"
                onClick={() => setShowSkillForm(!showSkillForm)}
              >
                <Plus className="w-4 h-4" />
                Create Skill
              </button>
            </div>

            {showSkillForm && (
              <div className="card mb-6">
                <h3 className="font-medium mb-4">New Custom Skill</h3>
                <div className="space-y-4">
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Skill name (e.g., 'SQL Expert')"
                    value={newSkill.name}
                    onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                  />
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Short description"
                    value={newSkill.description}
                    onChange={(e) => setNewSkill({ ...newSkill, description: e.target.value })}
                  />
                  <textarea
                    className="input-field min-h-[100px]"
                    placeholder="Skill template/prompt (e.g., 'You are an expert SQL developer...')"
                    value={newSkill.template}
                    onChange={(e) => setNewSkill({ ...newSkill, template: e.target.value })}
                  />
                  <div className="flex gap-3">
                    <button className="btn-primary" onClick={addSkill}>Save Skill</button>
                    <button className="btn-secondary" onClick={() => setShowSkillForm(false)}>Cancel</button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              {skills.map((skill, index) => (
                <div key={index} className="card">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold">{skill.name}</h3>
                    {skill.isCustom && (
                      <button
                        className="text-gray-400 hover:text-red-500"
                        onClick={() => deleteSkill(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{skill.description}</p>
                  <details className="text-sm">
                    <summary className="cursor-pointer text-claude-orange hover:underline">View template</summary>
                    <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-x-auto">{skill.template}</pre>
                  </details>
                  {skill.isCustom && (
                    <span className="inline-block mt-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">Custom</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Memory Files Tab */}
        {activeTab === 'files' && (
          <div className="max-w-3xl mx-auto">
            <div className="card mb-6">
              <h2 className="text-lg font-semibold mb-4">Generate CLAUDE.md</h2>
              <p className="text-gray-600 mb-4">
                Create a configuration file that captures your preferences, memories, and skills. 
                Use this file with Claude for personalized interactions.
              </p>
              <div className="flex gap-4 mb-4">
                <select
                  className="input-field w-48"
                  value={fileType}
                  onChange={(e) => setFileType(e.target.value as 'global' | 'project')}
                >
                  <option value="global">Global Config</option>
                  <option value="project">Project Specific</option>
                </select>
                <button className="btn-primary flex items-center gap-2" onClick={generateClaudeFile}>
                  <FileText className="w-4 h-4" />
                  Generate File
                </button>
              </div>
            </div>

            {generatedFile && (
              <div className="card">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold">Generated CLAUDE.md</h3>
                  <button
                    className="btn-secondary flex items-center gap-2"
                    onClick={() => downloadFile(generatedFile, 'CLAUDE.md')}
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
                <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto max-h-[500px] overflow-y-auto">
                  {generatedFile}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Project List */}
              <div className="md:col-span-1">
                <div className="card">
                  <h2 className="text-lg font-semibold mb-4">Projects</h2>
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      className="input-field flex-1"
                      placeholder="New project name"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && createProject()}
                    />
                    <button className="btn-primary" onClick={createProject}>
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {projects.map((project, index) => (
                      <button
                        key={index}
                        className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                          activeProject?.name === project.name
                            ? 'bg-claude-orange text-white'
                            : 'hover:bg-gray-100'
                        }`}
                        onClick={() => setActiveProject(project)}
                      >
                        <FolderOpen className="w-4 h-4" />
                        {project.name}
                      </button>
                    ))}
                    {projects.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">No projects yet</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Project Editor */}
              <div className="md:col-span-2">
                {activeProject ? (
                  <div className="card">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-lg font-semibold">{activeProject.name}</h2>
                      <button
                        className="btn-primary flex items-center gap-2"
                        onClick={exportProject}
                      >
                        <Download className="w-4 h-4" />
                        Export Docs
                      </button>
                    </div>
                    <div className="space-y-6">
                      {activeProject.sections.map((section, index) => (
                        <div key={index}>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {section.title}
                          </label>
                          <textarea
                            className="input-field min-h-[100px]"
                            placeholder={projectSectionTemplates[index]?.placeholder}
                            value={section.content}
                            onChange={(e) => updateProjectSection(index, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="card text-center py-16">
                    <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Select or create a project to get started</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
