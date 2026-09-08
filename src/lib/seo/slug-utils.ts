function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type SlugInput = {
  businessName: string | null;
  title: string | null;
  user: { firstName: string | null; lastName: string | null } | null;
  category: { slug: string };
  serviceAreas: { slug: string }[];
};

export function buildBaseSlug(professional: SlugInput): string {
  const name = professional.businessName
    || (professional.user
      ? [professional.user.firstName, professional.user.lastName].filter(Boolean).join(" ")
      : null)
    || "professional";

  const primaryArea = professional.serviceAreas[0]?.slug ?? "";
  const parts = [slugify(name), professional.category.slug];
  if (primaryArea) parts.push(primaryArea);
  return parts.join("-");
}

export function deduplicateSlug(base: string, existingSlugs: Set<string>): string {
  if (!existingSlugs.has(base)) return base;
  let counter = 2;
  while (existingSlugs.has(`${base}-${counter}`)) counter++;
  return `${base}-${counter}`;
}
