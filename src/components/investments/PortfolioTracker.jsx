import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { addHolding, sellHolding, deleteHolding } from '../../services/portfolio';
import { getStockQuote, POPULAR_STOCKS } from '../../services/stocks';

const PortfolioTracker = ({ holdings, quotes, metrics, onUpdate }) => {
    const { currentUser } = useAuth();
    const [showAddModal, setShowAddModal] = useState(false);
    const [showSellModal, setShowSellModal] = useState(false);
    const [selectedHolding, setSelectedHolding] = useState(null);

    // Add holding form state
    const [addSymbol, setAddSymbol] = useState('');
    const [addQuantity, setAddQuantity] = useState('');
    const [addPrice, setAddPrice] = useState('');
    const [adding, setAdding] = useState(false);

    // Sell form state
    const [sellQuantity, setSellQuantity] = useState('');
    const [sellPrice, setSellPrice] = useState('');
    const [selling, setSelling] = useState(false);

    const handleAddHolding = async () => {
        if (!addSymbol || !addQuantity || !addPrice || !currentUser) return;

        setAdding(true);
        const result = await addHolding(currentUser.uid, {
            symbol: addSymbol.toUpperCase(),
            quantity: parseFloat(addQuantity),
            buyPrice: parseFloat(addPrice)
        });

        if (result.success) {
            setShowAddModal(false);
            setAddSymbol('');
            setAddQuantity('');
            setAddPrice('');
            onUpdate?.();
        }
        setAdding(false);
    };

    const handleOpenSellModal = async (holding) => {
        setSelectedHolding(holding);
        setSellQuantity(holding.quantity.toString());

        // Get current price
        const quoteResult = await getStockQuote(holding.symbol);
        if (quoteResult.success) {
            setSellPrice(quoteResult.quote.price.toFixed(2));
        }

        setShowSellModal(true);
    };

    const handleSell = async () => {
        if (!selectedHolding || !sellQuantity || !sellPrice) return;

        setSelling(true);
        const result = await sellHolding(
            selectedHolding.id,
            parseFloat(sellQuantity),
            parseFloat(sellPrice)
        );

        if (result.success) {
            setShowSellModal(false);
            setSelectedHolding(null);
            setSellQuantity('');
            setSellPrice('');
            onUpdate?.();
        }
        setSelling(false);
    };

    const handleDelete = async (holdingId) => {
        if (window.confirm('Are you sure you want to delete this holding?')) {
            await deleteHolding(holdingId);
            onUpdate?.();
        }
    };

    const handleQuickAdd = async (stock) => {
        setAddSymbol(stock.symbol);
        const quoteResult = await getStockQuote(stock.symbol);
        if (quoteResult.success) {
            setAddPrice(quoteResult.quote.price.toFixed(2));
        }
        setShowAddModal(true);
    };

    // Calculate allocation percentages
    const totalValue = metrics?.summary?.totalValue || 0;
    const holdingsWithAllocation = (metrics?.holdings || []).map(h => ({
        ...h,
        allocation: totalValue > 0 ? (h.currentValue / totalValue) * 100 : 0
    })).sort((a, b) => b.allocation - a.allocation);

    return (
        <div className="space-y-6">
            {/* Portfolio Header with Add Button */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-800">💼 Portfolio Holdings</h2>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2"
                    >
                        <span>+</span>
                        Add Holding
                    </button>
                </div>

                {holdings.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">💼</div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">No holdings yet</h3>
                        <p className="text-gray-500 mb-6">Start building your portfolio by adding stocks</p>

                        <div className="flex flex-wrap justify-center gap-2">
                            {POPULAR_STOCKS.slice(0, 6).map((stock) => (
                                <button
                                    key={stock.symbol}
                                    onClick={() => handleQuickAdd(stock)}
                                    className="px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-xl font-medium transition-colors"
                                >
                                    + {stock.symbol}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">Stock</th>
                                    <th className="text-right py-3 px-4 text-gray-600 font-semibold">Shares</th>
                                    <th className="text-right py-3 px-4 text-gray-600 font-semibold">Avg Cost</th>
                                    <th className="text-right py-3 px-4 text-gray-600 font-semibold">Current Price</th>
                                    <th className="text-right py-3 px-4 text-gray-600 font-semibold">Value</th>
                                    <th className="text-right py-3 px-4 text-gray-600 font-semibold">Today</th>
                                    <th className="text-right py-3 px-4 text-gray-600 font-semibold">Total Gain</th>
                                    <th className="text-right py-3 px-4 text-gray-600 font-semibold">Allocation</th>
                                    <th className="text-center py-3 px-4 text-gray-600 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {holdingsWithAllocation.map((holding) => {
                                    const isGain = holding.gain >= 0;
                                    const isTodayUp = holding.todayChangePercent >= 0;

                                    return (
                                        <tr key={holding.id} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                                        {holding.symbol.slice(0, 2)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-800">{holding.symbol}</p>
                                                        <p className="text-xs text-gray-500 truncate max-w-[100px]">{holding.name}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-right font-medium text-gray-800">
                                                {holding.quantity}
                                            </td>
                                            <td className="py-4 px-4 text-right text-gray-600">
                                                ${holding.avgPrice?.toFixed(2)}
                                            </td>
                                            <td className="py-4 px-4 text-right font-bold text-gray-800">
                                                ${holding.currentPrice?.toFixed(2) || '--'}
                                            </td>
                                            <td className="py-4 px-4 text-right font-bold text-gray-800">
                                                ${holding.currentValue?.toFixed(2) || '--'}
                                            </td>
                                            <td className={`py-4 px-4 text-right font-medium ${isTodayUp ? 'text-green-600' : 'text-red-600'}`}>
                                                {isTodayUp ? '▲' : '▼'} {Math.abs(holding.todayChangePercent || 0).toFixed(2)}%
                                            </td>
                                            <td className={`py-4 px-4 text-right ${isGain ? 'text-green-600' : 'text-red-600'}`}>
                                                <p className="font-medium">
                                                    {isGain ? '+' : ''}{holding.gainPercent?.toFixed(2)}%
                                                </p>
                                                <p className="text-sm">
                                                    {isGain ? '+' : ''}${holding.gain?.toFixed(2)}
                                                </p>
                                            </td>
                                            <td className="py-4 px-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-indigo-600 rounded-full"
                                                            style={{ width: `${Math.min(holding.allocation, 100)}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-sm text-gray-600 w-12">
                                                        {holding.allocation?.toFixed(1)}%
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleOpenSellModal(holding)}
                                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                        title="Sell"
                                                    >
                                                        💵
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(holding.id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            {/* Footer with totals */}
                            <tfoot className="bg-gray-50">
                                <tr>
                                    <td className="py-4 px-4 font-bold text-gray-800" colSpan="4">
                                        Total Portfolio
                                    </td>
                                    <td className="py-4 px-4 text-right font-bold text-gray-800">
                                        ${metrics?.summary?.totalValue?.toFixed(2) || '0.00'}
                                    </td>
                                    <td className={`py-4 px-4 text-right font-bold ${metrics?.summary?.todayChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {metrics?.summary?.todayChange >= 0 ? '+' : ''}{metrics?.summary?.todayChangePercent?.toFixed(2) || '0.00'}%
                                    </td>
                                    <td className={`py-4 px-4 text-right font-bold ${metrics?.summary?.totalGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {metrics?.summary?.totalGain >= 0 ? '+' : ''}{metrics?.summary?.totalGainPercent?.toFixed(2) || '0.00'}%
                                        <p className="text-sm">
                                            ${metrics?.summary?.totalGain?.toFixed(2) || '0.00'}
                                        </p>
                                    </td>
                                    <td className="py-4 px-4 text-right font-bold text-gray-800">
                                        100%
                                    </td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
            </div>

            {/* Allocation Visualization */}
            {holdingsWithAllocation.length > 0 && (
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">📊 Portfolio Allocation</h3>

                    {/* Horizontal Bar */}
                    <div className="h-8 rounded-xl overflow-hidden flex mb-4">
                        {holdingsWithAllocation.map((holding, index) => {
                            const colors = [
                                'bg-indigo-500', 'bg-purple-500', 'bg-pink-500',
                                'bg-blue-500', 'bg-cyan-500', 'bg-teal-500',
                                'bg-green-500', 'bg-yellow-500', 'bg-orange-500'
                            ];
                            return (
                                <div
                                    key={holding.id}
                                    className={`${colors[index % colors.length]} relative group`}
                                    style={{ width: `${holding.allocation}%` }}
                                    title={`${holding.symbol}: ${holding.allocation.toFixed(1)}%`}
                                >
                                    <div className="absolute inset-0 bg-white/0 group-hover:bg-white/20 transition-colors" />
                                </div>
                            );
                        })}
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap gap-4">
                        {holdingsWithAllocation.map((holding, index) => {
                            const colors = [
                                'bg-indigo-500', 'bg-purple-500', 'bg-pink-500',
                                'bg-blue-500', 'bg-cyan-500', 'bg-teal-500',
                                'bg-green-500', 'bg-yellow-500', 'bg-orange-500'
                            ];
                            return (
                                <div key={holding.id} className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded ${colors[index % colors.length]}`} />
                                    <span className="text-sm font-medium text-gray-700">
                                        {holding.symbol} ({holding.allocation.toFixed(1)}%)
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Add Holding Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-800">Add Holding</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700">
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Symbol</label>
                                <input
                                    type="text"
                                    value={addSymbol}
                                    onChange={(e) => setAddSymbol(e.target.value.toUpperCase())}
                                    placeholder="e.g., AAPL"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Shares</label>
                                <input
                                    type="number"
                                    value={addQuantity}
                                    onChange={(e) => setAddQuantity(e.target.value)}
                                    placeholder="e.g., 10"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Buy Price ($)</label>
                                <input
                                    type="number"
                                    value={addPrice}
                                    onChange={(e) => setAddPrice(e.target.value)}
                                    placeholder="e.g., 150.00"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            {addQuantity && addPrice && (
                                <p className="text-sm text-gray-600">
                                    Total: <span className="font-bold">${(parseFloat(addQuantity) * parseFloat(addPrice)).toFixed(2)}</span>
                                </p>
                            )}
                        </div>

                        <div className="flex gap-2 mt-6">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddHolding}
                                disabled={adding || !addSymbol || !addQuantity || !addPrice}
                                className="flex-1 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {adding ? 'Adding...' : 'Add Holding'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Sell Modal */}
            {showSellModal && selectedHolding && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-800">Sell {selectedHolding.symbol}</h3>
                            <button onClick={() => setShowSellModal(false)} className="text-gray-500 hover:text-gray-700">
                                ✕
                            </button>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-xl mb-4">
                            <p className="text-sm text-gray-600">You own</p>
                            <p className="text-2xl font-bold text-gray-800">{selectedHolding.quantity} shares</p>
                            <p className="text-sm text-gray-500">Avg cost: ${selectedHolding.avgPrice?.toFixed(2)}</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Shares to Sell</label>
                                <input
                                    type="number"
                                    value={sellQuantity}
                                    onChange={(e) => setSellQuantity(e.target.value)}
                                    max={selectedHolding.quantity}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                                />
                                <button
                                    onClick={() => setSellQuantity(selectedHolding.quantity.toString())}
                                    className="text-sm text-indigo-600 mt-1"
                                >
                                    Sell all
                                </button>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Sell Price ($)</label>
                                <input
                                    type="number"
                                    value={sellPrice}
                                    onChange={(e) => setSellPrice(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            {sellQuantity && sellPrice && (
                                <div className="bg-gray-50 p-4 rounded-xl">
                                    <p className="text-sm text-gray-600">Total Sale</p>
                                    <p className="text-xl font-bold text-gray-800">
                                        ${(parseFloat(sellQuantity) * parseFloat(sellPrice)).toFixed(2)}
                                    </p>
                                    {(() => {
                                        const profit = (parseFloat(sellPrice) - selectedHolding.avgPrice) * parseFloat(sellQuantity);
                                        return (
                                            <p className={`text-sm font-medium ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {profit >= 0 ? 'Profit' : 'Loss'}: ${Math.abs(profit).toFixed(2)}
                                            </p>
                                        );
                                    })()}
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2 mt-6">
                            <button
                                onClick={() => setShowSellModal(false)}
                                className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSell}
                                disabled={selling || !sellQuantity || !sellPrice || parseFloat(sellQuantity) > selectedHolding.quantity}
                                className="flex-1 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50"
                            >
                                {selling ? 'Selling...' : 'Confirm Sale'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PortfolioTracker;
