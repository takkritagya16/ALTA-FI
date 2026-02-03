const PortfolioSummary = ({ metrics, holdingsCount, watchlistCount }) => {
    const summary = metrics?.summary || {
        totalValue: 0,
        totalCost: 0,
        totalGain: 0,
        totalGainPercent: 0,
        todayChange: 0,
        todayChangePercent: 0
    };

    const isGain = summary.totalGain >= 0;
    const isTodayUp = summary.todayChange >= 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Portfolio Value */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-2xl text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
                <div className="relative z-10">
                    <p className="text-indigo-100 text-sm font-medium mb-1">Total Portfolio Value</p>
                    <p className="text-3xl font-bold mb-2">
                        ${summary.totalValue?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                        <span className="bg-white/20 px-2 py-1 rounded-lg">
                            💼 {holdingsCount} holdings
                        </span>
                    </div>
                </div>
            </div>

            {/* Today's Change */}
            <div className={`p-6 rounded-2xl shadow-lg relative overflow-hidden ${isTodayUp
                    ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white'
                    : 'bg-gradient-to-br from-red-500 to-rose-600 text-white'
                }`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
                <div className="relative z-10">
                    <p className="text-white/80 text-sm font-medium mb-1">Today's Change</p>
                    <p className="text-3xl font-bold mb-2">
                        {isTodayUp ? '+' : ''}{summary.todayChangePercent?.toFixed(2) || '0.00'}%
                    </p>
                    <p className="text-sm text-white/80">
                        {isTodayUp ? '+' : ''}${summary.todayChange?.toFixed(2) || '0.00'}
                    </p>
                </div>
            </div>

            {/* Total Gain/Loss */}
            <div className={`p-6 rounded-2xl shadow-lg relative overflow-hidden ${isGain
                    ? 'bg-gradient-to-br from-teal-500 to-cyan-600 text-white'
                    : 'bg-gradient-to-br from-orange-500 to-red-600 text-white'
                }`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
                <div className="relative z-10">
                    <p className="text-white/80 text-sm font-medium mb-1">Total {isGain ? 'Gain' : 'Loss'}</p>
                    <p className="text-3xl font-bold mb-2">
                        {isGain ? '+' : ''}{summary.totalGainPercent?.toFixed(2) || '0.00'}%
                    </p>
                    <p className="text-sm text-white/80">
                        {isGain ? '+' : ''}${summary.totalGain?.toFixed(2) || '0.00'}
                    </p>
                </div>
            </div>

            {/* Watchlist Count */}
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 p-6 rounded-2xl shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/50 rounded-full -translate-y-16 translate-x-16" />
                <div className="relative z-10">
                    <p className="text-gray-600 text-sm font-medium mb-1">Watchlist</p>
                    <p className="text-3xl font-bold text-gray-800 mb-2">
                        {watchlistCount}
                    </p>
                    <p className="text-sm text-gray-600">
                        👁️ Stocks tracked
                    </p>
                </div>
            </div>

            {/* Additional Stats Row */}
            <div className="lg:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Total Cost Basis */}
                <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
                    <p className="text-gray-500 text-sm mb-1">Cost Basis</p>
                    <p className="text-xl font-bold text-gray-800">
                        ${summary.totalCost?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                </div>

                {/* Average Return */}
                <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
                    <p className="text-gray-500 text-sm mb-1">Average Return</p>
                    <p className={`text-xl font-bold ${summary.totalGainPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {summary.totalGainPercent >= 0 ? '+' : ''}{summary.totalGainPercent?.toFixed(2) || '0.00'}%
                    </p>
                </div>

                {/* Market Status */}
                <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
                    <p className="text-gray-500 text-sm mb-1">Market Status</p>
                    {(() => {
                        const now = new Date();
                        const hour = now.getUTCHours() - 5; // EST
                        const day = now.getDay();
                        const isOpen = day >= 1 && day <= 5 && hour >= 9 && hour < 16;
                        return (
                            <p className={`text-xl font-bold ${isOpen ? 'text-green-600' : 'text-gray-600'}`}>
                                {isOpen ? '🟢 Open' : '🔴 Closed'}
                            </p>
                        );
                    })()}
                </div>

                {/* Last Updated */}
                <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
                    <p className="text-gray-500 text-sm mb-1">Last Updated</p>
                    <p className="text-sm font-medium text-gray-800">
                        {new Date().toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PortfolioSummary;
