import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { removeFromWatchlist, updateWatchlistItem, addToWatchlist } from '../../services/portfolio';
import { POPULAR_STOCKS } from '../../services/stocks';

const StockWatchlist = ({ watchlist, quotes, onUpdate }) => {
    const { currentUser } = useAuth();
    const [editingId, setEditingId] = useState(null);
    const [alertPrice, setAlertPrice] = useState('');
    const [notes, setNotes] = useState('');
    const [removing, setRemoving] = useState(null);

    const handleRemove = async (id) => {
        setRemoving(id);
        const result = await removeFromWatchlist(id);
        if (result.success) {
            onUpdate?.();
        }
        setRemoving(null);
    };

    const handleEdit = (item) => {
        setEditingId(item.id);
        setAlertPrice(item.alertPrice || '');
        setNotes(item.notes || '');
    };

    const handleSaveEdit = async () => {
        if (!editingId) return;

        await updateWatchlistItem(editingId, {
            alertPrice: alertPrice ? parseFloat(alertPrice) : null,
            notes
        });

        setEditingId(null);
        onUpdate?.();
    };

    const handleQuickAdd = async (stock) => {
        if (!currentUser) return;
        await addToWatchlist(currentUser.uid, stock);
        onUpdate?.();
    };

    const sortedWatchlist = [...watchlist].sort((a, b) => {
        const quoteA = quotes[a.symbol];
        const quoteB = quotes[b.symbol];
        const changeA = quoteA?.changePercent || 0;
        const changeB = quoteB?.changePercent || 0;
        return changeB - changeA;
    });

    return (
        <div className="space-y-6">
            {/* Watchlist Header */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-800">👁️ Stock Watchlist</h2>
                    <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium">
                        {watchlist.length} stocks
                    </span>
                </div>

                {watchlist.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">📊</div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Your watchlist is empty</h3>
                        <p className="text-gray-500 mb-6">Add stocks to track their prices and performance</p>

                        {/* Quick Add Popular Stocks */}
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
                    <div className="space-y-3">
                        {sortedWatchlist.map((item) => {
                            const quote = quotes[item.symbol];
                            const isUp = quote?.changePercent >= 0;
                            const isEditing = editingId === item.id;

                            return (
                                <div
                                    key={item.id}
                                    className={`p-4 rounded-xl border-2 transition-all ${isEditing
                                            ? 'border-indigo-300 bg-indigo-50'
                                            : 'border-gray-100 hover:border-gray-200 bg-gradient-to-r from-gray-50 to-white'
                                        }`}
                                >
                                    {isEditing ? (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-4">
                                                <span className="font-bold text-lg">{item.symbol}</span>
                                                <span className="text-gray-500">{item.name}</span>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-sm text-gray-600 mb-1">Price Alert ($)</label>
                                                    <input
                                                        type="number"
                                                        value={alertPrice}
                                                        onChange={(e) => setAlertPrice(e.target.value)}
                                                        placeholder="e.g., 150.00"
                                                        className="w-full px-3 py-2 border rounded-lg"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm text-gray-600 mb-1">Notes</label>
                                                    <input
                                                        type="text"
                                                        value={notes}
                                                        onChange={(e) => setNotes(e.target.value)}
                                                        placeholder="Add a note..."
                                                        className="w-full px-3 py-2 border rounded-lg"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={handleSaveEdit}
                                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={() => setEditingId(null)}
                                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold">
                                                    {item.symbol.slice(0, 2)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-800 text-lg">{item.symbol}</p>
                                                    <p className="text-sm text-gray-500 truncate max-w-[200px]">{item.name}</p>
                                                    {item.notes && (
                                                        <p className="text-xs text-gray-400 mt-1">📝 {item.notes}</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6">
                                                {/* Price Info */}
                                                <div className="text-right">
                                                    <p className="text-xl font-bold text-gray-800">
                                                        ${quote?.price?.toFixed(2) || '--'}
                                                    </p>
                                                    <div className={`flex items-center justify-end gap-1 ${isUp ? 'text-green-600' : 'text-red-600'}`}>
                                                        <span className="text-lg">{isUp ? '▲' : '▼'}</span>
                                                        <span className="font-medium">
                                                            ${Math.abs(quote?.change || 0).toFixed(2)}
                                                            ({Math.abs(quote?.changePercent || 0).toFixed(2)}%)
                                                        </span>
                                                    </div>
                                                    {item.alertPrice && (
                                                        <p className="text-xs text-gray-400 mt-1">
                                                            🔔 Alert at ${item.alertPrice}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleEdit(item)}
                                                        className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        onClick={() => handleRemove(item.id)}
                                                        disabled={removing === item.id}
                                                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                        title="Remove"
                                                    >
                                                        {removing === item.id ? '⏳' : '🗑️'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Market Movers Section */}
            {watchlist.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Top Gainers */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-6 rounded-2xl border border-green-200">
                        <h3 className="text-lg font-bold text-green-800 mb-4">📈 Top Gainers</h3>
                        <div className="space-y-3">
                            {sortedWatchlist
                                .filter(item => quotes[item.symbol]?.changePercent > 0)
                                .slice(0, 3)
                                .map((item) => {
                                    const quote = quotes[item.symbol];
                                    return (
                                        <div key={item.id} className="flex items-center justify-between bg-white/50 p-3 rounded-xl">
                                            <span className="font-bold text-green-800">{item.symbol}</span>
                                            <span className="text-green-600 font-medium">
                                                +{quote?.changePercent?.toFixed(2)}%
                                            </span>
                                        </div>
                                    );
                                })}
                            {sortedWatchlist.filter(item => quotes[item.symbol]?.changePercent > 0).length === 0 && (
                                <p className="text-green-600 text-sm">No gainers today</p>
                            )}
                        </div>
                    </div>

                    {/* Top Losers */}
                    <div className="bg-gradient-to-br from-red-50 to-rose-100 p-6 rounded-2xl border border-red-200">
                        <h3 className="text-lg font-bold text-red-800 mb-4">📉 Top Losers</h3>
                        <div className="space-y-3">
                            {sortedWatchlist
                                .filter(item => quotes[item.symbol]?.changePercent < 0)
                                .sort((a, b) => quotes[a.symbol]?.changePercent - quotes[b.symbol]?.changePercent)
                                .slice(0, 3)
                                .map((item) => {
                                    const quote = quotes[item.symbol];
                                    return (
                                        <div key={item.id} className="flex items-center justify-between bg-white/50 p-3 rounded-xl">
                                            <span className="font-bold text-red-800">{item.symbol}</span>
                                            <span className="text-red-600 font-medium">
                                                {quote?.changePercent?.toFixed(2)}%
                                            </span>
                                        </div>
                                    );
                                })}
                            {sortedWatchlist.filter(item => quotes[item.symbol]?.changePercent < 0).length === 0 && (
                                <p className="text-red-600 text-sm">No losers today</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StockWatchlist;
