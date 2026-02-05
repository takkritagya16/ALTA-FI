import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { addTransaction } from '../../services/finance';
import { getRules, applyRules } from '../../services/rules';

const CATEGORIES = {
    income: ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'],
    expense: ['Food', 'Transportation', 'Rent', 'Utilities', 'Entertainment', 'Shopping', 'Health', 'Other']
};

const TransactionForm = ({ onTransactionAdded }) => {
    const { currentUser } = useAuth();
    const [formData, setFormData] = useState({
        type: 'expense',
        amount: '',
        source: '',
        category: '',
        date: new Date().toISOString().split('T')[0],
        description: ''
    });
    const [loading, setLoading] = useState(false);
    const [userRules, setUserRules] = useState([]);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        if (currentUser) {
            getRules(currentUser.uid).then(res => {
                if (res.success) setUserRules(res.rules);
            });
        }
    }, [currentUser]);

    useEffect(() => {
        if (formData.source && userRules.length > 0) {
            const suggestion = applyRules(userRules, formData.source);
            if (suggestion) {
                setFormData(prev => ({
                    ...prev,
                    type: suggestion.type,
                    category: suggestion.category
                }));
            }
        }
    }, [formData.source, userRules]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!currentUser) return;

        setLoading(true);
        const result = await addTransaction(currentUser.uid, {
            ...formData,
            date: new Date(formData.date)
        });
        setLoading(false);

        if (result.success) {
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2000);
            setFormData(prev => ({
                type: 'expense',
                amount: '',
                source: '',
                category: '',
                date: prev.date,
                description: ''
            }));
            if (onTransactionAdded) onTransactionAdded();
        } else {
            alert('Failed to add transaction: ' + result.error);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="card p-6">
            <h3 className="text-xl font-display font-bold text-surface-900 mb-5 flex items-center gap-2">
                <span className="text-2xl">➕</span> Add Transaction
            </h3>

            {/* Success Message */}
            {showSuccess && (
                <div className="mb-4 p-3 rounded-xl bg-success-50 border border-success-200 flex items-center gap-2 animate-fade-in">
                    <svg className="w-5 h-5 text-success-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-success-700 text-sm font-medium">Transaction added successfully!</span>
                </div>
            )}

            <div className="space-y-4">
                {/* Type Selection */}
                <div className="flex gap-2 p-1 bg-surface-100 rounded-xl">
                    <button
                        type="button"
                        className={`flex-1 py-2.5 rounded-lg font-semibold transition-all duration-200 ${formData.type === 'income'
                                ? 'bg-gradient-to-r from-success-500 to-success-600 text-white shadow-lg shadow-success-500/25'
                                : 'text-surface-600 hover:bg-surface-200'
                            }`}
                        onClick={() => setFormData({ ...formData, type: 'income', category: '' })}
                    >
                        <span className="flex items-center justify-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                            </svg>
                            Income
                        </span>
                    </button>
                    <button
                        type="button"
                        className={`flex-1 py-2.5 rounded-lg font-semibold transition-all duration-200 ${formData.type === 'expense'
                                ? 'bg-gradient-to-r from-danger-500 to-danger-600 text-white shadow-lg shadow-danger-500/25'
                                : 'text-surface-600 hover:bg-surface-200'
                            }`}
                        onClick={() => setFormData({ ...formData, type: 'expense', category: '' })}
                    >
                        <span className="flex items-center justify-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                            </svg>
                            Expense
                        </span>
                    </button>
                </div>

                {/* Amount & Date Row */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Amount */}
                    <div>
                        <label className="block text-sm font-medium text-surface-700 mb-1.5">Amount</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-surface-400 font-medium">₹</span>
                            <input
                                type="number"
                                name="amount"
                                value={formData.amount}
                                onChange={handleChange}
                                placeholder="0"
                                step="0.01"
                                required
                                className="input pl-8"
                            />
                        </div>
                    </div>

                    {/* Date */}
                    <div>
                        <label className="block text-sm font-medium text-surface-700 mb-1.5">Date</label>
                        <input
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            required
                            className="input"
                        />
                    </div>
                </div>

                {/* Source/Vendor */}
                <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1.5">
                        Source / Vendor
                        {userRules.length > 0 && (
                            <span className="ml-2 text-xs text-accent-600 font-normal">
                                ✨ Auto-category enabled
                            </span>
                        )}
                    </label>
                    <input
                        type="text"
                        name="source"
                        value={formData.source}
                        onChange={handleChange}
                        placeholder={formData.type === 'income' ? 'e.g. Employer Inc' : 'e.g. Swiggy, Amazon'}
                        required
                        className="input"
                    />
                </div>

                {/* Category */}
                <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1.5">Category</label>
                    <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        required
                        className="select"
                    >
                        <option value="">Select Category</option>
                        {CATEGORIES[formData.type].map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1.5">
                        Description <span className="text-surface-400 font-normal">(Optional)</span>
                    </label>
                    <input
                        type="text"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Add notes..."
                        className="input"
                    />
                </div>
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                disabled={loading}
                className={`w-full mt-6 py-3.5 rounded-xl font-bold text-white shadow-lg transform active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 ${formData.type === 'income'
                        ? 'bg-gradient-to-r from-success-500 to-success-600 hover:from-success-600 hover:to-success-700 shadow-success-500/25'
                        : 'bg-gradient-to-r from-danger-500 to-danger-600 hover:from-danger-600 hover:to-danger-700 shadow-danger-500/25'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
                {loading ? (
                    <>
                        <div className="spinner"></div>
                        <span>Adding...</span>
                    </>
                ) : (
                    <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span>Add {formData.type === 'income' ? 'Income' : 'Expense'}</span>
                    </>
                )}
            </button>
        </form>
    );
};

export default TransactionForm;
