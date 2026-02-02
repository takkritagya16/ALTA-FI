import { useState } from 'react';
import { parseSMSBulk } from '../../services/smsParser';
import { addTransaction } from '../../services/finance';
import { useAuth } from '../../hooks/useAuth';

const SMSImporter = ({ onImportComplete }) => {
    const { currentUser } = useAuth();
    const [smsText, setSmsText] = useState('');
    const [parsedResults, setParsedResults] = useState([]);
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [importing, setImporting] = useState(false);
    const [importStatus, setImportStatus] = useState({ success: 0, failed: 0 });
    const [step, setStep] = useState('input'); // 'input' | 'preview' | 'done'

    const handleParse = () => {
        const results = parseSMSBulk(smsText);
        setParsedResults(results);
        setSelectedItems(new Set(results.map((_, i) => i)));
        setStep('preview');
    };

    const toggleItem = (index) => {
        const newSelected = new Set(selectedItems);
        if (newSelected.has(index)) {
            newSelected.delete(index);
        } else {
            newSelected.add(index);
        }
        setSelectedItems(newSelected);
    };

    const toggleAll = () => {
        if (selectedItems.size === parsedResults.length) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(parsedResults.map((_, i) => i)));
        }
    };

    const handleImport = async () => {
        if (!currentUser) return;

        setImporting(true);
        let success = 0;
        let failed = 0;

        for (const index of selectedItems) {
            const item = parsedResults[index];
            try {
                const result = await addTransaction(currentUser.uid, {
                    type: item.type,
                    amount: item.amount,
                    source: item.source,
                    category: item.category,
                    date: item.date,
                    description: `Imported from SMS${item.isEMI ? ' (EMI)' : ''}`,
                    importedFromSMS: true,
                    originalSMS: item.originalText.substring(0, 200)
                });

                if (result.success) {
                    success++;
                } else {
                    failed++;
                }
            } catch (error) {
                failed++;
            }
        }

        setImportStatus({ success, failed });
        setStep('done');
        setImporting(false);

        if (onImportComplete) {
            onImportComplete();
        }
    };

    const handleReset = () => {
        setSmsText('');
        setParsedResults([]);
        setSelectedItems(new Set());
        setImportStatus({ success: 0, failed: 0 });
        setStep('input');
    };

    const getConfidenceColor = (confidence) => {
        if (confidence >= 70) return 'text-green-600 bg-green-100';
        if (confidence >= 50) return 'text-yellow-600 bg-yellow-100';
        return 'text-red-600 bg-red-100';
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-purple-100 p-2 rounded-lg">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-xl font-bold text-gray-800">SMS Import</h3>
                    <p className="text-sm text-gray-500">Paste bank SMS messages to auto-import transactions</p>
                </div>
            </div>

            {step === 'input' && (
                <>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Paste SMS Messages (one per line or separated by blank lines)
                        </label>
                        <textarea
                            value={smsText}
                            onChange={(e) => setSmsText(e.target.value)}
                            placeholder={`Example:
Rs.500.00 debited from A/c XX1234 on 15-01-2025 at SWIGGY. Avl Bal: Rs.12,500.00

INR 25,000.00 credited to A/c XX5678 on 16-01-2025. Ref: SALARY JAN25. Avl Bal: Rs.37,500.00`}
                            rows={8}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none font-mono text-sm"
                        />
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <h4 className="font-medium text-blue-800 mb-2">📱 Supported Formats</h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li>• Bank debit/credit alerts (HDFC, ICICI, SBI, Axis, etc.)</li>
                            <li>• UPI transaction messages</li>
                            <li>• Credit card transaction alerts</li>
                            <li>• EMI payment notifications</li>
                            <li>• Wallet transactions (Paytm, PhonePe, GPay)</li>
                        </ul>
                    </div>

                    <button
                        onClick={handleParse}
                        disabled={!smsText.trim()}
                        className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        🔍 Parse SMS Messages
                    </button>
                </>
            )}

            {step === 'preview' && (
                <>
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-gray-600">
                            Found <strong>{parsedResults.length}</strong> transactions
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={toggleAll}
                                className="text-sm text-purple-600 hover:text-purple-700"
                            >
                                {selectedItems.size === parsedResults.length ? 'Deselect All' : 'Select All'}
                            </button>
                            <button
                                onClick={handleReset}
                                className="text-sm text-gray-500 hover:text-gray-700"
                            >
                                ← Back
                            </button>
                        </div>
                    </div>

                    {parsedResults.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <p>No valid transactions found in the SMS text.</p>
                            <button onClick={handleReset} className="text-purple-600 hover:underline mt-2">
                                Try again
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-3 max-h-96 overflow-y-auto mb-4">
                                {parsedResults.map((item, index) => (
                                    <div
                                        key={index}
                                        onClick={() => toggleItem(index)}
                                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedItems.has(index)
                                                ? 'border-purple-500 bg-purple-50'
                                                : 'border-gray-200 bg-gray-50 opacity-60'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedItems.has(index)}
                                                    onChange={() => toggleItem(index)}
                                                    className="w-4 h-4 text-purple-600 rounded"
                                                />
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${item.type === 'income'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    {item.type === 'income' ? '↓ Income' : '↑ Expense'}
                                                </span>
                                                {item.isEMI && (
                                                    <span className="px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-700">
                                                        EMI
                                                    </span>
                                                )}
                                            </div>
                                            <span className={`text-lg font-bold ${item.type === 'income' ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                {item.type === 'income' ? '+' : '-'}₹{item.amount?.toFixed(2)}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div>
                                                <span className="text-gray-500">Source: </span>
                                                <span className="text-gray-800">{item.source}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Category: </span>
                                                <span className="text-gray-800">{item.category}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Date: </span>
                                                <span className="text-gray-800">
                                                    {item.date?.toLocaleDateString() || 'Today'}
                                                </span>
                                            </div>
                                            <div>
                                                <span className={`px-2 py-0.5 rounded text-xs ${getConfidenceColor(item.confidence)}`}>
                                                    {item.confidence}% confident
                                                </span>
                                            </div>
                                        </div>

                                        {item.balance && (
                                            <div className="mt-2 text-sm text-gray-500">
                                                Balance after: ₹{item.balance.toFixed(2)}
                                            </div>
                                        )}

                                        <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-600 font-mono truncate">
                                            {item.originalText.substring(0, 100)}...
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={handleImport}
                                disabled={selectedItems.size === 0 || importing}
                                className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {importing ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Importing...
                                    </span>
                                ) : (
                                    `✅ Import ${selectedItems.size} Transaction${selectedItems.size !== 1 ? 's' : ''}`
                                )}
                            </button>
                        </>
                    )}
                </>
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
                        className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 transition"
                    >
                        Import More
                    </button>
                </div>
            )}
        </div>
    );
};

export default SMSImporter;
