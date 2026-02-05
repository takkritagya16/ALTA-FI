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


    // Format currency in USD for US stocks (Finnhub)
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };


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
                    <div className="spinner w-12 h-12 border-4 border-primary-600 border-t-transparent mx-auto"></div>
                    <p className="mt-4 text-surface-600 font-medium">Loading investments...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
            {/* Page Header */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700 p-8 text-white shadow-xl shadow-primary-500/20">
                {/* Decorative elements */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-secondary-500/20 rounded-full blur-3xl"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl"></div>
                </div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-primary-100 text-sm font-medium mb-4">
                            <span className="w-2 h-2 rounded-full bg-success-400 animate-pulse"></span>
                            Live Market Data
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-display font-bold mb-2 flex items-center gap-3">
                            <span>📈</span> Investments
                        </h1>
                        <p className="text-primary-100 text-lg">
                            Track your portfolio and watch your favorite stocks.
                        </p>
                    </div>
                    <button
                        onClick={() => { setRefreshing(true); fetchData(); }}
                        disabled={refreshing}
                        className={`inline-flex items-center gap-2 px-5 py-3 bg-white/15 hover:bg-white/25 rounded-xl font-semibold transition-all backdrop-blur-sm border border-white/20 ${refreshing ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-0.5'}`}
                    >
                        <svg className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        {refreshing ? 'Refreshing...' : 'Refresh Data'}
                    </button>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="card p-2">
                <div className="flex flex-wrap gap-2">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${activeTab === tab.id
                                ? 'bg-primary-100 text-primary-700 shadow-sm'
                                : 'text-surface-500 hover:text-surface-700 hover:bg-surface-100'
                                }`}
                        >
                            <span className="text-lg">{tab.icon}</span>
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
                        <div className="card p-6">
                            <h3 className="text-lg font-display font-bold text-surface-900 mb-5 flex items-center gap-2">
                                <span className="text-xl">🏆</span> Top Holdings
                            </h3>
                            {portfolioMetrics && portfolioMetrics.holdings.length > 0 ? (
                                <div className="space-y-3">
                                    {portfolioMetrics.holdings
                                        .sort((a, b) => b.currentValue - a.currentValue)
                                        .slice(0, 5)
                                        .map((holding, index) => (
                                            <div
                                                key={holding.symbol}
                                                className="flex items-center justify-between p-4 bg-surface-50 rounded-xl hover:bg-surface-100 transition-all animate-fade-in"
                                                style={{ animationDelay: `${index * 0.05}s` }}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                                                        <span className="font-bold text-primary-700 text-sm">{holding.symbol.slice(0, 2)}</span>
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-surface-900">{holding.symbol}</p>
                                                        <p className="text-sm text-surface-500">{holding.quantity} shares</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-surface-900">{formatCurrency(holding.currentValue || 0)}</p>
                                                    <p className={`text-sm font-medium ${holding.gain >= 0 ? 'money-positive' : 'money-negative'}`}>
                                                        {holding.gain >= 0 ? '+' : ''}{holding.gainPercent?.toFixed(2) || '0.00'}%
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            ) : (
                                <div className="empty-state py-8">
                                    <svg className="w-16 h-16 text-surface-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                    <p className="text-surface-600 font-medium">No holdings yet</p>
                                    <p className="text-sm text-surface-500 mt-1">Add stocks to your portfolio to track them.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Watchlist Preview */}
                    <div className="card p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg font-display font-bold text-surface-900 flex items-center gap-2">
                                <span className="text-xl">👁️</span> Watchlist
                            </h3>
                            <button
                                onClick={() => setActiveTab('watchlist')}
                                className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1 group"
                            >
                                View All
                                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                        {watchlist.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {watchlist.slice(0, 5).map((item, index) => {
                                    const quote = quotes[item.symbol];
                                    return (
                                        <div
                                            key={item.id}
                                            className="p-4 bg-gradient-to-br from-surface-50 to-surface-100 rounded-xl border border-surface-200 hover:border-primary-300 hover:shadow-md transition-all animate-fade-in"
                                            style={{ animationDelay: `${index * 0.05}s` }}
                                        >
                                            <p className="font-bold text-surface-900">{item.symbol}</p>
                                            <p className="text-xl font-display font-bold text-surface-900 mt-1">
                                                {quote?.price ? formatCurrency(quote.price) : '--'}
                                            </p>
                                            {quote && (
                                                <p className={`text-sm font-semibold mt-1 flex items-center gap-1 ${quote.changePercent >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                                                    <span>{quote.changePercent >= 0 ? '▲' : '▼'}</span>
                                                    {Math.abs(quote.changePercent)?.toFixed(2) || '0.00'}%
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="empty-state py-8">
                                <svg className="w-16 h-16 text-surface-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                <p className="text-surface-600 font-medium">Your watchlist is empty</p>
                                <p className="text-sm text-surface-500 mt-1">Search for stocks above to add them.</p>
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
