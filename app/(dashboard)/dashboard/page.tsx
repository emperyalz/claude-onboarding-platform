'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import toast from 'react-hot-toast';
import {
  User,
  Settings,
  Brain,
  FileText,
  FolderOpen,
  Sparkles,
  Download,
  Plus,
  Trash2,
  Check,
  Loader2,
  Wand2,
} from 'lucide-react';

type Tab = 'preferences' | 'memory' | 'skills' | 'files' | 'projects';

interface MemoryEntry {
  category: string;
  content: string;
  createdAt?: number;
}

interface Skill {
  name: string;
  description: string;
  template: string;
  isCustom: boolean;
}

interface ProjectSection {
  title: string;
  content: string;
}

interface Project {
  name: string;
  sections: ProjectSection[];
}

interface Question {
  id: string;
  question: string;
  type: 'select' | 'multiselect' | 'text' | 'textarea';
  options?: string[];
  phase: 1 | 2;
}

// Phase 1: Core questions (15)
const phase1Questions: Question[] = [
  { id: 'role', question: 'What is your primary role?', type: 'select', options: ['Developer', 'Designer', 'Product Manager', 'Data Analyst', 'Marketing', 'Operations', 'Executive', 'Other'], phase: 1 },
  { id: 'experience', question: 'How experienced are you with AI assistants?', type: 'select', options: ['Beginner', 'Intermediate', 'Advanced', 'Expert'], phase: 1 },
  { id: 'industry', question: 'What industry do you work in?', type: 'text', phase: 1 },
  { id: 'tasks', question: 'What tasks do you most commonly need help with?', type: 'multiselect', options: ['Writing', 'Coding', 'Analysis', 'Research', 'Brainstorming', 'Planning', 'Communication', 'Learning'], phase: 1 },
  { id: 'tone', question: 'What communication style do you prefer?', type: 'select', options: ['Formal', 'Casual', 'Technical', 'Simple', 'Detailed', 'Concise'], phase: 1 },
  { id: 'format', question: 'How do you prefer responses formatted?', type: 'select', options: ['Bullet points', 'Paragraphs', 'Step-by-step', 'Tables', 'Mix of formats'], phase: 1 },
  { id: 'detail', question: 'How much detail do you typically want?', type: 'select', options: ['Brief overview', 'Moderate detail', 'Comprehensive', 'As much as possible'], phase: 1 },
  { id: 'feedback', question: 'Do you want Claude to ask clarifying questions?', type: 'select', options: ['Yes, always', 'Only when necessary', 'Rarely', 'No, just proceed'], phase: 1 },
  { id: 'codeStyle', question: 'If coding, what languages do you primarily use?', type: 'text', phase: 1 },
  { id: 'goals', question: 'What are your main goals using Claude?', type: 'textarea', phase: 1 },
  { id: 'challenges', question: 'What challenges do you face in your work?', type: 'textarea', phase: 1 },
  { id: 'tools', question: 'What tools/software do you use daily?', type: 'text', phase: 1 },
  { id: 'timezone', question: 'What timezone are you in?', type: 'text', phase: 1 },
  { id: 'availability', question: 'When do you typically work with Claude?', type: 'select', options: ['Morning', 'Afternoon', 'Evening', 'Night', 'Varies'], phase: 1 },
  { id: 'other', question: 'Anything else Claude should know about you?', type: 'textarea', phase: 1 },
];

