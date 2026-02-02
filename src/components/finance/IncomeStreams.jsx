import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const INCOME_COLORS = [
    '#10B981', '#059669', '#047857', '#065F46', '#064E3B',
    '#34D399', '#6EE7B7', '#A7F3D0', '#D1FAE5', '#ECFDF5'
];

const IncomeStreams = ({ transactions }) => {
    const incomeData = useMemo(() => {
        // Filter only income transactions
        const incomeTransactions = transactions.filter(t => t.type === 'income');

        // Group by source
        const bySource = incomeTransactions.reduce((acc, t) => {
            const source = t.source || 'Unknown';
            if (!acc[source]) {
                acc[source] = {
                    source,
                    total: 0,
                    count: 0,
                    categories: {}
                };
            }
            acc[source].total += parseFloat(t.amount) || 0;
            acc[source].count += 1;

            const category = t.category || 'Other';
            acc[source].categories[category] = (acc[source].categories[category] || 0) + parseFloat(t.amount);

            return acc;
        }, {});

        // Convert to array and sort by total
        return Object.values(bySource)
            .sort((a, b) => b.total - a.total)
            .map((item, index) => ({
                ...item,
                color: INCOME_COLORS[index % INCOME_COLORS.length]
            }));
    }, [transactions]);

    const totalIncome = incomeData.reduce((sum, item) => sum + item.total, 0);

    // Monthly income trend
    const monthlyData = useMemo(() => {
        const incomeTransactions = transactions.filter(t => t.type === 'income');
        const byMonth = {};

        incomeTransactions.forEach(t => {
            const date = t.date ? new Date(t.date) : new Date();
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthLabel = date.toLocaleString('default', { month: 'short', year: '2-digit' });

            if (!byMonth[monthKey]) {
                byMonth[monthKey] = { month: monthLabel, total: 0, sources: {} };
            }
            byMonth[monthKey].total += parseFloat(t.amount) || 0;

            const source = t.source || 'Unknown';
            byMonth[monthKey].sources[source] = (byMonth[monthKey].sources[source] || 0) + parseFloat(t.amount);
        });

        return Object.entries(byMonth)
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-6) // Last 6 months
            .map(([_, data]) => data);
    }, [transactions]);

    if (incomeData.length === 0) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-bold text-gray-800 mb-4">💰 Income Streams</h3>
                <div className="text-center py-8 text-gray-500">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p>No income recorded yet.</p>
                    <p className="text-sm mt-2">Add income transactions to see your income streams.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Income Sources Overview */}
            <div className="bg-white p-6 rounded-xl shadow-md">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">💰 Income Streams</h3>
                        <p className="text-sm text-gray-500">Track all your income sources</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-500">Total Income</p>
                        <p className="text-2xl font-bold text-green-600">${totalIncome.toFixed(2)}</p>
                    </div>
                </div>

                {/* Income Sources List */}
                <div className="space-y-4">
                    {incomeData.map((item, index) => {
                        const percentage = ((item.total / totalIncome) * 100).toFixed(1);
                        const mainCategory = Object.entries(item.categories)
                            .sort(([, a], [, b]) => b - a)[0]?.[0] || 'Other';

                        return (
                            <div key={item.source} className="relative">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: item.color }}
                                        />
                                        <div>
                                            <span className="font-medium text-gray-800">{item.source}</span>
                                            <span className="text-xs text-gray-500 ml-2">
                                                ({item.count} transaction{item.count !== 1 ? 's' : ''})
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-bold text-green-600">${item.total.toFixed(2)}</span>
                                        <span className="text-sm text-gray-500 ml-2">{percentage}%</span>
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{
                                            width: `${percentage}%`,
                                            backgroundColor: item.color
                                        }}
                                    />
                                </div>

                                {/* Category badge */}
                                <div className="mt-1">
                                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                                        {mainCategory}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Monthly Trend Chart */}
            {monthlyData.length > 1 && (
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">📈 Monthly Income Trend</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis
                                    dataKey="month"
                                    tick={{ fontSize: 12, fill: '#6b7280' }}
                                    axisLine={{ stroke: '#e5e7eb' }}
                                />
                                <YAxis
                                    tick={{ fontSize: 12, fill: '#6b7280' }}
                                    axisLine={{ stroke: '#e5e7eb' }}
                                    tickFormatter={(value) => `$${value}`}
                                />
                                <Tooltip
                                    formatter={(value) => [`$${value.toFixed(2)}`, 'Income']}
                                    contentStyle={{
                                        backgroundColor: 'white',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                    }}
                                />
                                <Bar
                                    dataKey="total"
                                    radius={[4, 4, 0, 0]}
                                    animationDuration={800}
                                >
                                    {monthlyData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={index === monthlyData.length - 1 ? '#10B981' : '#6EE7B7'}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-xl text-white">
                    <p className="text-green-100 text-sm">Total Sources</p>
                    <p className="text-2xl font-bold">{incomeData.length}</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 rounded-xl text-white">
                    <p className="text-emerald-100 text-sm">Top Source</p>
                    <p className="text-lg font-bold truncate">{incomeData[0]?.source || 'N/A'}</p>
                </div>
                <div className="bg-gradient-to-br from-teal-500 to-teal-600 p-4 rounded-xl text-white">
                    <p className="text-teal-100 text-sm">Avg per Source</p>
                    <p className="text-xl font-bold">
                        ${(totalIncome / Math.max(incomeData.length, 1)).toFixed(0)}
                    </p>
                </div>
                <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 p-4 rounded-xl text-white">
                    <p className="text-cyan-100 text-sm">Total Transactions</p>
                    <p className="text-2xl font-bold">
                        {incomeData.reduce((sum, item) => sum + item.count, 0)}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default IncomeStreams;
