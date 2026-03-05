import type { DetailedStats as DetailedStatsType } from "@/lib/types";

interface StatItem {
  label: string;
  value: string | number;
  sub?: string; // サブテキスト（例: "成功率 89%"）
}

interface StatCategory {
  title: string;
  icon: React.ReactNode;
  items: StatItem[];
}

function formatXg(val: number | undefined): string {
  if (val === undefined) return "-";
  return val.toFixed(2);
}

function calcRate(success: number | undefined, total: number | undefined): string | undefined {
  if (success === undefined || total === undefined || total === 0) return undefined;
  return `${Math.round((success / total) * 100)}%`;
}

function calcDuelDisplay(won: number | undefined, lost: number | undefined): string {
  if (won === undefined && lost === undefined) return "-";
  const w = won ?? 0;
  const l = lost ?? 0;
  const total = w + l;
  if (total === 0) return "0/0";
  return `${w}/${total}`;
}

function calcDuelRate(won: number | undefined, lost: number | undefined): string | undefined {
  const w = won ?? 0;
  const l = lost ?? 0;
  const total = w + l;
  if (total === 0) return undefined;
  return `勝率 ${Math.round((w / total) * 100)}%`;
}

export default function DetailedStats({
  stats,
}: {
  stats: DetailedStatsType;
}) {
  const categories: StatCategory[] = [];

  // 攻撃
  const attackItems: StatItem[] = [];
  if (stats.totalShots !== undefined) {
    attackItems.push({ label: "シュート", value: stats.totalShots });
  }
  if (stats.shotsOnTarget !== undefined) {
    attackItems.push({ label: "枠内シュート", value: stats.shotsOnTarget });
  }
  if (stats.expectedGoals !== undefined) {
    attackItems.push({ label: "xG (期待ゴール)", value: formatXg(stats.expectedGoals) });
  }
  if (stats.expectedAssists !== undefined) {
    attackItems.push({ label: "xA (期待アシスト)", value: formatXg(stats.expectedAssists) });
  }

  if (attackItems.length > 0) {
    categories.push({
      title: "攻撃",
      icon: (
        <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      items: attackItems,
    });
  }

  // パス
  const passItems: StatItem[] = [];
  if (stats.totalPass !== undefined) {
    const rate = calcRate(stats.accuratePass, stats.totalPass);
    passItems.push({
      label: "パス (成功/合計)",
      value: `${stats.accuratePass ?? 0}/${stats.totalPass}`,
      sub: rate ? `成功率 ${rate}` : undefined,
    });
  }
  if (stats.keyPass !== undefined) {
    passItems.push({ label: "キーパス", value: stats.keyPass });
  }
  if (stats.totalCross !== undefined) {
    passItems.push({ label: "クロス", value: stats.totalCross });
  }
  if (stats.totalLongBalls !== undefined) {
    const rate = calcRate(stats.accurateLongBalls, stats.totalLongBalls);
    passItems.push({
      label: "ロングボール",
      value: `${stats.accurateLongBalls ?? 0}/${stats.totalLongBalls}`,
      sub: rate ? `成功率 ${rate}` : undefined,
    });
  }

  if (passItems.length > 0) {
    categories.push({
      title: "パス",
      icon: (
        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      ),
      items: passItems,
    });
  }

  // 守備
  const defenseItems: StatItem[] = [];
  if (stats.totalTackle !== undefined) {
    defenseItems.push({
      label: "タックル",
      value: stats.wonTackle !== undefined ? `${stats.wonTackle}/${stats.totalTackle}` : stats.totalTackle,
      sub: stats.wonTackle !== undefined ? `成功 ${stats.wonTackle}` : undefined,
    });
  }
  if (stats.interceptionWon !== undefined) {
    defenseItems.push({ label: "インターセプト", value: stats.interceptionWon });
  }
  if (stats.totalClearance !== undefined) {
    defenseItems.push({ label: "クリア", value: stats.totalClearance });
  }
  if (stats.blockedScoringAttempt !== undefined) {
    defenseItems.push({ label: "ブロック", value: stats.blockedScoringAttempt });
  }
  if (stats.ballRecovery !== undefined) {
    defenseItems.push({ label: "ボール奪取", value: stats.ballRecovery });
  }

  if (defenseItems.length > 0) {
    categories.push({
      title: "守備",
      icon: (
        <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      items: defenseItems,
    });
  }

  // デュエル
  const duelItems: StatItem[] = [];
  if (stats.duelWon !== undefined || stats.duelLost !== undefined) {
    duelItems.push({
      label: "地上デュエル",
      value: calcDuelDisplay(stats.duelWon, stats.duelLost),
      sub: calcDuelRate(stats.duelWon, stats.duelLost),
    });
  }
  if (stats.aerialWon !== undefined || stats.aerialLost !== undefined) {
    duelItems.push({
      label: "空中戦",
      value: calcDuelDisplay(stats.aerialWon, stats.aerialLost),
      sub: calcDuelRate(stats.aerialWon, stats.aerialLost),
    });
  }

  if (duelItems.length > 0) {
    categories.push({
      title: "デュエル",
      icon: (
        <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      items: duelItems,
    });
  }

  // その他
  const otherItems: StatItem[] = [];
  if (stats.touches !== undefined) {
    otherItems.push({ label: "タッチ数", value: stats.touches });
  }
  if (stats.fouls !== undefined) {
    otherItems.push({ label: "ファウル", value: stats.fouls });
  }
  if (stats.wasFouled !== undefined) {
    otherItems.push({ label: "被ファウル", value: stats.wasFouled });
  }
  if (stats.possessionLostCtrl !== undefined) {
    otherItems.push({ label: "ポゼッションロスト", value: stats.possessionLostCtrl });
  }
  if (stats.dispossessed !== undefined) {
    otherItems.push({ label: "ボール喪失", value: stats.dispossessed });
  }

  if (otherItems.length > 0) {
    categories.push({
      title: "その他",
      icon: (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      items: otherItems,
    });
  }

  if (categories.length === 0) return null;

  return (
    <div className="bg-[#131829] rounded-xl p-6 border border-gray-800">
      <div className="flex items-center gap-2 mb-5">
        <svg
          className="w-5 h-5 text-emerald-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <h2 className="font-bold">詳細スタッツ</h2>
        <span className="text-[10px] text-gray-500 ml-auto">powered by SofaScore</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((cat) => (
          <div key={cat.title} className="bg-[#0a0e1a] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-800">
              {cat.icon}
              <span className="text-sm font-medium text-gray-300">{cat.title}</span>
            </div>
            <div className="space-y-2">
              {cat.items.map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">{item.label}</span>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-gray-200">{item.value}</span>
                    {item.sub && (
                      <span className="text-xs text-gray-500 ml-2">{item.sub}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
