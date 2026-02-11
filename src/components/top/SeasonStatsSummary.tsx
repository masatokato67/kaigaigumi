export default function SeasonStatsSummary({
  stats,
}: {
  stats: {
    playerCount: number;
    totalGoals: number;
    totalAssists: number;
    totalAppearances: number;
  };
}) {
  const items = [
    { value: stats.playerCount, label: "追跡選手数" },
    { value: stats.totalGoals, label: "総ゴール数" },
    { value: stats.totalAssists, label: "総アシスト数" },
    { value: stats.totalAppearances, label: "総出場試合数" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="bg-[#131829] rounded-xl p-6 text-center border border-gray-800"
        >
          <div className="text-3xl font-bold text-red-500">{item.value}</div>
          <div className="text-sm text-gray-400 mt-2">{item.label}</div>
        </div>
      ))}
    </div>
  );
}
