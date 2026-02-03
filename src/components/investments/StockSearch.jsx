import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { searchStocks, getStockQuote, POPULAR_STOCKS } from '../../services/stocks';
import { addToWatchlist, addHolding } from '../../services/portfolio';

const StockSearch = ({ onAddToWatchlist, onAddToPortfolio }) => {
    const { currentUser } = useAuth();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [selectedStock, setSelectedStock] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [addType, setAddType] = useState('watchlist'); // 'watchlist' or 'portfolio'

    // Portfolio add form state
    const [quantity, setQuantity] = useState('');
    const [buyPrice, setBuyPrice] = useState('');
    const [adding, setAdding] = useState(false);

    const handleSearch = async () => {
        if (!query.trim()) return;

        setSearching(true);
        const result = await searchStocks(query);
        if (result.success) {
            setResults(result.results);
        }
        setSearching(false);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const handleSelectStock = async (stock) => {
        setSelectedStock(stock);

        // Fetch current price
        const quoteResult = await getStockQuote(stock.symbol);
        if (quoteResult.success) {
            setBuyPrice(quoteResult.quote.price.toFixed(2));
        }

        setShowAddModal(true);
    };

    const handleAddToWatchlist = async () => {
        if (!selectedStock || !currentUser) return;

        setAdding(true);
        const result = await addToWatchlist(currentUser.uid, {
            symbol: selectedStock.symbol,
            name: selectedStock.name
        });

        if (result.success) {
            onAddToWatchlist?.(selectedStock);
            setShowAddModal(false);
            setSelectedStock(null);
            setResults([]);
            setQuery('');
        } else {
            alert(result.error || 'Failed to add to watchlist');
        }
        setAdding(false);
    };

    const handleAddToPortfolio = async () => {
        if (!selectedStock || !currentUser || !quantity || !buyPrice) return;

        setAdding(true);
        const result = await addHolding(currentUser.uid, {
            symbol: selectedStock.symbol,
            name: selectedStock.name,
            quantity: parseFloat(quantity),
            buyPrice: parseFloat(buyPrice)
        });

        if (result.success) {
            onAddToPortfolio?.(selectedStock);
            setShowAddModal(false);
            setSelectedStock(null);
            setResults([]);
            setQuery('');
            setQuantity('');
            setBuyPrice('');
        } else {
            alert(result.error || 'Failed to add to portfolio');
        }
        setAdding(false);
    };

    const handleQuickAdd = async (stock) => {
        setSelectedStock(stock);
        const quoteResult = await getStockQuote(stock.symbol);
        if (quoteResult.success) {
            setBuyPrice(quoteResult.quote.price.toFixed(2));
        }
        setShowAddModal(true);
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">🔍 Search Stocks</h3>

            {/* Search Input */}
            <div className="flex gap-2 mb-4">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Search by symbol or company name..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <button
                    onClick={handleSearch}
                    disabled={searching}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                    {searching ? (
                        <span className="animate-spin inline-block">⏳</span>
                    ) : (
                        '🔍'
                    )}
                </button>
            </div>

            {/* Search Results */}
            {results.length > 0 && (
                <div className="mb-4 max-h-48 overflow-y-auto border border-gray-200 rounded-xl">
                    {results.map((stock) => (
                        <button
                            key={stock.symbol}
                            onClick={() => handleSelectStock(stock)}
                            className="w-full flex items-center justify-between p-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors text-left"
                        >
                            <div>
                                <p className="font-bold text-gray-800">{stock.symbol}</p>
                                <p className="text-sm text-gray-500 truncate max-w-[200px]">{stock.name}</p>
                            </div>
                            <span className="text-indigo-600 text-sm">+ Add</span>
                        </button>
                    ))}
                </div>
            )}

            {/* Popular Stocks */}
            <div>
                <p className="text-sm text-gray-500 mb-2">Popular Stocks</p>
                <div className="flex flex-wrap gap-2">
                    {POPULAR_STOCKS.slice(0, 6).map((stock) => (
                        <button
                            key={stock.symbol}
                            onClick={() => handleQuickAdd(stock)}
                            className="px-3 py-1.5 bg-gray-100 hover:bg-indigo-100 text-gray-700 hover:text-indigo-700 rounded-lg text-sm font-medium transition-colors"
                        >
                            {stock.symbol}
                        </button>
                    ))}
                </div>
            </div>

            {/* Add Stock Modal */}
            {showAddModal && selectedStock && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-800">
                                Add {selectedStock.symbol}
                            </h3>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>

                        <p className="text-gray-600 mb-4">{selectedStock.name}</p>

                        {/* Toggle between watchlist and portfolio */}
                        <div className="flex gap-2 mb-4">
                            <button
                                onClick={() => setAddType('watchlist')}
                                className={`flex-1 py-2 rounded-xl font-medium transition-colors ${addType === 'watchlist'
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                👁️ Watchlist
                            </button>
                            <button
                                onClick={() => setAddType('portfolio')}
                                className={`flex-1 py-2 rounded-xl font-medium transition-colors ${addType === 'portfolio'
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                💼 Portfolio
                            </button>
                        </div>

                        {addType === 'portfolio' && (
                            <div className="space-y-3 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Number of Shares
                                    </label>
                                    <input
                                        type="number"
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                        placeholder="e.g., 10"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                                        min="0.001"
                                        step="0.001"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Buy Price ($)
                                    </label>
                                    <input
                                        type="number"
                                        value={buyPrice}
                                        onChange={(e) => setBuyPrice(e.target.value)}
                                        placeholder="e.g., 150.00"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                                        min="0.01"
                                        step="0.01"
                                    />
                                </div>
                                {quantity && buyPrice && (
                                    <p className="text-sm text-gray-600">
                                        Total Investment: <span className="font-bold">${(parseFloat(quantity) * parseFloat(buyPrice)).toFixed(2)}</span>
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={addType === 'watchlist' ? handleAddToWatchlist : handleAddToPortfolio}
                                disabled={adding || (addType === 'portfolio' && (!quantity || !buyPrice))}
                                className="flex-1 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
                            >
                                {adding ? 'Adding...' : `Add to ${addType === 'watchlist' ? 'Watchlist' : 'Portfolio'}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StockSearch;
