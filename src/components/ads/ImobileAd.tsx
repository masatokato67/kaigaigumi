"use client";

import { useEffect, useId } from "react";

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
  const reactId = useId();
  const safeId = reactId.replace(/:/g, "-");
  const mobileId = `im-mobile${safeId}`;
  const pcId = `im-pc${safeId}`;

  useEffect(() => {
    // Clear any previous ad content
    const mobileEl = document.getElementById(mobileId);
    const pcEl = document.getElementById(pcId);
    if (mobileEl) mobileEl.innerHTML = "";
    if (pcEl) pcEl.innerHTML = "";

    // Push ad configs (once each)
    (window.adsbyimobile = window.adsbyimobile || []).push({
      pid: 84700,
      mid: 591613,
      asid: 1926505,
      type: "banner",
      display: "inline",
      elementid: mobileId,
    });

    (window.adsbyimobile = window.adsbyimobile || []).push({
      pid: 84700,
      mid: 591613,
      asid: 1926505,
      type: "banner",
      display: "inline",
      elementid: pcId,
    });

    // Load spot.js with cache-busting to force re-processing on SPA navigation
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://imp-adedge.i-mobile.co.jp/script/v1/spot.js?t=${Date.now()}`;
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, [mobileId, pcId]);

  return (
    <div className={className}>
      {/* Mobile */}
      <div className="block md:hidden">
        <div id={mobileId} />
      </div>
      {/* PC */}
      <div className="hidden md:block">
        <div id={pcId} />
      </div>
    </div>
  );
}