// Phase 2: Role-specific questions (15 each)
const phase2QuestionsByRole: Record<string, Question[]> = {
  Developer: [
    { id: 'dev_frameworks', question: 'What frameworks do you use most?', type: 'text', phase: 2 },
    { id: 'dev_testing', question: 'What testing approach do you prefer?', type: 'select', options: ['TDD', 'BDD', 'Integration-first', 'Manual', 'Mixed approach'], phase: 2 },
    { id: 'dev_git', question: 'What is your Git workflow?', type: 'select', options: ['GitFlow', 'Trunk-based', 'Feature branches', 'GitHub Flow', 'Other'], phase: 2 },
    { id: 'dev_debugging', question: 'What debugging tools do you rely on?', type: 'text', phase: 2 },
    { id: 'dev_ide', question: 'What IDE/editor do you prefer?', type: 'text', phase: 2 },
    { id: 'dev_docs', question: 'How do you document your code?', type: 'select', options: ['Inline comments', 'README files', 'Documentation sites', 'JSDoc/TypeDoc', 'Minimal'], phase: 2 },
    { id: 'dev_review', question: 'How do you prefer code reviews?', type: 'select', options: ['Detailed line-by-line', 'High-level overview', 'Focus on architecture', 'Pair programming', 'Async reviews'], phase: 2 },
    { id: 'dev_deploy', question: 'What deployment practices do you use?', type: 'select', options: ['CI/CD pipelines', 'Manual deploys', 'Blue-green', 'Canary releases', 'Feature flags'], phase: 2 },
    { id: 'dev_errors', question: 'How do you handle errors in your code?', type: 'select', options: ['Try-catch everywhere', 'Error boundaries', 'Global handlers', 'Logging services', 'Custom error classes'], phase: 2 },
    { id: 'dev_perf', question: 'What performance optimization matters most?', type: 'select', options: ['Load time', 'Runtime speed', 'Memory usage', 'Bundle size', 'Database queries'], phase: 2 },
    { id: 'dev_security', question: 'What security practices do you follow?', type: 'multiselect', options: ['Input validation', 'Authentication', 'OWASP guidelines', 'Security audits', 'Dependency scanning'], phase: 2 },
    { id: 'dev_api', question: 'What API design style do you prefer?', type: 'select', options: ['REST', 'GraphQL', 'gRPC', 'WebSockets', 'Mix of styles'], phase: 2 },
    { id: 'dev_db', question: 'What databases do you work with?', type: 'text', phase: 2 },
    { id: 'dev_containers', question: 'Do you use containerization?', type: 'select', options: ['Docker', 'Kubernetes', 'Docker Compose', 'Podman', 'No containers'], phase: 2 },
    { id: 'dev_cicd', question: 'What CI/CD tools do you use?', type: 'text', phase: 2 },
  ],
  Designer: [
    { id: 'design_tools', question: 'What design tools do you use?', type: 'text', phase: 2 },
    { id: 'design_system', question: 'Do you use a design system?', type: 'select', options: ['Yes, custom', 'Yes, existing (Material, etc.)', 'Building one', 'No system'], phase: 2 },
    { id: 'design_prototype', question: 'How do you prototype?', type: 'select', options: ['Figma prototypes', 'InVision', 'Code prototypes', 'Paper sketches', 'Framer'], phase: 2 },
    { id: 'design_research', question: 'What user research methods do you use?', type: 'multiselect', options: ['Interviews', 'Surveys', 'Usability testing', 'Analytics', 'A/B testing', 'Card sorting'], phase: 2 },
    { id: 'design_a11y', question: 'How do you approach accessibility?', type: 'select', options: ['WCAG compliance', 'Screen reader testing', 'Color contrast checks', 'Keyboard navigation', 'All of above'], phase: 2 },
    { id: 'design_collab', question: 'How do you collaborate with developers?', type: 'select', options: ['Design specs', 'Pair sessions', 'Design tokens', 'Live handoff tools', 'Component libraries'], phase: 2 },
    { id: 'design_handoff', question: 'What is your handoff process?', type: 'textarea', phase: 2 },
    { id: 'design_motion', question: 'How do you handle animation/motion?', type: 'select', options: ['After Effects', 'Lottie', 'CSS animations', 'Rive', 'Minimal motion'], phase: 2 },
    { id: 'design_responsive', question: 'How do you approach responsive design?', type: 'select', options: ['Mobile-first', 'Desktop-first', 'Breakpoint systems', 'Fluid design', 'Component-based'], phase: 2 },
    { id: 'design_tokens', question: 'Do you use design tokens?', type: 'select', options: ['Yes, extensively', 'Some tokens', 'Learning', 'No'], phase: 2 },
    { id: 'design_version', question: 'How do you version your designs?', type: 'select', options: ['Figma versions', 'Git-based', 'Abstract', 'Manual naming', 'No versioning'], phase: 2 },
    { id: 'design_feedback', question: 'How do you gather design feedback?', type: 'select', options: ['Stakeholder reviews', 'User testing', 'Team critiques', 'Comments in tools', 'All methods'], phase: 2 },
    { id: 'design_critique', question: 'How do you prefer design critiques?', type: 'select', options: ['Structured sessions', 'Async feedback', 'Informal chats', '1:1 discussions', 'Group sessions'], phase: 2 },
    { id: 'design_brand', question: 'How do you maintain brand guidelines?', type: 'textarea', phase: 2 },
    { id: 'design_docs', question: 'How do you document designs?', type: 'select', options: ['Confluence/Notion', 'In-tool annotations', 'Separate specs', 'Video walkthroughs', 'Minimal docs'], phase: 2 },
  ],
  'Product Manager': [
    { id: 'pm_methodology', question: 'What methodology does your team use?', type: 'select', options: ['Agile/Scrum', 'Kanban', 'SAFe', 'Lean', 'Hybrid', 'Waterfall'], phase: 2 },
    { id: 'pm_metrics', question: 'What metrics do you track?', type: 'multiselect', options: ['NPS', 'DAU/MAU', 'Conversion', 'Revenue', 'Churn', 'Feature adoption'], phase: 2 },
    { id: 'pm_stakeholder', question: 'How do you communicate with stakeholders?', type: 'select', options: ['Weekly updates', 'Monthly reviews', 'Async docs', 'Ad-hoc meetings', 'Dashboard access'], phase: 2 },
    { id: 'pm_roadmap', question: 'How do you manage your roadmap?', type: 'select', options: ['Quarterly planning', 'Rolling roadmap', 'Theme-based', 'Now/Next/Later', 'OKR-aligned'], phase: 2 },
    { id: 'pm_prioritization', question: 'What prioritization framework do you use?', type: 'select', options: ['RICE', 'ICE', 'MoSCoW', 'Kano model', 'Value vs Effort', 'Custom'], phase: 2 },
    { id: 'pm_stories', question: 'How do you write user stories?', type: 'select', options: ['As a... I want...', 'Job stories', 'Problem statements', 'Feature specs', 'Mixed formats'], phase: 2 },
    { id: 'pm_sprints', question: 'What is your sprint planning like?', type: 'textarea', phase: 2 },
    { id: 'pm_backlog', question: 'How do you manage your backlog?', type: 'select', options: ['Regular grooming', 'Continuous refinement', 'Quarterly reviews', 'Minimal backlog', 'Theme buckets'], phase: 2 },
    { id: 'pm_competitor', question: 'How do you track competitors?', type: 'multiselect', options: ['Regular analysis', 'Feature tracking', 'Market research', 'Customer feedback', 'Win/loss analysis'], phase: 2 },
    { id: 'pm_validation', question: 'How do you validate features?', type: 'select', options: ['User interviews', 'Prototypes', 'Beta releases', 'A/B tests', 'Data analysis'], phase: 2 },
    { id: 'pm_launch', question: 'What is your launch process?', type: 'textarea', phase: 2 },
    { id: 'pm_feedback', question: 'How do you collect user feedback?', type: 'multiselect', options: ['In-app surveys', 'Support tickets', 'User interviews', 'Analytics', 'Community forums'], phase: 2 },
    { id: 'pm_crossfunc', question: 'How do you work cross-functionally?', type: 'select', options: ['Regular syncs', 'Embedded teams', 'Project-based', 'Matrix structure', 'Guilds/chapters'], phase: 2 },
    { id: 'pm_okrs', question: 'How do you set and track OKRs/KPIs?', type: 'textarea', phase: 2 },
    { id: 'pm_analytics', question: 'What analytics tools do you use?', type: 'text', phase: 2 },
  ],
  'Data Analyst': [
    { id: 'data_tools', question: 'What analysis tools do you use?', type: 'text', phase: 2 },
    { id: 'data_viz', question: 'What visualization tools do you prefer?', type: 'select', options: ['Tableau', 'Power BI', 'Looker', 'Metabase', 'Python libs', 'Excel'], phase: 2 },
    { id: 'data_sources', question: 'What data sources do you work with?', type: 'multiselect', options: ['SQL databases', 'Data warehouses', 'APIs', 'Spreadsheets', 'Streaming data', 'Logs'], phase: 2 },
    { id: 'data_sql', question: 'Rate your SQL proficiency', type: 'select', options: ['Basic queries', 'Intermediate (joins, subqueries)', 'Advanced (CTEs, window functions)', 'Expert (optimization, tuning)'], phase: 2 },
    { id: 'data_stats', question: 'What statistical methods do you use?', type: 'multiselect', options: ['Descriptive stats', 'Regression', 'Hypothesis testing', 'Time series', 'Clustering', 'ML models'], phase: 2 },
    { id: 'data_reporting', question: 'How often do you report?', type: 'select', options: ['Daily dashboards', 'Weekly reports', 'Monthly deep-dives', 'Ad-hoc analysis', 'Self-serve'], phase: 2 },
    { id: 'data_dashboards', question: 'How do you build dashboards?', type: 'textarea', phase: 2 },
    { id: 'data_cleaning', question: 'How do you handle data cleaning?', type: 'select', options: ['Python/pandas', 'SQL transformations', 'ETL tools', 'Spreadsheets', 'dbt'], phase: 2 },
    { id: 'data_etl', question: 'What ETL experience do you have?', type: 'text', phase: 2 },
    { id: 'data_modeling', question: 'What data modeling approach do you use?', type: 'select', options: ['Star schema', 'Snowflake schema', 'Data vault', 'Flat tables', 'Document-based'], phase: 2 },
    { id: 'data_presentation', question: 'How do you present findings?', type: 'select', options: ['Executive summaries', 'Detailed reports', 'Interactive dashboards', 'Presentations', 'Notebooks'], phase: 2 },
    { id: 'data_stakeholder', question: 'How do you work with stakeholders?', type: 'textarea', phase: 2 },
    { id: 'data_governance', question: 'How do you handle data governance?', type: 'select', options: ['Strict policies', 'Documentation', 'Access controls', 'Quality checks', 'Minimal governance'], phase: 2 },
    { id: 'data_ml', question: 'Do you work with machine learning?', type: 'select', options: ['Yes, regularly', 'Sometimes', 'Learning', 'No, but interested', 'No'], phase: 2 },
    { id: 'data_automation', question: 'How do you automate analysis?', type: 'text', phase: 2 },
  ],
  Marketing: [
    { id: 'mkt_channels', question: 'What marketing channels do you use?', type: 'multiselect', options: ['Email', 'Social media', 'Paid ads', 'Content/SEO', 'Events', 'Partnerships'], phase: 2 },
    { id: 'mkt_analytics', question: 'What analytics tools do you use?', type: 'text', phase: 2 },
    { id: 'mkt_campaigns', question: 'What types of campaigns do you run?', type: 'multiselect', options: ['Brand awareness', 'Lead gen', 'Product launches', 'Retention', 'ABM', 'Demand gen'], phase: 2 },
    { id: 'mkt_content', question: 'What content do you create?', type: 'multiselect', options: ['Blog posts', 'Videos', 'Podcasts', 'Ebooks', 'Case studies', 'Social content'], phase: 2 },
    { id: 'mkt_seo', question: 'What is your SEO approach?', type: 'select', options: ['Keyword-focused', 'Content clusters', 'Technical SEO', 'Link building', 'Local SEO', 'Mixed'], phase: 2 },
    { id: 'mkt_social', question: 'Which social platforms do you focus on?', type: 'multiselect', options: ['LinkedIn', 'Twitter/X', 'Instagram', 'Facebook', 'TikTok', 'YouTube'], phase: 2 },
    { id: 'mkt_email', question: 'How do you approach email marketing?', type: 'textarea', phase: 2 },
    { id: 'mkt_paid', question: 'What paid advertising do you manage?', type: 'multiselect', options: ['Google Ads', 'Facebook/Meta', 'LinkedIn Ads', 'Display', 'Retargeting', 'Programmatic'], phase: 2 },
    { id: 'mkt_attribution', question: 'What attribution model do you use?', type: 'select', options: ['Last-touch', 'First-touch', 'Multi-touch', 'Data-driven', 'Custom model'], phase: 2 },
    { id: 'mkt_testing', question: 'How do you run A/B tests?', type: 'select', options: ['Email tests', 'Landing pages', 'Ad creative', 'Full experiments', 'Minimal testing'], phase: 2 },
    { id: 'mkt_brand', question: 'How do you maintain brand voice?', type: 'textarea', phase: 2 },
    { id: 'mkt_segments', question: 'How do you segment audiences?', type: 'select', options: ['Demographics', 'Behavior', 'Firmographics', 'Intent signals', 'Custom segments'], phase: 2 },
    { id: 'mkt_automation', question: 'What marketing automation do you use?', type: 'text', phase: 2 },
    { id: 'mkt_metrics', question: 'What metrics matter most?', type: 'multiselect', options: ['CAC', 'LTV', 'Conversion rate', 'MQLs', 'Pipeline', 'Brand awareness'], phase: 2 },
    { id: 'mkt_competitor', question: 'How do you monitor competitors?', type: 'textarea', phase: 2 },
  ],
  Operations: [
    { id: 'ops_docs', question: 'How do you document processes?', type: 'select', options: ['SOPs', 'Wikis', 'Video guides', 'Flowcharts', 'Runbooks', 'Mixed'], phase: 2 },
    { id: 'ops_automation', question: 'What automation tools do you use?', type: 'text', phase: 2 },
    { id: 'ops_workflow', question: 'How do you manage workflows?', type: 'select', options: ['Project management tools', 'Custom workflows', 'Manual processes', 'Automation platforms', 'Hybrid'], phase: 2 },
    { id: 'ops_vendors', question: 'How do you manage vendors?', type: 'textarea', phase: 2 },
    { id: 'ops_compliance', question: 'What compliance requirements apply?', type: 'multiselect', options: ['GDPR', 'SOC 2', 'HIPAA', 'ISO 27001', 'Industry-specific', 'None'], phase: 2 },
    { id: 'ops_incident', question: 'How do you handle incidents?', type: 'select', options: ['On-call rotation', 'Incident commander', 'Escalation paths', 'War rooms', 'Post-mortems'], phase: 2 },
    { id: 'ops_capacity', question: 'How do you plan capacity?', type: 'select', options: ['Forecasting models', 'Buffer planning', 'Just-in-time', 'Demand signals', 'Historical data'], phase: 2 },
    { id: 'ops_resources', question: 'How do you allocate resources?', type: 'textarea', phase: 2 },
    { id: 'ops_sla', question: 'How do you manage SLAs?', type: 'select', options: ['Dashboards', 'Automated alerts', 'Regular reviews', 'Customer reports', 'Real-time monitoring'], phase: 2 },
    { id: 'ops_reporting', question: 'What reporting structure do you use?', type: 'select', options: ['Daily standups', 'Weekly reports', 'Monthly reviews', 'Real-time dashboards', 'Exception-based'], phase: 2 },
    { id: 'ops_change', question: 'How do you manage change?', type: 'select', options: ['Change advisory board', 'Approval workflows', 'Continuous deployment', 'Scheduled windows', 'Emergency only'], phase: 2 },
    { id: 'ops_risk', question: 'How do you assess risks?', type: 'select', options: ['Risk matrix', 'FMEA', 'Scenario planning', 'Regular audits', 'Automated scanning'], phase: 2 },
    { id: 'ops_budget', question: 'How do you track budgets?', type: 'textarea', phase: 2 },
    { id: 'ops_team', question: 'How do you coordinate teams?', type: 'select', options: ['Regular syncs', 'Async updates', 'Shared dashboards', 'Cross-functional pods', 'Matrix structure'], phase: 2 },
    { id: 'ops_improvement', question: 'How do you drive continuous improvement?', type: 'textarea', phase: 2 },
  ],
  Executive: [
    { id: 'exec_decisions', question: 'What decision-making framework do you use?', type: 'select', options: ['Data-driven', 'Consensus', 'RAPID', 'Intuition-based', 'Hybrid approach'], phase: 2 },
    { id: 'exec_reports', question: 'What reporting do you need?', type: 'multiselect', options: ['Executive dashboards', 'Financial reports', 'OKR progress', 'Team updates', 'Market intelligence'], phase: 2 },
    { id: 'exec_strategy', question: 'How do you approach strategic planning?', type: 'select', options: ['Annual planning', 'Rolling strategy', 'OKRs', 'Balanced scorecard', 'Scenario planning'], phase: 2 },
    { id: 'exec_board', question: 'How do you communicate with board/investors?', type: 'textarea', phase: 2 },
    { id: 'exec_delegate', question: 'How do you prefer to delegate?', type: 'select', options: ['Clear ownership', 'Collaborative', 'Milestone-based', 'Outcome-focused', 'Hands-on'], phase: 2 },
    { id: 'exec_meetings', question: 'What meeting formats work best?', type: 'select', options: ['Brief standups', 'Deep dives', 'Walking 1:1s', 'Skip levels', 'All-hands'], phase: 2 },
    { id: 'exec_info_density', question: 'What level of detail do you prefer?', type: 'select', options: ['Executive summary only', 'Key metrics + context', 'Detailed analysis', 'Exception-based', 'Varies by topic'], phase: 2 },
    { id: 'exec_risk', question: 'How do you think about risk?', type: 'select', options: ['Risk-averse', 'Calculated risks', 'High risk tolerance', 'Portfolio approach', 'Context-dependent'], phase: 2 },
    { id: 'exec_innovation', question: 'How do you drive innovation?', type: 'textarea', phase: 2 },
    { id: 'exec_structure', question: 'What org structure do you prefer?', type: 'select', options: ['Flat', 'Hierarchical', 'Matrix', 'Pods/squads', 'Hybrid'], phase: 2 },
    { id: 'exec_external', question: 'How do you manage external communications?', type: 'textarea', phase: 2 },
    { id: 'exec_industry', question: 'How do you track industry trends?', type: 'multiselect', options: ['News/publications', 'Conferences', 'Peer networks', 'Analyst reports', 'Advisory boards'], phase: 2 },
    { id: 'exec_investment', question: 'What investment criteria do you use?', type: 'textarea', phase: 2 },
    { id: 'exec_success', question: 'How do you define success?', type: 'textarea', phase: 2 },
    { id: 'exec_vision', question: 'How do you communicate vision?', type: 'select', options: ['All-hands', 'Written memos', 'Video updates', '1:1 cascades', 'Town halls'], phase: 2 },
  ],
  Other: [
    { id: 'other_work', question: 'Describe your typical work day', type: 'textarea', phase: 2 },
    { id: 'other_tools', question: 'What specialized tools do you use?', type: 'text', phase: 2 },
    { id: 'other_collab', question: 'Who do you collaborate with most?', type: 'text', phase: 2 },
    { id: 'other_output', question: 'What are your main deliverables?', type: 'textarea', phase: 2 },
    { id: 'other_metrics', question: 'How is your success measured?', type: 'textarea', phase: 2 },
    { id: 'other_learning', question: 'How do you stay current in your field?', type: 'text', phase: 2 },
    { id: 'other_challenges', question: 'What are your biggest daily challenges?', type: 'textarea', phase: 2 },
    { id: 'other_strengths', question: 'What are your key strengths?', type: 'textarea', phase: 2 },
    { id: 'other_improve', question: 'What would you like to improve?', type: 'textarea', phase: 2 },
    { id: 'other_projects', question: 'Describe your current main project', type: 'textarea', phase: 2 },
    { id: 'other_stakeholders', question: 'Who are your key stakeholders?', type: 'text', phase: 2 },
    { id: 'other_decisions', question: 'What decisions do you make frequently?', type: 'textarea', phase: 2 },
    { id: 'other_automation', question: 'What would you like to automate?', type: 'textarea', phase: 2 },
    { id: 'other_communication', question: 'How do you prefer to communicate?', type: 'select', options: ['Email', 'Slack/Teams', 'Meetings', 'Documents', 'Mixed'], phase: 2 },
    { id: 'other_ai_use', question: 'How do you currently use AI tools?', type: 'textarea', phase: 2 },
  ],
};

