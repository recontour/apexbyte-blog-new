"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import type { ChartBlock as ChartBlockType } from "@/lib/posts";

const COLORS = ["#0071e3", "#34c759", "#ff9f0a", "#ff3b30", "#af52de", "#5ac8fa"];

export default function ChartBlock({ block }: { block: ChartBlockType }) {
  const { chartType, title, xKey, yKey, data } = block;

  return (
    <figure className="my-8 rounded-2xl border border-border bg-white p-5 shadow-sm">
      {title && (
        <figcaption className="text-[13px] font-semibold text-ink-secondary mb-4 text-center">
          {title}
        </figcaption>
      )}
      <ResponsiveContainer width="99%" height={280}>
        {chartType === "bar" ? (
          <BarChart data={data as Record<string, unknown>[]} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e7" />
            <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: "#6e6e73" }} />
            <YAxis tick={{ fontSize: 11, fill: "#6e6e73" }} />
            <Tooltip
              contentStyle={{ borderRadius: 10, border: "1px solid #e5e5e7", fontSize: 12 }}
            />
            <Bar dataKey={yKey} fill="#0071e3" radius={[4, 4, 0, 0]} />
          </BarChart>
        ) : chartType === "line" ? (
          <LineChart data={data as Record<string, unknown>[]} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e7" />
            <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: "#6e6e73" }} />
            <YAxis tick={{ fontSize: 11, fill: "#6e6e73" }} />
            <Tooltip
              contentStyle={{ borderRadius: 10, border: "1px solid #e5e5e7", fontSize: 12 }}
            />
            <Line
              type="monotone"
              dataKey={yKey}
              stroke="#0071e3"
              strokeWidth={2}
              dot={{ fill: "#0071e3", r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        ) : (
          <PieChart>
            <Pie
              data={data as Record<string, unknown>[]}
              dataKey={yKey}
              nameKey={xKey}
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={({ name, percent }: { name?: string; percent?: number }) =>
                `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`
              }
              labelLine={false}
            >
              {(data as Record<string, unknown>[]).map((_entry, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{ borderRadius: 10, border: "1px solid #e5e5e7", fontSize: 12 }}
            />
          </PieChart>
        )}
      </ResponsiveContainer>
    </figure>
  );
}
