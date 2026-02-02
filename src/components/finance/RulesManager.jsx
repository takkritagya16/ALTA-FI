import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { addRule, getRules, deleteRule } from '../../services/rules';

const CATEGORIES = {
    income: ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'],
    expense: ['Food', 'Transportation', 'Rent', 'Utilities', 'Entertainment', 'Shopping', 'Health', 'Other']
};

const RulesManager = ({ onRuleChange }) => {
    const { currentUser } = useAuth();
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(false);
    const [newRule, setNewRule] = useState({
        pattern: '',
        matchType: 'contains',
        type: 'expense',
        category: ''
    });

    const fetchRules = async () => {
        if (currentUser) {
            const result = await getRules(currentUser.uid);
            if (result.success) setRules(result.rules);
        }
    };

    useEffect(() => {
        fetchRules();
    }, [currentUser]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!currentUser) return;

        setLoading(true);
        const result = await addRule(currentUser.uid, newRule);
        setLoading(false);

        if (result.success) {
            setNewRule({ pattern: '', matchType: 'contains', type: 'expense', category: '' });
            fetchRules();
            if (onRuleChange) onRuleChange();
        } else {
            alert('Error adding rule: ' + result.error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this rule?')) {
            await deleteRule(id);
            fetchRules();
            if (onRuleChange) onRuleChange();
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Automation Rules</h3>
            <p className="text-gray-600 text-sm mb-6">
                Defines how transactions are automatically categorized based on their source (e.g. "If source contains 'Starbucks', categorize as 'Food'").
            </p>

            {/* Add Rule Form */}
            <form onSubmit={handleSubmit} className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-700 mb-3">Create New Rule</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Condition: If Source... */}
                    <div className="col-span-1 md:col-span-2 flex gap-2 items-center">
                        <span className="text-sm font-medium text-gray-600">If Source</span>
                        <select
                            value={newRule.matchType}
                            onChange={(e) => setNewRule({ ...newRule, matchType: e.target.value })}
                            className="p-2 border rounded text-sm bg-white"
                        >
                            <option value="contains">contains</option>
                            <option value="exact">is exactly</option>
                        </select>
                        <input
                            type="text"
                            value={newRule.pattern}
                            onChange={(e) => setNewRule({ ...newRule, pattern: e.target.value })}
                            placeholder="keyword (e.g. Starbucks)"
                            className="flex-1 p-2 border rounded text-sm"
                            required
                        />
                    </div>

                    {/* Action: Set as... */}
                    <div className="col-span-1 md:col-span-2 flex gap-2 items-center">
                        <span className="text-sm font-medium text-gray-600">Then set as</span>
                        <select
                            value={newRule.type}
                            onChange={(e) => setNewRule({ ...newRule, type: e.target.value, category: '' })}
                            className="p-2 border rounded text-sm bg-white"
                        >
                            <option value="expense">Expense</option>
                            <option value="income">Income</option>
                        </select>
                        <span className="text-sm font-medium text-gray-600">-</span>
                        <select
                            value={newRule.category}
                            onChange={(e) => setNewRule({ ...newRule, category: e.target.value })}
                            required
                            className="flex-1 p-2 border rounded text-sm bg-white"
                        >
                            <option value="">Select Category</option>
                            {CATEGORIES[newRule.type].map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <div className="col-span-1 md:col-span-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 transition w-full"
                        >
                            {loading ? 'Saving...' : 'Save Rule'}
                        </button>
                    </div>
                </div>
            </form>

            {/* Rules List */}
            <div className="space-y-2">
                {rules.length === 0 && <p className="text-sm text-gray-500 italic">No rules defined.</p>}
                {rules.map(rule => (
                    <div key={rule.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50">
                        <div className="text-sm">
                            <span className="text-gray-500">If source {rule.matchType} </span>
                            <span className="font-bold text-gray-800">"{rule.pattern}"</span>
                            <span className="text-gray-500"> → </span>
                            <span className={`font-medium ${rule.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                {rule.type === 'income' ? 'Income' : 'Expense'}
                            </span>
                            <span className="text-gray-400"> | </span>
                            <span className="font-medium text-gray-700">{rule.category}</span>
                        </div>
                        <button
                            onClick={() => handleDelete(rule.id)}
                            className="text-red-400 hover:text-red-600 p-1"
                        >
                            &times;
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RulesManager;
