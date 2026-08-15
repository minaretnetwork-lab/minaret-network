export default function UpgradesInProgressPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-6 inline-flex rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground">
          Minaret Network
        </div>
        <h1 className="font-serif text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Upgrades in progress
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground sm:text-xl">
          We&apos;re making updates behind the scenes and will be back soon.
        </p>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Thanks for your patience while we improve the experience.
        </p>
      </div>
    </main>
  );
}
