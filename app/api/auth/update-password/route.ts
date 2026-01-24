import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hashPassword, verifyPassword } from "@/lib/auth";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL!;

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
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Get user with password
    const user = await convexQuery("users:getUserWithPassword", {
      email: session.user.email,
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.password) {
      return NextResponse.json(
        { error: "This account uses Google sign-in and does not have a password" },
        { status: 400 }
      );
    }

    // Verify current password
    const isValid = await verifyPassword(currentPassword, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    }

    // Hash new password and update
    const hashedPassword = await hashPassword(newPassword);
    await convexMutation("users:updatePassword", {
      email: session.user.email,
      newPassword: hashedPassword,
    });

    return NextResponse.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Password update error:", error);
    return NextResponse.json(
      { error: "An error occurred while updating password" },
      { status: 500 }
    );
  }
}
