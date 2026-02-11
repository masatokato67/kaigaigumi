import LocalVoiceCard from "./LocalVoiceCard";
import type { LocalVoice } from "@/lib/types";

export default function LocalVoices({ voices }: { voices: LocalVoice[] }) {
  return (
    <div className="bg-[#131829] rounded-xl p-6 border border-gray-800">
      <div className="flex items-center gap-2 mb-4">
        <svg
          className="w-5 h-5 text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
          />
        </svg>
        <h2 className="font-bold">現地の声</h2>
      </div>
      <div className="space-y-4">
        {voices.map((voice) => (
          <LocalVoiceCard key={voice.id} voice={voice} />
        ))}
      </div>
    </div>
  );
}