// Default skill templates
const defaultSkills: Skill[] = [
  { name: 'Web Scraping Expert', description: 'Specialized in extracting data from websites', template: 'You are an expert web scraper. Help me extract data from websites using Python, Beautiful Soup, Selenium, and other tools. Always provide clean, well-commented code.', isCustom: false },
  { name: 'Data Analyst', description: 'Analyze and visualize data', template: 'You are a data analysis expert. Help me analyze datasets, create visualizations, and derive insights. Use Python, pandas, and visualization libraries.', isCustom: false },
  { name: 'API Developer', description: 'Build and integrate APIs', template: 'You are an API development expert. Help me design, build, and integrate REST and GraphQL APIs. Focus on best practices, security, and documentation.', isCustom: false },
  { name: 'Content Writer', description: 'Create engaging content', template: 'You are a professional content writer. Help me create engaging, well-structured content for various platforms. Focus on clarity, engagement, and SEO.', isCustom: false },
  { name: 'Code Reviewer', description: 'Review and improve code quality', template: 'You are a code review expert. Analyze code for bugs, performance issues, security vulnerabilities, and suggest improvements. Be thorough but constructive.', isCustom: false },
  { name: 'Project Planner', description: 'Plan and organize projects', template: 'You are a project planning expert. Help me break down projects into tasks, create timelines, identify dependencies, and manage resources effectively.', isCustom: false },
];

