import {
  AnalyticsEventType,
  BadgeType,
  ContactMethod,
  FeaturedStatus,
  Gender,
  Prisma,
  PrismaClient,
  ProfessionalStatus,
  RecommendationStatus,
  RequestStatus,
  SponsoredStatus,
  UserRole,
} from "@prisma/client";
import { createClient, type User as SupabaseUser } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { CATEGORIES, SERVICE_AREAS } from "../src/lib/constants";

/**
 * Comprehensive fixtures for the self-hosting experiment.
 *
 * All accounts use the required EXPERIMENT_USER_PASSWORD environment variable.
 * These accounts use reserved example.com addresses and must never be treated
 * as production identities.
 *
 * This script is deliberately non-destructive: it updates its own stable
 * records and never truncates tables or deletes unrelated rows.
 */

const prisma = new PrismaClient();

const publicSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  ?.trim()
  .replace(/\/+$/, "");
const adminSupabaseUrl = (
  process.env.SUPABASE_INTERNAL_URL?.trim() || publicSupabaseUrl
)?.replace(/\/+$/, "");
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const experimentPassword = process.env.EXPERIMENT_USER_PASSWORD?.trim();
const mosqueSlug =
  process.env.NEXT_PUBLIC_DEFAULT_MOSQUE_SLUG?.trim() || "al-falah";
const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function at(iso: string) {
  return new Date(iso);
}

type AccountSpec = {
  key: string;
  appUserId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
  whatsapp?: string;
};

const accounts: AccountSpec[] = [
  {
    key: "super-admin",
    appUserId: "exp-user-super-admin",
    email: "superadmin@minaret-demo.example.com",
    firstName: "Safiya",
    lastName: "Mahmood",
    role: UserRole.SUPER_ADMIN,
    phone: "+1 905 555 0100",
  },
  {
    key: "admin",
    appUserId: "exp-user-admin",
    email: "admin@minaret-demo.example.com",
    firstName: "Hamza",
    lastName: "Malik",
    role: UserRole.ADMIN,
    phone: "+1 905 555 0101",
  },
  {
    key: "layla-member",
    appUserId: "exp-user-layla-member",
    email: "layla.noor@minaret-demo.example.com",
    firstName: "Layla",
    lastName: "Noor",
    role: UserRole.MEMBER,
    phone: "+1 905 555 0110",
    whatsapp: "+19055550110",
  },
  {
    key: "tariq-member",
    appUserId: "exp-user-tariq-member",
    email: "tariq.hussain@minaret-demo.example.com",
    firstName: "Tariq",
    lastName: "Hussain",
    role: UserRole.MEMBER,
    phone: "+1 416 555 0111",
  },
  {
    key: "amira-doctor",
    appUserId: "exp-user-amira-doctor",
    email: "amira.rahman@minaret-demo.example.com",
    firstName: "Amira",
    lastName: "Rahman",
    role: UserRole.PROFESSIONAL,
    phone: "+1 905 555 0201",
    whatsapp: "+19055550201",
  },
  {
    key: "yusuf-electrician",
    appUserId: "exp-user-yusuf-electrician",
    email: "yusuf.khan@minaret-demo.example.com",
    firstName: "Yusuf",
    lastName: "Khan",
    role: UserRole.PROFESSIONAL,
    phone: "+1 905 555 0202",
    whatsapp: "+19055550202",
  },
  {
    key: "farah-realtor",
    appUserId: "exp-user-farah-realtor",
    email: "farah.siddiqui@minaret-demo.example.com",
    firstName: "Farah",
    lastName: "Siddiqui",
    role: UserRole.PROFESSIONAL,
    phone: "+1 289 555 0203",
  },
  {
    key: "omar-plumber",
    appUserId: "exp-user-omar-plumber",
    email: "omar.farooq@minaret-demo.example.com",
    firstName: "Omar",
    lastName: "Farooq",
    role: UserRole.PROFESSIONAL,
    phone: "+1 905 555 0204",
    whatsapp: "+19055550204",
  },
  {
    key: "imran-photographer",
    appUserId: "exp-user-imran-photographer",
    email: "imran.sheikh@minaret-demo.example.com",
    firstName: "Imran",
    lastName: "Sheikh",
    role: UserRole.PROFESSIONAL,
    phone: "+1 416 555 0205",
  },
  {
    key: "samir-it",
    appUserId: "exp-user-samir-it",
    email: "samir.qureshi@minaret-demo.example.com",
    firstName: "Samir",
    lastName: "Qureshi",
    role: UserRole.PROFESSIONAL,
    phone: "+1 647 555 0206",
  },
  {
    key: "nadia-accountant",
    appUserId: "exp-user-nadia-accountant",
    email: "nadia.ali@minaret-demo.example.com",
    firstName: "Nadia",
    lastName: "Ali",
    role: UserRole.PROFESSIONAL,
    phone: "+1 905 555 0207",
  },
  {
    key: "bilal-counsellor",
    appUserId: "exp-user-bilal-counsellor",
    email: "bilal.ahmed@minaret-demo.example.com",
    firstName: "Bilal",
    lastName: "Ahmed",
    role: UserRole.PROFESSIONAL,
    phone: "+1 416 555 0208",
  },
  {
    key: "huda-web",
    appUserId: "exp-user-huda-web",
    email: "huda.hassan@minaret-demo.example.com",
    firstName: "Huda",
    lastName: "Hassan",
    role: UserRole.PROFESSIONAL,
    phone: "+1 647 555 0209",
  },
];

type ProfessionalSpec = {
  key: string;
  id: string;
  categorySlug: string;
  serviceAreaSlugs: string[];
  businessName: string;
  title: string;
  bio: string;
  yearsOfExperience: number;
  qualifications: string;
  licenses?: string;
  languages: string[];
  gender: Gender;
  website?: string;
  status: ProfessionalStatus;
  badges: BadgeType[];
  availability: string;
  rejectionReason?: string;
  isFeatured?: boolean;
  isSponsored?: boolean;
  logoUrl?: string;
  profileViews: number;
  searchAppearances: number;
  contactClicks: number;
};

