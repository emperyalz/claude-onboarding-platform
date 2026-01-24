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
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Personal Preferences Tab */}
        {activeTab === 'preferences' && (
          <div className="max-w-2xl mx-auto">
            {!preferencesComplete ? (
              <div className="card">
                <div className="mb-6">
                  <div className="flex justify-between items-center text-sm text-gray-500 mb-2">
                    <span>
                      Phase {phase}: Question {currentQuestion + 1} of {currentQuestions.length}
                    </span>
                    <span className="text-claude-orange font-medium">
                      {phase === 1 ? 'Core Questions' : `${answers.role || 'Role'}-Specific`}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div
                      className="h-2 bg-claude-orange rounded-full transition-all"
                      style={{
                        width: `${((currentQuestion + 1) / currentQuestions.length) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Total progress: {phase === 1 ? currentQuestion + 1 : phase1Questions.length + currentQuestion + 1} of {phase1Questions.length + currentQuestions.length}
                  </div>
                </div>

                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-xl font-semibold">{currentQuestions[currentQuestion].question}</h2>
                  <button
                    onClick={fetchAISuggestion}
                    disabled={isLoadingSuggestion}
                    className="flex items-center gap-1 text-sm text-claude-orange hover:text-claude-orange/80 transition-colors ml-4"
                    title="Get AI suggestion"
                  >
                    {isLoadingSuggestion ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Wand2 className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">AI Suggest</span>
                  </button>
                </div>

                {aiSuggestion && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-claude-orange mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-700">{aiSuggestion}</p>
                        {currentQuestions[currentQuestion].type === 'text' || currentQuestions[currentQuestion].type === 'textarea' ? (
                          <button
                            onClick={() => handleAnswerChange(currentQuestions[currentQuestion].id, aiSuggestion)}
                            className="text-xs text-claude-orange hover:underline mt-1"
                          >
                            Use this suggestion
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )}

                {currentQuestions[currentQuestion].type === 'select' && (
                  <div className="space-y-2">
                    {currentQuestions[currentQuestion].options?.map(option => (
                      <button
                        key={option}
                        className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                          answers[currentQuestions[currentQuestion].id] === option
                            ? 'border-claude-orange bg-orange-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleAnswerChange(currentQuestions[currentQuestion].id, option)}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}

                {currentQuestions[currentQuestion].type === 'multiselect' && (
                  <div className="space-y-2">
                    {currentQuestions[currentQuestion].options?.map(option => {
                      const selected = ((answers[currentQuestions[currentQuestion].id] as string[]) || []).includes(option);
                      return (
                        <button
                          key={option}
                          className={`w-full text-left px-4 py-3 rounded-lg border transition-colors flex items-center gap-3 ${
                            selected
                              ? 'border-claude-orange bg-orange-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => {
                            const current = (answers[currentQuestions[currentQuestion].id] as string[]) || [];
                            const updated = selected
                              ? current.filter(v => v !== option)
                              : [...current, option];
                            handleAnswerChange(currentQuestions[currentQuestion].id, updated);
                          }}
                        >
                          <div
                            className={`w-5 h-5 rounded border flex items-center justify-center ${
                              selected ? 'bg-claude-orange border-claude-orange' : 'border-gray-300'
                            }`}
                          >
                            {selected && <Check className="w-3 h-3 text-white" />}
                          </div>
                          {option}
                        </button>
                      );
                    })}
                  </div>
                )}

                {currentQuestions[currentQuestion].type === 'text' && (
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Type your answer..."
                    value={(answers[currentQuestions[currentQuestion].id] as string) || ''}
                    onChange={e => handleAnswerChange(currentQuestions[currentQuestion].id, e.target.value)}
                  />
                )}

                {currentQuestions[currentQuestion].type === 'textarea' && (
                  <textarea
                    className="input-field min-h-[120px]"
                    placeholder="Type your answer..."
                    value={(answers[currentQuestions[currentQuestion].id] as string) || ''}
                    onChange={e => handleAnswerChange(currentQuestions[currentQuestion].id, e.target.value)}
                  />
                )}

                <div className="flex justify-between mt-6">
                  <button
                    className="btn-secondary"
                    onClick={handlePrevQuestion}
                    disabled={currentQuestion === 0 && phase === 1}
                  >
                    Previous
                  </button>
                  <button className="btn-primary" onClick={handleNextQuestion}>
                    {phase === 2 && currentQuestion === currentQuestions.length - 1
                      ? 'Complete'
                      : phase === 1 && currentQuestion === phase1Questions.length - 1
                      ? 'Continue to Phase 2'
                      : 'Next'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="card text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Preferences Complete!</h2>
                <p className="text-gray-600 mb-6">
                  Your personalization is ready. Generate your CLAUDE.md file in the Memory Files tab.
                </p>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setPreferencesComplete(false);
                    setPhase(1);
                    setCurrentQuestion(0);
                  }}
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
                  onChange={e => setNewMemory({ ...newMemory, category: e.target.value })}
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
                  onChange={e => setNewMemory({ ...newMemory, content: e.target.value })}
                  onKeyDown={e => e.key === 'Enter' && addMemory()}
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
                    onChange={e => setNewSkill({ ...newSkill, name: e.target.value })}
                  />
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Short description"
                    value={newSkill.description}
                    onChange={e => setNewSkill({ ...newSkill, description: e.target.value })}
                  />
                  <textarea
                    className="input-field min-h-[100px]"
                    placeholder="Skill template/prompt (e.g., 'You are an expert SQL developer...')"
                    value={newSkill.template}
                    onChange={e => setNewSkill({ ...newSkill, template: e.target.value })}
                  />
                  <div className="flex gap-3">
                    <button className="btn-primary" onClick={addSkill}>
                      Save Skill
                    </button>
                    <button className="btn-secondary" onClick={() => setShowSkillForm(false)}>
                      Cancel
                    </button>
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
                    <summary className="cursor-pointer text-claude-orange hover:underline">
                      View template
                    </summary>
                    <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-x-auto">
                      {skill.template}
                    </pre>
                  </details>
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

        {/* Memory Files Tab */}
        {activeTab === 'files' && (
          <div className="max-w-3xl mx-auto">
            <div className="card mb-6">
              <h2 className="text-lg font-semibold mb-4">Generate CLAUDE.md</h2>
              <p className="text-gray-600 mb-4">
                Create a configuration file that captures your preferences, memories, and skills. Use
                this file with Claude for personalized interactions.
              </p>
              <button
                className="btn-primary flex items-center gap-2"
                onClick={generateClaudeFile}
              >
                <FileText className="w-4 h-4" />
                Generate File
              </button>
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
                      onChange={e => setNewProjectName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && createProject()}
                    />
                    <button className="btn-primary" onClick={createProject}>
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {projects.map((project, index) => (
                      <div
                        key={index}
                        className={`flex items-center gap-2 ${
                          activeProject?.name === project.name
                            ? 'bg-claude-orange text-white rounded-lg'
                            : ''
                        }`}
                      >
                        <button
                          className={`flex-1 text-left px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                            activeProject?.name === project.name
                              ? ''
                              : 'hover:bg-gray-100'
                          }`}
                          onClick={() => setActiveProject(project)}
                        >
                          <FolderOpen className="w-4 h-4" />
                          {project.name}
                        </button>
                        <button
                          className={`p-2 rounded transition-colors ${
                            activeProject?.name === project.name
                              ? 'text-white/70 hover:text-white'
                              : 'text-gray-400 hover:text-red-500'
                          }`}
                          onClick={() => deleteProject(project.name)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
                            onChange={e => updateProjectSection(index, e.target.value)}
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
      </div>
    </>
  );
}
