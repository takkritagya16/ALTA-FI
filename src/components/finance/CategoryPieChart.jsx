import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const INCOME_COLORS = ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0', '#059669', '#047857'];
const EXPENSE_COLORS = ['#EF4444', '#F87171', '#FCA5A5', '#FECACA', '#DC2626', '#B91C1C'];

const CategoryPieChart = ({ transactions, type = 'income' }) => {
    // Group transactions by category
    const categoryData = transactions
        .filter(t => t.type === type)
        .reduce((acc, t) => {
            const category = t.category || 'Other';
            acc[category] = (acc[category] || 0) + parseFloat(t.amount || 0);
            return acc;
        }, {});

    // Convert to array format for Recharts
    const data = Object.entries(categoryData).map(([name, value]) => ({
        name,
        value: Math.round(value * 100) / 100
    })).sort((a, b) => b.value - a.value);

    const colors = type === 'income' ? INCOME_COLORS : EXPENSE_COLORS;
    const total = data.reduce((sum, item) => sum + item.value, 0);

    if (data.length === 0) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                    {type === 'income' ? '💰 Income' : '💸 Expense'} by Category
                </h3>
                <div className="text-center py-8 text-gray-500">
                    No {type} transactions yet.
                </div>
            </div>
        );
    }

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const item = payload[0];
            const percentage = ((item.value / total) * 100).toFixed(1);
            return (
                <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                    <p className="font-semibold text-gray-800">{item.name}</p>
                    <p className={`font-bold ${type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        ${item.value.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500">{percentage}% of total</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">
                    {type === 'income' ? '💰 Income' : '💸 Expense'} by Category
                </h3>
                <span className={`text-xl font-bold ${type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    ${total.toFixed(2)}
                </span>
            </div>

            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={2}
                            dataKey="value"
                            animationBegin={0}
                            animationDuration={800}
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={colors[index % colors.length]}
                                    className="hover:opacity-80 transition-opacity cursor-pointer"
                                />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            layout="vertical"
                            align="right"
                            verticalAlign="middle"
                            formatter={(value) => <span className="text-sm text-gray-700">{value}</span>}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {/* Category breakdown list */}
            <div className="mt-4 space-y-2">
                {data.map((item, index) => {
                    const percentage = ((item.value / total) * 100).toFixed(1);
                    return (
                        <div key={item.name} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: colors[index % colors.length] }}
                                />
                                <span className="text-gray-700">{item.name}</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-gray-500">{percentage}%</span>
                                <span className={`font-medium ${type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                    ${item.value.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CategoryPieChart;
