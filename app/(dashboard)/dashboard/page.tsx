'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import toast from 'react-hot-toast';
import SessionSelector from '../../../components/SessionSelector';
import { useSessionContext } from '../../../contexts/SessionContext';
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
  Upload,
  Filter,
  ChevronDown,
  X,
  ArrowUpDown,
  Search,
  Edit3,
  Save,
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
  category: string;
  isCustom: boolean;
  createdAt?: number;
  icon?: string;
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

// Default skill templates - AI-generated comprehensive skills
const defaultSkills: Skill[] = [
  {
    name: 'Web Scraping Expert',
    description: 'Specialized in extracting data from websites',
    category: 'Data & Analytics',
    icon: '⚡',
    template: `You are an expert web scraper with deep knowledge of data extraction techniques. Your capabilities include:

**Technical Expertise:**
- Python libraries: Beautiful Soup, Scrapy, Selenium, Playwright, requests-html
- JavaScript: Puppeteer, Cheerio, Axios
- Handling anti-bot measures: rotating proxies, user-agent spoofing, CAPTCHA solving strategies
- Rate limiting and respectful scraping practices

**Best Practices:**
- Always check robots.txt before scraping
- Implement proper error handling and retry logic
- Structure extracted data in clean, normalized formats (JSON, CSV)
- Add comprehensive logging for debugging
- Include data validation and cleaning steps

**Output Format:**
- Provide complete, production-ready code with comments
- Include requirements.txt or package.json as needed
- Document any setup steps or environment variables required
- Suggest data storage solutions (databases, files)

When asked to scrape, first analyze the target site's structure and recommend the best approach.`,
    isCustom: false,
    createdAt: Date.now()
  },
  {
    name: 'Data Analyst',
    description: 'Analyze and visualize data',
    category: 'Data & Analytics',
    icon: '📊',
    template: `You are an expert data analyst skilled in transforming raw data into actionable insights. Your expertise includes:

**Analysis Capabilities:**
- Exploratory Data Analysis (EDA) with statistical summaries
- Hypothesis testing and A/B test analysis
- Trend analysis, seasonality detection, and forecasting
- Customer segmentation and cohort analysis
- Anomaly detection and outlier identification

**Technical Stack:**
- Python: pandas, numpy, scipy, statsmodels, scikit-learn
- Visualization: matplotlib, seaborn, plotly, altair
- SQL for data extraction and complex queries
- Excel/Google Sheets for quick analysis

**Deliverables:**
- Clear executive summaries with key findings
- Publication-ready visualizations with proper labels and legends
- Statistical significance tests with confidence intervals
- Reproducible analysis notebooks with documentation
- Actionable recommendations based on findings

**Communication Style:**
- Explain complex statistics in plain language
- Highlight business implications alongside technical findings
- Provide confidence levels for conclusions
- Suggest follow-up analyses when appropriate

Always start by understanding the business question before diving into analysis.`,
    isCustom: false,
    createdAt: Date.now()
  },
  {
    name: 'API Developer',
    description: 'Build and integrate APIs',
    category: 'Development',
    icon: '🔌',
    template: `You are an expert API developer specializing in designing, building, and integrating robust APIs. Your expertise includes:

**API Design:**
- RESTful API design following OpenAPI/Swagger specifications
- GraphQL schema design and resolver implementation
- gRPC for high-performance microservices
- WebSocket APIs for real-time applications
- API versioning strategies (URL, header, query param)

**Security Best Practices:**
- OAuth 2.0 and JWT authentication
- Rate limiting and throttling
- Input validation and sanitization
- CORS configuration
- API key management

**Documentation:**
- OpenAPI/Swagger documentation
- Postman collections with examples
- Code samples in multiple languages
- Authentication flow diagrams
- Error code reference guides

**Integration Patterns:**
- Webhook implementations
- Polling vs. push strategies
- Idempotency for reliable operations
- Pagination strategies (cursor, offset)
- Caching strategies (ETags, Cache-Control)

**Code Quality:**
- Comprehensive error handling with meaningful messages
- Request/response logging
- Health check endpoints
- Graceful degradation patterns

Provide production-ready code with proper structure and testing considerations.`,
    isCustom: false,
    createdAt: Date.now()
  },
  {
    name: 'Content Writer',
    description: 'Create engaging content',
    category: 'Writing & Communication',
    icon: '📝',
    template: `You are a professional content writer and strategist skilled in creating compelling content across multiple formats. Your expertise includes:

**Content Types:**
- Blog posts and articles (SEO-optimized)
- Technical documentation and guides
- Marketing copy (landing pages, ads, email)
- Social media content
- Case studies and white papers
- Product descriptions and UX copy

**Writing Principles:**
- Hook readers with compelling openings
- Use clear, scannable formatting (headers, bullets, short paragraphs)
- Match tone and voice to target audience
- Include actionable takeaways
- End with clear calls-to-action

**SEO Best Practices:**
- Keyword research and natural integration
- Meta descriptions and title tags
- Internal linking strategies
- Featured snippet optimization
- Readability scoring (Flesch-Kincaid)

**Content Structure:**
- AIDA framework (Attention, Interest, Desire, Action)
- PAS framework (Problem, Agitation, Solution)
- Inverted pyramid for news-style content
- Storytelling techniques for engagement

**Quality Checks:**
- Grammar and style consistency
- Fact verification
- Plagiarism awareness
- Brand voice alignment
- Accessibility considerations

Always ask about target audience, goals, and desired tone before writing.`,
    isCustom: false,
    createdAt: Date.now()
  },
  {
    name: 'Code Reviewer',
    description: 'Review and improve code quality',
    category: 'Development',
    icon: '🔍',
    template: `You are an expert code reviewer focused on improving code quality, security, and maintainability. Your review approach includes:

**Review Categories:**
1. **Correctness:** Logic errors, edge cases, off-by-one errors
2. **Security:** OWASP Top 10, injection vulnerabilities, authentication flaws
3. **Performance:** Time/space complexity, N+1 queries, memory leaks
4. **Maintainability:** Code clarity, naming, documentation
5. **Architecture:** Design patterns, separation of concerns, coupling

**Review Format:**
- 🔴 **Critical:** Must fix before merge (security, correctness)
- 🟡 **Important:** Should fix (performance, maintainability)
- 🟢 **Suggestion:** Nice to have (style, optimization)
- 💡 **Learning:** Educational notes for the author

**Feedback Style:**
- Be specific with line references and examples
- Explain the "why" behind suggestions
- Offer concrete alternatives, not just criticism
- Acknowledge good patterns and practices
- Consider context and constraints

**Common Patterns to Check:**
- Error handling completeness
- Input validation and sanitization
- Logging and observability
- Test coverage gaps
- Documentation accuracy
- Dependency versions and security

**Language-Specific:**
- Apply language idioms and best practices
- Check for modern syntax usage
- Verify type safety where applicable
- Assess library/framework usage

Always balance thoroughness with pragmatism—not everything needs to be perfect.`,
    isCustom: false,
    createdAt: Date.now()
  },
  {
    name: 'Project Planner',
    description: 'Plan and organize projects',
    category: 'Productivity',
    icon: '📋',
    template: `You are an expert project planner skilled in breaking down complex projects into actionable plans. Your expertise includes:

**Planning Frameworks:**
- Work Breakdown Structure (WBS)
- Agile sprint planning and story mapping
- Gantt chart creation and critical path analysis
- PERT estimation (optimistic, pessimistic, most likely)
- MoSCoW prioritization (Must, Should, Could, Won't)

**Deliverables:**
- Clear project scope and objectives
- Task breakdown with dependencies
- Resource allocation recommendations
- Risk identification and mitigation strategies
- Milestone definitions and success criteria
- Communication and reporting plans

**Estimation Techniques:**
- T-shirt sizing for initial estimates
- Story point calibration
- Three-point estimation
- Historical data comparison
- Buffer allocation strategies

**Tools Integration:**
- Jira/Linear epic and story structure
- Notion/Confluence documentation templates
- GitHub project board organization
- Asana/Monday.com task hierarchies

**Best Practices:**
- Start with clear definition of done
- Identify blockers and dependencies early
- Build in contingency time (15-25%)
- Plan for iterations and feedback loops
- Include stakeholder review checkpoints

**Output Format:**
- Executive summary with key milestones
- Detailed task list with estimates
- Dependency diagram
- Resource requirements
- Risk register

Always clarify scope, constraints, and success metrics before planning.`,
    isCustom: false,
    createdAt: Date.now()
  },
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
  const [newSkill, setNewSkill] = useState({ name: '', description: '', template: '', category: '' });
  const [showSkillForm, setShowSkillForm] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);

  // Skills filter state
  const [skillSearchQuery, setSkillSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [skillSortBy, setSkillSortBy] = useState<'recent' | 'name-asc' | 'name-desc' | 'oldest'>('recent');
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [showSortFilter, setShowSortFilter] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

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
      // Handle backward compatibility for skills without new fields
      interface LegacySkill {
        name: string;
        description: string;
        template: string;
        category?: string;
        isCustom: boolean;
        createdAt?: number;
        icon?: string;
      }
      const customSkills = getSkillsQuery
        .filter((s: LegacySkill) => s.isCustom)
        .map((s: LegacySkill): Skill => ({
          name: s.name,
          description: s.description,
          template: s.template,
          category: s.category || 'Other',
          isCustom: s.isCustom,
          createdAt: s.createdAt || Date.now(),
          icon: s.icon || '⚙️'
        }));
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

  // Session Context integration - sync current tab data with header save button
  const {
    setUserEmail: ctxSetUserEmail,
    setCurrentTabType: ctxSetCurrentTabType,
    setCurrentData: ctxSetCurrentData,
    setOnLoadSessionCallback: ctxSetOnLoadSessionCallback,
  } = useSessionContext();

  // Set user email in context (only when email changes)
  useEffect(() => {
    if (userEmail) {
      ctxSetUserEmail(userEmail);
    }
  }, [userEmail, ctxSetUserEmail]);

  // Update context when tab changes
  useEffect(() => {
    ctxSetCurrentTabType(activeTab);
  }, [activeTab, ctxSetCurrentTabType]);

  // Update context with current tab data - use a ref to avoid infinite loops
  const currentDataRef = useRef<unknown>(null);

  useEffect(() => {
    let newData: unknown;
    switch (activeTab) {
      case 'preferences':
        newData = { answers, phase };
        break;
      case 'memory':
        newData = { memories, newMemory };
        break;
      case 'skills':
        newData = { skills, newSkill, showSkillForm };
        break;
      case 'files':
        newData = { generatedFile };
        break;
      case 'projects':
        newData = { projects, activeProject };
        break;
      default:
        newData = {};
    }

    // Only update if data actually changed (simple JSON comparison)
    const newDataStr = JSON.stringify(newData);
    const currentDataStr = JSON.stringify(currentDataRef.current);
    if (newDataStr !== currentDataStr) {
      currentDataRef.current = newData;
      ctxSetCurrentData(newData);
    }
  }, [activeTab, answers, phase, memories, newMemory, skills, newSkill, showSkillForm, generatedFile, projects, activeProject, ctxSetCurrentData]);

  // Handle loading session data from context
  const handleLoadSessionFromContext = useCallback((data: unknown) => {
    switch (activeTab) {
      case 'preferences': {
        const sessionData = data as { answers: Record<string, string | string[]>; phase: 1 | 2 };
        setAnswers(sessionData.answers || {});
        setPhase(sessionData.phase || 1);
        break;
      }
      case 'memory': {
        const sessionData = data as { memories: MemoryEntry[]; newMemory: { category: string; content: string } };
        setMemories(sessionData.memories || []);
        setNewMemory(sessionData.newMemory || { category: 'Work', content: '' });
        break;
      }
      case 'skills': {
        const sessionData = data as { skills: Skill[]; newSkill: { name: string; description: string; template: string; category: string }; showSkillForm: boolean };
        setSkills(sessionData.skills || defaultSkills);
        setNewSkill(sessionData.newSkill || { name: '', description: '', template: '', category: '' });
        setShowSkillForm(sessionData.showSkillForm || false);
        break;
      }
      case 'files': {
        const sessionData = data as { generatedFile: string };
        setGeneratedFile(sessionData.generatedFile || '');
        break;
      }
      case 'projects': {
        const sessionData = data as { projects: Project[]; activeProject: Project | null };
        setProjects(sessionData.projects || []);
        setActiveProject(sessionData.activeProject || null);
        break;
      }
    }
  }, [activeTab]);

  // Register the load callback with context
  useEffect(() => {
    ctxSetOnLoadSessionCallback(() => handleLoadSessionFromContext);
    return () => ctxSetOnLoadSessionCallback(null);
  }, [handleLoadSessionFromContext, ctxSetOnLoadSessionCallback]);

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
    if (newSkill.name && newSkill.template && newSkill.category) {
      const skill: Skill = {
        ...newSkill,
        isCustom: true,
        createdAt: Date.now(),
        icon: '⚙️'
      };
      const updated = [...skills, skill];
      setSkills(updated);
      setNewSkill({ name: '', description: '', template: '', category: '' });
      setShowSkillForm(false);
      setEditingSkill(null);
      if (userEmail) {
        await saveSkillsMutation({ email: userEmail, skills: updated.filter(s => s.isCustom) });
        toast.success('Skill created!');
      }
    } else {
      toast.error('Please fill in all required fields');
    }
  };

  const useTemplate = (skill: Skill) => {
    setNewSkill({
      name: skill.name,
      description: skill.description,
      template: skill.template,
      category: skill.category
    });
    setShowSkillForm(true);
    toast.success(`Loaded "${skill.name}" template - customize it as needed!`);
  };

  const handleSkillImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('email', userEmail);

      const response = await fetch('/api/skills/import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (result.success && result.skills) {
        const importedSkills: Skill[] = result.skills.map((s: Partial<Skill>) => ({
          ...s,
          isCustom: true,
          createdAt: Date.now(),
          icon: s.icon || '📦'
        }));
        const updated = [...skills, ...importedSkills];
        setSkills(updated);
        if (userEmail) {
          await saveSkillsMutation({ email: userEmail, skills: updated.filter(s => s.isCustom) });
        }
        toast.success(`Imported ${importedSkills.length} skill(s)!`);
      } else {
        toast.error(result.error || 'Failed to import skills');
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import skills');
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  // Get unique categories from skills
  const allCategories = Array.from(new Set(skills.map(s => s.category).filter(Boolean)));

  // Filter and sort skills
  const filteredSkills = skills
    .filter(skill => {
      const matchesSearch = !skillSearchQuery ||
        skill.name.toLowerCase().includes(skillSearchQuery.toLowerCase()) ||
        skill.description.toLowerCase().includes(skillSearchQuery.toLowerCase());
      const matchesCategory = selectedCategories.length === 0 ||
        selectedCategories.includes(skill.category);
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (skillSortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'oldest':
          return (a.createdAt || 0) - (b.createdAt || 0);
        case 'recent':
        default:
          return (b.createdAt || 0) - (a.createdAt || 0);
      }
    });

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  };

  const deleteSkill = async (index: number) => {
    const updated = skills.filter((_, i) => i !== index);
    setSkills(updated);
    if (userEmail) {
      await saveSkillsMutation({ email: userEmail, skills: updated.filter(s => s.isCustom) });
      toast.success('Skill deleted');
    }
  };

  // Generate CLAUDE.md content (returns string, doesn't set state)
  const generateClaudeFileContent = useCallback(() => {
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

    return content;
  }, [session?.user?.name, answers, memories, skills]);

  // Generate and set to state (used by Memory Files tab button)
  const generateClaudeFile = () => {
    const content = generateClaudeFileContent();
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
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Personal Preferences - Adaptive Questionnaire</h2>
                  <p className="text-gray-600">Answer 15 discovery questions, then get personalized follow-ups!</p>
                </div>
                {userEmail && (
                  <SessionSelector
                    userEmail={userEmail}
                    tabType="preferences"
                    currentData={{ answers, phase }}
                    onLoadSession={(data: unknown) => {
                      const sessionData = data as { answers: Record<string, string | string[]>; phase: 1 | 2 };
                      setAnswers(sessionData.answers || {});
                      setPhase(sessionData.phase || 1);
                    }}
                    tabLabel="session"
                  />
                )}
              </div>
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
                      context={answers}
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
                      context={answers}
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
                      context={answers}
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
                      context={answers}
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
                      context={answers}
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
                      context={answers}
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
                      <ExportClaudeDropdown
                        onDirectDownload={() => {
                          // Generate and download immediately
                          const content = generateClaudeFileContent();
                          downloadFile(content, 'CLAUDE.md');
                          toast.success('CLAUDE.md downloaded!');
                        }}
                        onReviewEdit={() => {
                          // Generate content and navigate to files tab
                          const content = generateClaudeFileContent();
                          setGeneratedFile(content);
                          setActiveTab('files');
                          toast.success('CLAUDE.md generated! Review and edit below.');
                        }}
                      />
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
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Manage & Refine Memory</h2>
                  <p className="text-gray-600">Paste your existing Claude memory, and AI will help you refine it!</p>
                </div>
                {userEmail && (
                  <SessionSelector
                    userEmail={userEmail}
                    tabType="memory"
                    currentData={{ memories, newMemory }}
                    onLoadSession={(data: unknown) => {
                      const sessionData = data as { memories: MemoryEntry[]; newMemory: { category: string; content: string } };
                      setMemories(sessionData.memories || []);
                      setNewMemory(sessionData.newMemory || { category: 'Work', content: '' });
                    }}
                    tabLabel="memory session"
                  />
                )}
              </div>

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
            {/* Header */}
            <div className="bg-white rounded-xl border p-6 mb-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Claude Skills Builder</h2>
                  <p className="text-gray-600">Create custom skills, use templates, or import from external sources</p>
                </div>
                {userEmail && (
                  <SessionSelector
                    userEmail={userEmail}
                    tabType="skills"
                    currentData={{ skills, newSkill, showSkillForm }}
                    onLoadSession={(data: unknown) => {
                      const sessionData = data as { skills: Skill[]; newSkill: { name: string; description: string; template: string; category: string }; showSkillForm: boolean };
                      setSkills(sessionData.skills || defaultSkills);
                      setNewSkill(sessionData.newSkill || { name: '', description: '', template: '', category: '' });
                      setShowSkillForm(sessionData.showSkillForm || false);
                    }}
                    tabLabel="skill session"
                  />
                )}
              </div>
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
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSkillForm(true)}
                  className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium flex items-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  Generate Skill with AI
                </button>
                <label className="px-6 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium flex items-center gap-2 cursor-pointer">
                  <Upload className="w-5 h-5 text-gray-600" />
                  {isImporting ? 'Importing...' : 'Import Skills'}
                  <input
                    type="file"
                    accept=".zip,.md"
                    onChange={handleSkillImport}
                    className="hidden"
                    disabled={isImporting}
                  />
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-2">Import: .zip packages or SKILL.md files from skillsmp.com or other sources</p>
            </div>

            {/* Skill Form Modal */}
            {showSkillForm && (
              <div className="bg-white rounded-xl border-2 border-orange-300 p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-lg">{editingSkill ? 'Edit Skill' : 'Create Custom Skill'}</h3>
                  <button
                    onClick={() => {
                      setShowSkillForm(false);
                      setEditingSkill(null);
                      setNewSkill({ name: '', description: '', template: '', category: '' });
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Skill Name *</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600"
                        placeholder="e.g., 'SQL Expert'"
                        value={newSkill.name}
                        onChange={e => setNewSkill({ ...newSkill, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                      <select
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600"
                        value={newSkill.category}
                        onChange={e => setNewSkill({ ...newSkill, category: e.target.value })}
                      >
                        <option value="">Select category...</option>
                        <option value="Data & Analytics">Data & Analytics</option>
                        <option value="Development">Development</option>
                        <option value="Writing & Communication">Writing & Communication</option>
                        <option value="Productivity">Productivity</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Design">Design</option>
                        <option value="Research">Research</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600"
                      placeholder="Brief description of what this skill does"
                      value={newSkill.description}
                      onChange={e => setNewSkill({ ...newSkill, description: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Skill Template/Prompt *</label>
                    <textarea
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600 font-mono text-sm"
                      placeholder="You are an expert... (define the skill's capabilities, knowledge, and behavior)"
                      rows={8}
                      value={newSkill.template}
                      onChange={e => setNewSkill({ ...newSkill, template: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={addSkill}
                      className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      {editingSkill ? 'Update Skill' : 'Save Skill'}
                    </button>
                    <button
                      onClick={() => {
                        setShowSkillForm(false);
                        setEditingSkill(null);
                        setNewSkill({ name: '', description: '', template: '', category: '' });
                      }}
                      className="px-6 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Filters Bar */}
            <div className="bg-white rounded-lg border p-4 mb-6">
              <div className="flex flex-wrap items-center gap-4">
                {/* Search */}
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search skills..."
                      value={skillSearchQuery}
                      onChange={e => setSkillSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600"
                    />
                  </div>
                </div>

                {/* Category Filter */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowCategoryFilter(!showCategoryFilter);
                      setShowSortFilter(false);
                    }}
                    className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                      selectedCategories.length > 0
                        ? 'bg-orange-50 border-orange-300 text-orange-700'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Filter className="w-4 h-4" />
                    Category
                    {selectedCategories.length > 0 && (
                      <span className="bg-orange-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                        {selectedCategories.length}
                      </span>
                    )}
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  {showCategoryFilter && (
                    <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border z-50">
                      <div className="p-3 border-b">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">Filter by Category</span>
                          {selectedCategories.length > 0 && (
                            <button
                              onClick={() => setSelectedCategories([])}
                              className="text-xs text-orange-600 hover:text-orange-700"
                            >
                              Clear all
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="p-2 max-h-64 overflow-y-auto">
                        {allCategories.map(category => (
                          <label
                            key={category}
                            className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedCategories.includes(category)}
                              onChange={() => toggleCategory(category)}
                              className="w-4 h-4 rounded text-orange-600"
                            />
                            <span className="text-sm">{category}</span>
                            <span className="ml-auto text-xs text-gray-400">
                              ({skills.filter(s => s.category === category).length})
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Sort Filter */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowSortFilter(!showSortFilter);
                      setShowCategoryFilter(false);
                    }}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <ArrowUpDown className="w-4 h-4" />
                    {skillSortBy === 'recent' && 'Most Recent'}
                    {skillSortBy === 'name-asc' && 'Name A-Z'}
                    {skillSortBy === 'name-desc' && 'Name Z-A'}
                    {skillSortBy === 'oldest' && 'Oldest'}
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  {showSortFilter && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-50">
                      {[
                        { value: 'recent', label: 'Most Recent' },
                        { value: 'name-asc', label: 'Name A-Z' },
                        { value: 'name-desc', label: 'Name Z-A' },
                        { value: 'oldest', label: 'Oldest' },
                      ].map(option => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setSkillSortBy(option.value as typeof skillSortBy);
                            setShowSortFilter(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                            skillSortBy === option.value ? 'bg-orange-50 text-orange-700' : ''
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Results count */}
                <span className="text-sm text-gray-500">
                  {filteredSkills.length} skill{filteredSkills.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Active filters */}
              {selectedCategories.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
                  {selectedCategories.map(cat => (
                    <span
                      key={cat}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm"
                    >
                      {cat}
                      <button
                        onClick={() => toggleCategory(cat)}
                        className="hover:text-orange-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Skills Grid */}
            <div className="grid grid-cols-2 gap-4">
              {filteredSkills.map((skill, index) => (
                <div
                  key={`${skill.name}-${index}`}
                  className="bg-white rounded-lg border p-5 hover:border-orange-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{skill.icon || '⚙️'}</div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{skill.name}</h3>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          {skill.category}
                        </span>
                      </div>
                    </div>
                    {skill.isCustom && (
                      <div className="flex items-center gap-1">
                        <button
                          className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded"
                          onClick={() => {
                            setNewSkill({
                              name: skill.name,
                              description: skill.description,
                              template: skill.template,
                              category: skill.category
                            });
                            setEditingSkill(skill);
                            setShowSkillForm(true);
                          }}
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                          onClick={() => deleteSkill(index)}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{skill.description}</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => useTemplate(skill)}
                      className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-orange-50 hover:border-orange-300 transition-colors font-medium text-sm"
                    >
                      Use Template
                    </button>
                    {skill.isCustom && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                        Custom
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Empty state */}
            {filteredSkills.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg border">
                <div className="text-4xl mb-3">🔍</div>
                <h3 className="font-semibold text-gray-900 mb-2">No skills found</h3>
                <p className="text-gray-600 mb-4">
                  {selectedCategories.length > 0 || skillSearchQuery
                    ? 'Try adjusting your filters or search query'
                    : 'Create your first skill or import from external sources'}
                </p>
                <button
                  onClick={() => {
                    setSelectedCategories([]);
                    setSkillSearchQuery('');
                  }}
                  className="text-orange-600 hover:text-orange-700 font-medium"
                >
                  Clear filters
                </button>
              </div>
            )}

            {/* Click outside to close dropdowns */}
            {(showCategoryFilter || showSortFilter) && (
              <div
                className="fixed inset-0 z-40"
                onClick={() => {
                  setShowCategoryFilter(false);
                  setShowSortFilter(false);
                }}
              />
            )}
          </div>
        )}

        {/* Memory Files Tab - CLAUDE.md */}
        {activeTab === 'files' && (
          <div>
            <div className="bg-white rounded-xl border p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Memory Files (CLAUDE.md)</h2>
                  <p className="text-gray-600">Create global or project-specific memory files</p>
                </div>
                {userEmail && (
                  <SessionSelector
                    userEmail={userEmail}
                    tabType="files"
                    currentData={{ generatedFile }}
                    onLoadSession={(data: unknown) => {
                      const sessionData = data as { generatedFile: string };
                      setGeneratedFile(sessionData.generatedFile || '');
                    }}
                    tabLabel="file session"
                  />
                )}
              </div>

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
          <DevelopProjectsTab userEmail={userEmail} />
        )}
      </div>
    </>
  );
}

// Project Session Manager - Compact Sidebar Component
function ProjectSessionManager({
  userEmail,
  projects,
  activeProjectName,
  onLoadSession,
}: {
  userEmail: string;
  projects: Project[];
  activeProjectName: string | null;
  onLoadSession: (projects: Project[], activeProject: string | null) => void;
}) {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Convex hooks
  const sessions = useQuery(
    api.sessions.getSessionsByTab,
    userEmail ? { email: userEmail, tabType: 'projects' } : 'skip'
  ) as Array<{ _id: string; name: string; data: unknown; updatedAt: number }> | undefined;

  const createSession = useMutation(api.sessions.createSession);
  const deleteSessionMutation = useMutation(api.sessions.deleteSession);

  const handleSave = async () => {
    if (!sessionName.trim()) {
      toast.error('Please enter a session name');
      return;
    }
    setIsSaving(true);
    try {
      await createSession({
        email: userEmail,
        name: sessionName.trim(),
        tabType: 'projects',
        data: { projects, activeProjectName },
      });
      toast.success(`Session "${sessionName}" saved!`);
      setSessionName('');
      setShowSaveModal(false);
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save session');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoad = (session: { _id: string; name: string; data: unknown }) => {
    const data = session.data as { projects?: Project[]; activeProjectName?: string };
    if (data.projects) {
      onLoadSession(data.projects, data.activeProjectName || null);
      toast.success(`Loaded "${session.name}"`);
    }
    setShowLoadModal(false);
  };

  const handleDelete = async (sessionId: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await deleteSessionMutation({ sessionId: sessionId as Id<'sessions'> });
      toast.success('Session deleted');
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  return (
    <>
      {/* Compact Session Controls */}
      <div className="p-3 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-2">
          {/* Save Button */}
          <button
            onClick={() => setShowSaveModal(true)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Save className="w-4 h-4" />
            Save
          </button>

          {/* Load Button with Count */}
          <button
            onClick={() => setShowLoadModal(true)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FolderOpen className="w-4 h-4" />
            Load ({sessions?.length || 0})
          </button>
        </div>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowSaveModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Save Project Session</h3>
              <button onClick={() => setShowSaveModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Save all your projects and their content to restore later.
            </p>
            <input
              type="text"
              placeholder="Session name (e.g., 'My Work Projects')"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={isSaving || !sessionName.trim()}
                className="flex-1 px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
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

      {/* Load Modal */}
      {showLoadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowLoadModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Load Project Session</h3>
              <button onClick={() => setShowLoadModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {sessions && sessions.length > 0 ? (
                <div className="space-y-2">
                  {sessions.map((session) => (
                    <div
                      key={session._id}
                      className="p-4 border rounded-lg hover:border-orange-300 hover:bg-orange-50/50 cursor-pointer transition-colors group"
                      onClick={() => handleLoad(session)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{session.name}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(session.updatedAt).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(session._id, session.name);
                          }}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete session"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FolderOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">No saved sessions</p>
                  <p className="text-sm mt-1">Save your projects to load them later</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// TAB 5: Develop Projects - Full Implementation
function DevelopProjectsTab({ userEmail }: { userEmail: string }) {
  // Project state
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectName, setActiveProjectName] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Section editing state
  const [expandedSection, setExpandedSection] = useState<number>(0);
  const [editingSection, setEditingSection] = useState<number | null>(null);
  const [sectionContent, setSectionContent] = useState<Record<number, string>>({});

  // AI generation state
  const [generatingSection, setGeneratingSection] = useState<number | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [showAiPromptFor, setShowAiPromptFor] = useState<number | null>(null);

  // File upload state
  const [uploadingSection, setUploadingSection] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetSection, setUploadTargetSection] = useState<number | null>(null);

  // Auto-save debounce
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Convex hooks
  const projectsQuery = useQuery(api.projects.getProjects, userEmail ? { email: userEmail } : 'skip');
  const saveProjectMutation = useMutation(api.projects.saveProject);
  const deleteProjectMutation = useMutation(api.projects.deleteProject);
  const updateSectionMutation = useMutation(api.projects.updateProjectSection);

  // Section templates
  const sectionTemplates = [
    { title: 'Context', placeholder: 'Describe the project background, goals, and stakeholders...', icon: '📋', color: 'orange' },
    { title: 'Tech Stack', placeholder: 'List technologies, frameworks, and tools used...', icon: '🛠️', color: 'blue' },
    { title: 'Architecture', placeholder: 'Describe the system architecture and key components...', icon: '🏗️', color: 'purple' },
    { title: 'Database Schema', placeholder: 'Document database tables, relationships, and key fields...', icon: '🗄️', color: 'green', allowUpload: true, uploadTypes: '.sql,.json,.csv' },
    { title: 'API Endpoints', placeholder: 'List API routes, methods, and expected payloads...', icon: '🔌', color: 'yellow' },
    { title: 'UI/UX Guidelines', placeholder: 'Describe design system, components, and user flows...', icon: '🎨', color: 'pink', allowUpload: true, uploadTypes: 'image/*' },
    { title: 'Deployment', placeholder: 'Document deployment process, environments, and CI/CD...', icon: '🚀', color: 'indigo' },
    { title: 'Known Issues', placeholder: 'List current bugs, limitations, and technical debt...', icon: '⚠️', color: 'red' },
  ];

  // Load projects from Convex
  useEffect(() => {
    if (projectsQuery) {
      const loadedProjects = projectsQuery.map((p) => ({
        name: p.name,
        sections: p.sections as ProjectSection[],
      }));
      setProjects(loadedProjects);

      // Set first project as active if none selected
      if (!activeProjectName && loadedProjects.length > 0) {
        setActiveProjectName(loadedProjects[0].name);
      }
    }
  }, [projectsQuery, activeProjectName]);

  // Get active project
  const activeProject = projects.find(p => p.name === activeProjectName);

  // Calculate completed sections
  const completedSections = activeProject?.sections.filter(s => s.content.trim().length > 0).length || 0;

  // Create new project
  const handleCreateProject = async () => {
    if (!newProjectName.trim() || !userEmail) return;

    const emptySections = sectionTemplates.map(t => ({ title: t.title, content: '' }));

    try {
      await saveProjectMutation({
        email: userEmail,
        name: newProjectName.trim(),
        sections: emptySections,
      });

      setProjects(prev => [...prev, { name: newProjectName.trim(), sections: emptySections }]);
      setActiveProjectName(newProjectName.trim());
      setNewProjectName('');
      setIsCreating(false);
      toast.success('Project created!');
    } catch (error) {
      toast.error('Failed to create project');
    }
  };

  // Delete project
  const handleDeleteProject = async (projectName: string) => {
    if (!userEmail) return;

    try {
      await deleteProjectMutation({ email: userEmail, name: projectName });
      setProjects(prev => prev.filter(p => p.name !== projectName));

      if (activeProjectName === projectName) {
        const remaining = projects.filter(p => p.name !== projectName);
        setActiveProjectName(remaining.length > 0 ? remaining[0].name : null);
      }

      setDeleteConfirm(null);
      toast.success('Project deleted');
    } catch (error) {
      toast.error('Failed to delete project');
    }
  };

  // Update section content with debounced save
  const handleSectionChange = (sectionIndex: number, content: string) => {
    // Update local state immediately
    setProjects(prev => prev.map(p => {
      if (p.name === activeProjectName) {
        const newSections = [...p.sections];
        newSections[sectionIndex] = { ...newSections[sectionIndex], content };
        return { ...p, sections: newSections };
      }
      return p;
    }));

    // Debounced save to Convex
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setIsSaving(true);
    saveTimeoutRef.current = setTimeout(async () => {
      if (!userEmail || !activeProjectName) return;

      try {
        await updateSectionMutation({
          email: userEmail,
          name: activeProjectName,
          sectionIndex,
          content,
        });
        setLastSaved(new Date());
      } catch (error) {
        console.error('Failed to save section:', error);
      } finally {
        setIsSaving(false);
      }
    }, 500);
  };

  // Generate section content with AI
  const handleAIGenerate = async (sectionIndex: number) => {
    if (!activeProject || !activeProjectName) return;

    setGeneratingSection(sectionIndex);
    setShowAiPromptFor(null);

    try {
      const response = await fetch('/api/projects/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: activeProjectName,
          sectionTitle: sectionTemplates[sectionIndex].title,
          existingContent: activeProject.sections[sectionIndex]?.content || '',
          userPrompt: aiPrompt,
        }),
      });

      const data = await response.json();

      if (data.content) {
        handleSectionChange(sectionIndex, data.content);
        toast.success('Content generated!');
      } else {
        toast.error('Failed to generate content');
      }
    } catch (error) {
      toast.error('Failed to generate content');
    } finally {
      setGeneratingSection(null);
      setAiPrompt('');
    }
  };

  // Handle file upload for analysis
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, sectionIndex: number) => {
    const file = e.target.files?.[0];
    if (!file || !activeProjectName) return;

    setUploadingSection(sectionIndex);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sectionTitle', sectionTemplates[sectionIndex].title);
      formData.append('projectName', activeProjectName);

      const response = await fetch('/api/projects/analyze', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.content) {
        handleSectionChange(sectionIndex, data.content);
        toast.success('File analyzed and content generated!');
      } else {
        toast.error('Failed to analyze file');
      }
    } catch (error) {
      toast.error('Failed to analyze file');
    } finally {
      setUploadingSection(null);
      setUploadTargetSection(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Export project as markdown
  const handleExport = () => {
    if (!activeProject || !activeProjectName) return;

    let markdown = `# ${activeProjectName}\n\n`;
    markdown += `*Exported from Claude Onboarding Platform*\n\n---\n\n`;

    activeProject.sections.forEach((section, idx) => {
      markdown += `## ${idx + 1}. ${section.title}\n\n`;
      markdown += section.content || '*No content yet*';
      markdown += '\n\n---\n\n';
    });

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeProjectName.toLowerCase().replace(/\s+/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Project exported!');
  };

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => uploadTargetSection !== null && handleFileUpload(e, uploadTargetSection)}
        accept={uploadTargetSection !== null ? sectionTemplates[uploadTargetSection]?.uploadTypes : ''}
      />

      {/* Left Sidebar - Project List */}
      <div className="col-span-3">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden sticky top-4">
          {/* Header */}
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
            <h3 className="font-semibold text-gray-900">My Projects</h3>
            <button
              onClick={() => setIsCreating(true)}
              className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
              title="Create new project"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Session Management - Compact Sidebar Version */}
          {userEmail && (
            <ProjectSessionManager
              userEmail={userEmail}
              projects={projects}
              activeProjectName={activeProjectName}
              onLoadSession={(loadedProjects, loadedActiveProject) => {
                setProjects(loadedProjects);
                if (loadedActiveProject) setActiveProjectName(loadedActiveProject);
              }}
            />
          )}

          {/* Create Project Modal */}
          {isCreating && (
            <div className="p-4 border-b border-gray-100 bg-orange-50">
              <p className="text-sm font-medium text-gray-700 mb-2">New Project</p>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Project name..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 mb-2"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCreateProject}
                  disabled={!newProjectName.trim()}
                  className="flex-1 px-3 py-1.5 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create
                </button>
                <button
                  onClick={() => { setIsCreating(false); setNewProjectName(''); }}
                  className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Project List */}
          <div className="max-h-[400px] overflow-y-auto">
            {projects.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <FolderOpen className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No projects yet</p>
                <button
                  onClick={() => setIsCreating(true)}
                  className="mt-2 text-sm text-orange-600 hover:text-orange-700"
                >
                  Create your first project
                </button>
              </div>
            ) : (
              projects.map((project) => {
                const completed = project.sections.filter(s => s.content.trim().length > 0).length;
                const isActive = activeProjectName === project.name;

                return (
                  <div
                    key={project.name}
                    className={`group p-4 flex items-center gap-3 cursor-pointer transition-all border-l-4 ${
                      isActive
                        ? 'bg-orange-50 border-l-orange-600'
                        : 'hover:bg-gray-50 border-l-transparent'
                    }`}
                    onClick={() => setActiveProjectName(project.name)}
                  >
                    <FolderOpen className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-orange-600' : 'text-gray-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate ${isActive ? 'text-orange-900' : 'text-gray-700'}`}>
                        {project.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {completed}/{project.sections.length} sections
                      </p>
                    </div>

                    {/* Delete button */}
                    {deleteConfirm === project.name ? (
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleDeleteProject(project.name)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Confirm delete"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirm(project.name); }}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete project"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Main Content - Project Editor */}
      <div className="col-span-9 space-y-4">
        {!activeProject ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <FolderOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Project Selected</h3>
            <p className="text-gray-500 mb-4">Create a new project or select one from the sidebar</p>
            <button
              onClick={() => setIsCreating(true)}
              className="px-6 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create New Project
            </button>
          </div>
        ) : (
          <>
            {/* Project Header */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{activeProject.name}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Document your project for Claude to understand
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {isSaving && (
                    <span className="text-sm text-gray-400 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Saving...
                    </span>
                  )}
                  {lastSaved && !isSaving && (
                    <span className="text-xs text-gray-400">
                      Saved {lastSaved.toLocaleTimeString()}
                    </span>
                  )}
                  <button
                    onClick={handleExport}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm font-medium"
                  >
                    <Download className="w-4 h-4" />
                    Export for Claude
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-2">
                <div className="bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-orange-500 to-orange-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(completedSections / 8) * 100}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  {completedSections} of 8 sections completed
                </span>
                {completedSections === 8 && (
                  <span className="text-green-600 font-medium flex items-center gap-1">
                    <Check className="w-4 h-4" /> Ready to export
                  </span>
                )}
              </div>
            </div>

            {/* Section Cards */}
            <div className="space-y-3">
              {sectionTemplates.map((template, index) => {
                const section = activeProject.sections[index];
                const hasContent = section?.content?.trim().length > 0;
                const isExpanded = expandedSection === index;
                const isEditing = editingSection === index;
                const isGenerating = generatingSection === index;
                const isUploading = uploadingSection === index;

                return (
                  <div
                    key={template.title}
                    className={`bg-white rounded-xl border-2 transition-all ${
                      isExpanded ? 'border-orange-500 shadow-sm' : 'border-gray-200 hover:border-gray-300'
                    } ${hasContent ? 'ring-1 ring-green-100' : ''}`}
                  >
                    {/* Section Header */}
                    <div
                      className="p-5 flex items-center justify-between cursor-pointer"
                      onClick={() => setExpandedSection(isExpanded ? -1 : index)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                          hasContent ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          {hasContent ? <Check className="w-5 h-5 text-green-600" /> : template.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{index + 1}. {template.title}</h3>
                          <p className="text-sm text-gray-500">{template.placeholder.slice(0, 50)}...</p>
                        </div>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="px-5 pb-5 border-t border-gray-100">
                        {/* AI Prompt Input */}
                        {showAiPromptFor === index && (
                          <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                            <p className="text-sm font-medium text-purple-900 mb-2">
                              Describe what you want AI to generate:
                            </p>
                            <textarea
                              value={aiPrompt}
                              onChange={(e) => setAiPrompt(e.target.value)}
                              placeholder={`E.g., "Generate ${template.title.toLowerCase()} for a React e-commerce app with Node.js backend..."`}
                              rows={3}
                              className="w-full px-3 py-2 border border-purple-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 mb-3"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAIGenerate(index)}
                                disabled={isGenerating}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 text-sm disabled:opacity-50"
                              >
                                {isGenerating ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Sparkles className="w-4 h-4" />
                                )}
                                Generate
                              </button>
                              <button
                                onClick={() => { setShowAiPromptFor(null); setAiPrompt(''); }}
                                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Content Area */}
                        <div className="mt-4">
                          {isEditing ? (
                            <textarea
                              value={section?.content || ''}
                              onChange={(e) => handleSectionChange(index, e.target.value)}
                              rows={12}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-mono text-sm"
                              placeholder={template.placeholder}
                            />
                          ) : (
                            <div className="p-4 bg-gray-50 rounded-lg min-h-[150px] whitespace-pre-wrap text-sm">
                              {section?.content || (
                                <span className="text-gray-400 italic">
                                  No content yet. Click Edit or Generate with AI to get started.
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          <button
                            onClick={() => setEditingSection(isEditing ? null : index)}
                            className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${
                              isEditing
                                ? 'bg-orange-600 text-white hover:bg-orange-700'
                                : 'bg-white border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <Edit3 className="w-4 h-4" />
                            {isEditing ? 'Done Editing' : 'Edit'}
                          </button>

                          <button
                            onClick={() => showAiPromptFor === index ? handleAIGenerate(index) : setShowAiPromptFor(index)}
                            disabled={isGenerating}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 text-sm font-medium disabled:opacity-50"
                          >
                            {isGenerating ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Sparkles className="w-4 h-4" />
                            )}
                            {isGenerating ? 'Generating...' : 'Generate with AI'}
                          </button>

                          {/* Upload button for specific sections */}
                          {template.allowUpload && (
                            <button
                              onClick={() => {
                                setUploadTargetSection(index);
                                fileInputRef.current?.click();
                              }}
                              disabled={isUploading}
                              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm font-medium disabled:opacity-50"
                            >
                              {isUploading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Upload className="w-4 h-4" />
                              )}
                              {isUploading ? 'Analyzing...' : template.title === 'Database Schema' ? 'Upload Schema File' : 'Upload Screenshot'}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Export CLAUDE.md Dropdown Component
function ExportClaudeDropdown({
  onDirectDownload,
  onReviewEdit,
}: {
  onDirectDownload: () => void;
  onReviewEdit: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-6 py-2.5 bg-white border border-green-600 text-green-600 hover:bg-green-50 rounded-lg font-medium flex items-center gap-2"
      >
        <Download className="w-4 h-4" />
        Export as CLAUDE.md
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Dropdown Menu */}
          <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border z-50">
            <button
              onClick={() => {
                onDirectDownload();
                setIsOpen(false);
              }}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b"
            >
              <Download className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-gray-900">Download Now</p>
                <p className="text-xs text-gray-500">Download CLAUDE.md immediately</p>
              </div>
            </button>
            <button
              onClick={() => {
                onReviewEdit();
                setIsOpen(false);
              }}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3"
            >
              <Edit3 className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">Review & Edit</p>
                <p className="text-xs text-gray-500">Preview and customize before downloading</p>
              </div>
            </button>
          </div>
          {/* Click outside to close */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
        </>
      )}
    </div>
  );
}

// Question Card Component - matches original design
function QuestionCard({
  num,
  question,
  answer,
  onAnswerChange,
  context,
}: {
  num: number;
  question: { id: string; question: string; type: string; options?: string[] };
  answer: string | string[] | undefined;
  onAnswerChange: (id: string, value: string | string[]) => void;
  context?: Record<string, string | string[]>;
}) {
  // Check if the current answer is an "Other" value (not in the predefined options)
  const isOtherAnswer = (val: string | string[] | undefined): boolean => {
    if (!val || !question.options) return false;
    if (Array.isArray(val)) {
      // For multiselect, check if any value is not in options
      return val.some(v => !question.options!.includes(v));
    }
    // For select, check if the value is not in options
    return !question.options.includes(val);
  };

  const getOtherValue = (val: string | string[] | undefined): string => {
    if (!val || !question.options) return '';
    if (Array.isArray(val)) {
      // For multiselect, find the value not in options
      const otherVal = val.find(v => !question.options!.includes(v));
      return otherVal || '';
    }
    // For select, return the value if it's not in options
    return question.options.includes(val) ? '' : val;
  };

  const [showOther, setShowOther] = useState(() => isOtherAnswer(answer));
  const [otherValue, setOtherValue] = useState(() => getOtherValue(answer));
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [otherSuggestion, setOtherSuggestion] = useState<string | null>(null);
  const [isLoadingOtherSuggestion, setIsLoadingOtherSuggestion] = useState(false);

  // Update showOther and otherValue when answer changes externally (e.g., loading a session)
  useEffect(() => {
    const isOther = isOtherAnswer(answer);
    const otherVal = getOtherValue(answer);
    setShowOther(isOther);
    setOtherValue(otherVal);
  }, [answer, question.options]);

  const fetchOtherSuggestion = async () => {
    setIsLoadingOtherSuggestion(true);
    setOtherSuggestion(null);
    try {
      const response = await fetch('/api/claude/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: {
            role: context?.role,
            experience: context?.experience,
            industry: context?.industry,
            previousAnswers: context,
          },
          question: `${question.question} (The user selected "Other" - suggest a specific custom answer that doesn't fit the standard options: ${question.options?.join(', ')})`,
        }),
      });
      const data = await response.json();
      if (data.suggestion) {
        setOtherSuggestion(data.suggestion);
      }
    } catch (error) {
      console.error('Failed to get AI suggestion:', error);
    } finally {
      setIsLoadingOtherSuggestion(false);
    }
  };

  const applyOtherSuggestion = () => {
    if (otherSuggestion) {
      setOtherValue(otherSuggestion);
      if (question.type === 'multiselect') {
        const current = (answer as string[]) || [];
        const filtered = current.filter(v => question.options?.includes(v));
        onAnswerChange(question.id, [...filtered, otherSuggestion]);
      } else {
        onAnswerChange(question.id, otherSuggestion);
      }
      setOtherSuggestion(null);
    }
  };

  const fetchAISuggestion = async () => {
    setIsLoadingSuggestion(true);
    setSuggestion(null);
    try {
      const response = await fetch('/api/claude/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: {
            role: context?.role,
            experience: context?.experience,
            industry: context?.industry,
            previousAnswers: context,
          },
          question: question.question,
        }),
      });
      const data = await response.json();
      if (data.suggestion) {
        setSuggestion(data.suggestion);
      }
    } catch (error) {
      console.error('Failed to get AI suggestion:', error);
    } finally {
      setIsLoadingSuggestion(false);
    }
  };

  const applySuggestion = () => {
    if (suggestion) {
      onAnswerChange(question.id, suggestion);
      setSuggestion(null);
    }
  };

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
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type your answer..."
                  value={(answer as string) || ''}
                  onChange={e => onAnswerChange(question.id, e.target.value)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-orange-600"
                />
                <button
                  onClick={fetchAISuggestion}
                  disabled={isLoadingSuggestion}
                  className="px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
                >
                  {isLoadingSuggestion ? (
                    <Loader2 className="w-4 h-4 text-orange-600 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-orange-600" />
                  )}
                  <span>{isLoadingSuggestion ? 'Thinking...' : 'AI Suggest'}</span>
                </button>
              </div>
              {suggestion && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <span className="text-lg">💡</span>
                    <div className="flex-1">
                      <p className="text-sm text-purple-900 mb-2">{suggestion}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={applySuggestion}
                          className="text-xs px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
                        >
                          Use this
                        </button>
                        <button
                          onClick={() => setSuggestion(null)}
                          className="text-xs px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Textarea with AI Suggest */}
          {question.type === 'textarea' && (
            <div className="space-y-2">
              <div className="flex gap-2 items-start">
                <textarea
                  placeholder="Type your answer..."
                  value={(answer as string) || ''}
                  onChange={e => onAnswerChange(question.id, e.target.value)}
                  rows={3}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-orange-600"
                />
                <button
                  onClick={fetchAISuggestion}
                  disabled={isLoadingSuggestion}
                  className="px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
                >
                  {isLoadingSuggestion ? (
                    <Loader2 className="w-4 h-4 text-orange-600 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-orange-600" />
                  )}
                  <span>{isLoadingSuggestion ? 'Thinking...' : 'AI Suggest'}</span>
                </button>
              </div>
              {suggestion && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <span className="text-lg">💡</span>
                    <div className="flex-1">
                      <p className="text-sm text-purple-900 mb-2">{suggestion}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={applySuggestion}
                          className="text-xs px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
                        >
                          Use this
                        </button>
                        <button
                          onClick={() => setSuggestion(null)}
                          className="text-xs px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
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
                <div className="ml-8 space-y-2">
                  <div className="flex gap-2">
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
                    <button
                      onClick={fetchOtherSuggestion}
                      disabled={isLoadingOtherSuggestion}
                      className="px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
                    >
                      {isLoadingOtherSuggestion ? (
                        <Loader2 className="w-4 h-4 text-orange-600 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4 text-orange-600" />
                      )}
                      <span>{isLoadingOtherSuggestion ? 'Thinking...' : 'AI Suggest'}</span>
                    </button>
                  </div>
                  {otherSuggestion && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 ml-7">
                      <div className="flex items-start gap-2">
                        <span className="text-lg">💡</span>
                        <div className="flex-1">
                          <p className="text-sm text-purple-900 mb-2">{otherSuggestion}</p>
                          <div className="flex gap-2">
                            <button
                              onClick={applyOtherSuggestion}
                              className="text-xs px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
                            >
                              Use this
                            </button>
                            <button
                              onClick={() => setOtherSuggestion(null)}
                              className="text-xs px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50"
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
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
                <div className="ml-8 space-y-2">
                  <div className="flex gap-2">
                    <span className="text-xl">✍️</span>
                    <input
                      type="text"
                      placeholder="Please describe..."
                      value={otherValue}
                      onChange={e => {
                        setOtherValue(e.target.value);
                        const current = (answer as string[]) || [];
                        // Filter out old other value, keep standard options, add new other value
                        const standardOptions = current.filter(v => question.options?.includes(v));
                        if (e.target.value) {
                          onAnswerChange(question.id, [...standardOptions, e.target.value]);
                        } else {
                          onAnswerChange(question.id, standardOptions);
                        }
                      }}
                      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600"
                    />
                    <button
                      onClick={fetchOtherSuggestion}
                      disabled={isLoadingOtherSuggestion}
                      className="px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
                    >
                      {isLoadingOtherSuggestion ? (
                        <Loader2 className="w-4 h-4 text-orange-600 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4 text-orange-600" />
                      )}
                      <span>{isLoadingOtherSuggestion ? 'Thinking...' : 'AI Suggest'}</span>
                    </button>
                  </div>
                  {otherSuggestion && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 ml-7">
                      <div className="flex items-start gap-2">
                        <span className="text-lg">💡</span>
                        <div className="flex-1">
                          <p className="text-sm text-purple-900 mb-2">{otherSuggestion}</p>
                          <div className="flex gap-2">
                            <button
                              onClick={applyOtherSuggestion}
                              className="text-xs px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
                            >
                              Use this
                            </button>
                            <button
                              onClick={() => setOtherSuggestion(null)}
                              className="text-xs px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50"
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
