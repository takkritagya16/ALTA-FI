/**
 * SMS Parser Service
 * Parses bank SMS messages to extract transaction details
 * Supports major Indian and international bank formats
 */

// Common SMS patterns for different banks
const SMS_PATTERNS = [
    // Debit patterns
    {
        type: 'expense',
        patterns: [
            /(?:Rs\.?|INR|₹)\s*([\d,]+\.?\d*)\s*(?:has been |was )?debited/i,
            /debited\s*(?:by|with|for)?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i,
            /(?:spent|paid|purchase|payment)\s*(?:of|:)?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i,
            /withdrawal\s*(?:of)?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i,
            /(?:Rs\.?|INR|₹)\s*([\d,]+\.?\d*)\s*withdrawn/i,
            /txn\s*of\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)\s*at/i,
        ]
    },
    // Credit patterns
    {
        type: 'income',
        patterns: [
            /(?:Rs\.?|INR|₹)\s*([\d,]+\.?\d*)\s*(?:has been |was )?credited/i,
            /credited\s*(?:by|with)?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i,
            /(?:received|deposit|transferred to you)\s*(?:of|:)?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i,
            /(?:Rs\.?|INR|₹)\s*([\d,]+\.?\d*)\s*deposited/i,
            /salary\s*(?:of)?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i,
            /refund\s*(?:of)?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i,
        ]
    }
];