const professionals: ProfessionalSpec[] = [
  {
    key: "amira-doctor",
    id: "exp-prof-amira-doctor",
    categorySlug: "doctor",
    serviceAreaSlugs: ["keswick", "newmarket", "aurora"],
    businessName: "Lake Simcoe Family Health",
    title: "Family Physician",
    bio: "Family physician serving children, adults, and seniors across northern York Region. Dr. Rahman focuses on preventative care, chronic-disease management, and clear, culturally sensitive communication.",
    yearsOfExperience: 12,
    qualifications: "MD, McMaster University\nCCFP, College of Family Physicians of Canada",
    licenses: "CPSO demo registration #D-310245",
    languages: ["English", "Urdu", "Arabic"],
    gender: Gender.FEMALE,
    website: "https://lake-simcoe-health.example.com",
    status: ProfessionalStatus.APPROVED,
    badges: [BadgeType.MOSQUE_AFFILIATED, BadgeType.HIGHLY_RECOMMENDED],
    availability: "Monday to Friday, 9:00 a.m.–5:00 p.m.; Tuesday evenings by appointment",
    isFeatured: true,
    profileViews: 286,
    searchAppearances: 914,
    contactClicks: 73,
  },
  {
    key: "yusuf-electrician",
    id: "exp-prof-yusuf-electrician",
    categorySlug: "electrician",
    serviceAreaSlugs: ["keswick", "newmarket", "east-gwillimbury", "bradford"],
    businessName: "Khan Electrical & EV",
    title: "Licensed Master Electrician",
    bio: "Residential electrician specializing in panel upgrades, EV chargers, lighting, and renovation wiring. Yusuf provides written estimates and leaves every work area tidy.",
    yearsOfExperience: 15,
    qualifications: "Red Seal Construction Electrician\nESA Master Electrician",
    licenses: "ESA demo licence #D-45892",
    languages: ["English", "Urdu", "Punjabi"],
    gender: Gender.MALE,
    website: "https://khan-electrical.example.com",
    status: ProfessionalStatus.APPROVED,
    badges: [BadgeType.MOSQUE_AFFILIATED, BadgeType.HIGHLY_RECOMMENDED],
    availability: "Monday to Saturday, 8:00 a.m.–6:00 p.m.; emergency calls when available",
    profileViews: 341,
    searchAppearances: 1058,
    contactClicks: 109,
  },
  {
    key: "farah-realtor",
    id: "exp-prof-farah-realtor",
    categorySlug: "realtor",
    serviceAreaSlugs: ["newmarket", "aurora", "richmond-hill", "vaughan"],
    businessName: "Siddiqui York Region Realty",
    title: "Real Estate Broker",
    bio: "Residential broker helping first-time buyers, growing families, and downsizers navigate the York Region market with practical advice and transparent communication.",
    yearsOfExperience: 9,
    qualifications: "Licensed Real Estate Broker\nAccredited Buyer’s Representative",
    licenses: "RECO demo registration #D-452108",
    languages: ["English", "Urdu", "French"],
    gender: Gender.FEMALE,
    website: "https://siddiqui-realty.example.com",
    status: ProfessionalStatus.APPROVED,
    badges: [BadgeType.HIGHLY_RECOMMENDED],
    availability: "Daily, 9:00 a.m.–8:00 p.m.; showings by appointment",
    profileViews: 224,
    searchAppearances: 780,
    contactClicks: 61,
  },
  {
    key: "omar-plumber",
    id: "exp-prof-omar-plumber",
    categorySlug: "plumber",
    serviceAreaSlugs: ["keswick", "georgina", "newmarket", "bradford", "barrie"],
    businessName: "Farooq Plumbing & Heating",
    title: "Licensed Plumber",
    bio: "Local plumber handling leaks, fixture replacements, water heaters, rough-ins, and small renovation projects. Emergency appointments are available for burst pipes and active leaks.",
    yearsOfExperience: 14,
    qualifications: "Red Seal Plumber\nTSSA Gas Technician 2",
    licenses: "Ontario demo trade certificate #D-88341",
    languages: ["English", "Urdu"],
    gender: Gender.MALE,
    status: ProfessionalStatus.APPROVED,
    badges: [BadgeType.MOSQUE_AFFILIATED],
    availability: "Seven days a week; 24-hour emergency phone line",
    profileViews: 198,
    searchAppearances: 669,
    contactClicks: 84,
  },
  {
    key: "imran-photographer",
    id: "exp-prof-imran-photographer",
    categorySlug: "photographer",
    serviceAreaSlugs: ["keswick", "newmarket", "aurora", "markham", "scarborough"],
    businessName: "Northern Light Photo Co.",
    title: "Event & Family Photographer",
    bio: "Documentary-style photographer for weddings, community events, family portraits, and small-business branding. Private women-only event coverage can be arranged with a female associate.",
    yearsOfExperience: 8,
    qualifications: "Diploma in Creative Photography, Humber College",
    languages: ["English", "Urdu"],
    gender: Gender.MALE,
    website: "https://northern-light-photo.example.com",
    status: ProfessionalStatus.APPROVED,
    badges: [BadgeType.MOSQUE_AFFILIATED, BadgeType.HIGHLY_RECOMMENDED],
    availability: "Weekdays after 4:00 p.m. and weekends",
    profileViews: 173,
    searchAppearances: 528,
    contactClicks: 47,
  },
  {
    key: "samir-it",
    id: "exp-prof-samir-it",
    categorySlug: "it-consultant",
    serviceAreaSlugs: ["keswick", "newmarket", "aurora", "markham"],
    businessName: "Northstar Web & IT",
    title: "Small-Business IT Consultant",
    bio: "Technology support for community organizations and small businesses, including secure Wi-Fi, Microsoft 365, websites, backups, and staff training.",
    yearsOfExperience: 11,
    qualifications: "BSc Computer Science\nMicrosoft 365 Certified Administrator",
    languages: ["English", "Urdu"],
    gender: Gender.MALE,
    website: "https://northstar-it.example.com",
    status: ProfessionalStatus.APPROVED,
    badges: [BadgeType.MOSQUE_AFFILIATED],
    availability: "Weekdays, 8:30 a.m.–6:00 p.m.; remote support available",
    isSponsored: true,
    profileViews: 257,
    searchAppearances: 882,
    contactClicks: 92,
  },
  {
    key: "nadia-accountant",
    id: "exp-prof-nadia-accountant",
    categorySlug: "accountant",
    serviceAreaSlugs: ["keswick", "newmarket", "aurora"],
    businessName: "Ali Bookkeeping & Tax",
    title: "Chartered Professional Accountant",
    bio: "CPA offering bookkeeping, personal tax returns, and year-end support for sole proprietors and incorporated small businesses.",
    yearsOfExperience: 7,
    qualifications: "CPA, Ontario\nBCom, Toronto Metropolitan University",
    licenses: "CPA Ontario demo member #D-92134",
    languages: ["English", "Urdu", "Hindi"],
    gender: Gender.FEMALE,
    status: ProfessionalStatus.PENDING,
    badges: [],
    availability: "Weekday evenings and Saturdays",
    profileViews: 0,
    searchAppearances: 0,
    contactClicks: 0,
  },
  {
    key: "bilal-counsellor",
    id: "exp-prof-bilal-counsellor",
    categorySlug: "counsellor",
    serviceAreaSlugs: ["north-york", "scarborough"],
    businessName: "Clear Path Counselling",
    title: "Registered Psychotherapist",
    bio: "Counsellor offering individual and family sessions with a focus on anxiety, life transitions, and communication skills.",
    yearsOfExperience: 5,
    qualifications: "MA Counselling Psychology",
    languages: ["English", "Arabic"],
    gender: Gender.MALE,
    status: ProfessionalStatus.REJECTED,
    badges: [],
    availability: "Tuesday to Saturday by appointment",
    rejectionReason: "Demo record: supporting registration document requires clarification.",
    profileViews: 0,
    searchAppearances: 0,
    contactClicks: 0,
  },
  {
    key: "huda-web",
    id: "exp-prof-huda-web",
    categorySlug: "web-developer",
    serviceAreaSlugs: ["downtown-toronto", "north-york", "markham"],
    businessName: "Hassan Digital Studio",
    title: "Web Developer",
    bio: "Web developer building accessible marketing sites and lightweight online stores for local organizations and independent businesses.",
    yearsOfExperience: 6,
    qualifications: "Advanced Diploma in Computer Programming",
    languages: ["English", "Arabic"],
    gender: Gender.PREFER_NOT_TO_SAY,
    website: "https://hassan-digital.example.com",
    status: ProfessionalStatus.SUSPENDED,
    badges: [],
    availability: "Remote appointments Monday to Thursday",
    rejectionReason: "Demo record: temporarily suspended while contact information is reviewed.",
    profileViews: 89,
    searchAppearances: 201,
    contactClicks: 14,
  },
];

