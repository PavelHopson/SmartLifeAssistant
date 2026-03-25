import { auth } from "@/lib/auth";

// Get current user ID, falling back to "demo" for development
export async function getCurrentUserId(): Promise<string> {
  const session = await auth();
  return session?.user?.id || "demo";
}
