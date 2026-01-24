import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";
import { z } from "zod";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL!;

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

async function convexQuery(functionPath: string, args: Record<string, unknown>) {
  const response = await fetch(`${CONVEX_URL}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      path: functionPath,
      args,
      format: "json",
    }),
  });
  const data = await response.json();
  return data.value;
}

async function convexMutation(functionPath: string, args: Record<string, unknown>) {
  const response = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      path: functionPath,
      args,
      format: "json",
    }),
  });
  const data = await response.json();
  return data.value;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, email, password } = result.data;

    // Check if user already exists
    const existingUser = await convexQuery("users:getUser", { email });
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user in Convex
    await convexMutation("users:saveUser", {
      name,
      email,
      password: hashedPassword,
      provider: "credentials",
    });

    return NextResponse.json(
      { message: "Account created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An error occurred during registration" },
      { status: 500 }
    );
  }
}
