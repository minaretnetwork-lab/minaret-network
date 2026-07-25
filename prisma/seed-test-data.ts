import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding test data...");

  const mosque = await prisma.mosque.findUnique({ where: { slug: "al-falah" } });
  if (!mosque) throw new Error("Mosque not found. Run npm run db:seed first.");

  const categories = await prisma.category.findMany({ where: { mosqueId: mosque.id } });
  const serviceAreas = await prisma.serviceArea.findMany({ where: { mosqueId: mosque.id } });

  const getCat = (slug: string) => categories.find((c) => c.slug === slug)!;
  const getArea = (slug: string) => serviceAreas.find((a) => a.slug === slug);

  const professionals = [
    {
      firstName: "Ahmad",
      lastName: "Khan",
      email: "ahmad.khan@example.com",
      title: "Licensed Master Electrician",
      businessName: "Khan Electric Services",
      bio: "With over 15 years of experience in residential and commercial electrical work, I provide reliable, code-compliant electrical services across the GTA. I specialize in panel upgrades, EV charger installations, and smart home wiring. As a proud member of the Al-Falah community, I offer fellow members a 10% discount.",
      categorySlug: "electrician",
      yearsOfExperience: 15,
      qualifications: "Licensed Master Electrician (ESA Certified)\nRed Seal Journeyman",
      licenses: "Ontario Electrical Safety Authority License #45892",
      languages: ["English", "Urdu", "Punjabi"],
      phone: "+1 416 555 0101",
      whatsapp: "+14165550101",
      website: "https://khanelectric.example.com",
      serviceAreaSlugs: ["north-york", "scarborough", "markham"],
      badges: ["IDENTITY_VERIFIED", "MOSQUE_VERIFIED", "CREDENTIALS_VERIFIED", "HIGHLY_RECOMMENDED"],
      isFeatured: true,
      availability: "Monday–Saturday, 8am–6pm. Emergency calls available.",
      recommendations: [
        { name: "Yusuf Ali", content: "Ahmad did an outstanding job rewiring our basement. Very professional, clean work, and finished on time. Highly recommend to anyone in the community!" },
        { name: "Fatima Sheikh", content: "We had Ahmad install a new electrical panel and EV charger. Excellent work, very fairly priced, and he explained everything clearly. A true professional." },
        { name: "Omar Hassan", content: "Ahmad helped us with some urgent electrical issues. He came the same day and fixed everything quickly. Very trustworthy — I wouldn't hesitate to call him again." },
      ],
    },
    {
      firstName: "Dr. Aisha",
      lastName: "Rahman",
      email: "aisha.rahman@example.com",
      title: "Family Physician",
      businessName: "Scarborough Family Health Clinic",
      bio: "Board-certified family physician with 12 years of practice. I provide comprehensive primary care for all ages, from pediatrics to geriatrics. I speak Urdu, Arabic, and English, making it easier to serve our diverse community. I am accepting new patients and offer evening appointments.",
      categorySlug: "doctor",
      yearsOfExperience: 12,
      qualifications: "MD — University of Toronto\nCCFP — College of Family Physicians of Canada\nFellow, Royal College of Physicians",
      licenses: "Ontario College of Physicians and Surgeons License #2891034",
      languages: ["English", "Urdu", "Arabic"],
      phone: "+1 416 555 0202",
      whatsapp: "+14165550202",
      serviceAreaSlugs: ["scarborough", "markham", "north-york"],
      badges: ["IDENTITY_VERIFIED", "MOSQUE_VERIFIED", "CREDENTIALS_VERIFIED", "HIGHLY_RECOMMENDED"],
      isFeatured: true,
      availability: "Mon, Tue, Thu, Fri: 9am–5pm. Wed & Sat: 9am–1pm. Evening appointments available Tuesdays.",
      recommendations: [
        { name: "Ibrahim Syed", content: "Dr. Aisha is an exceptional doctor. She takes the time to listen and explain everything thoroughly. My whole family sees her now. A true blessing for our community." },
        { name: "Maryam Noor", content: "Finally found a doctor who understands our community's needs. Dr. Aisha is compassionate, knowledgeable, and genuinely cares about her patients." },
        { name: "Khalid Mahmood", content: "Dr. Aisha has been our family doctor for 3 years. She is thorough, caring, and always available when needed. Cannot recommend her enough." },
      ],
    },
    {
      firstName: "Hassan",
      lastName: "Siddiqui",
      email: "hassan.siddiqui@example.com",
      title: "Real Estate Agent & Broker",
      businessName: "Siddiqui Realty Group",
      bio: "Top-producing real estate agent with over $50M in transactions. I specialize in residential purchases, sales, and investment properties across the GTA. I understand the unique needs of first-time buyers and have helped dozens of community families find their dream homes. Let me guide you through one of life's biggest decisions.",
      categorySlug: "realtor",
      yearsOfExperience: 10,
      qualifications: "Licensed Real Estate Broker — RECO\nCertified Residential Specialist (CRS)\nAccredited Buyer's Representative (ABR)",
      licenses: "RECO Registration #4521089",
      languages: ["English", "Urdu", "Punjabi"],
      phone: "+1 905 555 0303",
      whatsapp: "+19055550303",
      website: "https://siddiqui-realty.example.com",
      serviceAreaSlugs: ["mississauga", "brampton", "vaughan", "oakville"],
      badges: ["IDENTITY_VERIFIED", "MOSQUE_VERIFIED", "HIGHLY_RECOMMENDED"],
      isFeatured: true,
      availability: "7 days a week, 9am–8pm",
      recommendations: [
        { name: "Tariq Ahmed", content: "Hassan helped us buy our first home in Mississauga. He was patient with all our questions and negotiated a great price. An absolute professional." },
        { name: "Zainab Malik", content: "We sold our home with Hassan and bought a new one — he made both transactions seamless. His knowledge of the market is impressive." },
      ],
    },
    {
      firstName: "Bilal",
      lastName: "Chaudhry",
      email: "bilal.chaudhry@example.com",
      title: "Immigration & Family Lawyer",
      businessName: "Chaudhry Law Firm",
      bio: "Experienced lawyer specializing in immigration law, family law, and business law. I have helped hundreds of community members with immigration applications, spousal sponsorships, refugee claims, divorce proceedings, and business incorporation. I offer free 30-minute consultations for Al-Falah community members.",
      categorySlug: "lawyer",
      yearsOfExperience: 14,
      qualifications: "Juris Doctor (JD) — Osgoode Hall Law School\nCalled to the Ontario Bar",
      licenses: "Law Society of Ontario — Member #P09234",
      languages: ["English", "Urdu", "Punjabi", "Arabic"],
      phone: "+1 416 555 0404",
      whatsapp: "+14165550404",
      website: "https://chaudhrylaw.example.com",
      serviceAreaSlugs: ["downtown", "north-york", "mississauga", "brampton"],
      badges: ["IDENTITY_VERIFIED", "MOSQUE_VERIFIED", "CREDENTIALS_VERIFIED"],
      isFeatured: false,
      availability: "Monday–Friday, 9am–6pm. Weekend appointments by request.",
      recommendations: [
        { name: "Amina Hussain", content: "Bilal helped my family with our immigration case. He was thorough, honest about expectations, and achieved an excellent outcome. Highly recommended." },
        { name: "Saad Qureshi", content: "I used Bilal for my business incorporation and he made the whole process simple. Very professional and responsive. Great value for the service provided." },
      ],
    },
    {
      firstName: "Nadia",
      lastName: "Farooqi",
      email: "nadia.farooqi@example.com",
      title: "Chartered Professional Accountant",
      businessName: "Farooqi & Associates CPA",
      bio: "CPA with 8 years of experience in personal tax, corporate tax, and small business accounting. I specialize in helping self-employed professionals, small business owners, and new immigrants navigate the Canadian tax system. Halal-conscious financial advice available.",
      categorySlug: "accountant",
      yearsOfExperience: 8,
      qualifications: "Chartered Professional Accountant (CPA)\nBComm — University of Waterloo",
      licenses: "CPA Ontario Member #CPA-78234",
      languages: ["English", "Urdu"],
      phone: "+1 905 555 0505",
      whatsapp: "+19055550505",
      serviceAreaSlugs: ["mississauga", "brampton", "oakville"],
      badges: ["IDENTITY_VERIFIED", "CREDENTIALS_VERIFIED"],
      isFeatured: false,
      availability: "Year-round. Extended hours January–April (tax season).",
      recommendations: [
        { name: "Rashid Iqbal", content: "Nadia has been handling our family and business taxes for 3 years. She is thorough, proactive about saving us money, and always available to answer questions." },
      ],
    },
    {
      firstName: "Tariq",
      lastName: "Mahmood",
      email: "tariq.mahmood@example.com",
      title: "Master Plumber",
      businessName: "GTA Plumbing Solutions",
      bio: "Licensed master plumber serving the GTA for over 18 years. I handle everything from leaky faucets to full bathroom renovations and new construction plumbing. Available for emergency calls 7 days a week. Community members receive priority scheduling.",
      categorySlug: "plumber",
      yearsOfExperience: 18,
      qualifications: "Licensed Master Plumber — TSSA Certified\nRed Seal Journeyman Plumber",
      licenses: "TSSA License #PLM-56789",
      languages: ["English", "Urdu", "Punjabi"],
      phone: "+1 416 555 0606",
      whatsapp: "+14165550606",
      serviceAreaSlugs: ["north-york", "scarborough", "downtown", "markham"],
      badges: ["IDENTITY_VERIFIED", "MOSQUE_VERIFIED", "CREDENTIALS_VERIFIED"],
      isFeatured: true,
      availability: "7 days a week, 7am–8pm. Emergency line available 24/7.",
      recommendations: [
        { name: "Usman Ali", content: "Tariq fixed a serious pipe leak in our basement on a Sunday evening. He was there within the hour and did excellent work. A lifesaver!" },
        { name: "Rukhsar Ahmed", content: "We used Tariq for a full bathroom renovation. The work was high quality, on schedule, and the price was very fair. Will definitely use him again." },
      ],
    },
    {
      firstName: "Zara",
      lastName: "Hussain",
      email: "zara.hussain@example.com",
      title: "Registered Mortgage Broker",
      businessName: "Hussain Mortgage Solutions",
      bio: "Registered mortgage broker helping families secure the best rates and terms for their home purchases and refinancing. I work with over 40 lenders and specialize in helping self-employed individuals, newcomers to Canada, and those with unique financial situations. Halal mortgage options available.",
      categorySlug: "mortgage-broker",
      yearsOfExperience: 7,
      qualifications: "Accredited Mortgage Professional (AMP)\nFSRA Licensed Mortgage Broker",
      licenses: "FSRA License #M21004567",
      languages: ["English", "Urdu", "Arabic"],
      phone: "+1 905 555 0707",
      whatsapp: "+19055550707",
      serviceAreaSlugs: ["mississauga", "brampton", "oakville", "hamilton"],
      badges: ["IDENTITY_VERIFIED", "MOSQUE_VERIFIED"],
      isFeatured: false,
      availability: "Monday–Saturday, 9am–7pm",
      recommendations: [
        { name: "Faisal Khan", content: "Zara helped us get an amazing mortgage rate when three other brokers couldn't help us. She was persistent and creative in finding us a solution. Highly recommend!" },
      ],
    },
    {
      firstName: "Imran",
      lastName: "Sheikh",
      email: "imran.sheikh@example.com",
      title: "IT Consultant & Software Developer",
      businessName: "Sheikh Tech Solutions",
      bio: "Full-stack developer and IT consultant with 10 years of experience. I help small businesses build websites, mobile apps, automate processes, and manage their IT infrastructure. I offer affordable rates to community members and can help you take your business online.",
      categorySlug: "it-consultant",
      yearsOfExperience: 10,
      qualifications: "BSc Computer Science — University of Toronto\nAWS Certified Solutions Architect\nGoogle Cloud Professional",
      languages: ["English", "Urdu"],
      phone: "+1 416 555 0808",
      whatsapp: "+14165550808",
      website: "https://sheikhtech.example.com",
      serviceAreaSlugs: ["downtown", "north-york", "scarborough", "markham"],
      badges: ["IDENTITY_VERIFIED", "CREDENTIALS_VERIFIED"],
      isFeatured: false,
      availability: "Flexible hours. Remote work available.",
      recommendations: [
        { name: "Hamza Malik", content: "Imran built our restaurant's website and online ordering system. Very professional, delivered on time, and the price was very reasonable. Great work!" },
      ],
    },
    {
      firstName: "Dr. Yusuf",
      lastName: "Patel",
      email: "yusuf.patel@example.com",
      title: "General Dentist",
      businessName: "Patel Family Dental",
      bio: "Gentle, patient-centered family dentistry for all ages. I have been practicing for 11 years and offer a full range of dental services including cleanings, fillings, crowns, Invisalign, and implants. I understand dental anxiety and create a calm, comfortable environment for every patient.",
      categorySlug: "dentist",
      yearsOfExperience: 11,
      qualifications: "Doctor of Dental Surgery (DDS) — University of Western Ontario\nInvisalign Certified Provider",
      licenses: "Royal College of Dental Surgeons of Ontario #RCDSO-34521",
      languages: ["English", "Urdu", "Gujarati"],
      phone: "+1 905 555 0909",
      whatsapp: "+19055550909",
      serviceAreaSlugs: ["mississauga", "brampton", "oakville"],
      badges: ["IDENTITY_VERIFIED", "MOSQUE_VERIFIED", "CREDENTIALS_VERIFIED", "HIGHLY_RECOMMENDED"],
      isFeatured: true,
      availability: "Mon–Wed: 9am–5pm, Thu: 11am–7pm, Sat: 9am–2pm",
      recommendations: [
        { name: "Safia Noor", content: "Dr. Patel is amazing with kids! My children actually look forward to going to the dentist now. He is gentle, explains everything, and the staff are wonderful." },
        { name: "Abdullah Rahman", content: "I had a crown done by Dr. Patel and it was completely pain-free. His attention to detail is excellent. I refer everyone in my family to him." },
      ],
    },
    {
      firstName: "Samira",
      lastName: "Akhtar",
      email: "samira.akhtar@example.com",
      title: "Registered Psychotherapist & Counsellor",
      businessName: "Mindful Healing Therapy",
      bio: "Registered psychotherapist specializing in anxiety, depression, trauma, and family counselling. I provide culturally sensitive therapy that respects Islamic values and understands the unique challenges faced by Muslim families in Canada. Offering both in-person and virtual sessions. Sliding scale fees available for those in need.",
      categorySlug: "counsellor",
      yearsOfExperience: 9,
      qualifications: "Master of Social Work (MSW) — York University\nRegistered Psychotherapist (RP) — CRPO\nCertified in EMDR Trauma Therapy",
      licenses: "College of Registered Psychotherapists of Ontario — RP #7823",
      languages: ["English", "Urdu", "Arabic"],
      phone: "+1 416 555 1010",
      whatsapp: "+14165551010",
      serviceAreaSlugs: ["north-york", "downtown", "scarborough"],
      badges: ["IDENTITY_VERIFIED", "MOSQUE_VERIFIED", "CREDENTIALS_VERIFIED"],
      isFeatured: false,
      availability: "Tuesday–Saturday. Evening and weekend appointments available. Virtual sessions available.",
      recommendations: [
        { name: "Anonymous Community Member", content: "Samira helped me through one of the most difficult periods of my life. She is compassionate, non-judgmental, and truly understands the Muslim experience. I cannot thank her enough." },
      ],
    },

    // ── Keswick / York Region / Northern GTA ──────────────────────────────
    {
      firstName: "Khalid",
      lastName: "Mirza",
      email: "khalid.mirza@example.com",
      title: "Licensed Electrician",
      businessName: "Mirza Electric — York Region",
      bio: "Licensed electrician serving Keswick, Newmarket, Aurora, and surrounding York Region communities for over 12 years. I handle residential rewiring, panel upgrades, pot lights, EV charger installations, and emergency electrical work. Local to Keswick — fast response times guaranteed.",
      categorySlug: "electrician",
      yearsOfExperience: 12,
      qualifications: "Licensed Electrician (ESA Certified)\nJourneyman Electrician — Red Seal",
      licenses: "Ontario Electrical Safety Authority License #67234",
      languages: ["English", "Urdu", "Punjabi"],
      phone: "+1 905 555 1101",
      whatsapp: "+19055551101",
      serviceAreaSlugs: ["keswick", "newmarket", "aurora", "east-gwillimbury", "georgina", "bradford"],
      badges: ["MOSQUE_AFFILIATED"],
      isFeatured: false,
      availability: "Monday–Saturday, 7am–7pm. Emergency calls available evenings.",
      recommendations: [
        { name: "Yusra Baig", content: "Khalid replaced our entire electrical panel and installed EV charger. Quick, clean, very professional. Glad to have a trusted electrician in Keswick." },
        { name: "Adnan Qureshi", content: "Called Khalid for an emergency on a Friday evening and he was there within the hour. Fixed the issue quickly and charged a fair price. Highly recommended." },
      ],
    },
    {
      firstName: "Sana",
      lastName: "Riaz",
      email: "sana.riaz@example.com",
      title: "Family Physician",
      businessName: "Newmarket Community Health",
      bio: "Family physician accepting new patients in the York Region area. I provide comprehensive primary care for families, children, and seniors. Fluent in Urdu and Punjabi, making it easier to serve our growing South Asian community in the north GTA. Telehealth appointments available.",
      categorySlug: "doctor",
      yearsOfExperience: 8,
      qualifications: "MD — McMaster University\nCCFP — College of Family Physicians of Canada",
      licenses: "Ontario College of Physicians and Surgeons #3102874",
      languages: ["English", "Urdu", "Punjabi"],
      phone: "+1 905 555 1202",
      whatsapp: "+19055551202",
      serviceAreaSlugs: ["newmarket", "aurora", "keswick", "bradford", "east-gwillimbury", "king-city"],
      badges: ["MOSQUE_AFFILIATED", "HIGHLY_RECOMMENDED"],
      isFeatured: false,
      availability: "Mon–Fri 9am–5pm, Sat 9am–12pm. Evening telehealth available Tuesdays.",
      recommendations: [
        { name: "Farhan Siddiqui", content: "Dr. Sana is wonderful — patient, thorough, and genuinely cares about her patients. Finally a doctor close to home who speaks Urdu. Our whole family sees her." },
        { name: "Noor Malik", content: "She took the time to actually listen and address all my concerns. Very rare these days. I drive from Bradford just to see her." },
      ],
    },
    {
      firstName: "Omer",
      lastName: "Farooq",
      email: "omer.farooq@example.com",
      title: "Master Plumber",
      businessName: "Farooq Plumbing & Heating",
      bio: "Licensed master plumber based in Keswick, serving York Region and Simcoe County. Specializing in residential plumbing, bathroom and kitchen renovations, water heater replacement, and frozen pipe emergencies. 24/7 emergency service available for community members.",
      categorySlug: "plumber",
      yearsOfExperience: 14,
      qualifications: "Licensed Master Plumber — TSSA Certified\nRed Seal Journeyman Plumber",
      licenses: "TSSA License #PLM-88341",
      languages: ["English", "Urdu"],
      phone: "+1 905 555 1303",
      whatsapp: "+19055551303",
      serviceAreaSlugs: ["keswick", "newmarket", "aurora", "bradford", "barrie", "georgina", "east-gwillimbury"],
      badges: ["MOSQUE_AFFILIATED"],
      isFeatured: false,
      availability: "7 days a week. 24/7 emergency line for burst pipes and flooding.",
      recommendations: [
        { name: "Tariq Hussain", content: "Omer came out on a Saturday for a burst pipe in our basement. Had it fixed within 2 hours. Professional and affordable. Will definitely call again." },
        { name: "Razia Ahmed", content: "We used Omer for a full bathroom renovation in our Keswick home. Excellent workmanship and he finished ahead of schedule. Great value." },
      ],
    },
    {
      firstName: "Farrukh",
      lastName: "Tashkentov",
      email: "farrukh.tashkentov@example.com",
      title: "Realtor",
      businessName: "York Region Homes",
      bio: "Top realtor specializing in Keswick, Newmarket, Aurora, and the broader York Region market. I help families buy and sell homes with honesty and expertise. With deep knowledge of the local market and a network of trusted professionals, I make the buying and selling process smooth and stress-free.",
      categorySlug: "realtor",
      yearsOfExperience: 9,
      qualifications: "Licensed Real Estate Salesperson — RECO\nAccredited Buyer's Representative (ABR)",
      licenses: "RECO Registration #5892341",
      languages: ["English", "Uzbek", "Russian"],
      phone: "+1 905 555 1404",
      whatsapp: "+19055551404",
      serviceAreaSlugs: ["keswick", "newmarket", "aurora", "bradford", "east-gwillimbury", "barrie", "georgina"],
      badges: ["MOSQUE_AFFILIATED", "HIGHLY_RECOMMENDED"],
      isFeatured: false,
      availability: "7 days a week, 8am–9pm",
      recommendations: [
        { name: "Musa Karimov", content: "Farrukh helped us find our dream home in Keswick. He was patient through 3 months of searching and negotiated a great price. Honest and hardworking." },
        { name: "Lena Abubakar", content: "Sold our Newmarket home in under a week for over asking. Farrukh knows this market inside out. Highly recommend to anyone buying or selling in York Region." },
      ],
    },
    {
      firstName: "Amir",
      lastName: "Chowdhury",
      email: "amir.chowdhury@example.com",
      title: "Handyman & Home Repair Specialist",
      businessName: "Chowdhury Handyman Services",
      bio: "Reliable handyman serving Keswick and York Region for 10 years. I handle drywall repairs, painting, door and window installation, flooring, deck repairs, and general home maintenance. No job too small. Community members get priority booking and honest pricing.",
      categorySlug: "handyman",
      yearsOfExperience: 10,
      qualifications: "Red Seal Carpenter\nCertified in Workplace Safety",
      languages: ["English", "Bengali", "Urdu"],
      phone: "+1 905 555 1505",
      whatsapp: "+19055551505",
      serviceAreaSlugs: ["keswick", "newmarket", "aurora", "east-gwillimbury", "georgina", "bradford", "barrie"],
      badges: ["MOSQUE_AFFILIATED"],
      isFeatured: false,
      availability: "Monday–Saturday, 8am–6pm",
      recommendations: [
        { name: "Hira Zaidi", content: "Amir repaired our deck and painted two rooms. Fair price, great work, and very respectful of our home. Will definitely call him for our next project." },
        { name: "Salim Choudhury", content: "Amir is our go-to for anything around the house. He has done drywall, flooring, and exterior repairs for us. Always on time and great quality." },
      ],
    },
    {
      firstName: "Zainab",
      lastName: "Al-Rashid",
      email: "zainab.alrashid@example.com",
      title: "Chartered Professional Accountant",
      businessName: "Al-Rashid Accounting — York Region",
      bio: "CPA serving individuals and small businesses in Keswick, Newmarket, and York Region. Specializing in personal and corporate tax returns, HST filings, bookkeeping, and financial planning for new immigrants and self-employed professionals. Halal-conscious financial guidance available.",
      categorySlug: "accountant",
      yearsOfExperience: 7,
      qualifications: "Chartered Professional Accountant (CPA)\nBBA — York University",
      licenses: "CPA Ontario Member #CPA-92134",
      languages: ["English", "Arabic", "Urdu"],
      phone: "+1 905 555 1606",
      whatsapp: "+19055551606",
      serviceAreaSlugs: ["keswick", "newmarket", "aurora", "bradford", "barrie", "georgina"],
      badges: ["MOSQUE_AFFILIATED"],
      isFeatured: false,
      availability: "Year-round. Extended hours during tax season (Feb–Apr). Virtual meetings available.",
      recommendations: [
        { name: "Yousef Nassar", content: "Zainab has been doing our family and business taxes for 4 years. She is sharp, proactive, and always finds deductions we miss. Very trustworthy." },
        { name: "Dina Khalil", content: "As a new immigrant, I was completely lost with Canadian taxes. Zainab explained everything clearly and filed everything perfectly. Highly recommend." },
      ],
    },
  ];

  let created = 0;

  for (const pro of professionals) {
    const category = getCat(pro.categorySlug);
    if (!category) {
      console.log(`⚠️  Category not found: ${pro.categorySlug}`);
      continue;
    }

    // Skip if already seeded
    const existing = await prisma.user.findUnique({ where: { supabaseId: `test-${pro.email}` } });
    if (existing) {
      console.log(`⏭️  Skipping ${pro.firstName} ${pro.lastName} (already exists)`);
      continue;
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        supabaseId: `test-${pro.email}`,
        email: pro.email,
        firstName: pro.firstName,
        lastName: pro.lastName,
        displayName: `${pro.firstName} ${pro.lastName}`,
        mosqueId: mosque.id,
        role: "PROFESSIONAL",
        emailVerified: true,
      },
    });

    // Get service areas
    const areas = pro.serviceAreaSlugs
      .map((slug) => getArea(slug))
      .filter(Boolean);

    // Create professional
    const professional = await prisma.professional.create({
      data: {
        userId: user.id,
        mosqueId: mosque.id,
        categoryId: category.id,
        title: pro.title,
        businessName: pro.businessName ?? null,
        bio: pro.bio,
        yearsOfExperience: pro.yearsOfExperience,
        qualifications: pro.qualifications ?? null,
        licenses: pro.licenses ?? null,
        languages: pro.languages,
        phone: pro.phone ?? null,
        email: pro.email,
        website: pro.website ?? null,
        whatsapp: pro.whatsapp ?? null,
        status: "APPROVED",
        isVerified: true,
        isFeatured: pro.isFeatured,
        approvedAt: new Date(),
        availability: pro.availability ?? null,
        serviceAreas: { connect: areas.map((a) => ({ id: a!.id })) },
      },
    });

    // Add badges
    for (const badgeType of pro.badges) {
      await prisma.verificationBadge.create({
        data: {
          professionalId: professional.id,
          type: badgeType as never,
        },
      });
    }

    // Add recommendations
    for (const rec of pro.recommendations) {
      // Create a dummy user for each recommender
      const recUser = await prisma.user.create({
        data: {
          supabaseId: `test-rec-${pro.email}-${rec.name.replace(/\s+/g, "-").toLowerCase()}`,
          email: `${rec.name.replace(/\s+/g, ".").toLowerCase()}@community.example.com`,
          displayName: rec.name,
          mosqueId: mosque.id,
          role: "MEMBER",
          emailVerified: true,
        },
      });

      await prisma.recommendation.create({
        data: {
          professionalId: professional.id,
          userId: recUser.id,
          content: rec.content,
          status: "APPROVED",
          approvedAt: new Date(),
        },
      });
    }

    console.log(`✅ ${pro.firstName} ${pro.lastName} — ${category.name}`);
    created++;
  }

  console.log(`\n🎉 Created ${created} professionals with recommendations!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
