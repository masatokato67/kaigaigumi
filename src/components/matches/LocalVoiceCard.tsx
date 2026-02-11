import { getRoleBadgeColor } from "@/lib/utils";
import type { LocalVoice } from "@/lib/types";

export default function LocalVoiceCard({ voice }: { voice: LocalVoice }) {
  return (
    <div className="bg-[#0a0e1a] rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
          <svg
            className="w-4 h-4 text-white"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{voice.username}</span>
          <span
            className={`px-2 py-0.5 rounded text-xs ${getRoleBadgeColor(voice.roleKey)}`}
          >
            {voice.role}
          </span>
        </div>
        <span className="text-xs text-gray-500 ml-auto">
          {voice.languageCode}
        </span>
      </div>
      <div className="bg-[#131829] rounded p-3 mb-2">
        <div className="text-xs text-gray-500 mb-1">原文</div>
        <p className="text-sm text-gray-300">{voice.originalText}</p>
      </div>
      <div className="bg-red-900/10 border border-red-800/20 rounded p-3">
        <div className="text-xs text-red-400 mb-1">翻訳</div>
        <p className="text-sm">{voice.translatedText}</p>
      </div>
    </div>
  );
}
