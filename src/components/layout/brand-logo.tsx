interface BrandLogoProps {
  className?: string;
}

export function BrandLogo({ className = "h-9 w-9" }: BrandLogoProps) {
  return (
    <img
      src="/minaret-logo.png"
      alt="Minaret Network"
      className={`${className} rounded-full object-cover`}
    />
  );
}
