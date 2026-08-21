"use client";

import { usePathname } from "next/navigation";

const WA_NUMBER = "16479733286";
const WA_MESSAGE = encodeURIComponent("Hi, I need help with Minaret Network");
const WA_URL = `https://wa.me/${WA_NUMBER}?text=${WA_MESSAGE}`;

export function WhatsAppBubble() {
  const pathname = usePathname();

  // Hide on admin pages — support widget not needed there
  if (pathname.startsWith("/admin")) return null;

  return (
    <a
      href={WA_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with support on WhatsApp"
      className="fixed bottom-24 right-4 z-40 flex h-13 w-13 items-center justify-center rounded-full bg-[#25D366] shadow-lg ring-2 ring-white/20 transition-transform hover:scale-110 active:scale-95 dark:ring-gray-900/40"
      style={{ width: "3.25rem", height: "3.25rem" }}
    >
      <WhatsAppIcon />
    </a>
  );
}

function WhatsAppIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      width="28"
      height="28"
      fill="white"
      aria-hidden="true"
    >
      <path d="M16 1C7.716 1 1 7.716 1 16c0 2.628.672 5.096 1.845 7.254L1 31l7.965-2.087A14.927 14.927 0 0 0 16 31c8.284 0 15-6.716 15-15S24.284 1 16 1zm0 27.333a12.272 12.272 0 0 1-6.25-1.71l-.448-.267-4.728 1.24 1.264-4.609-.293-.472A12.278 12.278 0 0 1 3.667 16C3.667 9.189 9.189 3.667 16 3.667S28.333 9.189 28.333 16 22.811 28.333 16 28.333zm6.73-9.22c-.37-.185-2.184-1.078-2.523-1.2-.34-.123-.587-.185-.834.185-.247.37-.957 1.2-1.173 1.447-.216.247-.432.278-.802.093-.37-.185-1.562-.576-2.975-1.836-1.1-.98-1.842-2.19-2.058-2.56-.216-.37-.023-.57.163-.754.167-.165.37-.432.555-.647.185-.216.247-.37.37-.617.123-.247.062-.463-.031-.648-.093-.185-.834-2.01-1.143-2.751-.301-.722-.607-.624-.834-.636l-.71-.012a1.362 1.362 0 0 0-.988.463c-.34.37-1.296 1.266-1.296 3.086s1.327 3.58 1.512 3.826c.185.247 2.61 3.986 6.326 5.59.884.381 1.573.609 2.11.78.887.282 1.694.242 2.332.147.712-.107 2.184-.894 2.493-1.757.308-.863.308-1.603.216-1.757-.093-.154-.34-.247-.71-.432z" />
    </svg>
  );
}
