import { useMemo } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';

const COLORS = {
    income: ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0'],
    expense: ['#EF4444', '#F87171', '#FCA5A5', '#FECACA']
};

const DashboardCharts = ({ transactions }) => {
    // Monthly trend data (last 6 months)
    const trendData = useMemo(() => {
        const byMonth = {};

        transactions.forEach(t => {
            const date = t.date ? new Date(t.date) : new Date();
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthLabel = date.toLocaleString('default', { month: 'short' });

            if (!byMonth[monthKey]) {
                byMonth[monthKey] = { key: monthKey, month: monthLabel, income: 0, expense: 0 };
            }

            const amount = parseFloat(t.amount) || 0;
            if (t.type === 'income') {
                byMonth[monthKey].income += amount;
            } else if (t.type === 'expense') {
                byMonth[monthKey].expense += amount;
            }
        });

        return Object.entries(byMonth)
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-6)
            .map(([_, data]) => data);
    }, [transactions]);

    // Category breakdown for pie charts
    const categoryData = useMemo(() => {
        const income = {};
        const expense = {};

        transactions.forEach(t => {
            const category = t.category || 'Other';
            const amount = parseFloat(t.amount) || 0;

            if (t.type === 'income') {
                income[category] = (income[category] || 0) + amount;
            } else if (t.type === 'expense') {
                expense[category] = (expense[category] || 0) + amount;
            }
        });

        return {
            income: Object.entries(income)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 4),
            expense: Object.entries(expense)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 4)
        };
    }, [transactions]);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-gray-100 text-sm">
                    <p className="font-semibold text-gray-800">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} style={{ color: entry.color }} className="font-medium">
                            {entry.name}: ₹{entry.value?.toLocaleString('en-IN') || '0'}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    const MiniPieChart = ({ data, colors, title, total }) => (
        <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-gray-700">{title}</h4>
                <span className={`text-sm font-bold ${title.includes('Income') ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{total.toLocaleString('en-IN')}
                </span>
            </div>
            {data.length > 0 ? (
                <div className="flex items-center gap-3">
                    <div className="w-20 h-20">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={20}
                                    outerRadius={35}
                                    paddingAngle={2}
                                    dataKey="value"
                                    animationDuration={600}
                                >
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex-1 space-y-1">
                        {data.slice(0, 3).map((item, index) => (
                            <div key={item.name} className="flex items-center gap-2 text-xs">
                                <div
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: colors[index % colors.length] }}
                                />
                                <span className="text-gray-600 truncate flex-1">{item.name}</span>
                                <span className="text-gray-800 font-medium">₹{item.value.toLocaleString('en-IN')}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="text-center py-4 text-gray-400 text-xs">
                    No data
                </div>
            )}
        </div>
    );

    if (transactions.length === 0) {
        return (
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4">📊 Financial Overview</h3>
                <div className="text-center py-8 text-gray-500">
                    <svg className="w-16 h-16 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <p>Add transactions to see charts</p>
                </div>
            </div>
        );
    }

    const totalIncome = categoryData.income.reduce((sum, item) => sum + item.value, 0);
    const totalExpense = categoryData.expense.reduce((sum, item) => sum + item.value, 0);

    return (
        <div className="space-y-6">
            {/* Trend Chart */}
            {trendData.length > 1 && (
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-800">📈 Monthly Trend</h3>
                        <div className="flex items-center gap-4 text-xs">
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                <span className="text-gray-600">Income</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <span className="text-gray-600">Expense</span>
                            </div>
                        </div>
                    </div>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient id="dashIncomeGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="dashExpenseGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis
                                    dataKey="month"
                                    tick={{ fontSize: 11, fill: '#6b7280' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fontSize: 11, fill: '#6b7280' }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(value) => `₹${value.toLocaleString('en-IN')}`}
                                    width={50}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Area
                                    type="monotone"
                                    dataKey="income"
                                    name="Income"
                                    stroke="#10B981"
                                    strokeWidth={2}
                                    fill="url(#dashIncomeGradient)"
                                    animationDuration={800}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="expense"
                                    name="Expense"
                                    stroke="#EF4444"
                                    strokeWidth={2}
                                    fill="url(#dashExpenseGradient)"
                                    animationDuration={800}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Category Breakdown Mini Charts */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4">📊 Spending Breakdown</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <MiniPieChart
                        data={categoryData.income}
                        colors={COLORS.income}
                        title="💰 Income by Category"
                        total={totalIncome}
                    />
                    <MiniPieChart
                        data={categoryData.expense}
                        colors={COLORS.expense}
                        title="💸 Expense by Category"
                        total={totalExpense}
                    />
                </div>
            </div>
        </div>
    );
};

export default DashboardCharts;
