import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getTransactions, getFinancialSummary } from '../services/finance';
import TransactionForm from '../components/finance/TransactionForm';
import TransactionList from '../components/finance/TransactionList';
import FinanceSummary from '../components/finance/FinanceSummary';
import RulesManager from '../components/finance/RulesManager';
import CategoryPieChart from '../components/finance/CategoryPieChart';
import IncomeStreams from '../components/finance/IncomeStreams';
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
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent mb-4"></div>
                    <p className="text-gray-600">Loading finance data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">

            {/* Page Header */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white shadow-xl">
                <h1 className="text-3xl font-bold mb-2">Finance Management</h1>
                <p className="text-primary-100">
                    Track income, expenses, import transactions, and manage automation rules.
                </p>
            </div>

            {/* Tabs Navigation */}
            <div className="bg-white p-2 rounded-xl shadow-md border border-gray-100">
                <div className="flex flex-wrap gap-2">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${activeTab === tab.id
                                    ? 'bg-primary-100 text-primary-700 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <span>{tab.icon}</span>
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
                            <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Transactions</h3>
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

                    {/* Pie Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <CategoryPieChart transactions={transactions} type="income" />
                        <CategoryPieChart transactions={transactions} type="expense" />
                    </div>

                    {/* Additional Analytics */}
                    <div className="bg-white p-6 rounded-xl shadow-md">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">📈 Quick Insights</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="text-sm text-blue-600 font-medium">Total Transactions</p>
                                <p className="text-2xl font-bold text-blue-700">{transactions.length}</p>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg">
                                <p className="text-sm text-green-600 font-medium">Income Transactions</p>
                                <p className="text-2xl font-bold text-green-700">
                                    {transactions.filter(t => t.type === 'income').length}
                                </p>
                            </div>
                            <div className="bg-red-50 p-4 rounded-lg">
                                <p className="text-sm text-red-600 font-medium">Expense Transactions</p>
                                <p className="text-2xl font-bold text-red-700">
                                    {transactions.filter(t => t.type === 'expense').length}
                                </p>
                            </div>
                            <div className="bg-purple-50 p-4 rounded-lg">
                                <p className="text-sm text-purple-600 font-medium">Avg Transaction</p>
                                <p className="text-2xl font-bold text-purple-700">
                                    ${transactions.length > 0
                                        ? (transactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0) / transactions.length).toFixed(0)
                                        : '0'
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
                    <div className="lg:col-span-2 bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">💡 Import Tips</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                                <h4 className="font-medium text-gray-700 mb-2">📱 SMS Import</h4>
                                <ul className="text-gray-600 space-y-1">
                                    <li>• Copy bank SMS from your phone</li>
                                    <li>• Paste multiple messages at once</li>
                                    <li>• Auto-detects Indian bank formats</li>
                                    <li>• Identifies EMI payments</li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-700 mb-2">📄 CSV Import</h4>
                                <ul className="text-gray-600 space-y-1">
                                    <li>• Export from your bank portal</li>
                                    <li>• Auto-maps common columns</li>
                                    <li>• Edit categories before import</li>
                                    <li>• Supports any CSV format</li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-700 mb-2">🔄 After Import</h4>
                                <ul className="text-gray-600 space-y-1">
                                    <li>• Review imported transactions</li>
                                    <li>• Create rules for auto-categorization</li>
                                    <li>• Check analytics for insights</li>
                                    <li>• Delete duplicates if needed</li>
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
