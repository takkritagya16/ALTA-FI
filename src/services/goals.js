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

const COLLECTION_NAME = 'goals';

/**
 * Add a new financial goal
 */
export const addGoal = async (userId, data) => {
    console.log('🎯 Adding goal for userId:', userId, 'Data:', data);

    try {
        const goalData = {
            userId,
            name: data.name,
            targetAmount: parseFloat(data.targetAmount),
            currentAmount: parseFloat(data.currentAmount) || 0,
            priority: data.priority || 'medium',
            status: 'active',
            createdAt: serverTimestamp(),
        };

        // Convert deadline to Firestore Timestamp
        if (data.deadline instanceof Date) {
            goalData.deadline = Timestamp.fromDate(data.deadline);
        } else if (typeof data.deadline === 'string') {
            goalData.deadline = Timestamp.fromDate(new Date(data.deadline));
        }

        console.log('📝 Final goal data to save:', goalData);

        const docRef = await addDoc(collection(db, COLLECTION_NAME), goalData);
        console.log('✅ Goal saved with ID:', docRef.id);
        return { success: true, id: docRef.id, ...goalData };
    } catch (error) {
        console.error('❌ Error adding goal:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get all goals for a user
 */
export const getGoals = async (userId) => {
    console.log('🔍 Fetching goals for userId:', userId);

    if (!userId) {
        console.error('❌ No userId provided!');
        return { success: false, error: 'No user ID provided' };
    }

    try {
        let querySnapshot;
        let usedFallback = false;

        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                where('userId', '==', userId),
                orderBy('deadline', 'asc')
            );
            querySnapshot = await getDocs(q);
            console.log('✅ Query with orderBy succeeded');
        } catch (indexError) {
            console.warn('⚠️ orderBy query failed, trying fallback...', indexError.message);
            usedFallback = true;

            const qSimple = query(
                collection(db, COLLECTION_NAME),
                where('userId', '==', userId)
            );
            querySnapshot = await getDocs(qSimple);
        }

        const goals = [];
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();

            // Handle deadline date format
            if (data.deadline) {
                if (data.deadline.toDate && typeof data.deadline.toDate === 'function') {
                    data.deadline = data.deadline.toDate();
                } else if (data.deadline.seconds) {
                    data.deadline = new Date(data.deadline.seconds * 1000);
                } else if (typeof data.deadline === 'string') {
                    data.deadline = new Date(data.deadline);
                }
            }

            goals.push({ id: docSnap.id, ...data });
        });

        // If we used fallback, sort client-side by deadline
        if (usedFallback && goals.length > 0) {
            goals.sort((a, b) => {
                const dateA = a.deadline ? new Date(a.deadline).getTime() : 0;
                const dateB = b.deadline ? new Date(b.deadline).getTime() : 0;
                return dateA - dateB;
            });
        }

        console.log('📦 Goals found:', goals.length, goals);
        return { success: true, goals };
    } catch (error) {
        console.error('❌ Error getting goals:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Update a goal
 */
export const updateGoal = async (id, data) => {
    try {
        const updateData = { ...data };

        // Convert deadline if provided
        if (updateData.deadline) {
            if (updateData.deadline instanceof Date) {
                updateData.deadline = Timestamp.fromDate(updateData.deadline);
            } else if (typeof updateData.deadline === 'string') {
                updateData.deadline = Timestamp.fromDate(new Date(updateData.deadline));
            }
        }

        // Parse numeric fields
        if (updateData.targetAmount !== undefined) {
            updateData.targetAmount = parseFloat(updateData.targetAmount);
        }
        if (updateData.currentAmount !== undefined) {
            updateData.currentAmount = parseFloat(updateData.currentAmount);
        }

        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, updateData);
        console.log('✅ Goal updated:', id);
        return { success: true };
    } catch (error) {
        console.error('❌ Error updating goal:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Delete a goal
 */
export const deleteGoal = async (id) => {
    try {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
        console.log('✅ Goal deleted:', id);
        return { success: true };
    } catch (error) {
        console.error('❌ Error deleting goal:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Calculate insights for a goal based on current finances
 */
export const calculateGoalInsights = (goal, transactions = []) => {
    const now = new Date();
    const deadline = new Date(goal.deadline);

    // Calculate time remaining
    const msRemaining = deadline.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
    const monthsRemaining = Math.max(0.1, daysRemaining / 30); // Avoid division by zero

    // Calculate amounts
    const amountRemaining = Math.max(0, goal.targetAmount - goal.currentAmount);
    const progressPercentage = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);

    // Calculate required savings
    const monthlySavingsNeeded = amountRemaining / monthsRemaining;
    const dailySavingsNeeded = daysRemaining > 0 ? amountRemaining / daysRemaining : amountRemaining;

    // Analyze transaction history for average monthly savings
    let averageMonthlySavings = 0;
    if (transactions.length > 0) {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        let recentIncome = 0;
        let recentExpense = 0;

        transactions.forEach(t => {
            const tDate = t.date ? new Date(t.date) : new Date();
            if (tDate >= thirtyDaysAgo) {
                const amount = parseFloat(t.amount) || 0;
                if (t.type === 'income') recentIncome += amount;
                else if (t.type === 'expense') recentExpense += amount;
            }
        });

        averageMonthlySavings = recentIncome - recentExpense;
    }

    // Determine status
    let status = 'on-track';
    let statusMessage = '';

    if (progressPercentage >= 100) {
        status = 'achieved';
        statusMessage = '🎉 Goal achieved!';
    } else if (daysRemaining <= 0) {
        status = 'overdue';
        statusMessage = '⏰ Deadline has passed';
    } else if (averageMonthlySavings > 0 && averageMonthlySavings < monthlySavingsNeeded) {
        status = 'behind';
        statusMessage = `📈 Increase savings by ₹${Math.round(monthlySavingsNeeded - averageMonthlySavings).toLocaleString('en-IN')}/month`;
    } else if (averageMonthlySavings >= monthlySavingsNeeded) {
        status = 'on-track';
        statusMessage = '✅ You\'re on track!';
    } else {
        status = 'needs-attention';
        statusMessage = `💡 Save ₹${Math.round(monthlySavingsNeeded).toLocaleString('en-IN')}/month to reach goal`;
    }

    return {
        daysRemaining,
        monthsRemaining: Math.round(monthsRemaining * 10) / 10,
        amountRemaining,
        progressPercentage: Math.round(progressPercentage * 10) / 10,
        monthlySavingsNeeded: Math.round(monthlySavingsNeeded),
        dailySavingsNeeded: Math.round(dailySavingsNeeded),
        averageMonthlySavings: Math.round(averageMonthlySavings),
        status,
        statusMessage,
        isAchieved: progressPercentage >= 100,
        isOverdue: daysRemaining <= 0 && progressPercentage < 100
    };
};
