/**
 * Admin configuration utilities
 */

export function getAdminUserId(): string {
  const adminUserId = process.env.NEXT_PUBLIC_ADMIN_USER_ID;

  if (!adminUserId) {
    throw new Error(
      "NEXT_PUBLIC_ADMIN_USER_ID environment variable is not set. " +
        "Please add your Firebase user ID to .env.local file."
    );
  }

  return adminUserId;
}

export function isAdminUser(userId: string | null): boolean {
  if (!userId) return false;
  return userId === getAdminUserId();
}
