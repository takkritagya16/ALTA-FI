import {
    collection,
    addDoc,
    deleteDoc,
    updateDoc,
    getDocs,
    query,
    where,
    doc,
    serverTimestamp,
    setDoc,
    getDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';

const WATCHLIST_COLLECTION = 'watchlists';
const PORTFOLIO_COLLECTION = 'portfolios';
const HOLDINGS_COLLECTION = 'holdings';

// ==================== WATCHLIST ====================

/**
 * Get user's watchlist
 */
export const getWatchlist = async (userId) => {
    try {
        const q = query(
            collection(db, WATCHLIST_COLLECTION),
            where('userId', '==', userId)
        );
        const querySnapshot = await getDocs(q);

        const watchlist = [];
        querySnapshot.forEach((docSnap) => {
            watchlist.push({ id: docSnap.id, ...docSnap.data() });
        });

        return { success: true, watchlist };
    } catch (error) {
        console.error('Error getting watchlist:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Add stock to watchlist
 */
export const addToWatchlist = async (userId, stockData) => {
    try {
        // Check if already in watchlist
        const existing = await getWatchlist(userId);
        if (existing.success) {
            const alreadyExists = existing.watchlist.find(
                item => item.symbol === stockData.symbol
            );
            if (alreadyExists) {
                return { success: false, error: 'Stock already in watchlist' };
            }
        }

        const docRef = await addDoc(collection(db, WATCHLIST_COLLECTION), {
            userId,
            symbol: stockData.symbol,
            name: stockData.name || stockData.symbol,
            addedAt: serverTimestamp(),
            alertPrice: stockData.alertPrice || null,
            notes: stockData.notes || ''
        });

        return { success: true, id: docRef.id };
    } catch (error) {
        console.error('Error adding to watchlist:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Remove stock from watchlist
 */
export const removeFromWatchlist = async (watchlistItemId) => {
    try {
        await deleteDoc(doc(db, WATCHLIST_COLLECTION, watchlistItemId));
        return { success: true };
    } catch (error) {
        console.error('Error removing from watchlist:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Update watchlist item (alert price, notes)
 */
export const updateWatchlistItem = async (watchlistItemId, updates) => {
    try {
        const docRef = doc(db, WATCHLIST_COLLECTION, watchlistItemId);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error('Error updating watchlist item:', error);
        return { success: false, error: error.message };
    }
};

// ==================== PORTFOLIO ====================

/**
 * Get user's portfolio holdings
 */
export const getPortfolio = async (userId) => {
    try {
        const q = query(
            collection(db, HOLDINGS_COLLECTION),
            where('userId', '==', userId)
        );
        const querySnapshot = await getDocs(q);

        const holdings = [];
        querySnapshot.forEach((docSnap) => {
            holdings.push({ id: docSnap.id, ...docSnap.data() });
        });

        return { success: true, holdings };
    } catch (error) {
        console.error('Error getting portfolio:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Add a new holding to portfolio
 */
export const addHolding = async (userId, holdingData) => {
    try {
        // Check if already have this stock
        const existing = await getPortfolio(userId);
        if (existing.success) {
            const existingHolding = existing.holdings.find(
                h => h.symbol === holdingData.symbol
            );
            if (existingHolding) {
                // Update existing holding with new average price
                const totalShares = existingHolding.quantity + holdingData.quantity;
                const totalCost = (existingHolding.avgPrice * existingHolding.quantity) +
                    (holdingData.buyPrice * holdingData.quantity);
                const newAvgPrice = totalCost / totalShares;

                return await updateHolding(existingHolding.id, {
                    quantity: totalShares,
                    avgPrice: newAvgPrice
                });
            }
        }

        const docRef = await addDoc(collection(db, HOLDINGS_COLLECTION), {
            userId,
            symbol: holdingData.symbol,
            name: holdingData.name || holdingData.symbol,
            quantity: holdingData.quantity,
            avgPrice: holdingData.buyPrice,
            buyDate: holdingData.buyDate || new Date(),
            createdAt: serverTimestamp(),
            notes: holdingData.notes || ''
        });

        return { success: true, id: docRef.id };
    } catch (error) {
        console.error('Error adding holding:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Update a holding
 */
export const updateHolding = async (holdingId, updates) => {
    try {
        const docRef = doc(db, HOLDINGS_COLLECTION, holdingId);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error('Error updating holding:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Sell shares (reduce or remove holding)
 */
export const sellHolding = async (holdingId, quantityToSell, sellPrice) => {
    try {
        const docRef = doc(db, HOLDINGS_COLLECTION, holdingId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return { success: false, error: 'Holding not found' };
        }

        const holding = docSnap.data();
        const remainingQuantity = holding.quantity - quantityToSell;

        if (remainingQuantity <= 0) {
            // Sell all - delete the holding
            await deleteDoc(docRef);
            return {
                success: true,
                soldAll: true,
                profit: (sellPrice - holding.avgPrice) * quantityToSell
            };
        } else {
            // Partial sell
            await updateDoc(docRef, {
                quantity: remainingQuantity,
                updatedAt: serverTimestamp()
            });
            return {
                success: true,
                soldAll: false,
                remainingQuantity,
                profit: (sellPrice - holding.avgPrice) * quantityToSell
            };
        }
    } catch (error) {
        console.error('Error selling holding:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Delete a holding completely
 */
export const deleteHolding = async (holdingId) => {
    try {
        await deleteDoc(doc(db, HOLDINGS_COLLECTION, holdingId));
        return { success: true };
    } catch (error) {
        console.error('Error deleting holding:', error);
        return { success: false, error: error.message };
    }
};

// ==================== PORTFOLIO SUMMARY ====================

/**
 * Get or create portfolio summary document
 */
export const getPortfolioSummary = async (userId) => {
    try {
        const docRef = doc(db, PORTFOLIO_COLLECTION, userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { success: true, summary: docSnap.data() };
        }

        // Create default summary
        const defaultSummary = {
            totalInvested: 0,
            lastUpdated: null
        };

        await setDoc(docRef, defaultSummary);
        return { success: true, summary: defaultSummary };
    } catch (error) {
        console.error('Error getting portfolio summary:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Update portfolio summary
 */
export const updatePortfolioSummary = async (userId, summaryData) => {
    try {
        const docRef = doc(db, PORTFOLIO_COLLECTION, userId);
        await setDoc(docRef, {
            ...summaryData,
            lastUpdated: serverTimestamp()
        }, { merge: true });
        return { success: true };
    } catch (error) {
        console.error('Error updating portfolio summary:', error);
        return { success: false, error: error.message };
    }
};

export default {
    getWatchlist,
    addToWatchlist,
    removeFromWatchlist,
    updateWatchlistItem,
    getPortfolio,
    addHolding,
    updateHolding,
    sellHolding,
    deleteHolding,
    getPortfolioSummary,
    updatePortfolioSummary
};
