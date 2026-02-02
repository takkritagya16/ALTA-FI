import {
    collection,
    addDoc,
    deleteDoc,
    getDocs,
    query,
    where,
    doc,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

const COLLECTION_NAME = 'rules';

// Add a new categorization rule
export const addRule = async (userId, data) => {
    try {
        const ruleData = {
            ...data,
            userId,
            createdAt: serverTimestamp()
        };
        const docRef = await addDoc(collection(db, COLLECTION_NAME), ruleData);
        return { success: true, id: docRef.id, ...ruleData };
    } catch (error) {
        console.error('Error adding rule:', error);
        return { success: false, error: error.message };
    }
};

// Get all rules for a user
export const getRules = async (userId) => {
    try {
        const q = query(collection(db, COLLECTION_NAME), where('userId', '==', userId));
        const querySnapshot = await getDocs(q);
        const rules = [];
        querySnapshot.forEach((doc) => {
            rules.push({ id: doc.id, ...doc.data() });
        });
        return { success: true, rules };
    } catch (error) {
        console.error('Error getting rules:', error);
        return { success: false, error: error.message };
    }
};

// Delete a rule
export const deleteRule = async (ruleId) => {
    try {
        await deleteDoc(doc(db, COLLECTION_NAME, ruleId));
        return { success: true };
    } catch (error) {
        console.error('Error deleting rule:', error);
        return { success: false, error: error.message };
    }
};

// Apply rules to a transaction
export const applyRules = (rules, source) => {
    if (!rules || !source) return null;

    const normalizedSource = source.toLowerCase();

    const matchedRule = rules.find(rule => {
        const pattern = rule.pattern.toLowerCase();
        if (rule.matchType === 'exact') {
            return normalizedSource === pattern;
        } else { // contains
            return normalizedSource.includes(pattern);
        }
    });

    if (matchedRule) {
        return {
            type: matchedRule.type,
            category: matchedRule.category,
            matchedRuleId: matchedRule.id
        };
    }

    return null;
};
