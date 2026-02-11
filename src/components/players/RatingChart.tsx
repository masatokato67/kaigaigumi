"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface RatingDataPoint {
  date: string;
  rating: number;
}

export default function RatingChart({ data }: { data: RatingDataPoint[] }) {
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
            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          />
        </svg>
        <h2 className="font-bold">評価点の推移</h2>
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            dataKey="date"
            stroke="#4b5563"
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            tickFormatter={(v) => v.slice(5)}
          />
          <YAxis
            domain={[5, 10]}
            stroke="#4b5563"
            tick={{ fill: "#9ca3af", fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#131829",
              border: "1px solid #374151",
              borderRadius: "8px",
              color: "#fff",
            }}
            labelFormatter={(v) => `日付: ${v}`}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any) => [Number(value).toFixed(1), "評価点"]}
          />
          <Line
            type="monotone"
            dataKey="rating"
            stroke="#dc2626"
            strokeWidth={2}
            dot={{ fill: "#dc2626", r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
