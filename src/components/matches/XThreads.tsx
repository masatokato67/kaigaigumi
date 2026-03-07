import { XThread } from "@/lib/types";
import XThreadCard from "./XThreadCard";

interface XThreadsProps {
  threads: XThread[];
}

export default function XThreads({ threads }: XThreadsProps) {
  // 手動（実際のX投稿）→ AI生成 の順でソート
  const sorted = [...threads].sort((a, b) => {
    if (a.isManual && !b.isManual) return -1;
    if (!a.isManual && b.isManual) return 1;
    return 0;
  });

  return (
    <div className="bg-[#131829] rounded-xl p-6 border border-gray-800">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Xの反応</h2>
          <p className="text-xs text-gray-500">この試合に関するXの投稿</p>
        </div>
      </div>

      <div className="space-y-3">
        {sorted.map((thread) => (
          <XThreadCard key={thread.id} thread={thread} />
        ))}
      </div>
    </div>
  );
}