const storageAssetSpecs = [
  {
    key: "northstarLogo",
    bucket: "professional-logos",
    objectPath: "experiment/northstar-web-it/logo.svg",
    sourceFile: "globe.svg",
    contentType: "image/svg+xml",
  },
  {
    key: "credentialDocument",
    bucket: "professional-photos",
    objectPath: "experiment/credentials/demo-verification-document.svg",
    sourceFile: "file.svg",
    contentType: "image/svg+xml",
  },
  {
    key: "imranGalleryOne",
    bucket: "professional-photos",
    objectPath: "experiment/imran-sheikh/gallery/community-gathering.jpg",
    sourceFile: "mosque3.jpg",
    contentType: "image/jpeg",
  },
  {
    key: "imranGalleryTwo",
    bucket: "professional-photos",
    objectPath: "experiment/imran-sheikh/gallery/architectural-detail.jpg",
    sourceFile: "mosque6.jpg",
    contentType: "image/jpeg",
  },
  {
    key: "imranGalleryThree",
    bucket: "professional-photos",
    objectPath: "experiment/imran-sheikh/gallery/evening-exterior.jpg",
    sourceFile: "mosque8.jpg",
    contentType: "image/jpeg",
  },
] as const;

type StorageAssetKey = (typeof storageAssetSpecs)[number]["key"];
type StorageAssetUrls = Record<StorageAssetKey, string>;

function requireSupabaseConfig() {
  if (!publicSupabaseUrl) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is required for public Auth and Storage URLs.",
    );
  }
  if (!adminSupabaseUrl) {
    throw new Error(
      "SUPABASE_INTERNAL_URL or NEXT_PUBLIC_SUPABASE_URL is required for admin API calls.",
    );
  }
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required to seed Auth and Storage.");
  }

  return {
    adminUrl: adminSupabaseUrl,
    publicUrl: publicSupabaseUrl,
    serviceRoleKey,
  };
}

async function ensureAuthUsers() {
  const config = requireSupabaseConfig();
  if (!experimentPassword || experimentPassword.length < 12) {
    throw new Error("EXPERIMENT_USER_PASSWORD must be at least 12 characters.");
  }

  const admin = createClient(config.adminUrl, config.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const existingUsers: SupabaseUser[] = [];
  const perPage = 1_000;
  for (let page = 1; ; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) {
      throw new Error(`Could not list Supabase Auth users: ${error.message}`);
    }
    existingUsers.push(...data.users);
    if (data.users.length < perPage) break;
  }
  const byEmail = new Map(
    existingUsers
      .filter((user) => user.email)
      .map((user) => [user.email!.toLowerCase(), user]),
  );
  const result = new Map<string, SupabaseUser>();

  for (const account of accounts) {
    const metadata = {
      first_name: account.firstName,
      last_name: account.lastName,
      full_name: `${account.firstName} ${account.lastName}`,
      experiment_seed: true,
    };
    const existing = byEmail.get(account.email.toLowerCase());

    if (existing) {
      const { data, error } = await admin.auth.admin.updateUserById(existing.id, {
        email: account.email,
        password: experimentPassword,
        email_confirm: true,
        user_metadata: metadata,
      });
      if (error) {
        throw new Error(`Could not update Auth user ${account.email}: ${error.message}`);
      }
      result.set(account.key, data.user);
      continue;
    }

    const { data, error } = await admin.auth.admin.createUser({
      email: account.email,
      password: experimentPassword,
      email_confirm: true,
      user_metadata: metadata,
    });
    if (error || !data.user) {
      throw new Error(
        `Could not create Auth user ${account.email}: ${error?.message ?? "unknown error"}`,
      );
    }
    byEmail.set(account.email.toLowerCase(), data.user);
    result.set(account.key, data.user);
  }

  return result;
}

async function ensureStorageAssets(): Promise<StorageAssetUrls> {
  const config = requireSupabaseConfig();
  const admin = createClient(config.adminUrl, config.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: buckets, error: listError } = await admin.storage.listBuckets({
    limit: 1_000,
  });
  if (listError) {
    throw new Error(`Could not list Supabase Storage buckets: ${listError.message}`);
  }

  for (const bucketName of ["professional-photos", "professional-logos"] as const) {
    const existing = buckets.find((bucket) => bucket.id === bucketName);
    if (!existing) {
      const { error } = await admin.storage.createBucket(bucketName, { public: true });
      if (error) {
        throw new Error(`Could not create Storage bucket ${bucketName}: ${error.message}`);
      }
      continue;
    }

    if (!existing.public) {
      const { error } = await admin.storage.updateBucket(bucketName, {
        public: true,
        fileSizeLimit: existing.file_size_limit ?? null,
        allowedMimeTypes: existing.allowed_mime_types ?? null,
      });
      if (error) {
        throw new Error(`Could not make Storage bucket ${bucketName} public: ${error.message}`);
      }
    }
  }

  const urls = {} as StorageAssetUrls;
  const publicOrigin = new URL(config.publicUrl);
  for (const asset of storageAssetSpecs) {
    const contents = await readFile(resolve(workspaceRoot, "public", asset.sourceFile));
    const bucket = admin.storage.from(asset.bucket);
    const { error } = await bucket.upload(asset.objectPath, contents, {
      cacheControl: "3600",
      contentType: asset.contentType,
      upsert: true,
    });
    if (error) {
      throw new Error(
        `Could not upload ${asset.sourceFile} to ${asset.bucket}/${asset.objectPath}: ${error.message}`,
      );
    }

    const { data } = bucket.getPublicUrl(asset.objectPath);
    const persistedUrl = new URL(data.publicUrl);
    // The admin client may use a loopback/container address. Browsers must see
    // the public Supabase origin while retaining Storage's generated path.
    persistedUrl.protocol = publicOrigin.protocol;
    persistedUrl.host = publicOrigin.host;
    urls[asset.key] = persistedUrl.toString();
  }

  return urls;
}

