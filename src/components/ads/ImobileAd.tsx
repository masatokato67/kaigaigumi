"use client";

import { useEffect, useRef, useState } from "react";

interface ImobileAdProps {
  className?: string;
}

declare global {
  interface Window {
    adsbyimobile?: Array<{
      pid: number;
      mid: number;
      asid: number;
      type: string;
      display: string;
      elementid: string;
    }>;
  }
}

let instanceCounter = 0;

function loadImobileScript() {
  const scriptId = "imobile-spot-js";
  if (!document.getElementById(scriptId)) {
    const script = document.createElement("script");
    script.id = scriptId;
    script.async = true;
    script.src =
      "https://imp-adedge.i-mobile.co.jp/script/v1/spot.js?20220104";
    document.head.appendChild(script);
  }
}

export default function ImobileAd({ className = "" }: ImobileAdProps) {
  const initialized = useRef(false);
  const [ids] = useState(() => {
    const n = instanceCounter++;
    return {
      mobile: `im-mobile-${n}`,
      pc: `im-pc-${n}`,
    };
  });

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    loadImobileScript();

    // Mobile ad
    (window.adsbyimobile = window.adsbyimobile || []).push({
      pid: 84700,
      mid: 591613,
      asid: 1926505,
      type: "banner",
      display: "inline",
      elementid: ids.mobile,
    });

    // PC ad
    (window.adsbyimobile = window.adsbyimobile || []).push({
      pid: 84700,
      mid: 591613,
      asid: 1926505,
      type: "banner",
      display: "inline",
      elementid: ids.pc,
    });
  }, [ids]);

  return (
    <div className={className}>
      {/* Mobile */}
      <div className="block md:hidden">
        <div id={ids.mobile} />
      </div>
      {/* PC */}
      <div className="hidden md:block">
        <div id={ids.pc} />
      </div>
    </div>
  );
}
