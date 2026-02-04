import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const sectionTitle = formData.get('sectionTitle') as string;
    const projectName = formData.get('projectName') as string;

    if (!file || !sectionTitle) {
      return NextResponse.json({ error: "Missing file or section title" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // For images - use vision capabilities
    if (file.type.startsWith('image/')) {
      const base64 = buffer.toString('base64');
      const mediaType = file.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

      let analysisPrompt = '';
      if (sectionTitle === 'UI/UX Guidelines') {
        analysisPrompt = `Analyze this UI screenshot and generate comprehensive UI/UX guidelines documentation including:
- Color palette (extract all colors with hex codes)
- Typography (identify fonts, sizes, weights used)
- Spacing patterns (margins, padding, gaps)
- Component styles (buttons, cards, inputs, etc.)
- Layout patterns observed
- Design principles and consistency notes
- Accessibility observations

Format the output as well-structured markdown suitable for project documentation.`;
      } else {
        analysisPrompt = `Analyze this image and generate documentation relevant to the "${sectionTitle}" section of a project. Extract any useful information visible in the image and format it as markdown documentation.`;
      }

      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: mediaType, data: base64 }
              },
              {
                type: "text",
                text: `Project: ${projectName || 'Unknown'}\n\n${analysisPrompt}`
              }
            ]
          }
        ]
      });

      const content = message.content[0];
      return NextResponse.json({ content: content.type === "text" ? content.text : "" });
    }

    // For text files (SQL, JSON, CSV, etc.)
    const textContent = buffer.toString('utf-8');

    let analysisPrompt = '';
    if (sectionTitle === 'Database Schema') {
      if (file.name.endsWith('.sql')) {
        analysisPrompt = `Analyze this SQL file and generate comprehensive database schema documentation including:
- Table definitions with all columns, types, and constraints
- Primary keys and foreign key relationships
- Indexes and their purposes
- Any triggers or stored procedures
- Entity relationship descriptions
- Sample queries for common operations

SQL Content:
${textContent.slice(0, 15000)}`;
      } else if (file.name.endsWith('.json')) {
        analysisPrompt = `Analyze this JSON structure and generate database schema documentation:
- Infer table/collection structure from the JSON
- Document field types and relationships
- Suggest indexes for common query patterns
- Note any nested structures or arrays

JSON Content:
${textContent.slice(0, 15000)}`;
      } else {
        analysisPrompt = `Analyze this file and generate database schema documentation based on the data structure:

File Content:
${textContent.slice(0, 15000)}`;
      }
    } else if (sectionTitle === 'API Endpoints') {
      analysisPrompt = `Analyze this file and generate API documentation:
- Extract endpoint definitions
- Document request/response formats
- Note authentication requirements
- List error codes and handling

File Content:
${textContent.slice(0, 15000)}`;
    } else {
      analysisPrompt = `Analyze this file and generate documentation for the "${sectionTitle}" section:

File Content:
${textContent.slice(0, 15000)}`;
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `Project: ${projectName || 'Unknown'}\n\n${analysisPrompt}\n\nFormat the output as well-structured markdown suitable for project documentation.`,
        },
      ],
    });

    const content = message.content[0];
    return NextResponse.json({ content: content.type === "text" ? content.text : "" });
  } catch (error) {
    console.error("Error analyzing file:", error);
    return NextResponse.json(
      { error: "Failed to analyze file" },
      { status: 500 }
    );
  }
}
