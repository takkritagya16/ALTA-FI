import { useState, useCallback } from 'react';
import Papa from 'papaparse';
import { useAuth } from '../../hooks/useAuth';
import { getPortfolio, addHolding } from '../../services/portfolio';

// Known Zerodha CSV column mappings
const ZERODHA_COLUMN_MAPS = {
    // Holdings report columns
    holdings: {
        'Instrument': 'symbol',
        'Symbol': 'symbol',
        'Trading Symbol': 'symbol',
        'Tradingsymbol': 'symbol',
        'Qty.': 'quantity',
        'Qty': 'quantity',
        'Quantity': 'quantity',
        'Avg. cost': 'avgPrice',
        'Avg cost': 'avgPrice',
        'Average Price': 'avgPrice',
        'Avg. Price': 'avgPrice',
        'Buy Avg': 'avgPrice',
        'LTP': 'currentPrice',
        'Last Price': 'currentPrice',
        'Cur. val': 'currentValue',
        'Current Value': 'currentValue',
        'P&L': 'pnl',
        'Net chg.': 'change',
        'Day chg.': 'dayChange',
    },
    // Tradebook report columns
    tradebook: {
        'Symbol': 'symbol',
        'Trade Date': 'date',
        'Trade Type': 'type', // BUY/SELL
        'Quantity': 'quantity',
        'Price': 'price',
        'Order Execution Time': 'time',
        'Exchange': 'exchange',
        'Segment': 'segment',
    }
};

