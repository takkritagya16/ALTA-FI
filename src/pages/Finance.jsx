import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getTransactions, getFinancialSummary } from '../services/finance';
import TransactionForm from '../components/finance/TransactionForm';
import TransactionList from '../components/finance/TransactionList';
import FinanceSummary from '../components/finance/FinanceSummary';
import RulesManager from '../components/finance/RulesManager';
import CategoryPieChart from '../components/finance/CategoryPieChart';
import IncomeStreams from '../components/finance/IncomeStreams';
import MonthlyAnalytics from '../components/finance/MonthlyAnalytics';
import SMSImporter from '../components/finance/SMSImporter';
import CSVImporter from '../components/finance/CSVImporter';

const TABS = [
    { id: 'transactions', label: 'Transactions', icon: '💳' },
    { id: 'analytics', label: 'Analytics', icon: '📊' },
    { id: 'income', label: 'Income Streams', icon: '💰' },
    { id: 'import', label: 'Import', icon: '📥' },
    { id: 'rules', label: 'Rules', icon: '⚙️' },
];

const Finance = () => {
    const { currentUser } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, balance: 0 });
    const [activeTab, setActiveTab] = useState('transactions');
    const [loading, setLoading] = useState(true);

    // Format currency in Indian style
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    // Fetch data function (wrapped in useCallback to be stable for useEffect)
    const fetchData = useCallback(async () => {
        if (!currentUser) return;

        const result = await getTransactions(currentUser.uid);
        console.log('📊 Fetched transactions:', result);
        if (result.success) {
            setTransactions(result.transactions);
            setSummary(getFinancialSummary(result.transactions));
        } else {
            console.error('❌ Failed to fetch transactions:', result.error);
        }
        setLoading(false);
    }, [currentUser]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="spinner w-12 h-12 border-4 border-primary-600 border-t-transparent mx-auto"></div>
                    <p className="mt-4 text-surface-600 font-medium">Loading finance data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">

            {/* Page Header */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 p-8 text-white shadow-xl shadow-primary-500/20">
                {/* Decorative elements */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-accent-500/20 rounded-full blur-3xl"></div>
                </div>
                <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-primary-100 text-sm font-medium mb-4">
                        <span>💳</span> Finance Management
                    </div>
                    <h1 className="text-3xl lg:text-4xl font-display font-bold mb-2">Manage Your Money</h1>
                    <p className="text-primary-100 text-lg">
                        Track income, expenses, import transactions, and manage automation rules.
                    </p>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="card p-2">
                <div className="flex flex-wrap gap-2">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${activeTab === tab.id
                                ? 'bg-primary-100 text-primary-700 shadow-sm'
                                : 'text-surface-500 hover:text-surface-700 hover:bg-surface-100'
                                }`}
                        >
                            <span className="text-lg">{tab.icon}</span>
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'transactions' && (
                <>
                    {/* Financial Summary */}
                    <FinanceSummary summary={summary} />

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column: Form */}
                        <div className="lg:col-span-1">
                            <TransactionForm onTransactionAdded={fetchData} />
                        </div>

                        {/* Right Column: List */}
                        <div className="lg:col-span-2">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-display font-bold text-surface-900">Recent Transactions</h3>
                                <span className="badge-neutral">{transactions.length} total</span>
                            </div>
                            <TransactionList
                                transactions={transactions}
                                onTransactionDeleted={fetchData}
                            />
                        </div>
                    </div>
                </>
            )}

            {activeTab === 'analytics' && (
                <div className="space-y-6">
                    {/* Summary Cards */}
                    <FinanceSummary summary={summary} />

                    {/* Monthly Analytics - Detailed Monthly Breakdown */}
                    <MonthlyAnalytics transactions={transactions} />

                    {/* Pie Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <CategoryPieChart transactions={transactions} type="income" />
                        <CategoryPieChart transactions={transactions} type="expense" />
                    </div>

                    {/* Additional Analytics */}
                    <div className="card p-6">
                        <h3 className="text-xl font-display font-bold text-surface-900 mb-5 flex items-center gap-2">
                            <span className="text-2xl">📈</span> Quick Insights
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-4 rounded-xl bg-gradient-to-br from-accent-50 to-accent-100 border border-accent-200/50">
                                <p className="text-sm text-accent-600 font-medium">Total Transactions</p>
                                <p className="text-2xl font-display font-bold text-accent-700 mt-1">{transactions.length}</p>
                            </div>
                            <div className="p-4 rounded-xl bg-gradient-to-br from-success-50 to-success-100 border border-success-200/50">
                                <p className="text-sm text-success-600 font-medium">Income Transactions</p>
                                <p className="text-2xl font-display font-bold text-success-700 mt-1">
                                    {transactions.filter(t => t.type === 'income').length}
                                </p>
                            </div>
                            <div className="p-4 rounded-xl bg-gradient-to-br from-danger-50 to-danger-100 border border-danger-200/50">
                                <p className="text-sm text-danger-600 font-medium">Expense Transactions</p>
                                <p className="text-2xl font-display font-bold text-danger-700 mt-1">
                                    {transactions.filter(t => t.type === 'expense').length}
                                </p>
                            </div>
                            <div className="p-4 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200/50">
                                <p className="text-sm text-primary-600 font-medium">Avg Transaction</p>
                                <p className="text-2xl font-display font-bold text-primary-700 mt-1">
                                    {transactions.length > 0
                                        ? formatCurrency(transactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0) / transactions.length)
                                        : '₹0'
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'income' && (
                <IncomeStreams transactions={transactions} />
            )}

            {activeTab === 'import' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <SMSImporter onImportComplete={fetchData} />
                    <CSVImporter onImportComplete={fetchData} />

                    {/* Import Tips */}
                    <div className="lg:col-span-2 card p-6 bg-gradient-to-r from-primary-50/50 via-accent-50/50 to-secondary-50/50">
                        <h3 className="text-lg font-display font-bold text-surface-900 mb-5 flex items-center gap-2">
                            <span className="text-2xl">💡</span> Import Tips
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-surface-200">
                                <h4 className="font-semibold text-surface-800 mb-3 flex items-center gap-2">
                                    <span className="text-lg">📱</span> SMS Import
                                </h4>
                                <ul className="text-sm text-surface-600 space-y-2">
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary-500 mt-1">•</span>
                                        Copy bank SMS from your phone
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary-500 mt-1">•</span>
                                        Paste multiple messages at once
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary-500 mt-1">•</span>
                                        Auto-detects Indian bank formats
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary-500 mt-1">•</span>
                                        Identifies EMI payments
                                    </li>
                                </ul>
                            </div>
                            <div className="p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-surface-200">
                                <h4 className="font-semibold text-surface-800 mb-3 flex items-center gap-2">
                                    <span className="text-lg">📄</span> CSV Import
                                </h4>
                                <ul className="text-sm text-surface-600 space-y-2">
                                    <li className="flex items-start gap-2">
                                        <span className="text-accent-500 mt-1">•</span>
                                        Export from your bank portal
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-accent-500 mt-1">•</span>
                                        Auto-maps common columns
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-accent-500 mt-1">•</span>
                                        Edit categories before import
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-accent-500 mt-1">•</span>
                                        Supports any CSV format
                                    </li>
                                </ul>
                            </div>
                            <div className="p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-surface-200">
                                <h4 className="font-semibold text-surface-800 mb-3 flex items-center gap-2">
                                    <span className="text-lg">🔄</span> After Import
                                </h4>
                                <ul className="text-sm text-surface-600 space-y-2">
                                    <li className="flex items-start gap-2">
                                        <span className="text-secondary-500 mt-1">•</span>
                                        Review imported transactions
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-secondary-500 mt-1">•</span>
                                        Create rules for auto-categorization
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-secondary-500 mt-1">•</span>
                                        Check analytics for insights
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-secondary-500 mt-1">•</span>
                                        Delete duplicates if needed
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'rules' && (
                <div className="grid grid-cols-1 gap-8">
                    <RulesManager onRuleChange={fetchData} />
                </div>
            )}

        </div>
    );
};

export default Finance;
