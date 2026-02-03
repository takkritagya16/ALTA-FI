import { useState, useEffect } from 'react';
import { getMarketNews } from '../../services/stocks';

const MarketNews = () => {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState('general');

    const categories = [
        { id: 'general', label: 'Top Stories', icon: '🔥' },
        { id: 'forex', label: 'Forex', icon: '💱' },
        { id: 'crypto', label: 'Crypto', icon: '🪙' },
        { id: 'merger', label: 'M&A', icon: '🤝' },
    ];

    useEffect(() => {
        const fetchNews = async () => {
            setLoading(true);
            const result = await getMarketNews(category);
            if (result.success) {
                setNews(result.news);
            }
            setLoading(false);
        };

        fetchNews();
    }, [category]);

    // Sentiment analysis based on headline keywords
    const getSentiment = (headline) => {
        const lower = headline.toLowerCase();
        const bullish = ['surge', 'soar', 'jump', 'rally', 'gain', 'rise', 'record', 'beat', 'profit', 'bull', 'growth', 'boom', 'breakthrough'];
        const bearish = ['plunge', 'crash', 'drop', 'fall', 'slide', 'loss', 'miss', 'warning', 'cut', 'bear', 'fear', 'crisis', 'decline'];

        if (bullish.some(w => lower.includes(w))) return 'bullish';
        if (bearish.some(w => lower.includes(w))) return 'bearish';
        return 'neutral';
    };

    const formatDate = (date) => {
        if (!date) return '';
        const now = new Date();
        const diff = now - new Date(date);
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));

        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (hours < 48) return 'Yesterday';
        return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const featuredNews = news[0];
    const otherNews = news.slice(1);

    return (
        <div className="space-y-6">
            {/* Header with Category Filters */}
            <div className="bg-white p-4 rounded-2xl shadow-lg border border-gray-100 sticky top-0 z-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold text-gray-800">📰 Market Pulse</h2>
                        {loading && (
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-600 border-t-transparent"></div>
                        )}
                    </div>

                    {/* Category Tabs */}
                    <div className="flex flex-wrap gap-2">
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setCategory(cat.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all transform ${category === cat.id
                                        ? 'bg-indigo-600 text-white shadow-lg scale-105'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-102'
                                    }`}
                            >
                                <span>{cat.icon}</span>
                                <span className="hidden sm:inline">{cat.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Loading State */}
            {loading ? (
                <div className="space-y-6">
                    {/* Skeleton for featured */}
                    <div className="h-[400px] bg-gradient-to-br from-gray-200 to-gray-300 rounded-3xl animate-pulse"></div>
                    {/* Skeleton grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-80 bg-gray-200 rounded-2xl animate-pulse"></div>
                        ))}
                    </div>
                </div>
            ) : news.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl shadow-lg border border-gray-100 text-center">
                    <div className="text-6xl mb-4">📭</div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No news available</h3>
                    <p className="text-gray-500">Check back later for updates</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Featured/Hero Story */}
                    {featuredNews && (
                        <a
                            href={featuredNews.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block group relative rounded-3xl overflow-hidden shadow-2xl h-[400px] hover:shadow-3xl transition-all duration-500"
                        >
                            {/* Background Image */}
                            <div className="absolute inset-0">
                                {featuredNews.image ? (
                                    <img
                                        src={featuredNews.image}
                                        alt={featuredNews.headline}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                        onError={(e) => {
                                            e.target.src = '';
                                            e.target.parentElement.classList.add('bg-gradient-to-br', 'from-indigo-900', 'to-purple-900');
                                        }}
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-indigo-900 to-purple-900"></div>
                                )}
                                {/* Gradient overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
                            </div>

                            {/* Content */}
                            <div className="absolute bottom-0 left-0 right-0 p-8">
                                <div className="flex items-center gap-3 mb-4">
                                    {/* Breaking badge */}
                                    <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider animate-pulse shadow-lg">
                                        🔴 Breaking
                                    </span>
                                    {/* Sentiment badge */}
                                    {getSentiment(featuredNews.headline) === 'bullish' && (
                                        <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                                            🚀 Bullish
                                        </span>
                                    )}
                                    {getSentiment(featuredNews.headline) === 'bearish' && (
                                        <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                                            🔻 Bearish
                                        </span>
                                    )}
                                    <span className="text-gray-300 text-sm">
                                        {formatDate(featuredNews.datetime)} • {featuredNews.source}
                                    </span>
                                </div>

                                <h1 className="text-2xl md:text-4xl font-bold text-white mb-3 leading-tight group-hover:text-indigo-200 transition-colors max-w-4xl">
                                    {featuredNews.headline}
                                </h1>

                                <p className="text-gray-200 text-lg line-clamp-2 max-w-3xl mb-4">
                                    {featuredNews.summary}
                                </p>

                                <div className="flex items-center gap-2 text-indigo-300 font-medium">
                                    <span>Read full story</span>
                                    <svg className="w-5 h-5 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </div>
                            </div>
                        </a>
                    )}

                    {/* News Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {otherNews.map((item, index) => {
                            const sentiment = getSentiment(item.headline);

                            return (
                                <a
                                    key={item.id || index}
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group flex flex-col"
                                >
                                    {/* Image with sentiment overlay */}
                                    <div className="h-48 overflow-hidden relative">
                                        {item.image ? (
                                            <img
                                                src={item.image}
                                                alt={item.headline}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                                <span className="text-6xl opacity-30">📰</span>
                                            </div>
                                        )}

                                        {/* Sentiment Badge */}
                                        {sentiment !== 'neutral' && (
                                            <div className="absolute top-3 left-3">
                                                {sentiment === 'bullish' && (
                                                    <span className="bg-green-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-xs font-bold shadow-lg flex items-center gap-1">
                                                        🚀 Bullish
                                                    </span>
                                                )}
                                                {sentiment === 'bearish' && (
                                                    <span className="bg-red-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-xs font-bold shadow-lg flex items-center gap-1">
                                                        🔻 Bearish
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-5 flex flex-col flex-1">
                                        {/* Source & Date */}
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg uppercase tracking-wide">
                                                {item.source}
                                            </span>
                                            <span className="text-xs text-gray-400 font-medium">
                                                {formatDate(item.datetime)}
                                            </span>
                                        </div>

                                        {/* Headline */}
                                        <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors text-lg leading-snug flex-grow">
                                            {item.headline}
                                        </h3>

                                        {/* Summary */}
                                        <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                                            {item.summary}
                                        </p>

                                        {/* Read More */}
                                        <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                                            <span className="text-xs text-gray-400">Read full story</span>
                                            <span className="w-8 h-8 rounded-full bg-gray-50 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-all duration-300">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                </svg>
                                            </span>
                                        </div>
                                    </div>
                                </a>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Market Insights Section */}
            <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 p-8 rounded-3xl text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>

                <h3 className="text-xl font-bold mb-6 relative z-10">💡 Quick Market Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                    <div className="bg-white/10 p-5 rounded-2xl backdrop-blur-sm border border-white/10 hover:bg-white/20 transition-colors">
                        <div className="flex items-center gap-3 mb-3">
                            <span className="text-3xl">🇺🇸</span>
                            <span className="font-semibold text-lg">US Markets</span>
                        </div>
                        <p className="text-indigo-100">
                            NYSE & NASDAQ<br />
                            <span className="font-mono font-bold">9:30 AM - 4:00 PM EST</span>
                        </p>
                    </div>
                    <div className="bg-white/10 p-5 rounded-2xl backdrop-blur-sm border border-white/10 hover:bg-white/20 transition-colors">
                        <div className="flex items-center gap-3 mb-3">
                            <span className="text-3xl">🇮🇳</span>
                            <span className="font-semibold text-lg">Indian Markets</span>
                        </div>
                        <p className="text-indigo-100">
                            NSE & BSE<br />
                            <span className="font-mono font-bold">9:15 AM - 3:30 PM IST</span>
                        </p>
                    </div>
                    <div className="bg-white/10 p-5 rounded-2xl backdrop-blur-sm border border-white/10 hover:bg-white/20 transition-colors">
                        <div className="flex items-center gap-3 mb-3">
                            <span className="text-3xl">🌍</span>
                            <span className="font-semibold text-lg">Crypto</span>
                        </div>
                        <p className="text-indigo-100">
                            Global Markets<br />
                            <span className="font-mono font-bold">24/7 Never Stops!</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MarketNews;
