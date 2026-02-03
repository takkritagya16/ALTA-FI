/**
 * Stock Market API Service
 * Uses Finnhub for real-time stock data (free tier)
 * https://finnhub.io/
 */

// Finnhub free API key - users can replace with their own
const FINNHUB_API_KEY = 'd60q3o1r01qto1re13p0d60q3o1r01qto1re13pg'; // Replace with actual key from https://finnhub.io/register
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

// Alpha Vantage as backup
const ALPHA_VANTAGE_API_KEY = 'demo';
const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';

/**
 * Fetch real-time quote for a stock symbol
 */
export const getStockQuote = async (symbol) => {
    try {
        const response = await fetch(
            `${FINNHUB_BASE_URL}/quote?symbol=${symbol.toUpperCase()}&token=${FINNHUB_API_KEY}`
        );

        if (!response.ok) {
            throw new Error('Failed to fetch stock quote');
        }

        const data = await response.json();

        // Finnhub returns: c (current), d (change), dp (percent change), h (high), l (low), o (open), pc (previous close)
        if (data.c === 0 && data.h === 0) {
            return { success: false, error: 'Symbol not found or market closed' };
        }

        return {
            success: true,
            quote: {
                symbol: symbol.toUpperCase(),
                price: data.c,
                change: data.d,
                changePercent: data.dp,
                high: data.h,
                low: data.l,
                open: data.o,
                previousClose: data.pc,
                timestamp: new Date()
            }
        };
    } catch (error) {
        console.error('Error fetching stock quote:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Search for stock symbols
 */
export const searchStocks = async (query) => {
    try {
        const response = await fetch(
            `${FINNHUB_BASE_URL}/search?q=${encodeURIComponent(query)}&token=${FINNHUB_API_KEY}`
        );

        if (!response.ok) {
            throw new Error('Failed to search stocks');
        }

        const data = await response.json();

        // Filter for stocks only (not crypto, forex, etc.)
        const stocks = (data.result || [])
            .filter(item => item.type === 'Common Stock' || item.type === 'ADR')
            .slice(0, 10)
            .map(item => ({
                symbol: item.symbol,
                name: item.description,
                type: item.type
            }));

        return { success: true, results: stocks };
    } catch (error) {
        console.error('Error searching stocks:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Fetch company profile/info
 */
export const getCompanyProfile = async (symbol) => {
    try {
        const response = await fetch(
            `${FINNHUB_BASE_URL}/stock/profile2?symbol=${symbol.toUpperCase()}&token=${FINNHUB_API_KEY}`
        );

        if (!response.ok) {
            throw new Error('Failed to fetch company profile');
        }

        const data = await response.json();

        if (!data.name) {
            return { success: false, error: 'Company not found' };
        }

        return {
            success: true,
            profile: {
                symbol: symbol.toUpperCase(),
                name: data.name,
                logo: data.logo,
                industry: data.finnhubIndustry,
                country: data.country,
                exchange: data.exchange,
                marketCap: data.marketCapitalization,
                website: data.weburl
            }
        };
    } catch (error) {
        console.error('Error fetching company profile:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Fetch market news
 */
export const getMarketNews = async (category = 'general') => {
    try {
        const response = await fetch(
            `${FINNHUB_BASE_URL}/news?category=${category}&token=${FINNHUB_API_KEY}`
        );

        if (!response.ok) {
            throw new Error('Failed to fetch market news');
        }

        const data = await response.json();

        return {
            success: true,
            news: data.slice(0, 20).map(item => ({
                id: item.id,
                headline: item.headline,
                summary: item.summary,
                source: item.source,
                url: item.url,
                image: item.image,
                datetime: new Date(item.datetime * 1000)
            }))
        };
    } catch (error) {
        console.error('Error fetching market news:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Fetch multiple stock quotes at once
 */
export const getMultipleQuotes = async (symbols) => {
    const results = {};

    // Fetch quotes in parallel but with rate limiting consideration
    const promises = symbols.map(async (symbol, index) => {
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, index * 100));
        const result = await getStockQuote(symbol);
        if (result.success) {
            results[symbol] = result.quote;
        }
    });

    await Promise.all(promises);
    return results;
};

/**
 * Calculate portfolio value and performance
 */
export const calculatePortfolioMetrics = (holdings, quotes) => {
    let totalValue = 0;
    let totalCost = 0;
    let todayChange = 0;

    const holdingsWithMetrics = holdings.map(holding => {
        const quote = quotes[holding.symbol];
        if (!quote) {
            return {
                ...holding,
                currentPrice: 0,
                currentValue: 0,
                gain: 0,
                gainPercent: 0,
                todayChange: 0,
                todayChangePercent: 0
            };
        }

        const currentPrice = quote.price;
        const currentValue = currentPrice * holding.quantity;
        const costBasis = holding.avgPrice * holding.quantity;
        const gain = currentValue - costBasis;
        const gainPercent = costBasis > 0 ? (gain / costBasis) * 100 : 0;
        const dayChange = quote.change * holding.quantity;

        totalValue += currentValue;
        totalCost += costBasis;
        todayChange += dayChange;

        return {
            ...holding,
            currentPrice,
            currentValue,
            gain,
            gainPercent,
            todayChange: dayChange,
            todayChangePercent: quote.changePercent
        };
    });

    const totalGain = totalValue - totalCost;
    const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;
    const todayChangePercent = totalValue > 0 ? (todayChange / (totalValue - todayChange)) * 100 : 0;

    return {
        holdings: holdingsWithMetrics,
        summary: {
            totalValue,
            totalCost,
            totalGain,
            totalGainPercent,
            todayChange,
            todayChangePercent
        }
    };
};

// Popular stock symbols for quick add
export const POPULAR_STOCKS = [
    { symbol: 'AAPL', name: 'Apple Inc.' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.' },
    { symbol: 'MSFT', name: 'Microsoft Corporation' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.' },
    { symbol: 'TSLA', name: 'Tesla Inc.' },
    { symbol: 'META', name: 'Meta Platforms Inc.' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation' },
    { symbol: 'JPM', name: 'JPMorgan Chase & Co.' },
    { symbol: 'V', name: 'Visa Inc.' },
    { symbol: 'WMT', name: 'Walmart Inc.' }
];

// Indian stocks (NSE) - Note: Finnhub requires different format
export const POPULAR_INDIAN_STOCKS = [
    { symbol: 'RELIANCE.NS', name: 'Reliance Industries' },
    { symbol: 'TCS.NS', name: 'Tata Consultancy Services' },
    { symbol: 'INFY.NS', name: 'Infosys Limited' },
    { symbol: 'HDFCBANK.NS', name: 'HDFC Bank' },
    { symbol: 'ICICIBANK.NS', name: 'ICICI Bank' },
    { symbol: 'WIPRO.NS', name: 'Wipro Limited' },
    { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel' },
    { symbol: 'ITC.NS', name: 'ITC Limited' },
    { symbol: 'SBIN.NS', name: 'State Bank of India' },
    { symbol: 'TATAMOTORS.NS', name: 'Tata Motors' }
];

export default {
    getStockQuote,
    searchStocks,
    getCompanyProfile,
    getMarketNews,
    getMultipleQuotes,
    calculatePortfolioMetrics,
    POPULAR_STOCKS,
    POPULAR_INDIAN_STOCKS
};
