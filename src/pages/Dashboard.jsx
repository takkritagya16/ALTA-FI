import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getTransactions, getFinancialSummary } from '../services/finance';
import { getRules } from '../services/rules';
import DashboardCharts from '../components/finance/DashboardCharts';

const Dashboard = () => {
    const { currentUser } = useAuth();
    const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, balance: 0 });
    const [transactions, setTransactions] = useState([]);
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [rulesCount, setRulesCount] = useState(0);
    const [loading, setLoading] = useState(true);

    // Calculate monthly comparison
    const monthlyComparison = useMemo(() => {
        if (transactions.length === 0) return null;

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

        let currentMonthIncome = 0, currentMonthExpense = 0;
        let lastMonthIncome = 0, lastMonthExpense = 0;

        transactions.forEach(t => {
            const date = t.date ? new Date(t.date) : new Date();
            const tMonth = date.getMonth();
            const tYear = date.getFullYear();
            const amount = parseFloat(t.amount) || 0;

            if (tMonth === currentMonth && tYear === currentYear) {
                if (t.type === 'income') currentMonthIncome += amount;
                else if (t.type === 'expense') currentMonthExpense += amount;
            } else if (tMonth === lastMonth && tYear === lastMonthYear) {
                if (t.type === 'income') lastMonthIncome += amount;
                else if (t.type === 'expense') lastMonthExpense += amount;
            }
        });

        const incomeChange = lastMonthIncome > 0
            ? ((currentMonthIncome - lastMonthIncome) / lastMonthIncome * 100)
            : currentMonthIncome > 0 ? 100 : 0;

        const expenseChange = lastMonthExpense > 0
            ? ((currentMonthExpense - lastMonthExpense) / lastMonthExpense * 100)
            : currentMonthExpense > 0 ? 100 : 0;

        return {
            currentMonthIncome,
            currentMonthExpense,
            lastMonthIncome,
            lastMonthExpense,
            incomeChange,
            expenseChange,
            currentMonthName: now.toLocaleString('default', { month: 'short' }),
            lastMonthName: new Date(lastMonthYear, lastMonth).toLocaleString('default', { month: 'short' })
        };
    }, [transactions]);

    const fetchDashboardData = useCallback(async () => {
        if (!currentUser) return;

        try {
            // Fetch transactions
            const transResult = await getTransactions(currentUser.uid);
            if (transResult.success) {
                setTransactions(transResult.transactions);
                setRecentTransactions(transResult.transactions.slice(0, 5));
                setSummary(getFinancialSummary(transResult.transactions));
            }

            // Fetch rules count
            const rulesResult = await getRules(currentUser.uid);
            if (rulesResult.success) {
                setRulesCount(rulesResult.rules.length);
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
                    <p className="mt-4 text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Welcome Header */}
            <div className="bg-gradient-to-r from-primary-600 via-primary-700 to-indigo-700 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
                <div className="relative z-10">
                    <h1 className="text-3xl font-bold mb-2">
                        Welcome back{currentUser?.email ? `, ${currentUser.email.split('@')[0]}` : ''}! 👋
                    </h1>
                    <p className="text-primary-100 text-lg">
                        Here's an overview of your financial health.
                    </p>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Total Balance */}
                <div className="bg-white p-6 rounded-2xl shadow-lg border-l-4 border-primary-500 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">Net Balance</p>
                            <p className={`text-3xl font-bold mt-2 ${summary.balance >= 0 ? 'text-primary-700' : 'text-orange-600'}`}>
                                ${summary.balance.toFixed(2)}
                            </p>
                        </div>
                        <div className="bg-gradient-to-br from-primary-100 to-primary-200 p-3 rounded-xl">
                            <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Total Income */}
                <div className="bg-white p-6 rounded-2xl shadow-lg border-l-4 border-green-500 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">Total Income</p>
                            <p className="text-3xl font-bold text-green-600 mt-2">
                                ${summary.totalIncome.toFixed(2)}
                            </p>
                        </div>
                        <div className="bg-gradient-to-br from-green-100 to-green-200 p-3 rounded-xl">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Total Expenses */}
                <div className="bg-white p-6 rounded-2xl shadow-lg border-l-4 border-red-500 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">Total Expenses</p>
                            <p className="text-3xl font-bold text-red-600 mt-2">
                                ${summary.totalExpense.toFixed(2)}
                            </p>
                        </div>
                        <div className="bg-gradient-to-br from-red-100 to-red-200 p-3 rounded-xl">
                            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Active Rules */}
                <div className="bg-white p-6 rounded-2xl shadow-lg border-l-4 border-blue-500 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">Active Rules</p>
                            <p className="text-3xl font-bold text-blue-600 mt-2">
                                {rulesCount}
                            </p>
                        </div>
                        <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-3 rounded-xl">
                            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Monthly Comparison Cards */}
            {monthlyComparison && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Income This Month vs Last Month */}
                    <div className="bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 p-6 rounded-2xl text-white shadow-lg shadow-green-500/25 transform hover:scale-[1.02] transition-all duration-300 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                        <div className="flex items-start justify-between relative z-10">
                            <div className="flex-1">
                                <p className="text-green-100 text-sm font-medium">📈 Income This Month</p>
                                <p className="text-3xl font-bold mt-1">${monthlyComparison.currentMonthIncome.toFixed(0)}</p>
                                <div className="flex items-center gap-2 mt-3">
                                    <span className={`flex items-center gap-1 text-sm font-semibold px-2 py-1 rounded-full ${monthlyComparison.incomeChange >= 0 ? 'bg-white/20' : 'bg-red-500/30'}`}>
                                        {monthlyComparison.incomeChange >= 0 ? (
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                            </svg>
                                        ) : (
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                            </svg>
                                        )}
                                        {monthlyComparison.incomeChange >= 0 ? '+' : ''}{monthlyComparison.incomeChange.toFixed(1)}%
                                    </span>
                                    <span className="text-green-100 text-sm">vs {monthlyComparison.lastMonthName}</span>
                                </div>
                            </div>
                            <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm">
                                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/20 relative z-10">
                            <p className="text-green-100 text-xs">
                                Last month ({monthlyComparison.lastMonthName}): ${monthlyComparison.lastMonthIncome.toFixed(0)}
                            </p>
                        </div>
                    </div>

                    {/* Spending This Month vs Last Month */}
                    <div className="bg-gradient-to-br from-rose-500 via-red-500 to-pink-600 p-6 rounded-2xl text-white shadow-lg shadow-red-500/25 transform hover:scale-[1.02] transition-all duration-300 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                        <div className="flex items-start justify-between relative z-10">
                            <div className="flex-1">
                                <p className="text-rose-100 text-sm font-medium">💸 Spending This Month</p>
                                <p className="text-3xl font-bold mt-1">${monthlyComparison.currentMonthExpense.toFixed(0)}</p>
                                <div className="flex items-center gap-2 mt-3">
                                    <span className={`flex items-center gap-1 text-sm font-semibold px-2 py-1 rounded-full ${monthlyComparison.expenseChange <= 0 ? 'bg-white/20' : 'bg-orange-500/40'}`}>
                                        {monthlyComparison.expenseChange <= 0 ? (
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                            </svg>
                                        ) : (
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                            </svg>
                                        )}
                                        {monthlyComparison.expenseChange >= 0 ? '+' : ''}{monthlyComparison.expenseChange.toFixed(1)}%
                                    </span>
                                    <span className="text-rose-100 text-sm">vs {monthlyComparison.lastMonthName}</span>
                                </div>
                            </div>
                            <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm">
                                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                                </svg>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/20 relative z-10">
                            <p className="text-rose-100 text-xs">
                                Last month ({monthlyComparison.lastMonthName}): ${monthlyComparison.lastMonthExpense.toFixed(0)}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Charts Section */}
            <DashboardCharts transactions={transactions} />

            {/* Quick Actions & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Quick Actions */}
                <div className="bg-white p-6 rounded-2xl shadow-lg">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">⚡ Quick Actions</h3>
                    <div className="space-y-3">
                        <Link
                            to="/finance"
                            className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl hover:from-green-100 hover:to-green-200 transition-all group border border-green-200/50"
                        >
                            <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-2 rounded-lg group-hover:scale-110 transition-transform shadow-md">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                            </div>
                            <span className="font-medium text-gray-700">Add Transaction</span>
                        </Link>

                        <Link
                            to="/finance"
                            className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all group border border-blue-200/50"
                        >
                            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-lg group-hover:scale-110 transition-transform shadow-md">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <span className="font-medium text-gray-700">Manage Rules</span>
                        </Link>

                        <Link
                            to="/finance"
                            className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl hover:from-purple-100 hover:to-purple-200 transition-all group border border-purple-200/50"
                        >
                            <div className="bg-gradient-to-br from-purple-500 to-violet-600 p-2 rounded-lg group-hover:scale-110 transition-transform shadow-md">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <span className="font-medium text-gray-700">View Analytics</span>
                        </Link>

                        <Link
                            to="/investments"
                            className="flex items-center gap-3 p-4 bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-xl hover:from-indigo-100 hover:to-indigo-200 transition-all group border border-indigo-200/50"
                        >
                            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg group-hover:scale-110 transition-transform shadow-md">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                            <span className="font-medium text-gray-700">📈 Investments</span>
                        </Link>
                    </div>
                </div>

                {/* Recent Transactions */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-gray-800">📝 Recent Transactions</h3>
                        <Link to="/finance" className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1">
                            View All
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>

                    {recentTransactions.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                            <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <p className="text-gray-500">No transactions yet.</p>
                            <Link to="/finance" className="text-primary-600 hover:underline text-sm mt-2 inline-block">
                                Add your first transaction
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {recentTransactions.map((t) => (
                                <div key={t.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-xl ${t.type === 'income' ? 'bg-gradient-to-br from-green-100 to-green-200' : 'bg-gradient-to-br from-red-100 to-red-200'}`}>
                                            {t.type === 'income' ? (
                                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                                                </svg>
                                            ) : (
                                                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                                                </svg>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-800">{t.source}</p>
                                            <p className="text-sm text-gray-500">{t.category} • {t.date ? new Date(t.date).toLocaleDateString() : 'N/A'}</p>
                                        </div>
                                    </div>
                                    <p className={`font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                        {t.type === 'income' ? '+' : '-'}${parseFloat(t.amount).toFixed(2)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
