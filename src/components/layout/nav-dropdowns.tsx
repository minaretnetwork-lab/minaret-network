"use client";

import { useEffect, useRef, useState } from "react";
import { CommunityDropdown } from "./community-dropdown";
import { AdvertiseDropdown } from "./advertise-dropdown";

type Menu = "community" | "advertise";

export function NavDropdowns() {
  const [activeMenu, setActiveMenu] = useState<Menu | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  function clearCloseTimer() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  }

  function open(menu: Menu) {
    clearCloseTimer();
    setActiveMenu(menu);
  }

  function scheduleClose(menu: Menu) {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => {
      setActiveMenu((current) => current === menu ? null : current);
      closeTimer.current = null;
    }, 120);
  }

  function toggle(menu: Menu) {
    clearCloseTimer();
    setActiveMenu((current) => current === menu ? null : menu);
  }

  function close() {
    clearCloseTimer();
    setActiveMenu(null);
  }

  return (
    <>
      <CommunityDropdown
        open={activeMenu === "community"}
        onOpen={() => open("community")}
        onScheduleClose={() => scheduleClose("community")}
        onToggle={() => toggle("community")}
        onClose={close}
      />
      <AdvertiseDropdown
        open={activeMenu === "advertise"}
        onOpen={() => open("advertise")}
        onScheduleClose={() => scheduleClose("advertise")}
        onToggle={() => toggle("advertise")}
        onClose={close}
      />
    </>
  );
}
