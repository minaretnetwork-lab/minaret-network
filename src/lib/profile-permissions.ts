type ProfileEditor = { role: string; isActive: boolean } | null | undefined;

export function isProfileAdmin(user: ProfileEditor): boolean {
  return !!user?.isActive && (user.role === "ADMIN" || user.role === "SUPER_ADMIN");
}