// Project section templates
const projectSectionTemplates = [
  { title: 'Context', placeholder: 'Describe the project background, goals, and stakeholders...' },
  { title: 'Tech Stack', placeholder: 'List technologies, frameworks, and tools used...' },
  { title: 'Architecture', placeholder: 'Describe the system architecture and key components...' },
  { title: 'Database Schema', placeholder: 'Document database tables, relationships, and key fields...' },
  { title: 'API Endpoints', placeholder: 'List API routes, methods, and expected payloads...' },
  { title: 'UI/UX Guidelines', placeholder: 'Describe design system, components, and user flows...' },
  { title: 'Deployment', placeholder: 'Document deployment process, environments, and CI/CD...' },
  { title: 'Known Issues', placeholder: 'List current bugs, limitations, and technical debt...' },
];

export default function DashboardPage() {
  const { data: session } = useSession();
  const userEmail = session?.user?.email || '';

  const [activeTab, setActiveTab] = useState<Tab>('preferences');

  // Questionnaire state
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [phase, setPhase] = useState<1 | 2>(1);
  const [preferencesComplete, setPreferencesComplete] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);

  // Memory state
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [newMemory, setNewMemory] = useState({ category: 'Work', content: '' });

  // Skills state
  const [skills, setSkills] = useState<Skill[]>(defaultSkills);
  const [newSkill, setNewSkill] = useState({ name: '', description: '', template: '' });
  const [showSkillForm, setShowSkillForm] = useState(false);

  // Files state
  const [generatedFile, setGeneratedFile] = useState('');

  // Projects state
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [newProjectName, setNewProjectName] = useState('');

  // Convex mutations and queries
  const savePreferences = useMutation(api.preferences.savePreferences);
  const getPreferences = useQuery(api.preferences.getPreferences, userEmail ? { email: userEmail } : 'skip');
  const saveMemoriesMutation = useMutation(api.memories.saveMemories);
  const getMemoriesQuery = useQuery(api.memories.getMemories, userEmail ? { email: userEmail } : 'skip');
  const saveSkillsMutation = useMutation(api.skills.saveSkills);
  const getSkillsQuery = useQuery(api.skills.getSkills, userEmail ? { email: userEmail } : 'skip');
  const saveProjectMutation = useMutation(api.projects.saveProject);
  const getProjectsQuery = useQuery(api.projects.getProjects, userEmail ? { email: userEmail } : 'skip');
  const deleteProjectMutation = useMutation(api.projects.deleteProject);

  // Get current questions based on phase
  const currentQuestions = phase === 1
    ? phase1Questions
    : (phase2QuestionsByRole[answers.role as string] || phase2QuestionsByRole.Other);

  // Load data from Convex
  useEffect(() => {
    if (getPreferences) {
      setAnswers(getPreferences.answers || {});
      setPreferencesComplete(getPreferences.complete || false);
      if (getPreferences.phase === 2) {
        setPhase(2);
      }
    }
  }, [getPreferences]);

  useEffect(() => {
    if (getMemoriesQuery) {
      setMemories(getMemoriesQuery);
    }
  }, [getMemoriesQuery]);

  useEffect(() => {
    if (getSkillsQuery && getSkillsQuery.length > 0) {
      // Merge default skills with custom skills from database
      const customSkills = getSkillsQuery.filter((s: Skill) => s.isCustom);
      setSkills([...defaultSkills, ...customSkills]);
    }
  }, [getSkillsQuery]);

  useEffect(() => {
    if (getProjectsQuery) {
      setProjects(getProjectsQuery.map((p: { name: string; sections: ProjectSection[] }) => ({
        name: p.name,
        sections: p.sections,
      })));
    }
  }, [getProjectsQuery]);

  const handleAnswerChange = (questionId: string, value: string | string[]) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    setAiSuggestion(null);
  };

  const handleNextQuestion = async () => {
    if (currentQuestion < currentQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setAiSuggestion(null);
    } else if (phase === 1) {
      // Move to phase 2
      setPhase(2);
      setCurrentQuestion(0);
      setAiSuggestion(null);
      if (userEmail) {
        await savePreferences({ email: userEmail, answers, complete: false, phase: 2 });
        toast.success('Phase 1 complete! Moving to personalized questions.');
      }
    } else {
      // Complete questionnaire
      setPreferencesComplete(true);
      if (userEmail) {
        await savePreferences({ email: userEmail, answers, complete: true, phase: 2 });
        toast.success('Preferences saved successfully!');
      }
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
      setAiSuggestion(null);
    } else if (phase === 2) {
      // Go back to phase 1
      setPhase(1);
      setCurrentQuestion(phase1Questions.length - 1);
      setAiSuggestion(null);
    }
  };

  const fetchAISuggestion = async () => {
    setIsLoadingSuggestion(true);
    try {
      const response = await fetch('/api/claude/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: {
            role: answers.role,
            experience: answers.experience,
            industry: answers.industry,
            previousAnswers: answers,
          },
          question: currentQuestions[currentQuestion].question,
        }),
      });
      const data = await response.json();
      if (data.suggestion) {
        setAiSuggestion(data.suggestion);
      }
    } catch (error) {
      console.error('Failed to get AI suggestion:', error);
      toast.error('Failed to get AI suggestion');
    } finally {
      setIsLoadingSuggestion(false);
    }
  };

  const addMemory = async () => {
    if (newMemory.content.trim()) {
      const updated = [...memories, { ...newMemory, createdAt: Date.now() }];
      setMemories(updated);
      setNewMemory({ category: 'Work', content: '' });
      if (userEmail) {
        await saveMemoriesMutation({ email: userEmail, memories: updated });
        toast.success('Memory added!');
      }
    }
  };

  const deleteMemory = async (index: number) => {
    const updated = memories.filter((_, i) => i !== index);
    setMemories(updated);
    if (userEmail) {
      await saveMemoriesMutation({ email: userEmail, memories: updated });
      toast.success('Memory deleted');
    }
  };

  const addSkill = async () => {
    if (newSkill.name && newSkill.template) {
      const skill = { ...newSkill, isCustom: true };
      const updated = [...skills, skill];
      setSkills(updated);
      setNewSkill({ name: '', description: '', template: '' });
      setShowSkillForm(false);
      if (userEmail) {
        await saveSkillsMutation({ email: userEmail, skills: updated.filter(s => s.isCustom) });
        toast.success('Skill created!');
      }
    }
  };

  const deleteSkill = async (index: number) => {
    const updated = skills.filter((_, i) => i !== index);
    setSkills(updated);
    if (userEmail) {
      await saveSkillsMutation({ email: userEmail, skills: updated.filter(s => s.isCustom) });
      toast.success('Skill deleted');
    }
  };

  const generateClaudeFile = () => {
    let content = `# CLAUDE.md - ${session?.user?.name || 'User'}'s Configuration\n\n`;
    content += `Generated: ${new Date().toISOString()}\n\n`;

    content += `## Personal Preferences\n\n`;
    const allQuestions = [...phase1Questions, ...(phase2QuestionsByRole[answers.role as string] || [])];
    allQuestions.forEach(q => {
      const value = answers[q.id];
      if (value) {
        content += `**${q.question}**\n${Array.isArray(value) ? value.join(', ') : value}\n\n`;
      }
    });

    content += `## Memory Bank\n\n`;
    const groupedMemories = memories.reduce((acc, mem) => {
      if (!acc[mem.category]) acc[mem.category] = [];
      acc[mem.category].push(mem.content);
      return acc;
    }, {} as Record<string, string[]>);

    Object.entries(groupedMemories).forEach(([category, items]) => {
      content += `### ${category}\n`;
      items.forEach(item => content += `- ${item}\n`);
      content += '\n';
    });

    if (skills.filter(s => s.isCustom).length > 0) {
      content += `## Custom Skills\n\n`;
      skills.filter(s => s.isCustom).forEach(skill => {
        content += `### ${skill.name}\n${skill.description}\n\n\`\`\`\n${skill.template}\n\`\`\`\n\n`;
      });
    }

    setGeneratedFile(content);
    toast.success('CLAUDE.md generated!');
  };

  const createProject = async () => {
    if (newProjectName.trim()) {
      const newProject: Project = {
        name: newProjectName,
        sections: projectSectionTemplates.map(t => ({ title: t.title, content: '' })),
      };
      setProjects([...projects, newProject]);
      setActiveProject(newProject);
      setNewProjectName('');
      if (userEmail) {
        await saveProjectMutation({ email: userEmail, name: newProject.name, sections: newProject.sections });
        toast.success('Project created!');
      }
    }
  };

  const updateProjectSection = async (sectionIndex: number, content: string) => {
    if (activeProject) {
      const updated = {
        ...activeProject,
        sections: activeProject.sections.map((s, i) =>
          i === sectionIndex ? { ...s, content } : s
        ),
      };
      setActiveProject(updated);
      setProjects(projects.map(p => p.name === updated.name ? updated : p));
      if (userEmail) {
        await saveProjectMutation({ email: userEmail, name: updated.name, sections: updated.sections });
      }
    }
  };

  const deleteProject = async (projectName: string) => {
    setProjects(projects.filter(p => p.name !== projectName));
    if (activeProject?.name === projectName) {
      setActiveProject(null);
    }
    if (userEmail) {
      await deleteProjectMutation({ email: userEmail, name: projectName });
      toast.success('Project deleted');
    }
  };

  const exportProject = () => {
    if (!activeProject) return;

    let content = `# ${activeProject.name} - Project Documentation\n\n`;
    content += `Generated: ${new Date().toISOString()}\n\n`;

    activeProject.sections.forEach(section => {
      if (section.content.trim()) {
        content += `## ${section.title}\n\n${section.content}\n\n`;
      }
    });

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeProject.name.toLowerCase().replace(/\s+/g, '-')}-docs.md`;
    a.click();
    toast.success('Project exported!');
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    toast.success('File downloaded!');
  };

  const tabs = [
    { id: 'preferences', label: 'Personal Preferences', icon: User },
    { id: 'memory', label: 'Manage Memory', icon: Brain },
    { id: 'skills', label: 'Claude Skills', icon: Settings },
    { id: 'files', label: 'Memory Files', icon: FileText },
    { id: 'projects', label: 'Develop Projects', icon: FolderOpen },
  ];

  return (
    <>
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
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Personal Preferences Tab */}
        {activeTab === 'preferences' && (
          <div>
            {/* Header Card */}
            <div className="bg-white rounded-xl border p-6 mb-6">
              <h2 className="text-2xl font-bold mb-2">Personal Preferences - Adaptive Questionnaire</h2>
              <p className="text-gray-600 mb-4">Answer 15 discovery questions, then get personalized follow-ups!</p>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                <p className="text-sm text-blue-900 font-medium">How It Works:</p>
                <p className="text-sm text-blue-800">Phase 1: Answer 15 questions → Phase 2: AI generates personalized follow-ups → Phase 3: Export</p>
              </div>
            </div>

            {/* Questions */}
            <div className="space-y-6">
              {/* Section Headers and Questions */}
              {phase === 1 && (
                <>
                  {/* Section 1: About You */}
                  <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg">
                    <h3 className="font-bold text-orange-900">Section 1: About You</h3>
                  </div>
                  {phase1Questions.slice(0, 3).map((q, i) => (
                    <QuestionCard
                      key={q.id}
                      num={i + 1}
                      question={q}
                      answer={answers[q.id]}
                      onAnswerChange={handleAnswerChange}
                    />
                  ))}

                  {/* Section 2: How You Use Claude */}
                  <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg">
                    <h3 className="font-bold text-orange-900">Section 2: How You Use Claude</h3>
                  </div>
                  {phase1Questions.slice(3, 5).map((q, i) => (
                    <QuestionCard
                      key={q.id}
                      num={i + 4}
                      question={q}
                      answer={answers[q.id]}
                      onAnswerChange={handleAnswerChange}
                    />
                  ))}

                  {/* Section 3: Your Work Style */}
                  <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg">
                    <h3 className="font-bold text-orange-900">Section 3: Your Work Style</h3>
                  </div>
                  {phase1Questions.slice(5, 8).map((q, i) => (
                    <QuestionCard
                      key={q.id}
                      num={i + 6}
                      question={q}
                      answer={answers[q.id]}
                      onAnswerChange={handleAnswerChange}
                    />
                  ))}

                  {/* Section 4: Communication Preferences */}
                  <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg">
                    <h3 className="font-bold text-orange-900">Section 4: Communication Preferences</h3>
                  </div>
                  {phase1Questions.slice(8, 12).map((q, i) => (
                    <QuestionCard
                      key={q.id}
                      num={i + 9}
                      question={q}
                      answer={answers[q.id]}
                      onAnswerChange={handleAnswerChange}
                    />
                  ))}

                  {/* Section 5: Additional Context */}
                  <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg">
                    <h3 className="font-bold text-orange-900">Section 5: Additional Context</h3>
                  </div>
                  {phase1Questions.slice(12).map((q, i) => (
                    <QuestionCard
                      key={q.id}
                      num={i + 13}
                      question={q}
                      answer={answers[q.id]}
                      onAnswerChange={handleAnswerChange}
                    />
                  ))}
                </>
              )}

              {/* Phase 2 Questions */}
              {phase === 2 && (
                <>
                  <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg p-6">
                    <h3 className="font-bold text-xl mb-2">Your Personalized Questions</h3>
                    <p className="text-purple-100">Based on your role as {answers.role || 'your selection'}, here are questions tailored to YOU:</p>
                  </div>
                  <button
                    className="text-sm text-gray-500 hover:text-claude-orange"
                    onClick={() => setPhase(1)}
                  >
                    ← Back to Core Questions
                  </button>
                  {currentQuestions.map((q, i) => (
                    <QuestionCard
                      key={q.id}
                      num={i + 1}
                      question={q}
                      answer={answers[q.id]}
                      onAnswerChange={handleAnswerChange}
                    />
                  ))}
                </>
              )}

              {/* Generate/Save Button */}
              <div className="bg-purple-50 border border-purple-300 rounded-lg p-6 text-center">
                {phase === 1 ? (
                  <>
                    <h3 className="font-bold text-lg mb-2">Ready for Phase 2?</h3>
                    <p className="text-sm text-gray-700 mb-4">AI will generate personalized questions based on YOUR profile!</p>
                    <button
                      onClick={async () => {
                        if (userEmail) {
                          await savePreferences({ email: userEmail, answers, complete: false, phase: 1 });
                          toast.success('Phase 1 saved!');
                        }
                        setPhase(2);
                      }}
                      className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-bold"
                    >
                      Generate My Personalized Questions
                    </button>
                  </>
                ) : (
                  <>
                    <h3 className="font-bold text-lg mb-2 text-green-900">Complete!</h3>
                    <p className="text-sm text-gray-700 mb-4">Your preferences have been captured.</p>
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={async () => {
                          if (userEmail) {
                            await savePreferences({ email: userEmail, answers, complete: true, phase: 2 });
                            toast.success('All preferences saved!');
                            setPreferencesComplete(true);
                          }
                        }}
                        className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
                      >
                        Save All Preferences
                      </button>
                      <button
                        onClick={() => setActiveTab('files')}
                        className="px-6 py-2.5 bg-white border border-green-600 text-green-600 hover:bg-green-50 rounded-lg font-medium"
                      >
                        Export as CLAUDE.md
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Memory Tab - Manage & Refine Memory */}
        {activeTab === 'memory' && (
          <div>
            <div className="bg-white rounded-xl border p-6 mb-6">
              <h2 className="text-2xl font-bold mb-2">Manage & Refine Memory</h2>
              <p className="text-gray-600 mb-4">Paste your existing Claude memory, and AI will help you refine it!</p>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                <p className="text-sm text-blue-900 font-medium">How it works:</p>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside mt-2">
                  <li>Copy your memory from Claude.ai (Settings → Memory)</li>
                  <li>Paste it below</li>
                  <li>AI analyzes and suggests improvements</li>
                  <li>Edit with AI assistance</li>
                  <li>Export refined memory back to Claude</li>
                </ol>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium">Paste Your Current Claude Memory</label>
                    <button className="text-sm text-orange-600 hover:text-orange-700 font-medium">Clear</button>
                  </div>
                  <textarea
                    value={newMemory.content}
                    onChange={(e) => setNewMemory({ ...newMemory, content: e.target.value })}
                    rows={10}
                    placeholder={`Paste your Claude memory here...

