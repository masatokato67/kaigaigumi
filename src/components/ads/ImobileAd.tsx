"use client";

import { useEffect, useId, useRef } from "react";

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

function pushAdSlot(elementId: string) {
  (window.adsbyimobile = window.adsbyimobile || []).push({
    pid: 84700,
    mid: 591613,
    asid: 1926505,
    type: "banner",
    display: "inline",
    elementid: elementId,
  });

  // Inject inline script to trigger i-mobile processing for SPA navigation
  const inlineScript = document.createElement("script");
  inlineScript.textContent = `
    (window.adsbyimobile = window.adsbyimobile || []).push({
      pid: 84700, mid: 591613, asid: 1926505,
      type: "banner", display: "inline",
      elementid: "${elementId}"
    });
  `;
  const target = document.getElementById(elementId);
  if (target) {
    target.appendChild(inlineScript);
  }
}

export default function ImobileAd({ className = "" }: ImobileAdProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reactId = useId();
  const safeId = reactId.replace(/:/g, "-");
  const mobileId = `im-mobile${safeId}`;
  const pcId = `im-pc${safeId}`;

  useEffect(() => {
    loadImobileScript();
    pushAdSlot(mobileId);
    pushAdSlot(pcId);
  }, [mobileId, pcId]);

  return (
    <div ref={containerRef} className={className}>
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
