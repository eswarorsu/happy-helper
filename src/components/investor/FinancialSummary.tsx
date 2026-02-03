import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from "recharts";
import { formatCurrency } from "@/types/investor";

interface FinancialSummaryProps {
    fundsNeeded: number;
    fundsSecured: number | null;
    totalInvested?: number;
    profitsEarned?: number;
}

/**
 * Financial summary with bar chart visualization
 * Design: Clear labels, readable graphs, no decorative elements
 */
export default function FinancialSummary({
    fundsNeeded,
    fundsSecured,
    totalInvested = 0,
    profitsEarned = 0,
}: FinancialSummaryProps) {
    const secured = fundsSecured ?? 0;
    const fundingPercentage = Math.min((secured / fundsNeeded) * 100, 100);

    // Data for bar chart
    const chartData = [
        { name: "Target", value: fundsNeeded, fill: "#64748b" },
        { name: "Raised", value: secured, fill: "#3b82f6" },
        { name: "Invested", value: totalInvested, fill: "#22c55e" },
        { name: "Profits", value: profitsEarned, fill: "#f59e0b" },
    ];

    return (
        <div className="border border-slate-200 rounded-lg p-5 bg-white">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-4">
                Financial Summary
            </h3>

            {/* Numbers Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">
                        Funds Needed
                    </p>
                    <p className="text-lg font-bold text-slate-800">
                        {formatCurrency(fundsNeeded)}
                    </p>
                </div>
                <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">
                        Funds Secured
                    </p>
                    <p className="text-lg font-bold text-blue-600">
                        {formatCurrency(secured)}
                    </p>
                </div>
                <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">
                        Total Invested
                    </p>
                    <p className="text-lg font-bold text-green-600">
                        {formatCurrency(totalInvested)}
                    </p>
                </div>
                <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">
                        Profits Earned
                    </p>
                    <p className="text-lg font-bold text-amber-600">
                        {formatCurrency(profitsEarned)}
                    </p>
                </div>
            </div>

            {/* Funding Progress */}
            <div className="mb-6">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Funding Progress</span>
                    <span>{fundingPercentage.toFixed(0)}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${fundingPercentage}%` }}
                    />
                </div>
            </div>

            {/* Bar Chart */}
            <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal stroke="#f1f5f9" />
                        <XAxis
                            type="number"
                            tickFormatter={(value) => formatCurrency(value)}
                            tick={{ fontSize: 10, fill: "#94a3b8" }}
                            axisLine={false}
                        />
                        <YAxis
                            type="category"
                            dataKey="name"
                            tick={{ fontSize: 11, fill: "#64748b", fontWeight: 500 }}
                            axisLine={false}
                            tickLine={false}
                            width={70}
                        />
                        <Tooltip
                            formatter={(value: number) => [formatCurrency(value), ""]}
                            contentStyle={{
                                borderRadius: "8px",
                                border: "1px solid #e2e8f0",
                                fontSize: "12px",
                            }}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Note about profits */}
            {profitsEarned === 0 && (
                <p className="text-xs text-slate-400 mt-3 italic">
                    * Profit data will be updated as the startup reports earnings.
                </p>
            )}
        </div>
    );
}
