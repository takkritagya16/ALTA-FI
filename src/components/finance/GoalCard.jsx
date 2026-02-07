import { useState } from 'react';
import { calculateGoalInsights, deleteGoal, updateGoal } from '../../services/goals';

const GoalCard = ({ goal, transactions = [], onGoalUpdated, onEdit }) => {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showUpdateProgress, setShowUpdateProgress] = useState(false);
    const [newAmount, setNewAmount] = useState(goal.currentAmount || 0);

    // Calculate insights
    const insights = calculateGoalInsights(goal, transactions);

    // Format currency in Indian style
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    // Format date
    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const handleDelete = async () => {
        setLoading(true);
        const result = await deleteGoal(goal.id);
        if (result.success) {
            onGoalUpdated?.();
        }
        setLoading(false);
        setShowDeleteConfirm(false);
    };

    const handleUpdateProgress = async () => {
        setLoading(true);
        const result = await updateGoal(goal.id, { currentAmount: parseFloat(newAmount) });
        if (result.success) {
            onGoalUpdated?.();
            setShowUpdateProgress(false);
        }
        setLoading(false);
    };

    const handleMarkComplete = async () => {
        setLoading(true);
        const result = await updateGoal(goal.id, {
            currentAmount: goal.targetAmount,
            status: 'completed'
        });
        if (result.success) {
            onGoalUpdated?.();
        }
        setLoading(false);
    };

    // Get priority badge color
    const getPriorityBadge = () => {
        switch (goal.priority) {
            case 'high':
                return 'badge-danger';
            case 'medium':
                return 'badge-warning';
            case 'low':
                return 'badge-success';
            default:
                return 'badge-neutral';
        }
    };

    // Get status color for progress bar
    const getProgressColor = () => {
        if (insights.isAchieved) return 'bg-success-500';
        if (insights.isOverdue) return 'bg-danger-500';
        if (insights.status === 'behind') return 'bg-warning-500';
        return 'bg-primary-500';
    };

    return (
        <div className={`card p-5 transition-all hover:shadow-lg ${insights.isAchieved ? 'ring-2 ring-success-300 bg-success-50/30' : ''}`}>
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-display font-bold text-lg text-surface-900">{goal.name}</h4>
                        <span className={`text-xs ${getPriorityBadge()}`}>
                            {goal.priority}
                        </span>
                    </div>
                    <p className="text-sm text-surface-500">
                        Target: {formatCurrency(goal.targetAmount)} by {formatDate(goal.deadline)}
                    </p>
                </div>

                {/* Actions dropdown */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onEdit?.(goal)}
                        className="p-2 hover:bg-surface-100 rounded-lg text-surface-500 hover:text-surface-700 transition-colors"
                        title="Edit goal"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="p-2 hover:bg-danger-50 rounded-lg text-surface-500 hover:text-danger-600 transition-colors"
                        title="Delete goal"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
                <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-surface-600 font-medium">
                        {formatCurrency(goal.currentAmount || 0)} saved
                    </span>
                    <span className="font-semibold text-surface-900">{insights.progressPercentage}%</span>
                </div>
                <div className="h-3 bg-surface-200 rounded-full overflow-hidden">
                    <div
                        className={`h-full ${getProgressColor()} transition-all duration-500 rounded-full`}
                        style={{ width: `${Math.min(100, insights.progressPercentage)}%` }}
                    ></div>
                </div>
            </div>

            {/* Insights Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded-xl bg-surface-50 border border-surface-100">
                    <p className="text-xs text-surface-500 mb-0.5">Days Remaining</p>
                    <p className="font-display font-bold text-surface-900">
                        {insights.daysRemaining > 0 ? insights.daysRemaining : 'Overdue'}
                    </p>
                </div>
                <div className="p-3 rounded-xl bg-surface-50 border border-surface-100">
                    <p className="text-xs text-surface-500 mb-0.5">Amount Left</p>
                    <p className="font-display font-bold text-surface-900">
                        {formatCurrency(insights.amountRemaining)}
                    </p>
                </div>
                <div className="p-3 rounded-xl bg-primary-50 border border-primary-100">
                    <p className="text-xs text-primary-600 mb-0.5">Monthly Savings Needed</p>
                    <p className="font-display font-bold text-primary-700">
                        {formatCurrency(insights.monthlySavingsNeeded)}
                    </p>
                </div>
                <div className="p-3 rounded-xl bg-accent-50 border border-accent-100">
                    <p className="text-xs text-accent-600 mb-0.5">Daily Savings Needed</p>
                    <p className="font-display font-bold text-accent-700">
                        {formatCurrency(insights.dailySavingsNeeded)}
                    </p>
                </div>
            </div>

            {/* Status Message */}
            <div className={`p-3 rounded-xl text-sm font-medium ${insights.isAchieved ? 'bg-success-100 text-success-700' :
                    insights.isOverdue ? 'bg-danger-100 text-danger-700' :
                        insights.status === 'behind' ? 'bg-warning-100 text-warning-700' :
                            'bg-primary-100 text-primary-700'
                }`}>
                {insights.statusMessage}
            </div>

            {/* Action Buttons */}
            {!insights.isAchieved && (
                <div className="flex gap-2 mt-4">
                    <button
                        onClick={() => setShowUpdateProgress(true)}
                        className="btn-secondary btn-sm flex-1"
                    >
                        Update Progress
                    </button>
                    <button
                        onClick={handleMarkComplete}
                        className="btn-primary btn-sm flex-1"
                        disabled={loading}
                    >
                        Mark Complete
                    </button>
                </div>
            )}

            {/* Update Progress Modal */}
            {showUpdateProgress && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-fade-in">
                        <h4 className="font-display font-bold text-lg mb-4">Update Progress</h4>
                        <p className="text-sm text-surface-600 mb-4">
                            How much have you saved toward "{goal.name}"?
                        </p>
                        <div className="relative mb-4">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500 font-medium">₹</span>
                            <input
                                type="number"
                                value={newAmount}
                                onChange={(e) => setNewAmount(e.target.value)}
                                className="form-input w-full pl-8"
                                min="0"
                                max={goal.targetAmount}
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowUpdateProgress(false)}
                                className="btn-secondary flex-1"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateProgress}
                                className="btn-primary flex-1"
                                disabled={loading}
                            >
                                {loading ? 'Saving...' : 'Update'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-fade-in">
                        <h4 className="font-display font-bold text-lg mb-2 text-danger-600">Delete Goal?</h4>
                        <p className="text-surface-600 mb-4">
                            Are you sure you want to delete "{goal.name}"? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="btn-secondary flex-1"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="bg-danger-500 hover:bg-danger-600 text-white px-4 py-2.5 rounded-xl font-medium transition-colors flex-1"
                                disabled={loading}
                            >
                                {loading ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GoalCard;