const ZerodhaImporter = ({ onImportComplete, existingHoldings = [] }) => {
    const { currentUser } = useAuth();
    const [file, setFile] = useState(null);
    const [parsedData, setParsedData] = useState([]);
    const [headers, setHeaders] = useState([]);
    const [columnMapping, setColumnMapping] = useState({});
    const [step, setStep] = useState('upload'); // upload, mapping, preview, importing, done
    const [importType, setImportType] = useState('holdings'); // holdings or tradebook
    const [error, setError] = useState('');
    const [duplicates, setDuplicates] = useState([]);
    const [selectedRows, setSelectedRows] = useState([]);
    const [importProgress, setImportProgress] = useState(0);
    const [importResults, setImportResults] = useState({ success: 0, failed: 0, skipped: 0 });

    // Auto-detect column mapping based on headers
    const autoDetectMapping = useCallback((csvHeaders) => {
        const mapping = {};
        const columnMap = ZERODHA_COLUMN_MAPS[importType];

        csvHeaders.forEach((header) => {
            const normalizedHeader = header.trim();
            if (columnMap[normalizedHeader]) {
                mapping[normalizedHeader] = columnMap[normalizedHeader];
            }
        });

        return mapping;
    }, [importType]);

    // Handle file selection
    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        if (!selectedFile.name.endsWith('.csv')) {
            setError('Please select a CSV file');
            return;
        }

        setFile(selectedFile);
        setError('');
        parseCSV(selectedFile);
    };

    // Parse CSV file
    const parseCSV = (csvFile) => {
        Papa.parse(csvFile, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.errors.length > 0) {
                    setError(`CSV parsing error: ${results.errors[0].message}`);
                    return;
                }

                if (results.data.length === 0) {
                    setError('CSV file is empty');
                    return;
                }

                const csvHeaders = Object.keys(results.data[0]);
                setHeaders(csvHeaders);
                setParsedData(results.data);

                // Auto-detect column mapping
                const detectedMapping = autoDetectMapping(csvHeaders);
                setColumnMapping(detectedMapping);

                // Check for duplicates
                checkDuplicates(results.data, detectedMapping);

                // Select all rows by default
                setSelectedRows(results.data.map((_, index) => index));

                setStep('mapping');
            },
            error: (error) => {
                setError(`Failed to parse CSV: ${error.message}`);
            }
        });
    };

    // Check for duplicate holdings
    const checkDuplicates = (data, mapping) => {
        const symbolKey = Object.keys(mapping).find(k => mapping[k] === 'symbol');
        if (!symbolKey) return;

        const existingSymbols = existingHoldings.map(h =>
            h.symbol.toUpperCase().replace('.NS', '').replace('.BSE', '')
        );

        const dupes = [];
        data.forEach((row, index) => {
            const symbol = row[symbolKey]?.toUpperCase().replace('.NS', '').replace('.BSE', '');
            if (existingSymbols.includes(symbol)) {
                dupes.push(index);
            }
        });

        setDuplicates(dupes);
    };

    // Handle column mapping change
    const handleMappingChange = (header, field) => {
        setColumnMapping(prev => ({
            ...prev,
            [header]: field
        }));
    };

    // Toggle row selection
    const toggleRowSelection = (index) => {
        setSelectedRows(prev => {
            if (prev.includes(index)) {
                return prev.filter(i => i !== index);
            } else {
                return [...prev, index];
            }
        });
    };

    // Select/deselect all rows
    const toggleAllRows = () => {
        if (selectedRows.length === parsedData.length) {
            setSelectedRows([]);
        } else {
            setSelectedRows(parsedData.map((_, index) => index));
        }
    };

    // Get mapped value from row
    const getMappedValue = (row, field) => {
        const header = Object.keys(columnMapping).find(k => columnMapping[k] === field);
        if (!header) return null;
        return row[header];
    };

    // Clean symbol for storage (remove exchange suffixes)
    const cleanSymbol = (symbol) => {
        if (!symbol) return '';
        return symbol
            .toUpperCase()
            .replace('.NS', '')
            .replace('.BSE', '')
            .replace('-EQ', '')
            .trim();
    };

    // Parse number from string (handles Indian number format)
    const parseNumber = (value) => {
        if (!value) return 0;
        if (typeof value === 'number') return value;
        // Remove commas and parse
        return parseFloat(value.toString().replace(/,/g, '')) || 0;
    };

    // Import selected holdings
    const handleImport = async () => {
        if (!currentUser) {
            setError('Please log in to import');
            return;
        }

        const symbolField = Object.keys(columnMapping).find(k => columnMapping[k] === 'symbol');
        const quantityField = Object.keys(columnMapping).find(k => columnMapping[k] === 'quantity');
        const priceField = Object.keys(columnMapping).find(k => columnMapping[k] === 'avgPrice');

        if (!symbolField) {
            setError('Symbol column is required');
            return;
        }

        setStep('importing');
        setImportProgress(0);

        const results = { success: 0, failed: 0, skipped: 0 };
        const rowsToImport = parsedData.filter((_, index) => selectedRows.includes(index));

        for (let i = 0; i < rowsToImport.length; i++) {
            const row = rowsToImport[i];
            const symbol = cleanSymbol(row[symbolField]);
            const quantity = quantityField ? parseNumber(row[quantityField]) : 1;
            const avgPrice = priceField ? parseNumber(row[priceField]) : 0;

            if (!symbol || quantity <= 0) {
                results.skipped++;
                continue;
            }

            try {
                const result = await addHolding(currentUser.uid, {
                    symbol,
                    name: symbol, // Will be updated when fetching quotes
                    quantity,
                    buyPrice: avgPrice,
                    source: 'zerodha_import',
                    importedAt: new Date()
                });

                if (result.success) {
                    results.success++;
                } else {
                    results.failed++;
                }
            } catch (err) {
                console.error('Import error:', err);
                results.failed++;
            }

            setImportProgress(Math.round(((i + 1) / rowsToImport.length) * 100));
        }

        setImportResults(results);
        setStep('done');

        if (results.success > 0) {
            onImportComplete?.();
        }
    };

    // Reset importer
    const resetImporter = () => {
        setFile(null);
        setParsedData([]);
        setHeaders([]);
        setColumnMapping({});
        setStep('upload');
        setError('');
        setDuplicates([]);
        setSelectedRows([]);
        setImportProgress(0);
        setImportResults({ success: 0, failed: 0, skipped: 0 });
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-orange-500 to-red-600 p-3 rounded-xl">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">Import from Zerodha</h3>
                        <p className="text-sm text-gray-500">Upload your holdings or tradebook CSV</p>
                    </div>
                </div>
                {step !== 'upload' && step !== 'done' && (
                    <button
                        onClick={resetImporter}
                        className="text-gray-500 hover:text-gray-700 text-sm"
                    >
                        ← Start Over
                    </button>
                )}
            </div>

            {/* Error Display */}
            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                    <div className="flex items-center gap-2">
                        <span>⚠️</span>
                        <span>{error}</span>
                    </div>
                </div>
            )}

            {/* Step 1: Upload */}
            {step === 'upload' && (
                <div className="space-y-6">
                    {/* Import Type Selection */}
                    <div className="flex gap-4">
                        <button
                            onClick={() => setImportType('holdings')}
                            className={`flex-1 p-4 rounded-xl border-2 transition-all ${importType === 'holdings'
                                    ? 'border-orange-500 bg-orange-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <div className="text-2xl mb-2">💼</div>
                            <p className="font-medium text-gray-800">Holdings Report</p>
                            <p className="text-sm text-gray-500">Current portfolio positions</p>
                        </button>
                        <button
                            onClick={() => setImportType('tradebook')}
                            className={`flex-1 p-4 rounded-xl border-2 transition-all ${importType === 'tradebook'
                                    ? 'border-orange-500 bg-orange-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <div className="text-2xl mb-2">📊</div>
                            <p className="font-medium text-gray-800">Trade Book</p>
                            <p className="text-sm text-gray-500">Transaction history</p>
                        </button>
                    </div>

                    {/* File Drop Zone */}
                    <label className="block">
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition-all">
                            <div className="text-4xl mb-4">📄</div>
                            <p className="text-lg font-medium text-gray-700 mb-2">
                                Drop your Zerodha CSV file here
                            </p>
                            <p className="text-sm text-gray-500 mb-4">
                                or click to browse
                            </p>
                            <span className="inline-block px-4 py-2 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium">
                                Select CSV File
                            </span>
                        </div>
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                    </label>

                    {/* Instructions */}
                    <div className="bg-gray-50 p-4 rounded-xl">
                        <h4 className="font-medium text-gray-800 mb-2">📝 How to export from Zerodha:</h4>
                        <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                            <li>Login to Zerodha Console (console.zerodha.com)</li>
                            <li>Go to Portfolio → Holdings</li>
                            <li>Click the download icon (⬇️) to export CSV</li>
                            <li>Upload the downloaded file here</li>
                        </ol>
                    </div>
                </div>
            )}

            {/* Step 2: Column Mapping */}
            {step === 'mapping' && (
                <div className="space-y-6">
                    <div className="bg-blue-50 p-4 rounded-xl">
                        <p className="text-blue-700 text-sm">
                            <span className="font-medium">📊 Found {parsedData.length} rows</span> •
                            Map the columns below to match your data
                        </p>
                    </div>

                    {/* Column Mapping Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 text-gray-600 font-medium">CSV Column</th>
                                    <th className="text-left py-3 px-4 text-gray-600 font-medium">Sample Data</th>
                                    <th className="text-left py-3 px-4 text-gray-600 font-medium">Map To</th>
                                </tr>
                            </thead>
                            <tbody>
                                {headers.map((header) => (
                                    <tr key={header} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-3 px-4 font-medium text-gray-800">{header}</td>
                                        <td className="py-3 px-4 text-gray-600 text-sm truncate max-w-[200px]">
                                            {parsedData[0]?.[header] || '-'}
                                        </td>
                                        <td className="py-3 px-4">
                                            <select
                                                value={columnMapping[header] || ''}
                                                onChange={(e) => handleMappingChange(header, e.target.value)}
                                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                                            >
                                                <option value="">-- Ignore --</option>
                                                <option value="symbol">Symbol</option>
                                                <option value="quantity">Quantity</option>
                                                <option value="avgPrice">Average Price</option>
                                                <option value="currentPrice">Current Price</option>
                                                <option value="pnl">P&L</option>
                                                <option value="date">Date</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            onClick={resetImporter}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => setStep('preview')}
                            disabled={!Object.values(columnMapping).includes('symbol')}
                            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Continue to Preview →
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Preview */}
            {step === 'preview' && (
                <div className="space-y-6">
                    {/* Duplicate Warning */}
                    {duplicates.length > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl">
                            <div className="flex items-center gap-2 text-yellow-700">
                                <span>⚠️</span>
                                <span className="font-medium">
                                    {duplicates.length} stocks already exist in your portfolio
                                </span>
                            </div>
                            <p className="text-sm text-yellow-600 mt-1">
                                These will be merged (quantities and avg price will be recalculated)
                            </p>
                        </div>
                    )}

                    {/* Selection Controls */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={toggleAllRows}
                                className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                            >
                                {selectedRows.length === parsedData.length ? 'Deselect All' : 'Select All'}
                            </button>
                            <span className="text-sm text-gray-500">
                                {selectedRows.length} of {parsedData.length} selected
                            </span>
                        </div>
                    </div>

                    {/* Preview Table */}
                    <div className="overflow-x-auto max-h-96">
                        <table className="w-full">
                            <thead className="sticky top-0 bg-white">
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 text-gray-600 font-medium w-10">
                                        <input
                                            type="checkbox"
                                            checked={selectedRows.length === parsedData.length}
                                            onChange={toggleAllRows}
                                            className="rounded"
                                        />
                                    </th>
                                    <th className="text-left py-3 px-4 text-gray-600 font-medium">Symbol</th>
                                    <th className="text-right py-3 px-4 text-gray-600 font-medium">Quantity</th>
                                    <th className="text-right py-3 px-4 text-gray-600 font-medium">Avg Price</th>
                                    <th className="text-center py-3 px-4 text-gray-600 font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {parsedData.map((row, index) => {
                                    const symbol = cleanSymbol(getMappedValue(row, 'symbol'));
                                    const quantity = parseNumber(getMappedValue(row, 'quantity'));
                                    const avgPrice = parseNumber(getMappedValue(row, 'avgPrice'));
                                    const isDuplicate = duplicates.includes(index);
                                    const isSelected = selectedRows.includes(index);

                                    return (
                                        <tr
                                            key={index}
                                            className={`border-b border-gray-100 ${isSelected ? 'bg-orange-50' : 'hover:bg-gray-50'} ${isDuplicate ? 'bg-yellow-50' : ''}`}
                                        >
                                            <td className="py-3 px-4">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleRowSelection(index)}
                                                    className="rounded"
                                                />
                                            </td>
                                            <td className="py-3 px-4 font-medium text-gray-800">
                                                {symbol || '-'}
                                            </td>
                                            <td className="py-3 px-4 text-right text-gray-600">
                                                {quantity || '-'}
                                            </td>
                                            <td className="py-3 px-4 text-right text-gray-600">
                                                ₹{avgPrice?.toFixed(2) || '-'}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                {isDuplicate ? (
                                                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                                                        Will Merge
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                                                        New
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => setStep('mapping')}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                            ← Back
                        </button>
                        <button
                            onClick={handleImport}
                            disabled={selectedRows.length === 0}
                            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <span>Import {selectedRows.length} Holdings</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {/* Step 4: Importing */}
            {step === 'importing' && (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-orange-600 border-t-transparent mb-6"></div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Importing Holdings...</h3>
                    <p className="text-gray-500 mb-4">Please wait while we add your stocks</p>

                    {/* Progress Bar */}
                    <div className="max-w-md mx-auto">
                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-orange-500 to-red-600 rounded-full transition-all duration-300"
                                style={{ width: `${importProgress}%` }}
                            />
                        </div>
                        <p className="text-sm text-gray-500 mt-2">{importProgress}% complete</p>
                    </div>
                </div>
            )}

            {/* Step 5: Done */}
            {step === 'done' && (
                <div className="text-center py-12">
                    <div className="text-6xl mb-6">🎉</div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Import Complete!</h3>

                    <div className="flex justify-center gap-6 my-6">
                        <div className="bg-green-50 px-6 py-4 rounded-xl">
                            <p className="text-3xl font-bold text-green-600">{importResults.success}</p>
                            <p className="text-sm text-green-700">Imported</p>
                        </div>
                        {importResults.skipped > 0 && (
                            <div className="bg-yellow-50 px-6 py-4 rounded-xl">
                                <p className="text-3xl font-bold text-yellow-600">{importResults.skipped}</p>
                                <p className="text-sm text-yellow-700">Skipped</p>
                            </div>
                        )}
                        {importResults.failed > 0 && (
                            <div className="bg-red-50 px-6 py-4 rounded-xl">
                                <p className="text-3xl font-bold text-red-600">{importResults.failed}</p>
                                <p className="text-sm text-red-700">Failed</p>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={resetImporter}
                        className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                        Import More
                    </button>
                </div>
            )}
        </div>
    );
};

export default ZerodhaImporter;
