import { useState, useRef } from 'react';
import Papa from 'papaparse';
import { addTransaction } from '../../services/finance';
import { useAuth } from '../../hooks/useAuth';

// File size limit: 5MB
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const CATEGORIES = {
    income: ['Salary', 'Freelance', 'Investment', 'Gift', 'Rent Income', 'Interest', 'Dividends', 'Other'],
    expense: ['Food', 'Transportation', 'Rent', 'Utilities', 'Entertainment', 'Shopping', 'Health', 'EMI', 'Other']
};

const CSVImporter = ({ onImportComplete }) => {
    const { currentUser } = useAuth();
    const fileInputRef = useRef(null);
    const [parsedData, setParsedData] = useState([]);
    const [headers, setHeaders] = useState([]);
    const [columnMapping, setColumnMapping] = useState({
        amount: '',
        date: '',
        source: '',
        category: '',
        type: '',
        description: ''
    });
    const [step, setStep] = useState('upload'); // 'upload' | 'map' | 'preview' | 'importing' | 'done'
    const [importing, setImporting] = useState(false);
    const [importStatus, setImportStatus] = useState({ success: 0, failed: 0, total: 0 });
    const [previewData, setPreviewData] = useState([]);
    const [fileSizeError, setFileSizeError] = useState('');

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Check file size
        if (file.size > MAX_FILE_SIZE_BYTES) {
            const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
            setFileSizeError(`File size (${fileSizeMB} MB) exceeds the ${MAX_FILE_SIZE_MB} MB limit. Please upload a smaller file.`);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            return;
        }
        setFileSizeError('');

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                setHeaders(results.meta.fields || []);
                setParsedData(results.data);

                // Auto-detect column mappings
                const detected = detectColumnMappings(results.meta.fields);
                setColumnMapping(detected);

                setStep('map');
            },
            error: (error) => {
                alert('Error parsing CSV: ' + error.message);
            }
        });
    };

    const detectColumnMappings = (fields) => {
        const mapping = {
            amount: '',
            date: '',
            source: '',
            category: '',
            type: '',
            description: ''
        };

        const fieldLower = fields.map(f => f.toLowerCase());

        // Amount detection
        const amountPatterns = ['amount', 'value', 'sum', 'total', 'price', 'cost', 'rs', 'inr'];
        mapping.amount = fields.find((f, i) => amountPatterns.some(p => fieldLower[i].includes(p))) || '';

        // Date detection
        const datePatterns = ['date', 'time', 'when', 'day', 'transaction_date', 'trans_date'];
        mapping.date = fields.find((f, i) => datePatterns.some(p => fieldLower[i].includes(p))) || '';

        // Source detection
        const sourcePatterns = ['source', 'vendor', 'merchant', 'from', 'to', 'payee', 'payer', 'name', 'counterparty'];
        mapping.source = fields.find((f, i) => sourcePatterns.some(p => fieldLower[i].includes(p))) || '';

        // Category detection
        const categoryPatterns = ['category', 'type', 'tag', 'label', 'group'];
        mapping.category = fields.find((f, i) => categoryPatterns.some(p => fieldLower[i].includes(p))) || '';

        // Type detection (income/expense)
        const typePatterns = ['type', 'transaction_type', 'trans_type', 'credit_debit', 'dr_cr'];
        mapping.type = fields.find((f, i) => typePatterns.some(p => fieldLower[i].includes(p))) || '';

        // Description detection
        const descPatterns = ['description', 'desc', 'note', 'notes', 'memo', 'remarks', 'narration'];
        mapping.description = fields.find((f, i) => descPatterns.some(p => fieldLower[i].includes(p))) || '';

        return mapping;
    };

    const handleMappingChange = (field, value) => {
        setColumnMapping(prev => ({ ...prev, [field]: value }));
    };

    const processData = () => {
        const processed = parsedData.map((row, index) => {
            // Extract amount
            let amount = 0;
            if (columnMapping.amount) {
                const rawAmount = row[columnMapping.amount];
                amount = parseFloat(String(rawAmount).replace(/[^0-9.-]/g, '')) || 0;
            }

            // Extract date
            let date = new Date();
            if (columnMapping.date) {
                const rawDate = row[columnMapping.date];
                const parsed = new Date(rawDate);
                if (!isNaN(parsed.getTime())) {
                    date = parsed;
                }
            }

            // Extract source
            let source = 'CSV Import';
            if (columnMapping.source) {
                source = row[columnMapping.source] || 'CSV Import';
            }

            // Extract/Detect type
            let type = 'expense';
            if (columnMapping.type) {
                const rawType = String(row[columnMapping.type]).toLowerCase();
                if (rawType.includes('income') || rawType.includes('credit') || rawType.includes('cr')) {
                    type = 'income';
                } else if (rawType.includes('expense') || rawType.includes('debit') || rawType.includes('dr')) {
                    type = 'expense';
                }
            }
            // If amount is negative, it's typically an expense
            if (amount < 0) {
                type = 'expense';
                amount = Math.abs(amount);
            }

            // Extract/Default category
            let category = type === 'income' ? 'Other' : 'Other';
            if (columnMapping.category) {
                const rawCategory = row[columnMapping.category];
                if (rawCategory) {
                    // Check if it matches our categories
                    const validCategories = [...CATEGORIES.income, ...CATEGORIES.expense];
                    if (validCategories.some(c => c.toLowerCase() === rawCategory.toLowerCase())) {
                        category = rawCategory;
                    } else {
                        category = rawCategory; // Use as-is
                    }
                }
            }

            // Extract description
            let description = '';
            if (columnMapping.description) {
                description = row[columnMapping.description] || '';
            }

            return {
                index,
                amount,
                date,
                source,
                type,
                category,
                description,
                selected: amount > 0, // Only select valid amounts
                originalRow: row
            };
        }).filter(item => item.amount > 0);

        setPreviewData(processed);
        setStep('preview');
    };

    const toggleItem = (index) => {
        setPreviewData(prev => prev.map(item =>
            item.index === index ? { ...item, selected: !item.selected } : item
        ));
    };

    const updateItem = (index, field, value) => {
        setPreviewData(prev => prev.map(item =>
            item.index === index ? { ...item, [field]: value } : item
        ));
    };

    const handleImport = async () => {
        if (!currentUser) return;

        const toImport = previewData.filter(item => item.selected);
        setImportStatus({ success: 0, failed: 0, total: toImport.length });
        setStep('importing');
        setImporting(true);

        let success = 0;
        let failed = 0;

        for (const item of toImport) {
            try {
                const result = await addTransaction(currentUser.uid, {
                    type: item.type,
                    amount: item.amount,
                    source: item.source,
                    category: item.category,
                    date: item.date,
                    description: item.description || 'Imported from CSV',
                    importedFromCSV: true
                });

                if (result.success) {
                    success++;
                } else {
                    failed++;
                }
                setImportStatus({ success, failed, total: toImport.length });
            } catch (error) {
                failed++;
                setImportStatus({ success, failed, total: toImport.length });
            }
        }

        setImporting(false);
        setStep('done');

        if (onImportComplete) {
            onImportComplete();
        }
    };

    const handleReset = () => {
        setParsedData([]);
        setHeaders([]);
        setColumnMapping({
            amount: '',
            date: '',
            source: '',
            category: '',
            type: '',
            description: ''
        });
        setPreviewData([]);
        setImportStatus({ success: 0, failed: 0, total: 0 });
        setFileSizeError('');
        setStep('upload');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-blue-100 p-2 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-xl font-bold text-gray-800">CSV Import</h3>
                    <p className="text-sm text-gray-500">Upload a CSV file to bulk import transactions</p>
                </div>
            </div>

            {step === 'upload' && (
                <>
                    {/* File Size Error Alert */}
                    {fileSizeError && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                            <div className="flex items-center gap-2">
                                <span>⚠️</span>
                                <span>{fileSizeError}</span>
                            </div>
                        </div>
                    )}

                    <div
                        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv"
                            onChange={handleFileUpload}
                            className="hidden"
                        />
                        <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-gray-600 font-medium">Click to upload or drag and drop</p>
                        <p className="text-sm text-gray-500 mt-1">CSV files only (max {MAX_FILE_SIZE_MB} MB)</p>
                    </div>

                    <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-700 mb-2">📋 Expected Format</h4>
                        <p className="text-sm text-gray-600 mb-2">Your CSV should have columns like:</p>
                        <code className="text-xs bg-gray-200 px-2 py-1 rounded">
                            Date, Amount, Description, Category, Type
                        </code>
                    </div>
                </>
            )}

            {step === 'map' && (
                <>
                    <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-4">
                            Found <strong>{parsedData.length}</strong> rows. Map your columns:
                        </p>

                        <div className="grid grid-cols-2 gap-4">
                            {Object.entries({
                                amount: 'Amount *',
                                date: 'Date',
                                source: 'Source/Vendor',
                                type: 'Type (Income/Expense)',
                                category: 'Category',
                                description: 'Description'
                            }).map(([field, label]) => (
                                <div key={field}>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {label}
                                    </label>
                                    <select
                                        value={columnMapping[field]}
                                        onChange={(e) => handleMappingChange(field, e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        <option value="">-- Select Column --</option>
                                        {headers.map(h => (
                                            <option key={h} value={h}>{h}</option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handleReset}
                            className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-50 transition"
                        >
                            ← Back
                        </button>
                        <button
                            onClick={processData}
                            disabled={!columnMapping.amount}
                            className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
                        >
                            Preview Data →
                        </button>
                    </div>
                </>
            )}

            {step === 'preview' && (
                <>
                    <div className="mb-4 flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                            {previewData.filter(d => d.selected).length} of {previewData.length} selected
                        </span>
                        <button onClick={() => setStep('map')} className="text-sm text-blue-600 hover:underline">
                            ← Edit Mapping
                        </button>
                    </div>

                    <div className="max-h-80 overflow-y-auto space-y-2 mb-4">
                        {previewData.map((item) => (
                            <div
                                key={item.index}
                                className={`p-3 rounded-lg border ${item.selected ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-gray-50 opacity-60'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={item.selected}
                                        onChange={() => toggleItem(item.index)}
                                        className="w-4 h-4"
                                    />

                                    <select
                                        value={item.type}
                                        onChange={(e) => updateItem(item.index, 'type', e.target.value)}
                                        className={`px-2 py-1 rounded text-xs font-medium border-0 ${item.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}
                                    >
                                        <option value="income">Income</option>
                                        <option value="expense">Expense</option>
                                    </select>

                                    <span className="flex-1 text-sm text-gray-800 truncate">{item.source}</span>

                                    <select
                                        value={item.category}
                                        onChange={(e) => updateItem(item.index, 'category', e.target.value)}
                                        className="px-2 py-1 text-xs border rounded"
                                    >
                                        {CATEGORIES[item.type].map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>

                                    <span className={`font-bold ${item.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                        {item.type === 'income' ? '+' : '-'}${item.amount.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={handleImport}
                        disabled={previewData.filter(d => d.selected).length === 0}
                        className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50"
                    >
                        ✅ Import {previewData.filter(d => d.selected).length} Transactions
                    </button>
                </>
            )}

            {step === 'importing' && (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
                    <p className="text-lg font-medium text-gray-800">Importing transactions...</p>
                    <p className="text-gray-600 mt-2">
                        {importStatus.success + importStatus.failed} / {importStatus.total}
                    </p>
                </div>
            )}

            {step === 'done' && (
                <div className="text-center py-8">
                    <div className="text-6xl mb-4">🎉</div>
                    <h4 className="text-xl font-bold text-gray-800 mb-2">Import Complete!</h4>
                    <p className="text-gray-600 mb-4">
                        Successfully imported <strong className="text-green-600">{importStatus.success}</strong> transactions
                        {importStatus.failed > 0 && (
                            <span className="text-red-600"> ({importStatus.failed} failed)</span>
                        )}
                    </p>
                    <button
                        onClick={handleReset}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
                    >
                        Import More
                    </button>
                </div>
            )}
        </div>
    );
};

export default CSVImporter;
