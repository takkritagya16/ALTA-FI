import {
    collection,
    addDoc,
    deleteDoc,
    updateDoc,
    getDocs,
    query,
    where,
    orderBy,
    doc,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { applyRules, getRules } from './rules';

const COLLECTION_NAME = 'transactions';

// Add a transaction
export const addTransaction = async (userId, data) => {
    console.log('💾 Adding transaction for userId:', userId, 'Data:', data);

    try {
        let transactionData = { ...data, userId };

        // Auto-categorize if needed
        if (!transactionData.category || !transactionData.type) {
            const rulesResult = await getRules(userId);
            if (rulesResult.success) {
                const suggestion = applyRules(rulesResult.rules, transactionData.source);
                if (suggestion) {
                    if (!transactionData.type) transactionData.type = suggestion.type;
                    if (!transactionData.category) transactionData.category = suggestion.category;
                    transactionData.autoCategorized = true;
                }
            }
        }

        transactionData.createdAt = serverTimestamp();
        transactionData.amount = parseFloat(transactionData.amount);

        // Convert date to Firestore Timestamp for proper indexing/sorting
        if (transactionData.date instanceof Date) {
            transactionData.date = Timestamp.fromDate(transactionData.date);
        } else if (typeof transactionData.date === 'string') {
            transactionData.date = Timestamp.fromDate(new Date(transactionData.date));
        }

        console.log('📝 Final transaction data to save:', transactionData);

        const docRef = await addDoc(collection(db, COLLECTION_NAME), transactionData);
        console.log('✅ Transaction saved with ID:', docRef.id);
        return { success: true, id: docRef.id, ...transactionData };
    } catch (error) {
        console.error('❌ Error adding transaction:', error);
        return { success: false, error: error.message };
    }
};

// Get transactions for a user
export const getTransactions = async (userId, filters = {}) => {
    console.log('🔍 Fetching transactions for userId:', userId);

    if (!userId) {
        console.error('❌ No userId provided!');
        return { success: false, error: 'No user ID provided' };
    }

    try {
        // First, try the query with ordering (requires composite index)
        let querySnapshot;
        let usedFallback = false;

        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                where('userId', '==', userId),
                orderBy('date', 'desc')
            );
            querySnapshot = await getDocs(q);
            console.log('✅ Query with orderBy succeeded');
        } catch (indexError) {
            console.warn('⚠️ orderBy query failed, trying fallback...', indexError.message);
            usedFallback = true;

            // Fallback: simple query without orderBy
            const qSimple = query(
                collection(db, COLLECTION_NAME),
                where('userId', '==', userId)
            );
            querySnapshot = await getDocs(qSimple);
        }

        const transactions = [];
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();

            // Handle various date formats
            if (data.date) {
                if (data.date.toDate && typeof data.date.toDate === 'function') {
                    // Firestore Timestamp
                    data.date = data.date.toDate();
                } else if (data.date.seconds) {
                    // Raw Timestamp object
                    data.date = new Date(data.date.seconds * 1000);
                } else if (typeof data.date === 'string') {
                    // String date
                    data.date = new Date(data.date);
                }
                // If it's already a Date, leave it
            }

            transactions.push({ id: docSnap.id, ...data });
        });

        // If we used fallback, sort client-side
        if (usedFallback && transactions.length > 0) {
            transactions.sort((a, b) => {
                const dateA = a.date ? new Date(a.date).getTime() : 0;
                const dateB = b.date ? new Date(b.date).getTime() : 0;
                return dateB - dateA;
            });
        }

        console.log('📦 Transactions found:', transactions.length, transactions);
        return { success: true, transactions };
    } catch (error) {
        console.error('❌ Error getting transactions:', error);
        return { success: false, error: error.message };
    }
};

// Update transaction
export const updateTransaction = async (id, data) => {
    try {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, data);
        return { success: true };
    } catch (error) {
        console.error('Error updating transaction:', error);
        return { success: false, error: error.message };
    }
};

// Delete transaction
export const deleteTransaction = async (id) => {
    try {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
        return { success: true };
    } catch (error) {
        console.error('Error deleting transaction:', error);
        return { success: false, error: error.message };
    }
};

export const getFinancialSummary = (transactions) => {
    const summary = {
        totalIncome: 0,
        totalExpense: 0,
        balance: 0
    };

    transactions.forEach(t => {
        const amount = parseFloat(t.amount) || 0;
        if (t.type === 'income') {
            summary.totalIncome += amount;
        } else if (t.type === 'expense') {
            summary.totalExpense += amount;
        }
    });

    summary.balance = summary.totalIncome - summary.totalExpense;
    return summary;
};
