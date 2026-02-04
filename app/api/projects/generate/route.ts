import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const sectionPrompts: Record<string, string> = {
  'Context': `Generate a comprehensive project context section including:
- Project purpose and goals
- Target users/stakeholders
- Business requirements
- Success metrics
- Key constraints or considerations`,

  'Tech Stack': `Generate a detailed tech stack documentation including:
- Frontend technologies (framework, UI library, state management)
- Backend technologies (language, framework, database)
- Infrastructure (hosting, CI/CD, monitoring)
- Development tools and environment
- Key dependencies and versions`,

  'Architecture': `Generate system architecture documentation including:
- High-level architecture overview
- Component breakdown and responsibilities
- Data flow patterns
- External integrations and APIs
- Scalability considerations`,

  'Database Schema': `Generate database schema documentation including:
- Table/collection definitions with fields and types
- Relationships and foreign keys
- Indexes for performance
- Sample queries for common operations
- Data validation rules`,

  'API Endpoints': `Generate API documentation including:
- Endpoint routes with HTTP methods
- Request parameters and body schemas
- Response formats and status codes
- Authentication requirements
- Rate limiting and error handling`,

  'UI/UX Guidelines': `Generate UI/UX guidelines including:
- Design principles and philosophy
- Color palette with hex codes
- Typography (fonts, sizes, weights)
- Component patterns and usage
- User flow descriptions
- Accessibility considerations`,

  'Deployment': `Generate deployment documentation including:
- Environment configuration (dev, staging, prod)
- Build and deploy steps
- CI/CD pipeline overview
- Environment variables needed
- Monitoring and logging setup`,

  'Known Issues': `Generate known issues documentation including:
- Current bugs with severity levels
- Technical debt items
- Performance bottlenecks
- Security considerations
- Planned improvements and roadmap`,
};

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectName, sectionTitle, existingContent, userPrompt } = await request.json();

    if (!projectName || !sectionTitle) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const systemPrompt = sectionPrompts[sectionTitle] || 'Generate helpful project documentation for this section.';

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `You are helping document a software project for use with Claude AI assistant.

Project Name: ${projectName}
Section: ${sectionTitle}
${existingContent ? `\nExisting content to improve or expand:\n${existingContent}` : ''}
${userPrompt ? `\nUser's specific request: ${userPrompt}` : ''}

${systemPrompt}

Generate well-structured markdown content for this section. Be specific, practical, and use proper markdown formatting (headers, lists, code blocks where appropriate). The content should be detailed enough to help Claude understand the project context when assisting with development.`,
        },
      ],
    });

    const content = message.content[0];
    return NextResponse.json({
      content: content.type === "text" ? content.text : "",
    });
  } catch (error) {
    console.error("Error generating project content:", error);
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 }
    );
  }
}
