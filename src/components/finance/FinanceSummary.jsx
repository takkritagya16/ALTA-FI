const FinanceSummary = ({ summary }) => {
    // Format currency in Indian style
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Income Card */}
            <div className="card p-6 group border-l-4 border-success-500">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="stat-label">Total Income</p>
                        <p className="text-3xl font-display font-bold text-success-600 mt-2">
                            {formatCurrency(summary.totalIncome)}
                        </p>
                    </div>
                    <div className="p-3 rounded-xl bg-gradient-to-br from-success-100 to-success-200 group-hover:scale-110 transition-transform">
                        <svg className="w-7 h-7 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                        </svg>
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t border-surface-100">
                    <span className="badge-success text-xs">↑ Money In</span>
                </div>
            </div>

            {/* Expense Card */}
            <div className="card p-6 group border-l-4 border-danger-500">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="stat-label">Total Expense</p>
                        <p className="text-3xl font-display font-bold text-danger-600 mt-2">
                            {formatCurrency(summary.totalExpense)}
                        </p>
                    </div>
                    <div className="p-3 rounded-xl bg-gradient-to-br from-danger-100 to-danger-200 group-hover:scale-110 transition-transform">
                        <svg className="w-7 h-7 text-danger-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                        </svg>
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t border-surface-100">
                    <span className="badge-danger text-xs">↓ Money Out</span>
                </div>
            </div>

            {/* Balance Card */}
            <div className={`card p-6 group border-l-4 ${summary.balance >= 0 ? 'border-primary-500' : 'border-warning-500'}`}>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="stat-label">Net Balance</p>
                        <p className={`text-3xl font-display font-bold mt-2 ${summary.balance >= 0 ? 'text-gradient-primary' : 'text-warning-600'}`}>
                            {formatCurrency(summary.balance)}
                        </p>
                    </div>
                    <div className={`p-3 rounded-xl group-hover:scale-110 transition-transform ${summary.balance >= 0
                            ? 'bg-gradient-to-br from-primary-100 to-primary-200'
                            : 'bg-gradient-to-br from-warning-100 to-warning-200'
                        }`}>
                        <svg className={`w-7 h-7 ${summary.balance >= 0 ? 'text-primary-600' : 'text-warning-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t border-surface-100">
                    <span className={`badge text-xs ${summary.balance >= 0 ? 'badge-primary' : 'badge-warning'}`}>
                        {summary.balance >= 0 ? '💰 Savings' : '⚠️ Deficit'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default FinanceSummary;
