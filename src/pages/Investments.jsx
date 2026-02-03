import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import StockWatchlist from '../components/investments/StockWatchlist';
import PortfolioTracker from '../components/investments/PortfolioTracker';
import StockSearch from '../components/investments/StockSearch';
import MarketNews from '../components/investments/MarketNews';
import PortfolioSummary from '../components/investments/PortfolioSummary';
import ZerodhaImporter from '../components/investments/ZerodhaImporter';
import { getWatchlist } from '../services/portfolio';
import { getPortfolio } from '../services/portfolio';
import { getMultipleQuotes, calculatePortfolioMetrics } from '../services/stocks';

const TABS = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'watchlist', label: 'Watchlist', icon: '👁️' },
    { id: 'portfolio', label: 'Portfolio', icon: '💼' },
    { id: 'import', label: 'Import', icon: '📥' },
    { id: 'news', label: 'Market News', icon: '📰' },
];

const Investments = () => {
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [watchlist, setWatchlist] = useState([]);
    const [holdings, setHoldings] = useState([]);
    const [quotes, setQuotes] = useState({});
    const [portfolioMetrics, setPortfolioMetrics] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    // Fetch all data
    const fetchData = useCallback(async () => {
        if (!currentUser) return;

        try {
            // Fetch watchlist and portfolio in parallel
            const [watchlistResult, portfolioResult] = await Promise.all([
                getWatchlist(currentUser.uid),
                getPortfolio(currentUser.uid)
            ]);

            if (watchlistResult.success) {
                setWatchlist(watchlistResult.watchlist);
            }

            if (portfolioResult.success) {
                setHoldings(portfolioResult.holdings);
            }

            // Get all unique symbols
            const allSymbols = [
                ...new Set([
                    ...(watchlistResult.watchlist || []).map(w => w.symbol),
                    ...(portfolioResult.holdings || []).map(h => h.symbol)
                ])
            ];

            // Fetch quotes for all symbols
            if (allSymbols.length > 0) {
                const quotesData = await getMultipleQuotes(allSymbols);
                setQuotes(quotesData);

                // Calculate portfolio metrics
                if (portfolioResult.holdings && portfolioResult.holdings.length > 0) {
                    const metrics = calculatePortfolioMetrics(portfolioResult.holdings, quotesData);
                    setPortfolioMetrics(metrics);
                }
            }
        } catch (error) {
            console.error('Error fetching investment data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [currentUser]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Refresh quotes periodically (every 30 seconds)
    useEffect(() => {
        const interval = setInterval(() => {
            if (!loading) {
                refreshQuotes();
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [loading, watchlist, holdings]);

    const refreshQuotes = async () => {
        setRefreshing(true);
        const allSymbols = [
            ...new Set([
                ...watchlist.map(w => w.symbol),
                ...holdings.map(h => h.symbol)
            ])
        ];

        if (allSymbols.length > 0) {
            const quotesData = await getMultipleQuotes(allSymbols);
            setQuotes(quotesData);

            if (holdings.length > 0) {
                const metrics = calculatePortfolioMetrics(holdings, quotesData);
                setPortfolioMetrics(metrics);
            }
        }
        setRefreshing(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent mb-4"></div>
                    <p className="text-gray-600">Loading investments...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Page Header */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-700 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">📈 Investments</h1>
                        <p className="text-indigo-100">
                            Track your portfolio and watch your favorite stocks.
                        </p>
                    </div>
                    <button
                        onClick={() => { setRefreshing(true); fetchData(); }}
                        disabled={refreshing}
                        className={`flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all ${refreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <svg className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        {refreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="bg-white p-2 rounded-xl shadow-md border border-gray-100">
                <div className="flex flex-wrap gap-2">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${activeTab === tab.id
                                ? 'bg-indigo-100 text-indigo-700 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <span>{tab.icon}</span>
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    {/* Portfolio Summary */}
                    <PortfolioSummary
                        metrics={portfolioMetrics}
                        holdingsCount={holdings.length}
                        watchlistCount={watchlist.length}
                    />

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Stock Search */}
                        <StockSearch
                            onAddToWatchlist={(stock) => {
                                fetchData();
                            }}
                            onAddToPortfolio={(stock) => {
                                fetchData();
                            }}
                        />

                        {/* Top Holdings */}
                        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">🏆 Top Holdings</h3>
                            {portfolioMetrics && portfolioMetrics.holdings.length > 0 ? (
                                <div className="space-y-3">
                                    {portfolioMetrics.holdings
                                        .sort((a, b) => b.currentValue - a.currentValue)
                                        .slice(0, 5)
                                        .map((holding) => (
                                            <div key={holding.symbol} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                                <div>
                                                    <p className="font-bold text-gray-800">{holding.symbol}</p>
                                                    <p className="text-sm text-gray-500">{holding.quantity} shares</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-gray-800">${holding.currentValue?.toFixed(2) || '0.00'}</p>
                                                    <p className={`text-sm font-medium ${holding.gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {holding.gain >= 0 ? '+' : ''}{holding.gainPercent?.toFixed(2) || '0.00'}%
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <p>No holdings yet.</p>
                                    <p className="text-sm mt-1">Add stocks to your portfolio to track them.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Watchlist Preview */}
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-800">👁️ Watchlist</h3>
                            <button
                                onClick={() => setActiveTab('watchlist')}
                                className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                            >
                                View All →
                            </button>
                        </div>
                        {watchlist.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                {watchlist.slice(0, 5).map((item) => {
                                    const quote = quotes[item.symbol];
                                    return (
                                        <div key={item.id} className="p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                                            <p className="font-bold text-gray-800">{item.symbol}</p>
                                            <p className="text-lg font-bold text-gray-900">
                                                ${quote?.price?.toFixed(2) || '--'}
                                            </p>
                                            {quote && (
                                                <p className={`text-sm font-medium ${quote.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {quote.changePercent >= 0 ? '▲' : '▼'} {Math.abs(quote.changePercent)?.toFixed(2) || '0.00'}%
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <p>Your watchlist is empty.</p>
                                <p className="text-sm mt-1">Search for stocks above to add them.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'watchlist' && (
                <StockWatchlist
                    watchlist={watchlist}
                    quotes={quotes}
                    onUpdate={fetchData}
                />
            )}

            {activeTab === 'portfolio' && (
                <PortfolioTracker
                    holdings={holdings}
                    quotes={quotes}
                    metrics={portfolioMetrics}
                    onUpdate={fetchData}
                />
            )}

            {activeTab === 'import' && (
                <ZerodhaImporter
                    onImportComplete={fetchData}
                    existingHoldings={holdings}
                />
            )}

            {activeTab === 'news' && (
                <MarketNews />
            )}
        </div>
    );
};

export default Investments;
