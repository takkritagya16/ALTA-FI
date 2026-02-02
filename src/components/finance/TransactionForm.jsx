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
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Add Transaction</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Type Selection */}
                <div className="col-span-1 md:col-span-2 flex gap-4 p-1 bg-gray-100 rounded-lg">
                    <button
                        type="button"
                        className={`flex-1 py-2 rounded-md font-medium transition-all ${formData.type === 'income' ? 'bg-green-500 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}
                        onClick={() => setFormData({ ...formData, type: 'income', category: '' })}
                    >
                        Income
                    </button>
                    <button
                        type="button"
                        className={`flex-1 py-2 rounded-md font-medium transition-all ${formData.type === 'expense' ? 'bg-red-500 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}
                        onClick={() => setFormData({ ...formData, type: 'expense', category: '' })}
                    >
                        Expense
                    </button>
                </div>

                {/* Amount */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                    <input
                        type="number"
                        name="amount"
                        value={formData.amount}
                        onChange={handleChange}
                        placeholder="0.00"
                        step="0.01"
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                </div>

                {/* Date */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                </div>

                {/* Source/Vendor */}
                <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Source / Vendor</label>
                    <input
                        type="text"
                        name="source"
                        value={formData.source}
                        onChange={handleChange}
                        placeholder={formData.type === 'income' ? 'e.g. Employer Inc' : 'e.g. Starbucks'}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                </div>

                {/* Category */}
                <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                    >
                        <option value="">Select Category</option>
                        {CATEGORIES[formData.type].map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                {/* Description */}
                <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                    <input
                        type="text"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Notes..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                </div>
            </div>

            <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-lg font-bold text-white shadow-lg transform active:scale-95 transition-all ${formData.type === 'income' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                    }`}
            >
                {loading ? 'Adding...' : 'Add Transaction'}
            </button>
        </form>
    );
};

export default TransactionForm;
