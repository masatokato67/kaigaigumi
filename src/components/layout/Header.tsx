"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  const navItems = [
    { href: "/matches", label: "試合結果", icon: "matches" },
    { href: "/players", label: "選手一覧", icon: "players" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#0a0e1a]/95 backdrop-blur-sm border-b border-gray-800">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 h-14 sm:h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1.5 shrink-0">
          <Image
            src="/images/logo.png"
            alt="海外組サカレポ"
            width={28}
            height={28}
            className="w-7 h-7 sm:w-7 sm:h-7"
          />
          <span className="font-bold text-white text-[20px] leading-[20px] sm:text-sm whitespace-nowrap">海外組サカレポ</span>
        </Link>
        <nav className="flex items-center">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-2.5 py-1.5 sm:py-1.5 rounded-md text-sm sm:text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? "bg-red-600 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <span className="inline-flex items-center gap-1">
                  {item.icon === "matches" && (
                    <svg
                      className="w-5 h-5 sm:w-4 sm:h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                  )}
                  {item.icon === "players" && (
                    <svg
                      className="w-5 h-5 sm:w-4 sm:h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                  )}
                  <span className="hidden min-[480px]:inline">{item.label}</span>
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
