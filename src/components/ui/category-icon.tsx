import {
  Stethoscope, Smile, Pill, Activity, Bone, Eye, Brain,
  Scale, Globe, FileSignature, Calculator, Receipt, TrendingUp,
  Shield, Landmark, Home,
  HardHat, Hammer, Zap, Wrench, Thermometer, Snowflake, Paintbrush,
  Layers, Leaf, Truck, Bug, Plug, Sparkles,
  Cog, BookOpen, Car, Dumbbell,
  Monitor, Code2, Palette, Camera, Video,
  Scissors, UtensilsCrossed, PawPrint, Heart,
  Briefcase, Plane, Baby, MoreHorizontal,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  // Healthcare
  "doctor":               Stethoscope,
  "dentist":              Smile,
  "pharmacist":           Pill,
  "physiotherapist":      Activity,
  "chiropractor":         Bone,
  "optometrist":          Eye,
  "counsellor":           Brain,
  // Legal & Financial
  "lawyer":               Scale,
  "immigration-consultant": Globe,
  "notary-public":        FileSignature,
  "accountant":           Calculator,
  "tax-preparer":         Receipt,
  "financial-advisor":    TrendingUp,
  "insurance-broker":     Shield,
  "mortgage-broker":      Landmark,
  "realtor":              Home,
  // Home Services & Trades
  "contractor":           HardHat,
  "handyman":             Hammer,
  "electrician":          Zap,
  "plumber":              Wrench,
  "hvac":                 Thermometer,
  "roofer":               Home,
  "painter":              Paintbrush,
  "flooring":             Layers,
  "landscaper":           Leaf,
  "snow-removal":         Snowflake,
  "home-inspector":       Activity,
  "moving-services":      Truck,
  "pest-control":         Bug,
  "appliance-repair":     Plug,
  "cleaning-services":    Sparkles,
  // Auto
  "mechanic":             Cog,
  // Education & Coaching
  "tutor":                BookOpen,
  "driving-instructor":   Car,
  "personal-trainer":     Dumbbell,
  // Technology & Creative
  "it-consultant":        Monitor,
  "web-developer":        Code2,
  "graphic-designer":     Palette,
  "photographer":         Camera,
  "videographer":         Video,
  // Lifestyle & Events
  "tailor-alterations":   Scissors,
  "barber-hair-stylist":  Scissors,
  "event-wedding-planner": Heart,
  "restaurant-catering":  UtensilsCrossed,
  "pet-sitter":           PawPrint,
  // Business
  "business-consultant":  Briefcase,
  "travel-agent":         Plane,
  "childcare":            Baby,
  "other":                MoreHorizontal,
};

interface Props {
  slug: string;
  className?: string;
}

export function CategoryIcon({ slug, className = "h-4 w-4" }: Props) {
  const Icon = ICON_MAP[slug] ?? MoreHorizontal;
  return <Icon className={className} />;
}