Example:
Work context:
QueXopa operates a MEGA sweepstakes company...

Personal context:
QueXopa demonstrates strong technical curiosity...`}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-orange-600"
                  />
                </div>

                <button
                  onClick={addMemory}
                  className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium flex items-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  Analyze & Suggest Improvements
                </button>
              </div>
            </div>

            {/* AI Suggestions */}
            {memories.length > 0 && (
              <div className="space-y-4">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                  <h3 className="font-semibold text-purple-900 mb-4 flex items-center gap-2">
                    <span className="text-xl">🤖</span>
                    AI Analysis & Suggestions
                  </h3>

                  <div className="space-y-4">
                    <div className="bg-white rounded-lg p-4 border-l-4 border-yellow-500">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">💡</span>
                        <div>
                          <p className="font-medium text-gray-900 mb-1">Suggestion 1: Add specificity</p>
                          <p className="text-sm text-gray-700 mb-2">"Technical curiosity" is vague. Try: "Prefers complete, production-ready solutions with TypeScript and proper error handling"</p>
                          <button className="text-sm text-orange-600 hover:text-orange-700 font-medium">Apply this change</button>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">🏷️</span>
                        <div>
                          <p className="font-medium text-gray-900 mb-1">Suggestion 2: Add categories</p>
                          <p className="text-sm text-gray-700 mb-2">Organize memories into: "Work Context", "Technical Preferences", "Communication Style", "Current Projects"</p>
                          <button className="text-sm text-orange-600 hover:text-orange-700 font-medium">Auto-organize</button>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-4 border-l-4 border-green-500">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">➕</span>
                        <div>
                          <p className="font-medium text-gray-900 mb-1">Suggestion 3: Missing info</p>
                          <p className="text-sm text-gray-700 mb-2">Consider adding: Preferred programming languages, Communication timezone, Team collaboration style</p>
                          <button className="text-sm text-orange-600 hover:text-orange-700 font-medium">Add these entries</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border p-6">
                  <h3 className="font-semibold mb-4">Refined Memory (Editable)</h3>
                  <textarea
                    rows={12}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm mb-4 focus:ring-2 focus:ring-orange-600"
                    defaultValue={memories.map(m => `${m.category}:\n${m.content}`).join('\n\n')}
                  />

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        if (userEmail) {
                          saveMemoriesMutation({ email: userEmail, memories });
                          toast.success('Memory saved!');
                        }
                      }}
                      className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
                    >
                      Save Refined Memory
                    </button>
                    <button className="px-6 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">
                      Copy to Clipboard
                    </button>
                    <button className="px-6 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">
                      Export as .txt
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Skills Tab - Claude Skills Builder */}
        {activeTab === 'skills' && (
          <div>
            <div className="bg-white rounded-xl border p-6 mb-6">
              <h2 className="text-2xl font-bold mb-2">Claude Skills Builder</h2>
              <p className="text-gray-600">Create custom skills or use templates</p>
            </div>

            {/* AI Generator */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6 mb-6">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Wand2 className="w-6 h-6 text-purple-600" />
                AI Skill Generator
              </h3>
              <p className="text-sm text-gray-700 mb-4">Describe what you want → AI creates the complete skill</p>
              <textarea
                placeholder="e.g., 'Create a skill for writing compelling marketing emails for B2B SaaS companies'"
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-purple-600"
                value={newSkill.description}
                onChange={e => setNewSkill({ ...newSkill, description: e.target.value })}
              />
              <button
                onClick={() => setShowSkillForm(true)}
                className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium flex items-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Generate Skill with AI
              </button>
            </div>

            {/* Skill Form */}
            {showSkillForm && (
              <div className="bg-white rounded-xl border p-6 mb-6">
                <h3 className="font-semibold mb-4">Create Custom Skill</h3>
                <div className="space-y-4">
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600"
                    placeholder="Skill name (e.g., 'SQL Expert')"
                    value={newSkill.name}
                    onChange={e => setNewSkill({ ...newSkill, name: e.target.value })}
                  />
                  <textarea
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600"
                    placeholder="Skill template/prompt (e.g., 'You are an expert SQL developer...')"
                    rows={4}
                    value={newSkill.template}
                    onChange={e => setNewSkill({ ...newSkill, template: e.target.value })}
                  />
                  <div className="flex gap-3">
                    <button onClick={addSkill} className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium">
                      Save Skill
                    </button>
                    <button onClick={() => setShowSkillForm(false)} className="px-6 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Templates Grid */}
            <div className="grid grid-cols-2 gap-4">
              {skills.map((skill, index) => (
                <div key={index} className="bg-white rounded-lg border p-5 hover:border-orange-600 transition-colors cursor-pointer">
                  <div className="text-3xl mb-2">
                    {skill.name.includes('Scraping') ? '⚡' :
                     skill.name.includes('Data') ? '📊' :
                     skill.name.includes('API') ? '🔌' :
                     skill.name.includes('Content') ? '📝' :
                     skill.name.includes('Code') ? '🔍' :
                     skill.name.includes('Project') ? '📋' : '⚙️'}
                  </div>
                  <div className="flex items-start justify-between mb-1">
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
                  <button className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                    Use Template
                  </button>
                  {skill.isCustom && (
                    <span className="inline-block mt-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                      Custom
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Memory Files Tab - CLAUDE.md */}
        {activeTab === 'files' && (
          <div>
            <div className="bg-white rounded-xl border p-6 mb-6">
              <h2 className="text-2xl font-bold mb-2">Memory Files (CLAUDE.md)</h2>
              <p className="text-gray-600 mb-4">Create global or project-specific memory files</p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-900 font-medium mb-2">📄 What are Memory Files?</p>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li><strong>Global:</strong> Place in ~/.claude/ for all projects</li>
                  <li><strong>Project:</strong> Place in project root for that project only</li>
                  <li>Perfect for Claude Code autonomous development</li>
                </ul>
              </div>

              <button
                onClick={generateClaudeFile}
                className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create New CLAUDE.md
              </button>
            </div>

            {/* Generated/Example Files */}
            <div className="space-y-4">
              {generatedFile ? (
                <div className="bg-white rounded-lg border p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <span className="text-2xl">✅</span>
                      </div>
                      <div>
                        <h3 className="font-semibold">Generated CLAUDE.md</h3>
                        <p className="text-sm text-gray-600">Your personalized configuration</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => downloadFile(generatedFile, 'CLAUDE.md')}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                      <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Edit</button>
                    </div>
                  </div>
                  <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto max-h-[400px] overflow-y-auto">
                    {generatedFile}
                  </pre>
                </div>
              ) : (
                <div className="bg-white rounded-lg border p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <span className="text-2xl">🌍</span>
                      </div>
                      <div>
                        <h3 className="font-semibold">Global Development Rules</h3>
                        <p className="text-sm text-gray-600">Applied to all projects</p>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Edit</button>
                  </div>
                  <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto">
{`# Global Claude Rules

