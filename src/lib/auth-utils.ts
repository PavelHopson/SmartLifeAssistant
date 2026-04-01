import { auth } from "@/lib/auth";

const DESKTOP_MODE = process.env.DESKTOP_MODE === "true";
const LOCAL_USER_ID = "local-user";

// Get current user ID
// Desktop mode: uses local user (no Google OAuth needed)
// Web mode: uses NextAuth session, falls back to "demo"
export async function getCurrentUserId(): Promise<string> {
  if (DESKTOP_MODE) return LOCAL_USER_ID;

  const session = await auth();
  return session?.user?.id || "demo";
}
