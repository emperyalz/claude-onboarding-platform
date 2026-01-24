import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export interface AISuggestionContext {
  role?: string;
  experience?: string;
  industry?: string;
  previousAnswers?: Record<string, string | string[]>;
}

export async function getAISuggestion(
  context: AISuggestionContext,
  question: string
): Promise<string> {
  const contextString = Object.entries(context)
    .filter(([_, value]) => value)
    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
    .join("\n");

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: `You are helping a user complete an onboarding questionnaire for Claude AI assistant personalization.

Based on what we know about the user:
${contextString || "No context yet"}

The current question is: "${question}"

Provide a brief, helpful suggestion for how they might answer this question. Keep it to 1-2 sentences, be specific and actionable. Don't be generic - tailor it to their context if available.`,
      },
    ],
  });

  const content = message.content[0];
  return content.type === "text" ? content.text : "";
}

export async function getFormAssistance(
  formData: Record<string, unknown>,
  userQuestion: string
): Promise<string> {
  const formContext = Object.entries(formData)
    .filter(([_, value]) => value)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    .join("\n");

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: `You are an AI assistant helping a user complete their Claude personalization profile.

Current form data:
${formContext || "No data yet"}

User's question: "${userQuestion}"

Provide a helpful response that assists them with their question. Be concise and practical.`,
      },
    ],
  });

  const content = message.content[0];
  return content.type === "text" ? content.text : "";
}

export async function generateSkillSuggestions(
  userContext: AISuggestionContext
): Promise<Array<{ name: string; description: string; template: string }>> {
  const contextString = Object.entries(userContext)
    .filter(([_, value]) => value)
    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
    .join("\n");

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    messages: [
      {
        role: "user",
        content: `Based on this user's profile:
${contextString}

Suggest 3 custom Claude skill templates that would be most useful for them. Return as JSON array with format:
[{"name": "Skill Name", "description": "Brief description", "template": "You are an expert... (prompt template)"}]

Only return the JSON array, nothing else.`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") return [];

  try {
    return JSON.parse(content.text);
  } catch {
    return [];
  }
}
