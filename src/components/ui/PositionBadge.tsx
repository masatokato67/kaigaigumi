export default function PositionBadge({ position }: { position: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700">
      {position}
    </span>
  );
}
