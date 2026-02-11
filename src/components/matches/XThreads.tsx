import { XThread } from "@/lib/types";
import XThreadCard from "./XThreadCard";

interface XThreadsProps {
  threads: XThread[];
}

export default function XThreads({ threads }: XThreadsProps) {
  return (
    <div className="bg-bg-card rounded-xl p-6 border border-border-dark">
      <div className="flex items-center gap-2 mb-6">
        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        <h2 className="text-xl font-bold text-white">主要スレッド</h2>
      </div>

      <div className="space-y-4">
        {threads.map((thread) => (
          <XThreadCard key={thread.id} thread={thread} />
        ))}
      </div>
    </div>
  );
}
