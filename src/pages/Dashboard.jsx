import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getTransactions, getFinancialSummary } from '../services/finance';
import { getRules } from '../services/rules';
import { getGoals, calculateGoalInsights } from '../services/goals';
import DashboardCharts from '../components/finance/DashboardCharts';

const Dashboard = () => {
    const { currentUser } = useAuth();
    const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, balance: 0 });
    const [transactions, setTransactions] = useState([]);
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [rulesCount, setRulesCount] = useState(0);
    const [goals, setGoals] = useState([]);
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

            // Fetch goals
            const goalsResult = await getGoals(currentUser.uid);
            if (goalsResult.success) {
                setGoals(goalsResult.goals);
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

    // Format currency in Indian style
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="spinner w-12 h-12 border-4 border-primary-600 border-t-transparent mx-auto"></div>
                    <p className="mt-4 text-surface-600 font-medium">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
            {/* Welcome Header */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 p-8 lg:p-10 text-white shadow-xl shadow-primary-500/20">
                {/* Decorative elements */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-accent-500/20 rounded-full blur-3xl"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl"></div>
                </div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-primary-100 text-sm font-medium mb-4">
                            <span className="w-2 h-2 rounded-full bg-accent-400 animate-pulse"></span>
                            Live Overview
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-display font-bold mb-2">
                            Welcome back{currentUser?.email ? `, ${currentUser.email.split('@')[0]}` : ''}! 👋
                        </h1>
                        <p className="text-primary-100 text-lg">
                            Here's an overview of your financial health.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Link
                            to="/finance"
                            className="inline-flex items-center gap-2 px-5 py-3 bg-white text-primary-700 rounded-xl font-semibold hover:bg-primary-50 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add Transaction
                        </Link>
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Net Balance */}
                <div className="card p-6 group">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="stat-label">Net Balance</p>
                            <p className={`text-3xl font-display font-bold mt-2 ${summary.balance >= 0 ? 'text-gradient-primary' : 'text-danger-600'}`}>
                                {formatCurrency(summary.balance)}
                            </p>
                        </div>
                        <div className="p-3 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 group-hover:scale-110 transition-transform">
                            <svg className="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-surface-100">
                        <span className="text-sm text-surface-500">All-time savings</span>
                    </div>
                </div>

                {/* Total Income */}
                <div className="card p-6 group">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="stat-label">Total Income</p>
                            <p className="text-3xl font-display font-bold mt-2 text-success-600">
                                {formatCurrency(summary.totalIncome)}
                            </p>
                        </div>
                        <div className="p-3 rounded-xl bg-gradient-to-br from-success-100 to-success-200 group-hover:scale-110 transition-transform">
                            <svg className="w-7 h-7 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                            </svg>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-surface-100">
                        <span className="badge-success text-xs">↑ Money In</span>
                    </div>
                </div>

                {/* Total Expenses */}
                <div className="card p-6 group">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="stat-label">Total Expenses</p>
                            <p className="text-3xl font-display font-bold mt-2 text-danger-600">
                                {formatCurrency(summary.totalExpense)}
                            </p>
                        </div>
                        <div className="p-3 rounded-xl bg-gradient-to-br from-danger-100 to-danger-200 group-hover:scale-110 transition-transform">
                            <svg className="w-7 h-7 text-danger-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                            </svg>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-surface-100">
                        <span className="badge-danger text-xs">↓ Money Out</span>
                    </div>
                </div>

                {/* Active Goals */}
                <Link to="/finance" className="card p-6 group hover:shadow-lg transition-all">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="stat-label">Active Goals</p>
                            <p className="text-3xl font-display font-bold mt-2 text-accent-600">
                                {goals.filter(g => g.status !== 'completed' && g.currentAmount < g.targetAmount).length}
                            </p>
                        </div>
                        <div className="p-3 rounded-xl bg-gradient-to-br from-accent-100 to-accent-200 group-hover:scale-110 transition-transform">
                            <svg className="w-7 h-7 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-surface-100">
                        <span className="text-sm text-surface-500 flex items-center gap-1">
                            🎯 Financial Goals
                            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </span>
                    </div>
                </Link>
            </div>

            {/* Monthly Comparison Cards */}
            {monthlyComparison && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Income This Month vs Last Month */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-success-500 via-success-600 to-accent-600 p-6 text-white shadow-xl shadow-success-500/25 group hover:shadow-2xl transition-all duration-300">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full translate-y-16 -translate-x-16"></div>

                        <div className="relative z-10">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <p className="text-success-100 text-sm font-medium flex items-center gap-2">
                                        <span>📈</span> Income This Month
                                    </p>
                                    <p className="text-4xl font-display font-bold mt-2">{formatCurrency(monthlyComparison.currentMonthIncome)}</p>
                                    <div className="flex items-center gap-3 mt-4">
                                        <span className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full ${monthlyComparison.incomeChange >= 0 ? 'bg-white/20' : 'bg-danger-500/40'}`}>
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
                                        <span className="text-success-100 text-sm">vs {monthlyComparison.lastMonthName}</span>
                                    </div>
                                </div>
                                <div className="bg-white/15 p-4 rounded-2xl backdrop-blur-sm group-hover:scale-110 transition-transform">
                                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                    </svg>
                                </div>
                            </div>
                            <div className="mt-6 pt-4 border-t border-white/20">
                                <p className="text-success-100 text-sm">
                                    Last month ({monthlyComparison.lastMonthName}): {formatCurrency(monthlyComparison.lastMonthIncome)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Spending This Month vs Last Month */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-danger-500 via-danger-600 to-secondary-600 p-6 text-white shadow-xl shadow-danger-500/25 group hover:shadow-2xl transition-all duration-300">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full translate-y-16 -translate-x-16"></div>

                        <div className="relative z-10">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <p className="text-danger-100 text-sm font-medium flex items-center gap-2">
                                        <span>💸</span> Spending This Month
                                    </p>
                                    <p className="text-4xl font-display font-bold mt-2">{formatCurrency(monthlyComparison.currentMonthExpense)}</p>
                                    <div className="flex items-center gap-3 mt-4">
                                        <span className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full ${monthlyComparison.expenseChange <= 0 ? 'bg-white/20' : 'bg-warning-500/40'}`}>
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
                                        <span className="text-danger-100 text-sm">vs {monthlyComparison.lastMonthName}</span>
                                    </div>
                                </div>
                                <div className="bg-white/15 p-4 rounded-2xl backdrop-blur-sm group-hover:scale-110 transition-transform">
                                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                                    </svg>
                                </div>
                            </div>
                            <div className="mt-6 pt-4 border-t border-white/20">
                                <p className="text-danger-100 text-sm">
                                    Last month ({monthlyComparison.lastMonthName}): {formatCurrency(monthlyComparison.lastMonthExpense)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Charts Section */}
            <DashboardCharts transactions={transactions} />

            {/* Quick Actions & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Quick Actions */}
                <div className="card p-6">
                    <h3 className="text-xl font-display font-bold text-surface-900 mb-5 flex items-center gap-2">
                        <span className="text-2xl">⚡</span> Quick Actions
                    </h3>
                    <div className="space-y-3">
                        <Link
                            to="/finance"
                            className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-success-50 to-success-100/50 hover:from-success-100 hover:to-success-200/50 transition-all group border border-success-200/50"
                        >
                            <div className="p-2.5 rounded-xl bg-gradient-to-br from-success-500 to-success-600 shadow-lg shadow-success-500/25 group-hover:scale-110 transition-transform">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                            </div>
                            <span className="font-medium text-surface-700">Add Transaction</span>
                            <svg className="w-5 h-5 text-surface-400 ml-auto group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>

                        <Link
                            to="/finance"
                            className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-accent-50 to-accent-100/50 hover:from-accent-100 hover:to-accent-200/50 transition-all group border border-accent-200/50"
                        >
                            <div className="p-2.5 rounded-xl bg-gradient-to-br from-accent-500 to-accent-600 shadow-lg shadow-accent-500/25 group-hover:scale-110 transition-transform">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <span className="font-medium text-surface-700">Manage Rules</span>
                            <svg className="w-5 h-5 text-surface-400 ml-auto group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>

                        <Link
                            to="/finance"
                            className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-primary-50 to-primary-100/50 hover:from-primary-100 hover:to-primary-200/50 transition-all group border border-primary-200/50"
                        >
                            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-500/25 group-hover:scale-110 transition-transform">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <span className="font-medium text-surface-700">View Analytics</span>
                            <svg className="w-5 h-5 text-surface-400 ml-auto group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>

                        <Link
                            to="/investments"
                            className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-secondary-50 to-secondary-100/50 hover:from-secondary-100 hover:to-secondary-200/50 transition-all group border border-secondary-200/50"
                        >
                            <div className="p-2.5 rounded-xl bg-gradient-to-br from-secondary-500 to-secondary-600 shadow-lg shadow-secondary-500/25 group-hover:scale-110 transition-transform">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                            <span className="font-medium text-surface-700">Investments</span>
                            <svg className="w-5 h-5 text-surface-400 ml-auto group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>
                </div>

                {/* Recent Transactions */}
                <div className="lg:col-span-2 card p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-xl font-display font-bold text-surface-900 flex items-center gap-2">
                            <span className="text-2xl">📝</span> Recent Transactions
                        </h3>
                        <Link to="/finance" className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1 group">
                            View All
                            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>

                    {recentTransactions.length === 0 ? (
                        <div className="empty-state py-12 bg-surface-50 rounded-xl border-2 border-dashed border-surface-200">
                            <svg className="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <h4 className="empty-state-title">No transactions yet</h4>
                            <p className="empty-state-description">Start tracking your finances by adding your first transaction.</p>
                            <Link to="/finance" className="btn-primary btn-sm mt-4">
                                Add Transaction
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {recentTransactions.map((t, index) => (
                                <div
                                    key={t.id}
                                    className="flex items-center justify-between p-4 bg-surface-50 rounded-xl hover:bg-surface-100 transition-all duration-200 animate-fade-in-up"
                                    style={{ animationDelay: `${index * 0.05}s` }}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2.5 rounded-xl ${t.type === 'income' ? 'bg-gradient-to-br from-success-100 to-success-200' : 'bg-gradient-to-br from-danger-100 to-danger-200'}`}>
                                            {t.type === 'income' ? (
                                                <svg className="w-5 h-5 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                                                </svg>
                                            ) : (
                                                <svg className="w-5 h-5 text-danger-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                                                </svg>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium text-surface-900">{t.source}</p>
                                            <p className="text-sm text-surface-500">
                                                <span className="badge-neutral text-xs mr-2">{t.category}</span>
                                                {t.date ? new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                    <p className={`font-bold text-lg ${t.type === 'income' ? 'money-positive' : 'money-negative'}`}>
                                        {t.type === 'income' ? '+' : '-'}{formatCurrency(parseFloat(t.amount))}
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
