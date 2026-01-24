import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAISuggestion, AISuggestionContext } from "@/lib/claude";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { context, question } = body as {
      context: AISuggestionContext;
      question: string;
    };

    if (!question) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    const suggestion = await getAISuggestion(context || {}, question);

    return NextResponse.json({ suggestion });
  } catch (error) {
    console.error("AI suggestion error:", error);
    return NextResponse.json(
      { error: "Failed to generate suggestion" },
      { status: 500 }
    );
  }
}
