import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { addGoal, updateGoal } from '../../services/goals';

const PRIORITY_OPTIONS = [
    { value: 'high', label: 'High Priority', color: 'danger' },
    { value: 'medium', label: 'Medium Priority', color: 'warning' },
    { value: 'low', label: 'Low Priority', color: 'success' },
];

const GoalForm = ({ onGoalAdded, editingGoal = null, onCancelEdit }) => {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: editingGoal?.name || '',
        targetAmount: editingGoal?.targetAmount || '',
        currentAmount: editingGoal?.currentAmount || '',
        deadline: editingGoal?.deadline
            ? new Date(editingGoal.deadline).toISOString().split('T')[0]
            : '',
        priority: editingGoal?.priority || 'medium',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError('');
    };

    const validateForm = () => {
        if (!formData.name.trim()) {
            setError('Please enter a goal name');
            return false;
        }
        if (!formData.targetAmount || parseFloat(formData.targetAmount) <= 0) {
            setError('Please enter a valid target amount');
            return false;
        }
        if (!formData.deadline) {
            setError('Please select a deadline');
            return false;
        }

        const deadlineDate = new Date(formData.deadline);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (deadlineDate < today && !editingGoal) {
            setError('Deadline cannot be in the past');
            return false;
        }

        if (parseFloat(formData.currentAmount) < 0) {
            setError('Current amount cannot be negative');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);
        setError('');

        try {
            let result;

            if (editingGoal) {
                result = await updateGoal(editingGoal.id, formData);
            } else {
                result = await addGoal(currentUser.uid, formData);
            }

            if (result.success) {
                // Reset form
                setFormData({
                    name: '',
                    targetAmount: '',
                    currentAmount: '',
                    deadline: '',
                    priority: 'medium',
                });

                if (onGoalAdded) onGoalAdded();
                if (onCancelEdit) onCancelEdit();
            } else {
                setError(result.error || 'Failed to save goal');
            }
        } catch (err) {
            console.error('Error saving goal:', err);
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    // Get minimum date (today) for the date picker
    const getMinDate = () => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };

    return (
        <div className="card p-6">
            <h3 className="text-xl font-display font-bold text-surface-900 mb-5 flex items-center gap-2">
                <span className="text-2xl">🎯</span>
                {editingGoal ? 'Edit Goal' : 'Set a New Goal'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Goal Name */}
                <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1.5">
                        Goal Name
                    </label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="e.g., New Car, Vacation, Emergency Fund"
                        className="form-input w-full"
                        disabled={loading}
                    />
                </div>

                {/* Target Amount */}
                <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1.5">
                        Target Amount (₹)
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500 font-medium">₹</span>
                        <input
                            type="number"
                            name="targetAmount"
                            value={formData.targetAmount}
                            onChange={handleChange}
                            placeholder="50,000"
                            min="1"
                            step="1"
                            className="form-input w-full pl-8"
                            disabled={loading}
                        />
                    </div>
                </div>

                {/* Current Amount Saved */}
                <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1.5">
                        Already Saved (₹) <span className="text-surface-400 font-normal">- optional</span>
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500 font-medium">₹</span>
                        <input
                            type="number"
                            name="currentAmount"
                            value={formData.currentAmount}
                            onChange={handleChange}
                            placeholder="0"
                            min="0"
                            step="1"
                            className="form-input w-full pl-8"
                            disabled={loading}
                        />
                    </div>
                </div>

                {/* Deadline */}
                <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1.5">
                        Target Deadline
                    </label>
                    <input
                        type="date"
                        name="deadline"
                        value={formData.deadline}
                        onChange={handleChange}
                        min={editingGoal ? undefined : getMinDate()}
                        className="form-input w-full"
                        disabled={loading}
                    />
                </div>

                {/* Priority */}
                <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1.5">
                        Priority Level
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                        {PRIORITY_OPTIONS.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, priority: option.value }))}
                                className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${formData.priority === option.value
                                        ? option.value === 'high'
                                            ? 'bg-danger-100 text-danger-700 ring-2 ring-danger-500'
                                            : option.value === 'medium'
                                                ? 'bg-warning-100 text-warning-700 ring-2 ring-warning-500'
                                                : 'bg-success-100 text-success-700 ring-2 ring-success-500'
                                        : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                                    }`}
                                disabled={loading}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="p-3 rounded-xl bg-danger-50 border border-danger-200 text-danger-700 text-sm">
                        {error}
                    </div>
                )}

                {/* Submit Buttons */}
                <div className="flex gap-3 pt-2">
                    {editingGoal && (
                        <button
                            type="button"
                            onClick={onCancelEdit}
                            className="btn-secondary flex-1"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        type="submit"
                        className={`btn-primary ${editingGoal ? 'flex-1' : 'w-full'}`}
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                Saving...
                            </span>
                        ) : (
                            editingGoal ? 'Update Goal' : 'Create Goal'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default GoalForm;