## Code Style
- TypeScript required
- ESLint + Prettier
- Comprehensive error handling

## Testing
- Unit tests for all functions
- Integration tests for API routes`}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Projects Tab - Develop Projects */}
        {activeTab === 'projects' && (
          <DevelopProjectsTab />
        )}
      </div>
    </>
  );
}

// TAB 5: Develop Projects - exact match to original design
function DevelopProjectsTab() {
  const [showUpload, setShowUpload] = useState(false);

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-3">
        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-bold mb-4">Projects</h3>
          <div className="p-3 bg-orange-600 text-white rounded-lg mb-2 cursor-pointer">📁 SaaS Dashboard</div>
          <div className="p-3 hover:bg-gray-50 rounded-lg cursor-pointer">📁 E-commerce</div>
        </div>
      </div>

      <div className="col-span-9 space-y-4">
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-2xl font-bold mb-2">SaaS Dashboard</h2>
          <div className="bg-gray-200 rounded-full h-2 mb-2">
            <div className="bg-orange-600 h-full rounded-full" style={{width: '33%'}}></div>
          </div>
          <p className="text-sm text-gray-600">2 of 6 sections completed</p>
        </div>

        {/* Context Section */}
        <div className="bg-white rounded-lg border-2 border-orange-600 p-5">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-semibold text-lg">1. Project Context</h3>
            <button onClick={() => setShowUpload(!showUpload)} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2">
              <span className="text-xl">✨</span>
              Generate with AI
            </button>
          </div>

          {showUpload && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900 font-medium mb-3">Let AI write this section for you:</p>
              <textarea placeholder="Describe your project... (e.g., 'A customer analytics dashboard for SaaS companies')" rows={3} className="w-full px-4 py-3 border rounded-lg mb-3" />
              <button className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
                Generate Context Section
              </button>
            </div>
          )}

          <textarea rows={6} placeholder="Or write manually..." className="w-full px-4 py-3 border rounded-lg" defaultValue={`# Project Context

