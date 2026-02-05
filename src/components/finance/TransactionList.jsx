import { useState } from 'react';
import { deleteTransaction } from '../../services/finance';

const TransactionList = ({ transactions, onTransactionDeleted }) => {
    const [deletingId, setDeletingId] = useState(null);

    // Format currency in Indian style
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this transaction?')) {
            setDeletingId(id);
            await deleteTransaction(id);
            setDeletingId(null);
            if (onTransactionDeleted) onTransactionDeleted();
        }
    };

    if (!transactions || transactions.length === 0) {
        return (
            <div className="empty-state py-12 bg-surface-50 rounded-2xl border-2 border-dashed border-surface-200">
                <svg className="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h4 className="empty-state-title">No transactions found</h4>
                <p className="empty-state-description">Start tracking your finances by adding your first transaction.</p>
            </div>
        );
    }

    return (
        <div className="card overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Source</th>
                            <th>Category</th>
                            <th className="text-right">Amount</th>
                            <th className="text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map((t, index) => (
                            <tr
                                key={t.id}
                                className="animate-fade-in"
                                style={{ animationDelay: `${index * 0.02}s` }}
                            >
                                <td className="text-surface-600">
                                    {t.date ? new Date(t.date).toLocaleDateString('en-IN', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric'
                                    }) : 'N/A'}
                                </td>
                                <td>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-surface-900">{t.source}</span>
                                        {t.autoCategorized && (
                                            <span className="badge-accent text-xs">
                                                ✨ Auto
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td>
                                    <span className={`badge ${t.type === 'income' ? 'badge-success' : 'badge-danger'}`}>
                                        {t.category}
                                    </span>
                                </td>
                                <td className={`text-right font-bold ${t.type === 'income' ? 'money-positive' : 'money-negative'}`}>
                                    {t.type === 'income' ? '+' : '-'}{formatCurrency(parseFloat(t.amount))}
                                </td>
                                <td className="text-right">
                                    <button
                                        onClick={() => handleDelete(t.id)}
                                        disabled={deletingId === t.id}
                                        className="p-2 rounded-lg text-surface-400 hover:text-danger-500 hover:bg-danger-50 transition-all disabled:opacity-50"
                                        title="Delete"
                                    >
                                        {deletingId === t.id ? (
                                            <div className="spinner w-4 h-4 border-2 border-danger-500"></div>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        )}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-surface-100">
                {transactions.map((t, index) => (
                    <div
                        key={t.id}
                        className="p-4 hover:bg-surface-50 transition-colors animate-fade-in"
                        style={{ animationDelay: `${index * 0.02}s` }}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                                <div className={`p-2.5 rounded-xl flex-shrink-0 ${t.type === 'income'
                                        ? 'bg-gradient-to-br from-success-100 to-success-200'
                                        : 'bg-gradient-to-br from-danger-100 to-danger-200'
                                    }`}>
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
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-medium text-surface-900 truncate">{t.source}</p>
                                        {t.autoCategorized && (
                                            <span className="badge-accent text-xs">✨ Auto</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                        <span className={`badge text-xs ${t.type === 'income' ? 'badge-success' : 'badge-danger'}`}>
                                            {t.category}
                                        </span>
                                        <span className="text-xs text-surface-500">
                                            {t.date ? new Date(t.date).toLocaleDateString('en-IN', {
                                                day: 'numeric',
                                                month: 'short'
                                            }) : 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <p className={`font-bold ${t.type === 'income' ? 'money-positive' : 'money-negative'}`}>
                                    {t.type === 'income' ? '+' : '-'}{formatCurrency(parseFloat(t.amount))}
                                </p>
                                <button
                                    onClick={() => handleDelete(t.id)}
                                    disabled={deletingId === t.id}
                                    className="p-2 rounded-lg text-surface-400 hover:text-danger-500 hover:bg-danger-50 transition-all disabled:opacity-50"
                                    title="Delete"
                                >
                                    {deletingId === t.id ? (
                                        <div className="spinner w-4 h-4 border-2 border-danger-500"></div>
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TransactionList;