// Date extraction patterns
const DATE_PATTERNS = [
    /(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/,  // DD-MM-YYYY or DD/MM/YYYY
    /(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*\d{2,4})/i,
    /(?:on|dated?)\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i
];

// Merchant/Source extraction patterns
const MERCHANT_PATTERNS = [
    /(?:at|to|from|@)\s+([A-Za-z0-9\s&]+?)(?:\s+on|\s+dated|\s+ref|\.|\s*$)/i,
    /(?:Info|Ref|VPA):\s*([A-Za-z0-9@.\-_]+)/i,
    /UPI[-\s]*(?:Ref)?[:\s]*([A-Za-z0-9]+)/i,
    /(?:merchant|vendor|payee):\s*([A-Za-z0-9\s]+)/i,
];

// Account number patterns
const ACCOUNT_PATTERNS = [
    /A\/c\s*[Xx*]*(\d{4})/i,
    /account\s*[Xx*]*(\d{4})/i,
    /(?:card|ac)\s*(?:ending\s*)?[Xx*]*(\d{4})/i,
];

// Balance extraction
const BALANCE_PATTERNS = [
    /(?:Avl\.?\s*Bal|Available\s*Balance|Bal)[:\s]*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i,
    /(?:balance|bal)[:\s]*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i,
];

// Category detection based on keywords
const CATEGORY_KEYWORDS = {
    // Expense categories
    'Food': ['swiggy', 'zomato', 'restaurant', 'food', 'cafe', 'pizza', 'burger', 'kitchen', 'dominos', 'mcdonalds', 'kfc', 'starbucks', 'coffee'],
    'Transportation': ['uber', 'ola', 'rapido', 'metro', 'petrol', 'fuel', 'parking', 'cab', 'auto', 'railway', 'irctc', 'flight', 'air'],
    'Shopping': ['amazon', 'flipkart', 'myntra', 'ajio', 'mall', 'mart', 'store', 'shop', 'retail', 'market'],
    'Utilities': ['electricity', 'water', 'gas', 'bill', 'recharge', 'mobile', 'airtel', 'jio', 'vodafone', 'broadband', 'internet', 'dth'],
    'Entertainment': ['netflix', 'spotify', 'hotstar', 'prime', 'movie', 'cinema', 'pvr', 'inox', 'game'],
    'Health': ['hospital', 'pharmacy', 'medical', 'doctor', 'clinic', 'apollo', 'medplus', 'medicine', 'health'],
    'Rent': ['rent', 'landlord', 'housing', 'pg ', 'hostel'],
    'EMI': ['emi', 'loan', 'installment', 'repayment'],

    // Income categories
    'Salary': ['salary', 'payroll', 'wage', 'stipend', 'employer'],
    'Freelance': ['freelance', 'payment received', 'invoice', 'client'],
    'Investment': ['dividend', 'interest', 'mutual fund', 'mf ', 'stock', 'trading', 'nifty', 'sensex'],
    'Gift': ['gift', 'birthday', 'cashback', 'reward', 'bonus'],
    'Refund': ['refund', 'reversal', 'chargeback'],
};

// EMI Detection
const EMI_PATTERNS = [
    /EMI\s*(?:of)?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i,
    /(?:loan|installment)\s*(?:of)?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i,
    /(\d+)\s*(?:of|\/)\s*(\d+)\s*EMI/i,  // "3 of 12 EMI" pattern
];

/**
 * Parse a single SMS message and extract transaction details
 */
export const parseSMS = (smsText) => {
    if (!smsText || typeof smsText !== 'string') {
        return null;
    }

    const result = {
        originalText: smsText,
        parsed: false,
        type: null,
        amount: null,
        date: null,
        source: null,
        category: null,
        accountLast4: null,
        balance: null,
        isEMI: false,
        emiDetails: null,
        confidence: 0
    };

    // Detect transaction type and amount
    for (const { type, patterns } of SMS_PATTERNS) {
        for (const pattern of patterns) {
            const match = smsText.match(pattern);
            if (match) {
                result.type = type;
                result.amount = parseFloat(match[1].replace(/,/g, ''));
                result.parsed = true;
                result.confidence += 40;
                break;
            }
        }
        if (result.parsed) break;
    }

    if (!result.parsed) {
        return result;
    }

    // Extract date
    for (const pattern of DATE_PATTERNS) {
        const match = smsText.match(pattern);
        if (match) {
            try {
                const parsedDate = new Date(match[1]);
                if (!isNaN(parsedDate.getTime())) {
                    result.date = parsedDate;
                    result.confidence += 15;
                    break;
                }
            } catch (e) {
                // Try alternative date parsing
                result.date = new Date();
            }
        }
    }

    // Default to today if no date found
    if (!result.date) {
        result.date = new Date();
    }

    // Extract merchant/source
    for (const pattern of MERCHANT_PATTERNS) {
        const match = smsText.match(pattern);
        if (match) {
            result.source = match[1].trim().substring(0, 50); // Limit length
            result.confidence += 15;
            break;
        }
    }

    // If no specific source, try to find a recognizable name
    if (!result.source) {
        // Look for any capitalized words that might be merchant names
        const words = smsText.match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g);
        if (words && words.length > 0) {
            result.source = words.find(w => w.length > 3 && !['The', 'Your', 'Account', 'Dear', 'Transaction'].includes(w)) || 'Unknown';
        } else {
            result.source = 'Bank Transaction';
        }
    }

    // Extract account number
    for (const pattern of ACCOUNT_PATTERNS) {
        const match = smsText.match(pattern);
        if (match) {
            result.accountLast4 = match[1];
            result.confidence += 10;
            break;
        }
    }

    // Extract balance
    for (const pattern of BALANCE_PATTERNS) {
        const match = smsText.match(pattern);
        if (match) {
            result.balance = parseFloat(match[1].replace(/,/g, ''));
            result.confidence += 10;
            break;
        }
    }

    // Detect category based on keywords
    const lowerText = smsText.toLowerCase();
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        if (keywords.some(kw => lowerText.includes(kw))) {
            result.category = category;
            result.confidence += 10;
            break;
        }
    }

    // Default category if not detected
    if (!result.category) {
        result.category = result.type === 'income' ? 'Other' : 'Other';
    }

    // Detect EMI
    for (const pattern of EMI_PATTERNS) {
        const match = smsText.match(pattern);
        if (match) {
            result.isEMI = true;
            result.category = 'EMI';
            result.emiDetails = {
                amount: result.amount,
                currentEMI: match[1] ? parseInt(match[1]) : null,
                totalEMIs: match[2] ? parseInt(match[2]) : null
            };
            result.confidence += 10;
            break;
        }
    }

    return result;
};

/**
 * Parse multiple SMS messages
 */
export const parseMultipleSMS = (smsArray) => {
    if (!Array.isArray(smsArray)) {
        return [];
    }

    return smsArray
        .map(sms => parseSMS(typeof sms === 'string' ? sms : sms.body || sms.text || sms.message))
        .filter(result => result && result.parsed)
        .sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));
};

/**
 * Parse SMS text file or pasted content (one SMS per line or separated by blank lines)
 */
export const parseSMSBulk = (bulkText) => {
    if (!bulkText || typeof bulkText !== 'string') {
        return [];
    }

    // Split by double newlines or single newlines (depending on format)
    const messages = bulkText
        .split(/\n\n+|\r\n\r\n+/)
        .map(msg => msg.trim())
        .filter(msg => msg.length > 10); // Filter out very short strings

    // If we only got one item, try splitting by single newlines
    if (messages.length === 1) {
        const singleLineSplit = bulkText
            .split(/\n|\r\n/)
            .map(msg => msg.trim())
            .filter(msg => msg.length > 20);

        if (singleLineSplit.length > 1) {
            return parseMultipleSMS(singleLineSplit);
        }
    }

    return parseMultipleSMS(messages);
};

export default {
    parseSMS,
    parseMultipleSMS,
    parseSMSBulk
};