async function main() {
  console.log("Seeding comprehensive Minaret experiment data...");

  // Auth is intentionally provisioned first. If the database is unavailable,
  // rerunning safely attaches the same Auth users to the database fixtures.
  const authUsers = await ensureAuthUsers();
  const storageAssets = await ensureStorageAssets();

  const mosque = await prisma.mosque.upsert({
    where: { slug: mosqueSlug },
    update: {
      name: "Al-Falah Mosque",
      description: "A welcoming York Region mosque community used for the Minaret self-hosting experiment.",
      address: "2200 Community Road",
      city: "Keswick",
      province: "Ontario",
      country: "Canada",
      communityChannelType: "WhatsApp",
      communityChannelName: "Al-Falah Community Announcements",
      isActive: true,
    },
    create: {
      id: "exp-mosque-primary",
      name: "Al-Falah Mosque",
      slug: mosqueSlug,
      description: "A welcoming York Region mosque community used for the Minaret self-hosting experiment.",
      address: "2200 Community Road",
      city: "Keswick",
      province: "Ontario",
      country: "Canada",
      communityChannelType: "WhatsApp",
      communityChannelName: "Al-Falah Community Announcements",
      isActive: true,
    },
  });

  const categoryBySlug = new Map<string, Awaited<ReturnType<typeof prisma.category.upsert>>>();
  for (const [sortOrder, category] of CATEGORIES.entries()) {
    const record = await prisma.category.upsert({
      where: { slug_mosqueId: { slug: category.slug, mosqueId: mosque.id } },
      update: {
        name: category.name,
        icon: category.icon,
        isActive: true,
        sortOrder,
      },
      create: {
        name: category.name,
        slug: category.slug,
        icon: category.icon,
        mosqueId: mosque.id,
        isActive: true,
        sortOrder,
      },
    });
    categoryBySlug.set(record.slug, record);
  }

  // This mirrors the outcome of approving one seeded category suggestion.
  const seniorCareCategory = await prisma.category.upsert({
    where: {
      slug_mosqueId: { slug: "senior-companion-care", mosqueId: mosque.id },
    },
    update: { name: "Senior Companion Care", icon: "🤝", isActive: true },
    create: {
      name: "Senior Companion Care",
      slug: "senior-companion-care",
      icon: "🤝",
      description: "Non-medical companionship and practical support for seniors.",
      mosqueId: mosque.id,
      isActive: true,
      sortOrder: CATEGORIES.length,
    },
  });
  categoryBySlug.set(seniorCareCategory.slug, seniorCareCategory);

  const serviceAreaBySlug = new Map<string, Awaited<ReturnType<typeof prisma.serviceArea.upsert>>>();
  for (const area of SERVICE_AREAS) {
    const record = await prisma.serviceArea.upsert({
      where: { slug_mosqueId: { slug: area.slug, mosqueId: mosque.id } },
      update: {
        name: area.name,
        city: area.name,
        province: "Ontario",
        country: "Canada",
      },
      create: {
        name: area.name,
        slug: area.slug,
        city: area.name,
        province: "Ontario",
        country: "Canada",
        mosqueId: mosque.id,
      },
    });
    serviceAreaBySlug.set(record.slug, record);
  }

  const appUsers = new Map<string, Awaited<ReturnType<typeof prisma.user.create>>>();
  for (const account of accounts) {
    const authUser = authUsers.get(account.key);
    if (!authUser) throw new Error(`Missing Auth user for ${account.key}`);

    const matches = await prisma.user.findMany({
      where: {
        OR: [
          { id: account.appUserId },
          { supabaseId: authUser.id },
          { email: account.email },
        ],
      },
    });
    if (matches.length > 1) {
      throw new Error(
        `Conflicting app users exist for ${account.email}; refusing to merge records automatically.`,
      );
    }

    const userData = {
      supabaseId: authUser.id,
      email: account.email,
      firstName: account.firstName,
      lastName: account.lastName,
      displayName: `${account.firstName} ${account.lastName}`,
      avatarUrl: null,
      phone: account.phone ?? null,
      whatsapp: account.whatsapp ?? null,
      role: account.role,
      mosqueId: mosque.id,
      isActive: true,
      emailVerified: true,
    };

    const appUser = matches[0]
      ? await prisma.user.update({ where: { id: matches[0].id }, data: userData })
      : await prisma.user.create({
          data: { id: account.appUserId, ...userData },
        });
    appUsers.set(account.key, appUser);
  }

  const requiredCategory = (slug: string) => {
    const category = categoryBySlug.get(slug);
    if (!category) throw new Error(`Missing seeded category: ${slug}`);
    return category;
  };
  const requiredArea = (slug: string) => {
    const area = serviceAreaBySlug.get(slug);
    if (!area) throw new Error(`Missing seeded service area: ${slug}`);
    return area;
  };
  const requiredUser = (key: string) => {
    const user = appUsers.get(key);
    if (!user) throw new Error(`Missing seeded app user: ${key}`);
    return user;
  };

  const professionalByKey = new Map<
    string,
    Awaited<ReturnType<typeof prisma.professional.create>>
  >();
  for (const spec of professionals) {
    const user = requiredUser(spec.key);
    const category = requiredCategory(spec.categorySlug);
    const areaConnections = spec.serviceAreaSlugs.map((slug) => ({
      id: requiredArea(slug).id,
    }));
    const approvedAt =
      spec.status === ProfessionalStatus.APPROVED ||
      spec.status === ProfessionalStatus.SUSPENDED
        ? at("2026-06-18T14:00:00.000Z")
        : null;
    const sharedData = {
      mosqueId: mosque.id,
      categoryId: category.id,
      businessName: spec.businessName,
      title: spec.title,
      bio: spec.bio,
      yearsOfExperience: spec.yearsOfExperience,
      qualifications: spec.qualifications,
      licenses: spec.licenses ?? null,
      languages: spec.languages,
      gender: spec.gender,
      phone: user.phone,
      email: user.email,
      website: spec.website ?? null,
      whatsapp: user.whatsapp,
      photoUrl: null,
      logoUrl:
        spec.key === "samir-it"
          ? storageAssets.northstarLogo
          : spec.logoUrl ?? null,
      status: spec.status,
      isVerified: spec.status === ProfessionalStatus.APPROVED,
      isFeatured: spec.isFeatured ?? false,
      isSponsored: spec.isSponsored ?? false,
      profileViews: spec.profileViews,
      searchAppearances: spec.searchAppearances,
      contactClicks: spec.contactClicks,
      availability: spec.availability,
      rejectionReason: spec.rejectionReason ?? null,
      submittedAt: at("2026-06-10T13:00:00.000Z"),
      approvedAt,
    };

    const professional = await prisma.professional.upsert({
      where: { id: spec.id },
      update: {
        ...sharedData,
        serviceAreas: { set: areaConnections },
      },
      create: {
        id: spec.id,
        userId: user.id,
        ...sharedData,
        serviceAreas: { connect: areaConnections },
      },
    });
    professionalByKey.set(spec.key, professional);

    if (spec.badges.length === 0) {
      await prisma.verificationBadge.deleteMany({
        where: { professionalId: professional.id },
      });
    } else {
      await prisma.verificationBadge.deleteMany({
        where: {
          professionalId: professional.id,
          type: { notIn: spec.badges },
        },
      });
    }
    for (const badge of spec.badges) {
      await prisma.verificationBadge.upsert({
        where: {
          professionalId_type: {
            professionalId: professional.id,
            type: badge,
          },
        },
        update: {
          expiresAt: null,
          notes: "Verified fixture for the local self-hosting experiment.",
        },
        create: {
          professionalId: professional.id,
          type: badge,
          issuedAt: at("2026-06-18T14:00:00.000Z"),
          notes: "Verified fixture for the local self-hosting experiment.",
        },
      });
    }
  }

  const requiredProfessional = (key: string) => {
    const professional = professionalByKey.get(key);
    if (!professional) throw new Error(`Missing seeded professional: ${key}`);
    return professional;
  };

  const credentialFixtures = [
    {
      id: "exp-credential-amira-cpso",
      professionalKey: "amira-doctor",
      name: "CPSO Registration (Demo)",
      verified: true,
    },
    {
      id: "exp-credential-yusuf-esa",
      professionalKey: "yusuf-electrician",
      name: "ESA Master Electrician Licence (Demo)",
      verified: true,
    },
    {
      id: "exp-credential-farah-reco",
      professionalKey: "farah-realtor",
      name: "RECO Registration (Demo)",
      verified: false,
    },
  ];
  for (const fixture of credentialFixtures) {
    await prisma.credential.upsert({
      where: { id: fixture.id },
      update: {
        professionalId: requiredProfessional(fixture.professionalKey).id,
        name: fixture.name,
        fileUrl: storageAssets.credentialDocument,
        fileType: "image/svg+xml",
        isVerified: fixture.verified,
      },
      create: {
        id: fixture.id,
        professionalId: requiredProfessional(fixture.professionalKey).id,
        name: fixture.name,
        fileUrl: storageAssets.credentialDocument,
        fileType: "image/svg+xml",
        isVerified: fixture.verified,
        uploadedAt: at("2026-06-12T10:00:00.000Z"),
      },
    });
  }

  const galleryFixtures = [
    {
      id: "exp-gallery-imran-1",
      url: storageAssets.imranGalleryOne,
      caption: "Golden-hour community gathering",
      sortOrder: 0,
    },
    {
      id: "exp-gallery-imran-2",
      url: storageAssets.imranGalleryTwo,
      caption: "Architectural detail study",
      sortOrder: 1,
    },
    {
      id: "exp-gallery-imran-3",
      url: storageAssets.imranGalleryThree,
      caption: "Evening event exterior",
      sortOrder: 2,
    },
  ];
  for (const fixture of galleryFixtures) {
    await prisma.galleryImage.upsert({
      where: { id: fixture.id },
      update: {
        professionalId: requiredProfessional("imran-photographer").id,
        url: fixture.url,
        caption: fixture.caption,
        sortOrder: fixture.sortOrder,
      },
      create: {
        ...fixture,
        professionalId: requiredProfessional("imran-photographer").id,
        uploadedAt: at("2026-06-20T15:00:00.000Z"),
      },
    });
  }

  const recommendationFixtures = [
    {
      id: "exp-rec-amira-approved",
      professionalKey: "amira-doctor",
      userKey: "layla-member",
      content: "Dr. Rahman listened carefully, explained the options in plain language, and followed up when the test results arrived. Our family felt genuinely cared for.",
      rating: 5,
      highlyRecommended: true,
      status: RecommendationStatus.APPROVED,
      moderatorNote: null,
      approvedAt: at("2026-07-03T16:00:00.000Z"),
    },
    {
      id: "exp-rec-yusuf-approved",
      professionalKey: "yusuf-electrician",
      userKey: "tariq-member",
      content: "Yusuf installed our EV charger and labelled the panel properly. The estimate was accurate, the inspection passed, and the workspace was spotless.",
      rating: 5,
      highlyRecommended: true,
      status: RecommendationStatus.APPROVED,
      moderatorNote: null,
      approvedAt: at("2026-07-08T16:00:00.000Z"),
    },
    {
      id: "exp-rec-farah-approved",
      professionalKey: "farah-realtor",
      userKey: "layla-member",
      content: "Farah was patient through a long search and never pressured us. Her neighbourhood comparisons helped us make a confident offer.",
      rating: 5,
      highlyRecommended: true,
      status: RecommendationStatus.APPROVED,
      moderatorNote: null,
      approvedAt: at("2026-07-13T16:00:00.000Z"),
    },
    {
      id: "exp-rec-imran-pending",
      professionalKey: "imran-photographer",
      userKey: "tariq-member",
      content: "Imran photographed our community dinner and delivered a thoughtful set of candid images within the promised week.",
      rating: 5,
      highlyRecommended: false,
      status: RecommendationStatus.PENDING,
      moderatorNote: null,
      approvedAt: null,
    },
    {
      id: "exp-rec-bilal-rejected",
      professionalKey: "bilal-counsellor",
      userKey: "layla-member",
      content: "The initial consultation was easy to schedule and the office was convenient.",
      rating: 4,
      highlyRecommended: false,
      status: RecommendationStatus.REJECTED,
      moderatorNote: "Demo moderation: hold recommendations while the professional profile is rejected.",
      approvedAt: null,
    },
  ];
  for (const fixture of recommendationFixtures) {
    await prisma.recommendation.upsert({
      where: { id: fixture.id },
      update: {
        professionalId: requiredProfessional(fixture.professionalKey).id,
        userId: requiredUser(fixture.userKey).id,
        content: fixture.content,
        rating: fixture.rating,
        highlyRecommended: fixture.highlyRecommended,
        status: fixture.status,
        moderatorNote: fixture.moderatorNote,
        approvedAt: fixture.approvedAt,
      },
      create: {
        id: fixture.id,
        professionalId: requiredProfessional(fixture.professionalKey).id,
        userId: requiredUser(fixture.userKey).id,
        content: fixture.content,
        rating: fixture.rating,
        highlyRecommended: fixture.highlyRecommended,
        status: fixture.status,
        moderatorNote: fixture.moderatorNote,
        createdAt: at("2026-07-01T13:00:00.000Z"),
        approvedAt: fixture.approvedAt,
      },
    });
  }

  const serviceRequestFixtures = [
    {
      id: "exp-request-open",
      userKey: "layla-member",
      categorySlug: "landscaper",
      areaSlug: "keswick",
      description: "Looking for spring garden-bed cleanup, fresh mulch, and pruning for two small trees at a detached home in Keswick.",
      preferredContact: ContactMethod.EMAIL,
      contactName: "Layla Noor",
      contactEmail: "layla.noor@minaret-demo.example.com",
      contactPhone: "+1 905 555 0110",
      preferredDate: at("2026-09-12T13:00:00.000Z"),
      status: RequestStatus.OPEN,
      assignedProfessionalKey: null,
    },
    {
      id: "exp-request-in-progress",
      userKey: "tariq-member",
      categorySlug: "electrician",
      areaSlug: "newmarket",
      description: "Need a licensed electrician to add a 240-volt garage circuit and confirm whether the existing panel has enough capacity.",
      preferredContact: ContactMethod.PHONE,
      contactName: "Tariq Hussain",
      contactEmail: "tariq.hussain@minaret-demo.example.com",
      contactPhone: "+1 416 555 0111",
      preferredDate: at("2026-08-22T13:00:00.000Z"),
      status: RequestStatus.IN_PROGRESS,
      assignedProfessionalKey: "yusuf-electrician",
    },
    {
      id: "exp-request-closed",
      userKey: "layla-member",
      categorySlug: "plumber",
      areaSlug: "georgina",
      description: "Replace a leaking kitchen faucet and inspect the shut-off valves under the sink before new cabinets are installed.",
      preferredContact: ContactMethod.WHATSAPP,
      contactName: "Layla Noor",
      contactEmail: "layla.noor@minaret-demo.example.com",
      contactPhone: "+1 905 555 0110",
      preferredDate: at("2026-07-19T13:00:00.000Z"),
      status: RequestStatus.CLOSED,
      assignedProfessionalKey: "omar-plumber",
    },
    {
      id: "exp-request-cancelled",
      userKey: "tariq-member",
      categorySlug: "photographer",
      areaSlug: "aurora",
      description: "Family portrait session for six adults and three children, preferably outdoors near sunset on a weekend.",
      preferredContact: ContactMethod.EMAIL,
      contactName: "Tariq Hussain",
      contactEmail: "tariq.hussain@minaret-demo.example.com",
      contactPhone: "+1 416 555 0111",
      preferredDate: at("2026-08-02T13:00:00.000Z"),
      status: RequestStatus.CANCELLED,
      assignedProfessionalKey: null,
    },
  ];
  for (const fixture of serviceRequestFixtures) {
    const assignedToId = fixture.assignedProfessionalKey
      ? requiredProfessional(fixture.assignedProfessionalKey).id
      : null;
    const requestData = {
      mosqueId: mosque.id,
      userId: requiredUser(fixture.userKey).id,
      categoryId: requiredCategory(fixture.categorySlug).id,
      serviceAreaId: requiredArea(fixture.areaSlug).id,
      description: fixture.description,
      preferredContact: fixture.preferredContact,
      contactValue:
        fixture.preferredContact === ContactMethod.EMAIL
          ? fixture.contactEmail
          : fixture.contactPhone,
      contactName: fixture.contactName,
      contactEmail: fixture.contactEmail,
      contactPhone: fixture.contactPhone,
      preferredDate: fixture.preferredDate,
      status: fixture.status,
      assignedToId,
    };
    await prisma.serviceRequest.upsert({
      where: { id: fixture.id },
      update: requestData,
      create: {
        id: fixture.id,
        ...requestData,
        createdAt: at("2026-07-15T13:00:00.000Z"),
      },
    });
  }

  let defaultSponsoredTier = await prisma.sponsoredPricingTier.findFirst({
    where: { categoryId: null, serviceAreaId: null },
  });
  defaultSponsoredTier = defaultSponsoredTier
    ? await prisma.sponsoredPricingTier.update({
        where: { id: defaultSponsoredTier.id },
        data: { name: "Default", priceMonthly: 49, maxSlots: 2, isActive: true },
      })
    : await prisma.sponsoredPricingTier.create({
        data: {
          id: "exp-sponsored-tier-default",
          name: "Default",
          priceMonthly: 49,
          maxSlots: 2,
          isActive: true,
        },
      });
  const itKeswickSponsoredTier = await prisma.sponsoredPricingTier.upsert({
    where: { id: "exp-sponsored-tier-it-keswick" },
    update: {
      name: "Keswick Technology",
      categoryId: requiredCategory("it-consultant").id,
      serviceAreaId: requiredArea("keswick").id,
      priceMonthly: 69,
      maxSlots: 2,
      isActive: true,
    },
    create: {
      id: "exp-sponsored-tier-it-keswick",
      name: "Keswick Technology",
      categoryId: requiredCategory("it-consultant").id,
      serviceAreaId: requiredArea("keswick").id,
      priceMonthly: 69,
      maxSlots: 2,
      isActive: true,
    },
  });

  const sponsoredFixtures = [
    {
      id: "exp-sponsored-active",
      professionalKey: "samir-it",
      categorySlug: "it-consultant",
      areaSlug: "keswick",
      pricingTierId: itKeswickSponsoredTier.id,
      priceMonthly: 69,
      status: SponsoredStatus.ACTIVE,
      startDate: at("2026-07-01T12:00:00.000Z"),
      cancelledAt: null,
      adminNote: "Approved experiment listing.",
    },
    {
      id: "exp-sponsored-pending",
      professionalKey: "farah-realtor",
      categorySlug: "realtor",
      areaSlug: "newmarket",
      pricingTierId: defaultSponsoredTier.id,
      priceMonthly: 49,
      status: SponsoredStatus.PENDING,
      startDate: null,
      cancelledAt: null,
      adminNote: null,
    },
    {
      id: "exp-sponsored-rejected",
      professionalKey: "omar-plumber",
      categorySlug: "plumber",
      areaSlug: "bradford",
      pricingTierId: defaultSponsoredTier.id,
      priceMonthly: 49,
      status: SponsoredStatus.REJECTED,
      startDate: null,
      cancelledAt: null,
      adminNote: "Demo moderation: requested artwork needs revision.",
    },
    {
      id: "exp-sponsored-cancelled",
      professionalKey: "imran-photographer",
      categorySlug: "photographer",
      areaSlug: "keswick",
      pricingTierId: defaultSponsoredTier.id,
      priceMonthly: 49,
      status: SponsoredStatus.CANCELLED,
      startDate: at("2026-05-01T12:00:00.000Z"),
      cancelledAt: at("2026-07-01T12:00:00.000Z"),
      adminNote: "Demo listing cancelled at the end of its campaign.",
    },
  ];
  for (const fixture of sponsoredFixtures) {
    await prisma.sponsoredListing.upsert({
      where: { id: fixture.id },
      update: {
        professionalId: requiredProfessional(fixture.professionalKey).id,
        categoryId: requiredCategory(fixture.categorySlug).id,
        serviceAreaId: requiredArea(fixture.areaSlug).id,
        pricingTierId: fixture.pricingTierId,
        priceMonthly: fixture.priceMonthly,
        status: fixture.status,
        startDate: fixture.startDate,
        cancelledAt: fixture.cancelledAt,
        adminNote: fixture.adminNote,
      },
      create: {
        id: fixture.id,
        professionalId: requiredProfessional(fixture.professionalKey).id,
        categoryId: requiredCategory(fixture.categorySlug).id,
        serviceAreaId: requiredArea(fixture.areaSlug).id,
        pricingTierId: fixture.pricingTierId,
        priceMonthly: fixture.priceMonthly,
        status: fixture.status,
        startDate: fixture.startDate,
        cancelledAt: fixture.cancelledAt,
        adminNote: fixture.adminNote,
        createdAt: at("2026-06-25T12:00:00.000Z"),
      },
    });
  }
  await prisma.sponsoredWaitlist.upsert({
    where: {
      professionalId_categoryId_serviceAreaId: {
        professionalId: requiredProfessional("yusuf-electrician").id,
        categoryId: requiredCategory("electrician").id,
        serviceAreaId: requiredArea("aurora").id,
      },
    },
    update: { notifiedAt: null },
    create: {
      id: "exp-sponsored-waitlist-yusuf-aurora",
      professionalId: requiredProfessional("yusuf-electrician").id,
      categoryId: requiredCategory("electrician").id,
      serviceAreaId: requiredArea("aurora").id,
      notifiedAt: null,
      createdAt: at("2026-07-28T12:00:00.000Z"),
    },
  });

  let defaultFeaturedTier = await prisma.featuredPricingTier.findFirst({
    where: { city: null },
  });
  defaultFeaturedTier = defaultFeaturedTier
    ? await prisma.featuredPricingTier.update({
        where: { id: defaultFeaturedTier.id },
        data: { name: "Default", priceMonthly: 99, maxSlots: 6, isActive: true },
      })
    : await prisma.featuredPricingTier.create({
        data: {
          id: "exp-featured-tier-default",
          name: "Default",
          priceMonthly: 99,
          maxSlots: 6,
          isActive: true,
        },
      });
  const keswickFeaturedTier = await prisma.featuredPricingTier.upsert({
    where: { id: "exp-featured-tier-keswick" },
    update: {
      name: "Keswick Spotlight",
      city: "Keswick",
      priceMonthly: 119,
      maxSlots: 3,
      isActive: true,
    },
    create: {
      id: "exp-featured-tier-keswick",
      name: "Keswick Spotlight",
      city: "Keswick",
      priceMonthly: 119,
      maxSlots: 3,
      isActive: true,
    },
  });

  const featuredFixtures = [
    {
      id: "exp-featured-active",
      professionalKey: "amira-doctor",
      city: "Keswick",
      pricingTierId: keswickFeaturedTier.id,
      priceMonthly: 119,
      status: FeaturedStatus.ACTIVE,
      startDate: at("2026-07-01T12:00:00.000Z"),
      cancelledAt: null,
      adminNote: "Approved experiment feature.",
      impressions: 1480,
      cardClicks: 176,
      websiteClicks: 29,
      phoneClicks: 41,
      whatsappClicks: 18,
    },
    {
      id: "exp-featured-pending",
      professionalKey: "farah-realtor",
      city: "Newmarket",
      pricingTierId: defaultFeaturedTier.id,
      priceMonthly: 99,
      status: FeaturedStatus.PENDING,
      startDate: null,
      cancelledAt: null,
      adminNote: null,
      impressions: 0,
      cardClicks: 0,
      websiteClicks: 0,
      phoneClicks: 0,
      whatsappClicks: 0,
    },
    {
      id: "exp-featured-rejected",
      professionalKey: "samir-it",
      city: "Aurora",
      pricingTierId: defaultFeaturedTier.id,
      priceMonthly: 99,
      status: FeaturedStatus.REJECTED,
      startDate: null,
      cancelledAt: null,
      adminNote: "Demo moderation: please provide a landscape-format promotional image.",
      impressions: 0,
      cardClicks: 0,
      websiteClicks: 0,
      phoneClicks: 0,
      whatsappClicks: 0,
    },
    {
      id: "exp-featured-cancelled",
      professionalKey: "imran-photographer",
      city: "Keswick",
      pricingTierId: keswickFeaturedTier.id,
      priceMonthly: 119,
      status: FeaturedStatus.CANCELLED,
      startDate: at("2026-04-01T12:00:00.000Z"),
      cancelledAt: at("2026-06-30T12:00:00.000Z"),
      adminNote: "Demo campaign completed after three months.",
      impressions: 936,
      cardClicks: 103,
      websiteClicks: 22,
      phoneClicks: 17,
      whatsappClicks: 9,
    },
  ];
  for (const fixture of featuredFixtures) {
    await prisma.featuredListing.upsert({
      where: { id: fixture.id },
      update: {
        professionalId: requiredProfessional(fixture.professionalKey).id,
        city: fixture.city,
        pricingTierId: fixture.pricingTierId,
        priceMonthly: fixture.priceMonthly,
        status: fixture.status,
        startDate: fixture.startDate,
        cancelledAt: fixture.cancelledAt,
        adminNote: fixture.adminNote,
        impressions: fixture.impressions,
        cardClicks: fixture.cardClicks,
        websiteClicks: fixture.websiteClicks,
        phoneClicks: fixture.phoneClicks,
        whatsappClicks: fixture.whatsappClicks,
      },
      create: {
        id: fixture.id,
        professionalId: requiredProfessional(fixture.professionalKey).id,
        city: fixture.city,
        pricingTierId: fixture.pricingTierId,
        priceMonthly: fixture.priceMonthly,
        status: fixture.status,
        startDate: fixture.startDate,
        cancelledAt: fixture.cancelledAt,
        adminNote: fixture.adminNote,
        impressions: fixture.impressions,
        cardClicks: fixture.cardClicks,
        websiteClicks: fixture.websiteClicks,
        phoneClicks: fixture.phoneClicks,
        whatsappClicks: fixture.whatsappClicks,
        createdAt: at("2026-06-25T12:00:00.000Z"),
      },
    });
  }
  await prisma.featuredWaitlist.upsert({
    where: {
      professionalId_city: {
        professionalId: requiredProfessional("yusuf-electrician").id,
        city: "Newmarket",
      },
    },
    update: { notifiedAt: null },
    create: {
      id: "exp-featured-waitlist-yusuf-newmarket",
      professionalId: requiredProfessional("yusuf-electrician").id,
      city: "Newmarket",
      notifiedAt: null,
      createdAt: at("2026-07-29T12:00:00.000Z"),
    },
  });

  const suggestionFixtures = [
    {
      id: "exp-suggestion-pending",
      name: "Speech-Language Pathologist",
      icon: "🗣️",
      requestedByKey: "layla-member",
      status: "PENDING",
      adminNote: null,
      reviewedAt: null,
    },
    {
      id: "exp-suggestion-approved",
      name: "Senior Companion Care",
      icon: "🤝",
      requestedByKey: "tariq-member",
      status: "APPROVED",
      adminNote: "Added to the experiment directory.",
      reviewedAt: at("2026-07-21T12:00:00.000Z"),
    },
    {
      id: "exp-suggestion-rejected",
      name: "General Marketplace Seller",
      icon: "🛍️",
      requestedByKey: "layla-member",
      status: "REJECTED",
      adminNote: "The directory currently focuses on professional services.",
      reviewedAt: at("2026-07-22T12:00:00.000Z"),
    },
  ];
  for (const fixture of suggestionFixtures) {
    await prisma.categorySuggestion.upsert({
      where: { id: fixture.id },
      update: {
        name: fixture.name,
        icon: fixture.icon,
        mosqueId: mosque.id,
        requestedById: requiredUser(fixture.requestedByKey).id,
        status: fixture.status,
        adminNote: fixture.adminNote,
        reviewedAt: fixture.reviewedAt,
      },
      create: {
        id: fixture.id,
        name: fixture.name,
        icon: fixture.icon,
        mosqueId: mosque.id,
        requestedById: requiredUser(fixture.requestedByKey).id,
        status: fixture.status,
        adminNote: fixture.adminNote,
        createdAt: at("2026-07-20T12:00:00.000Z"),
        reviewedAt: fixture.reviewedAt,
      },
    });
  }

  await prisma.analyticsEvent.deleteMany({
    where: { id: { startsWith: "exp-analytics-" } },
  });

  const analyticsNow = new Date();
  const analyticsRegions = ["Keswick", "Newmarket", "Aurora", "Richmond Hill", "Markham", "East Gwillimbury", "Vaughan"];
  const analyticsTerms = ["plumber", "family doctor", "accountant", "realtor", "electrician", "barber", "web developer", "photographer"];
  const analyticsEvents: Prisma.AnalyticsEventCreateManyInput[] = [];

  for (let hour = 0; hour < 24; hour++) {
    const visitorsThisHour = 2 + ((hour * 7) % 9);
    for (let visitor = 0; visitor < visitorsThisHour; visitor++) {
      const createdAt = new Date(analyticsNow);
      createdAt.setHours(createdAt.getHours() - hour, (visitor * 11) % 60, 0, 0);
      analyticsEvents.push({
        id: `exp-analytics-page-hour-${hour}-${visitor}`,
        eventType: AnalyticsEventType.PAGE_VIEW,
        visitorId: `exp-visitor-${(hour * 5 + visitor) % 31}`,
        path: visitor % 3 === 0 ? "/" : visitor % 3 === 1 ? "/professionals" : "/categories",
        createdAt,
      });
    }
  }

  for (let day = 0; day < 7; day++) {
    for (let visitor = 0; visitor < 14 + day * 3; visitor++) {
      const createdAt = new Date(analyticsNow);
      createdAt.setDate(createdAt.getDate() - day);
      createdAt.setHours((visitor * 3) % 24, (visitor * 13) % 60, 0, 0);
      analyticsEvents.push({
        id: `exp-analytics-page-day-${day}-${visitor}`,
        eventType: AnalyticsEventType.PAGE_VIEW,
        visitorId: `exp-week-visitor-${day}-${visitor}`,
        path: visitor % 4 === 0 ? "/" : visitor % 4 === 1 ? "/professionals" : visitor % 4 === 2 ? "/request" : "/professionals/exp-prof-omar-plumber",
        createdAt,
      });
    }
  }

  for (let month = 0; month < 12; month++) {
    for (let visitor = 0; visitor < 20 + month * 4; visitor++) {
      const createdAt = new Date(analyticsNow);
      createdAt.setMonth(createdAt.getMonth() - month);
      createdAt.setDate(1 + (visitor % 24));
      createdAt.setHours((visitor * 5) % 24, 0, 0, 0);
      analyticsEvents.push({
        id: `exp-analytics-page-month-${month}-${visitor}`,
        eventType: AnalyticsEventType.PAGE_VIEW,
        visitorId: `exp-month-visitor-${month}-${visitor}`,
        path: visitor % 2 === 0 ? "/" : "/professionals",
        createdAt,
      });
    }
  }

  for (let index = 0; index < 96; index++) {
    const createdAt = new Date(analyticsNow);
    createdAt.setHours(createdAt.getHours() - (index % 72), (index * 17) % 60, 0, 0);
    analyticsEvents.push({
      id: `exp-analytics-search-${index}`,
      eventType: AnalyticsEventType.HOME_SEARCH,
      visitorId: `exp-search-visitor-${index % 42}`,
      path: "/",
      searchTerm: analyticsTerms[index % analyticsTerms.length],
      region: analyticsRegions[(index * 3) % analyticsRegions.length],
      createdAt,
    });
  }

  await prisma.analyticsEvent.createMany({
    data: analyticsEvents,
    skipDuplicates: true,
  });

  console.log("Experiment seed complete.");
  console.log(
    `Created or refreshed ${accounts.length} Auth/app users, ${professionals.length} professionals, ` +
      `${recommendationFixtures.length} recommendations, ${serviceRequestFixtures.length} service requests, ` +
      `${sponsoredFixtures.length} sponsored listings, and ${featuredFixtures.length} featured listings.`,
  );
  console.log(
    `Uploaded or refreshed ${storageAssetSpecs.length} experiment objects in two public Storage buckets.`,
  );
  console.log("Login accounts (all share EXPERIMENT_USER_PASSWORD):");
  for (const account of accounts) {
    console.log(`  ${account.role.padEnd(12)} ${account.email}`);
  }
  console.log("The configured password is intentionally not printed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
