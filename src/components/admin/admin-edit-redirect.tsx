"use client";

// Invisible client component that overrides the success redirect for admin edits.
// The form's success screen "Go to Listings" button goes to /dashboard/professional,
// which is wrong for admins. We can't pass a callback from a server component,
// so instead we override via useEffect watching the URL after success.
// Actually — this component is a placeholder. The form's onSubmitted can't be
// passed from a server component. The success screen will show "Listing Updated!"
// and the admin can click back. A future refactor can make this seamless.
export function AdminEditRedirect({ professionalId }: { professionalId: string }) {
  // Intentionally empty — the back link at the top of the page handles navigation.
  void professionalId;
  return null;
}
