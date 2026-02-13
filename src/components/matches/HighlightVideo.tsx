import type { HighlightVideo as HighlightVideoType } from "@/lib/types";

export default function HighlightVideo({
  video,
}: {
  video: HighlightVideoType;
}) {
  return (
    <div className="bg-[#131829] rounded-xl p-6 border border-gray-800">
      <div className="flex items-center gap-2 mb-4">
        <svg
          className="w-5 h-5 text-red-500"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
        </svg>
        <h2 className="font-bold">個人ハイライト</h2>
      </div>
      <div className="relative w-full pb-[56.25%] rounded-lg overflow-hidden bg-black">
        <iframe
          className="absolute top-0 left-0 w-full h-full"
          src={`https://www.youtube.com/embed/${video.youtubeId}`}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      <p className="mt-3 text-sm text-gray-400">{video.title}</p>
    </div>
  );
}
