const FinanceSummary = ({ summary }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Income Card */}
            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500">
                <p className="text-gray-500 text-sm font-medium">Total Income</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                    ${summary.totalIncome.toFixed(2)}
                </p>
            </div>

            {/* Expense Card */}
            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-red-500">
                <p className="text-gray-500 text-sm font-medium">Total Expense</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                    ${summary.totalExpense.toFixed(2)}
                </p>
            </div>

            {/* Balance Card */}
            <div className={`bg-white p-6 rounded-xl shadow-md border-l-4 ${summary.balance >= 0 ? 'border-primary-500' : 'border-orange-500'}`}>
                <p className="text-gray-500 text-sm font-medium">Net Balance</p>
                <p className={`text-2xl font-bold mt-1 ${summary.balance >= 0 ? 'text-primary-700' : 'text-orange-600'}`}>
                    ${summary.balance.toFixed(2)}
                </p>
            </div>
        </div>
    );
};

export default FinanceSummary;
