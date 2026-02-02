import {
    collection,
    addDoc,
    getDocs,
    getDoc,
    doc,
    updateDoc,
    deleteDoc,
    query,
    where,
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Example: Add a document to a collection
export const addDocument = async (collectionName, data) => {
    try {
        const docRef = await addDoc(collection(db, collectionName), data);
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error('Error adding document:', error);
        return { success: false, error: error.message };
    }
};

// Example: Get all documents from a collection
export const getDocuments = async (collectionName) => {
    try {
        const querySnapshot = await getDocs(collection(db, collectionName));
        const documents = [];
        querySnapshot.forEach((doc) => {
            documents.push({ id: doc.id, ...doc.data() });
        });
        return { success: true, documents };
    } catch (error) {
        console.error('Error getting documents:', error);
        return { success: false, error: error.message };
    }
};

// Example: Get a single document by ID
export const getDocument = async (collectionName, documentId) => {
    try {
        const docRef = doc(db, collectionName, documentId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { success: true, document: { id: docSnap.id, ...docSnap.data() } };
        } else {
            return { success: false, error: 'Document not found' };
        }
    } catch (error) {
        console.error('Error getting document:', error);
        return { success: false, error: error.message };
    }
};

// Example: Update a document
export const updateDocument = async (collectionName, documentId, data) => {
    try {
        const docRef = doc(db, collectionName, documentId);
        await updateDoc(docRef, data);
        return { success: true };
    } catch (error) {
        console.error('Error updating document:', error);
        return { success: false, error: error.message };
    }
};

// Example: Delete a document
export const deleteDocument = async (collectionName, documentId) => {
    try {
        await deleteDoc(doc(db, collectionName, documentId));
        return { success: true };
    } catch (error) {
        console.error('Error deleting document:', error);
        return { success: false, error: error.message };
    }
};

// Example: Query documents with a condition
export const queryDocuments = async (collectionName, field, operator, value) => {
    try {
        const q = query(collection(db, collectionName), where(field, operator, value));
        const querySnapshot = await getDocs(q);
        const documents = [];
        querySnapshot.forEach((doc) => {
            documents.push({ id: doc.id, ...doc.data() });
        });
        return { success: true, documents };
    } catch (error) {
        console.error('Error querying documents:', error);
        return { success: false, error: error.message };
    }
};
