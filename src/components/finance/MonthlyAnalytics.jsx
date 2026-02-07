import { useMemo } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell,
    Legend
} from 'recharts';

const MonthlyAnalytics = ({ transactions }) => {
    // Process monthly data
    const monthlyData = useMemo(() => {
        const byMonth = {};

        transactions.forEach(t => {
            const date = t.date ? new Date(t.date) : new Date();
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthLabel = date.toLocaleString('default', { month: 'short', year: '2-digit' });

            if (!byMonth[monthKey]) {
                byMonth[monthKey] = {
                    key: monthKey,
                    month: monthLabel,
                    income: 0,
                    expense: 0,
                    transactions: 0
                };
            }

            const amount = parseFloat(t.amount) || 0;
            if (t.type === 'income') {
                byMonth[monthKey].income += amount;
            } else if (t.type === 'expense') {
                byMonth[monthKey].expense += amount;
            }
            byMonth[monthKey].transactions += 1;
        });

        // Convert to sorted array
        return Object.entries(byMonth)
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-6) // Last 6 months
            .map(([_, data]) => ({
                ...data,
                net: data.income - data.expense,
                savingsRate: data.income > 0 ? ((data.income - data.expense) / data.income * 100) : 0
            }));
    }, [transactions]);

    // Calculate month-over-month changes
    const monthlyChanges = useMemo(() => {
        if (monthlyData.length < 2) return null;

        const current = monthlyData[monthlyData.length - 1];
        const previous = monthlyData[monthlyData.length - 2];

        const incomeChange = previous.income > 0
            ? ((current.income - previous.income) / previous.income * 100)
            : current.income > 0 ? 100 : 0;

        const expenseChange = previous.expense > 0
            ? ((current.expense - previous.expense) / previous.expense * 100)
            : current.expense > 0 ? 100 : 0;

        const netChange = previous.net !== 0
            ? ((current.net - previous.net) / Math.abs(previous.net) * 100)
            : current.net !== 0 ? 100 : 0;

        return {
            currentMonth: current.month,
            previousMonth: previous.month,
            incomeChange,
            expenseChange,
            netChange,
            current,
            previous
        };
    }, [monthlyData]);

    // Custom tooltip for charts
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-xl border border-gray-100">
                    <p className="font-bold text-gray-800 mb-2">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} style={{ color: entry.color }} className="text-sm font-medium">
                            {entry.name}: ₹{entry.value?.toLocaleString('en-IN') || '0'}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    if (monthlyData.length === 0) {
        return (
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                <h3 className="text-xl font-bold text-gray-800 mb-4">📊 Monthly Analytics</h3>
                <div className="text-center py-12 text-gray-500">
                    <svg className="w-20 h-20 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <p className="text-lg font-medium">No transaction data yet</p>
                    <p className="text-sm mt-2">Add some transactions to see your monthly analytics</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Month-over-Month Comparison Cards */}
            {monthlyChanges && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Income Change */}
                    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-5 rounded-2xl text-white shadow-lg shadow-emerald-500/20 transform hover:scale-[1.02] transition-all duration-300">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-emerald-100 text-sm font-medium">Income vs Last Month</p>
                                <p className="text-3xl font-bold mt-1">
                                    {monthlyChanges.incomeChange >= 0 ? '+' : ''}{monthlyChanges.incomeChange.toFixed(1)}%
                                </p>
                                <p className="text-emerald-100 text-xs mt-2">
                                    ₹{monthlyChanges.previous.income.toLocaleString('en-IN')} → ₹{monthlyChanges.current.income.toLocaleString('en-IN')}
                                </p>
                            </div>
                            <div className={`p-3 rounded-xl ${monthlyChanges.incomeChange >= 0 ? 'bg-white/20' : 'bg-red-400/30'}`}>
                                {monthlyChanges.incomeChange >= 0 ? (
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                    </svg>
                                ) : (
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                                    </svg>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Expense Change */}
                    <div className="bg-gradient-to-br from-rose-500 to-pink-600 p-5 rounded-2xl text-white shadow-lg shadow-rose-500/20 transform hover:scale-[1.02] transition-all duration-300">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-rose-100 text-sm font-medium">Spending vs Last Month</p>
                                <p className="text-3xl font-bold mt-1">
                                    {monthlyChanges.expenseChange >= 0 ? '+' : ''}{monthlyChanges.expenseChange.toFixed(1)}%
                                </p>
                                <p className="text-rose-100 text-xs mt-2">
                                    ₹{monthlyChanges.previous.expense.toLocaleString('en-IN')} → ₹{monthlyChanges.current.expense.toLocaleString('en-IN')}
                                </p>
                            </div>
                            <div className={`p-3 rounded-xl ${monthlyChanges.expenseChange <= 0 ? 'bg-white/20' : 'bg-red-400/30'}`}>
                                {monthlyChanges.expenseChange <= 0 ? (
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                                    </svg>
                                ) : (
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                    </svg>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Net Change */}
                    <div className="bg-gradient-to-br from-violet-500 to-purple-600 p-5 rounded-2xl text-white shadow-lg shadow-violet-500/20 transform hover:scale-[1.02] transition-all duration-300">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-violet-100 text-sm font-medium">Savings vs Last Month</p>
                                <p className="text-3xl font-bold mt-1">
                                    {monthlyChanges.netChange >= 0 ? '+' : ''}{monthlyChanges.netChange.toFixed(1)}%
                                </p>
                                <p className="text-violet-100 text-xs mt-2">
                                    ₹{monthlyChanges.previous.net.toLocaleString('en-IN')} → ₹{monthlyChanges.current.net.toLocaleString('en-IN')}
                                </p>
                            </div>
                            <div className={`p-3 rounded-xl ${monthlyChanges.netChange >= 0 ? 'bg-white/20' : 'bg-red-400/30'}`}>
                                {monthlyChanges.netChange >= 0 ? (
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                ) : (
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Income vs Expense Area Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">📈 Income vs Expenses Trend</h3>
                        <p className="text-sm text-gray-500">See how your finances have changed over time</p>
                    </div>
                </div>
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={monthlyData}>
                            <defs>
                                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis
                                dataKey="month"
                                tick={{ fontSize: 12, fill: '#6b7280' }}
                                axisLine={{ stroke: '#e5e7eb' }}
                            />
                            <YAxis
                                tick={{ fontSize: 12, fill: '#6b7280' }}
                                axisLine={{ stroke: '#e5e7eb' }}
                                tickFormatter={(value) => `₹${value.toLocaleString('en-IN')}`}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Area
                                type="monotone"
                                dataKey="income"
                                name="Income"
                                stroke="#10B981"
                                strokeWidth={3}
                                fill="url(#incomeGradient)"
                                animationDuration={1000}
                            />
                            <Area
                                type="monotone"
                                dataKey="expense"
                                name="Expense"
                                stroke="#EF4444"
                                strokeWidth={3}
                                fill="url(#expenseGradient)"
                                animationDuration={1000}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Monthly Net Savings Bar Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">💰 Monthly Net Savings</h3>
                        <p className="text-sm text-gray-500">Track your monthly savings performance</p>
                    </div>
                </div>
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
                                tickFormatter={(value) => `₹${value.toLocaleString('en-IN')}`}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar
                                dataKey="net"
                                name="Net Savings"
                                radius={[8, 8, 0, 0]}
                                animationDuration={800}
                            >
                                {monthlyData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.net >= 0 ? '#10B981' : '#EF4444'}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Monthly Summary Table */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 overflow-x-auto">
                <h3 className="text-xl font-bold text-gray-800 mb-4">📋 Monthly Breakdown</h3>
                <table className="w-full min-w-[500px]">
                    <thead>
                        <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Month</th>
                            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Income</th>
                            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Expenses</th>
                            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Net</th>
                            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Savings Rate</th>
                            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Transactions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[...monthlyData].reverse().map((month, index) => (
                            <tr
                                key={month.key}
                                className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${index === 0 ? 'bg-primary-50/50' : ''}`}
                            >
                                <td className="py-3 px-4">
                                    <span className={`font-medium ${index === 0 ? 'text-primary-700' : 'text-gray-800'}`}>
                                        {month.month}
                                        {index === 0 && (
                                            <span className="ml-2 text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                                                Current
                                            </span>
                                        )}
                                    </span>
                                </td>
                                <td className="text-right py-3 px-4 text-green-600 font-medium">
                                    ₹{month.income.toLocaleString('en-IN')}
                                </td>
                                <td className="text-right py-3 px-4 text-red-600 font-medium">
                                    ₹{month.expense.toLocaleString('en-IN')}
                                </td>
                                <td className={`text-right py-3 px-4 font-bold ${month.net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {month.net >= 0 ? '+' : ''}₹{month.net.toLocaleString('en-IN')}
                                </td>
                                <td className="text-right py-3 px-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${month.savingsRate >= 20 ? 'bg-green-100 text-green-700' :
                                        month.savingsRate >= 0 ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                        {month.savingsRate.toFixed(0)}%
                                    </span>
                                </td>
                                <td className="text-right py-3 px-4 text-gray-600">
                                    {month.transactions}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MonthlyAnalytics;
