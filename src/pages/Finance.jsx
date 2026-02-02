import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getTransactions, getFinancialSummary } from '../services/finance';
import TransactionForm from '../components/finance/TransactionForm';
import TransactionList from '../components/finance/TransactionList';
import FinanceSummary from '../components/finance/FinanceSummary';
import RulesManager from '../components/finance/RulesManager';

const Finance = () => {
    const { currentUser } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, balance: 0 });
    const [activeTab, setActiveTab] = useState('transactions'); // 'transactions' | 'rules'
    const [loading, setLoading] = useState(true);

    // Fetch data function (wrapped in useCallback to be stable for useEffect)
    const fetchData = useCallback(async () => {
        if (!currentUser) return;

        // We don't set loading true here to avoid flickering on every update
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
        return <div className="p-8 text-center text-gray-500">Loading finance data...</div>;
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8">

            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Finance Management</h1>
                    <p className="text-gray-600">Track your income, expenses, and manage automation rules.</p>
                </div>

                {/* Tabs */}
                <div className="bg-white p-1 rounded-lg shadow-sm border border-gray-100 flex">
                    <button
                        onClick={() => setActiveTab('transactions')}
                        className={`px-6 py-2 rounded-md font-medium transition-all ${activeTab === 'transactions'
                            ? 'bg-primary-100 text-primary-700'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        Transactions
                    </button>
                    <button
                        onClick={() => setActiveTab('rules')}
                        className={`px-6 py-2 rounded-md font-medium transition-all ${activeTab === 'rules'
                            ? 'bg-primary-100 text-primary-700'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        Automation Rules
                    </button>
                </div>
            </div>

            {activeTab === 'transactions' ? (
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
            ) : (
                <div className="grid grid-cols-1 gap-8">
                    <RulesManager onRuleChange={() => { }} />
                </div>
            )}

        </div>
    );
};

export default Finance;
