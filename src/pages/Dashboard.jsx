import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getTransactions, getFinancialSummary } from '../services/finance';
import { getRules } from '../services/rules';

const Dashboard = () => {
    const { currentUser } = useAuth();
    const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, balance: 0 });
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [rulesCount, setRulesCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchDashboardData = useCallback(async () => {
        if (!currentUser) return;

        try {
            // Fetch transactions
            const transResult = await getTransactions(currentUser.uid);
            if (transResult.success) {
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
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Welcome Header */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-8 text-white shadow-xl">
                <h1 className="text-3xl font-bold mb-2">
                    Welcome back{currentUser?.email ? `, ${currentUser.email.split('@')[0]}` : ''}!
                </h1>
                <p className="text-primary-100 text-lg">
                    Here's an overview of your financial health.
                </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Total Balance */}
                <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-primary-500 hover:shadow-xl transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">Net Balance</p>
                            <p className={`text-3xl font-bold mt-2 ${summary.balance >= 0 ? 'text-primary-700' : 'text-orange-600'}`}>
                                ${summary.balance.toFixed(2)}
                            </p>
                        </div>
                        <div className="bg-primary-100 p-3 rounded-full">
                            <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Total Income */}
                <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-green-500 hover:shadow-xl transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">Total Income</p>
                            <p className="text-3xl font-bold text-green-600 mt-2">
                                ${summary.totalIncome.toFixed(2)}
                            </p>
                        </div>
                        <div className="bg-green-100 p-3 rounded-full">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Total Expenses */}
                <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-red-500 hover:shadow-xl transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">Total Expenses</p>
                            <p className="text-3xl font-bold text-red-600 mt-2">
                                ${summary.totalExpense.toFixed(2)}
                            </p>
                        </div>
                        <div className="bg-red-100 p-3 rounded-full">
                            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Active Rules */}
                <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-blue-500 hover:shadow-xl transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">Active Rules</p>
                            <p className="text-3xl font-bold text-blue-600 mt-2">
                                {rulesCount}
                            </p>
                        </div>
                        <div className="bg-blue-100 p-3 rounded-full">
                            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Quick Actions */}
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                        <Link
                            to="/finance"
                            className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg hover:from-green-100 hover:to-green-200 transition-all group"
                        >
                            <div className="bg-green-500 p-2 rounded-lg group-hover:scale-110 transition-transform">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                            </div>
                            <span className="font-medium text-gray-700">Add Transaction</span>
                        </Link>

                        <Link
                            to="/finance"
                            className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg hover:from-blue-100 hover:to-blue-200 transition-all group"
                        >
                            <div className="bg-blue-500 p-2 rounded-lg group-hover:scale-110 transition-transform">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <span className="font-medium text-gray-700">Manage Rules</span>
                        </Link>

                        <Link
                            to="/finance"
                            className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg hover:from-purple-100 hover:to-purple-200 transition-all group"
                        >
                            <div className="bg-purple-500 p-2 rounded-lg group-hover:scale-110 transition-transform">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <span className="font-medium text-gray-700">View Reports</span>
                        </Link>
                    </div>
                </div>

                {/* Recent Transactions */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-gray-800">Recent Transactions</h3>
                        <Link to="/finance" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                            View All →
                        </Link>
                    </div>

                    {recentTransactions.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
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
                                <div key={t.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-full ${t.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
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