## Purpose
Customer analytics dashboard for SaaS companies...

## Goals
- Real-time metrics visualization
- Custom report builder`} />
        </div>

        {/* Schema Section */}
        <div className="bg-white rounded-lg border p-5">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-semibold text-lg">3. Data Schema</h3>
            <button className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50">Edit</button>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <div className="text-4xl mb-3">📁</div>
            <p className="text-gray-700 font-medium mb-2">Upload Files or Describe</p>
            <p className="text-sm text-gray-600 mb-4">Upload: Database dumps, API responses, spreadsheets</p>
            <div className="flex gap-3 justify-center">
              <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
                Upload Files
              </button>
              <button className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50">
                Describe Instead
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-3">AI will analyze and generate schema</p>
          </div>
        </div>

        {/* UX Section */}
        <div className="bg-white rounded-lg border p-5">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-semibold text-lg">5. UX Guidelines</h3>
            <button className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50">Edit</button>
          </div>

          <div className="border-2 border-dashed border-purple-300 rounded-lg p-8 text-center">
            <div className="text-4xl mb-3">🎥</div>
            <p className="text-gray-700 font-medium mb-2">Upload User Flow Videos or Screenshots</p>
            <p className="text-sm text-gray-600 mb-4">AI will watch/analyze and generate UX guidelines</p>
            <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              Upload Videos/Screenshots
            </button>
            <p className="text-xs text-gray-500 mt-3">Supported: MP4, MOV, PNG, JPG</p>
          </div>
        </div>

        {/* UI Section */}
        <div className="bg-white rounded-lg border p-5">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-semibold text-lg">6. UI Guidelines</h3>
            <button className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50">Edit</button>
          </div>

          <div className="border-2 border-dashed border-green-300 rounded-lg p-8 text-center">
            <div className="text-4xl mb-3">🎨</div>
            <p className="text-gray-700 font-medium mb-2">Upload UI Screenshots You Like</p>
            <p className="text-sm text-gray-600 mb-4">AI will analyze: colors, spacing, typography, components</p>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              Upload UI Examples
            </button>
            <p className="text-xs text-gray-500 mt-3">AI generates design guidelines from your examples</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Question Card Component - matches original design
function QuestionCard({
  num,
  question,
  answer,
  onAnswerChange,
}: {
  num: number;
  question: { id: string; question: string; type: string; options?: string[] };
  answer: string | string[] | undefined;
  onAnswerChange: (id: string, value: string | string[]) => void;
}) {
  const [showOther, setShowOther] = useState(false);
  const [otherValue, setOtherValue] = useState('');

  return (
    <div className="bg-white rounded-lg border p-5 hover:border-orange-600 transition-colors">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-semibold flex-shrink-0">
          {num}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-medium mb-3">{question.question}</h3>

          {/* Text with AI Suggest */}
          {question.type === 'text' && (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type your answer..."
                value={(answer as string) || ''}
                onChange={e => onAnswerChange(question.id, e.target.value)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-orange-600"
              />
              <button className="px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 whitespace-nowrap">
                <Sparkles className="w-4 h-4 text-orange-600" />
                <span>AI Suggest</span>
              </button>
            </div>
          )}

          {/* Textarea */}
          {question.type === 'textarea' && (
            <textarea
              placeholder="Type your answer..."
              value={(answer as string) || ''}
              onChange={e => onAnswerChange(question.id, e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-orange-600"
            />
          )}

          {/* Radio (select) */}
          {question.type === 'select' && (
            <div className="space-y-2">
              {question.options?.map((opt, i) => (
                <label
                  key={i}
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    answer === opt ? 'border-orange-600 bg-orange-50' : 'hover:border-orange-600'
                  }`}
                >
                  <input
                    type="radio"
                    name={`q${question.id}`}
                    checked={answer === opt}
                    onChange={() => onAnswerChange(question.id, opt)}
                    className="w-5 h-5 text-orange-600"
                  />
                  <span>{opt}</span>
                </label>
              ))}
              {/* Other option */}
              <label
                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  showOther ? 'border-orange-600 bg-orange-50' : 'hover:border-orange-600'
                }`}
              >
                <input
                  type="radio"
                  name={`q${question.id}`}
                  checked={showOther}
                  onChange={() => setShowOther(true)}
                  className="w-5 h-5 text-orange-600"
                />
                <span>Other (please specify)</span>
              </label>
              {showOther && (
                <div className="ml-8 flex gap-2">
                  <span className="text-xl">✍️</span>
                  <input
                    type="text"
                    placeholder="Please describe..."
                    value={otherValue}
                    onChange={e => {
                      setOtherValue(e.target.value);
                      onAnswerChange(question.id, e.target.value);
                    }}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600"
                  />
                </div>
              )}
            </div>
          )}

          {/* Checkbox (multiselect) */}
          {question.type === 'multiselect' && (
            <div className="space-y-2">
              {question.options?.map((opt, i) => {
                const selected = ((answer as string[]) || []).includes(opt);
                return (
                  <label
                    key={i}
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      selected ? 'border-orange-600 bg-orange-50' : 'hover:border-orange-600'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => {
                        const current = (answer as string[]) || [];
                        const updated = selected
                          ? current.filter(v => v !== opt)
                          : [...current, opt];
                        onAnswerChange(question.id, updated);
                      }}
                      className="w-5 h-5 rounded text-orange-600"
                    />
                    <span>{opt}</span>
                  </label>
                );
              })}
              {/* Other option */}
              <label
                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  showOther ? 'border-orange-600 bg-orange-50' : 'hover:border-orange-600'
                }`}
              >
                <input
                  type="checkbox"
                  checked={showOther}
                  onChange={() => setShowOther(!showOther)}
                  className="w-5 h-5 rounded text-orange-600"
                />
                <span>Other (please specify)</span>
              </label>
              {showOther && (
                <div className="ml-8 flex gap-2">
                  <span className="text-xl">✍️</span>
                  <input
                    type="text"
                    placeholder="Please describe..."
                    value={otherValue}
                    onChange={e => {
                      setOtherValue(e.target.value);
                      const current = (answer as string[]) || [];
                      if (!current.includes(e.target.value) && e.target.value) {
                        onAnswerChange(question.id, [...current.filter(v => v !== otherValue), e.target.value]);
                      }
                    }}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
