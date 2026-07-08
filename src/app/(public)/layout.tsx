import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { getCurrentUser } from "@/lib/actions/auth";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-full flex-col">
      <Navbar
        user={
          user
            ? {
                firstName: user.firstName,
                lastName: user.lastName,
                displayName: user.displayName,
                email: user.email,
                role: user.role,
              }
            : null
        }
      />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
