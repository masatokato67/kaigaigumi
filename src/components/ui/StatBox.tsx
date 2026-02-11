export default function StatBox({
  value,
  label,
  accent = false,
}: {
  value: string | number;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-[#131829] rounded-lg p-4 text-center border border-gray-800">
      <div
        className={`text-2xl font-bold ${accent ? "text-red-500" : "text-white"}`}
      >
        {value}
      </div>
      <div className="text-xs text-gray-400 mt-1">{label}</div>
    </div>
  );
}
