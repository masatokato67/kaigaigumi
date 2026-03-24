"use client";

import { useEffect, useRef } from "react";

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

export default function ImobileAd({ className = "" }: ImobileAdProps) {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Load i-mobile script if not already loaded
    const scriptId = "imobile-spot-js";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.async = true;
      script.src =
        "https://imp-adedge.i-mobile.co.jp/script/v1/spot.js?20220104";
      document.head.appendChild(script);
    }

    // Push ad config
    (window.adsbyimobile = window.adsbyimobile || []).push({
      pid: 84700,
      mid: 591613,
      asid: 1926505,
      type: "banner",
      display: "inline",
      elementid: "im-5bbe9f84528d40a798f4294389663aa0",
    });
  }, []);

  return (
    <div className={`block md:hidden ${className}`}>
      <div id="im-5bbe9f84528d40a798f4294389663aa0" />
    </div>
  );
}
