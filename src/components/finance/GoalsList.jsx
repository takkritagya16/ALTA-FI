import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getGoals } from '../../services/goals';
import GoalForm from './GoalForm';
import GoalCard from './GoalCard';

const GoalsList = ({ transactions = [] }) => {
    const { currentUser } = useAuth();
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingGoal, setEditingGoal] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [filter, setFilter] = useState('all'); // all, active, completed

    const fetchGoals = useCallback(async () => {
        if (!currentUser) return;

        const result = await getGoals(currentUser.uid);
        if (result.success) {
            setGoals(result.goals);
        }
        setLoading(false);
    }, [currentUser]);

    useEffect(() => {
        fetchGoals();
    }, [fetchGoals]);

    const handleGoalAdded = () => {
        fetchGoals();
        setShowForm(false);
        setEditingGoal(null);
    };

    const handleEdit = (goal) => {
        setEditingGoal(goal);
        setShowForm(true);
    };

    const handleCancelEdit = () => {
        setEditingGoal(null);
        setShowForm(false);
    };

    // Filter goals
    const filteredGoals = goals.filter(goal => {
        if (filter === 'all') return true;
        if (filter === 'active') return goal.status !== 'completed' && new Date(goal.deadline) >= new Date();
        if (filter === 'completed') return goal.status === 'completed' || (goal.currentAmount >= goal.targetAmount);
        return true;
    });

    // Calculate summary stats
    const totalGoals = goals.length;
    const completedGoals = goals.filter(g => g.status === 'completed' || g.currentAmount >= g.targetAmount).length;
    const totalTargetAmount = goals.reduce((sum, g) => sum + (g.targetAmount || 0), 0);
    const totalSavedAmount = goals.reduce((sum, g) => sum + (g.currentAmount || 0), 0);

    // Format currency
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
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="spinner w-10 h-10 border-4 border-primary-600 border-t-transparent mx-auto"></div>
                    <p className="mt-3 text-surface-600 font-medium">Loading goals...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="card p-4">
                    <p className="text-sm text-surface-500 mb-1">Total Goals</p>
                    <p className="text-2xl font-display font-bold text-surface-900">{totalGoals}</p>
                </div>
                <div className="card p-4">
                    <p className="text-sm text-surface-500 mb-1">Completed</p>
                    <p className="text-2xl font-display font-bold text-success-600">{completedGoals}</p>
                </div>
                <div className="card p-4">
                    <p className="text-sm text-surface-500 mb-1">Total Target</p>
                    <p className="text-2xl font-display font-bold text-primary-600">{formatCurrency(totalTargetAmount)}</p>
                </div>
                <div className="card p-4">
                    <p className="text-sm text-surface-500 mb-1">Total Saved</p>
                    <p className="text-2xl font-display font-bold text-accent-600">{formatCurrency(totalSavedAmount)}</p>
                </div>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === 'all'
                                ? 'bg-primary-100 text-primary-700'
                                : 'text-surface-600 hover:bg-surface-100'
                            }`}
                    >
                        All ({goals.length})
                    </button>
                    <button
                        onClick={() => setFilter('active')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === 'active'
                                ? 'bg-primary-100 text-primary-700'
                                : 'text-surface-600 hover:bg-surface-100'
                            }`}
                    >
                        Active
                    </button>
                    <button
                        onClick={() => setFilter('completed')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === 'completed'
                                ? 'bg-success-100 text-success-700'
                                : 'text-surface-600 hover:bg-surface-100'
                            }`}
                    >
                        Completed
                    </button>
                </div>
                <button
                    onClick={() => {
                        setEditingGoal(null);
                        setShowForm(!showForm);
                    }}
                    className="btn-primary btn-sm flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    {showForm ? 'Cancel' : 'Add Goal'}
                </button>
            </div>

            {/* Form (Expandable) */}
            {showForm && (
                <div className="animate-fade-in">
                    <GoalForm
                        onGoalAdded={handleGoalAdded}
                        editingGoal={editingGoal}
                        onCancelEdit={handleCancelEdit}
                    />
                </div>
            )}

            {/* Goals Grid */}
            {filteredGoals.length === 0 ? (
                <div className="empty-state py-16 bg-surface-50 rounded-2xl border-2 border-dashed border-surface-200">
                    <svg className="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    <h4 className="empty-state-title">
                        {filter === 'all' ? 'No goals yet' : `No ${filter} goals`}
                    </h4>
                    <p className="empty-state-description">
                        {filter === 'all'
                            ? 'Create your first financial goal and start tracking your progress!'
                            : 'Try a different filter or create a new goal.'}
                    </p>
                    {filter === 'all' && !showForm && (
                        <button
                            onClick={() => setShowForm(true)}
                            className="btn-primary btn-sm mt-4"
                        >
                            Create Your First Goal
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredGoals.map((goal, index) => (
                        <div
                            key={goal.id}
                            className="animate-fade-in-up"
                            style={{ animationDelay: `${index * 0.05}s` }}
                        >
                            <GoalCard
                                goal={goal}
                                transactions={transactions}
                                onGoalUpdated={fetchGoals}
                                onEdit={handleEdit}
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Tips Section */}
            {goals.length > 0 && (
                <div className="card p-6 bg-gradient-to-r from-primary-50/50 via-accent-50/50 to-secondary-50/50">
                    <h4 className="font-display font-bold text-surface-900 mb-4 flex items-center gap-2">
                        <span className="text-xl">💡</span> Goal Tips
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-surface-200">
                            <h5 className="font-semibold text-surface-800 mb-2">Break It Down</h5>
                            <p className="text-sm text-surface-600">
                                Focus on the monthly or daily savings amount to make big goals feel achievable.
                            </p>
                        </div>
                        <div className="p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-surface-200">
                            <h5 className="font-semibold text-surface-800 mb-2">Automate Savings</h5>
                            <p className="text-sm text-surface-600">
                                Set up automatic transfers on payday to consistently build toward your goals.
                            </p>
                        </div>
                        <div className="p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-surface-200">
                            <h5 className="font-semibold text-surface-800 mb-2">Review Regularly</h5>
                            <p className="text-sm text-surface-600">
                                Update your progress weekly to stay motivated and adjust as needed.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GoalsList;
