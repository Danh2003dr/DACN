import React, { useState } from 'react';
import { importExportAPI } from '../utils/api';
import toast from 'react-hot-toast';

const ImportExport = () => {
  const [activeTab, setActiveTab] = useState('import');
  const [importType, setImportType] = useState('drugs');
  const [selectedFile, setSelectedFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [exportType, setExportType] = useState('drugs');
  const [exporting, setExporting] = useState(false);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const ext = file.name.split('.').pop().toLowerCase();
      if (!['csv', 'xlsx', 'xls'].includes(ext)) {
        toast.error('Chỉ chấp nhận file CSV hoặc Excel');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error('Vui lòng chọn file');
      return;
    }

    try {
      setImporting(true);
      let result;
      if (importType === 'drugs') {
        result = await importExportAPI.importDrugs(selectedFile);
      } else if (importType === 'inventory') {
        result = await importExportAPI.importInventory(selectedFile);
      }

      if (result.success) {
        toast.success(`Import thành công: ${result.data?.imported || 0} records`);
        if (result.data?.errors > 0) {
          toast.error(`${result.data.errors} records có lỗi`);
        }
        setSelectedFile(null);
        document.getElementById('file-input').value = '';
      }
    } catch (error) {
      console.error('Error importing:', error);
    } finally {
      setImporting(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      if (exportType === 'drugs') {
        await importExportAPI.exportDrugs();
      } else if (exportType === 'inventory') {
        await importExportAPI.exportInventory();
      } else if (exportType === 'orders') {
        await importExportAPI.exportOrders();
      } else if (exportType === 'invoices') {
        await importExportAPI.exportInvoices();
      }
    } catch (error) {
      console.error('Error exporting:', error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Import/Export Dữ liệu</h1>
        <p className="text-gray-600 mt-2">Import và export dữ liệu từ Excel/CSV</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('import')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'import'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Import
            </button>
            <button
              onClick={() => setActiveTab('export')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'export'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Export
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'import' ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold mb-4">Import Dữ liệu</h2>
                <p className="text-gray-600 mb-4">
                  Chọn loại dữ liệu và file CSV/Excel để import
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại dữ liệu
                </label>
                <select
                  value={importType}
                  onChange={(e) => setImportType(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="drugs">Thuốc (Drugs)</option>
                  <option value="inventory">Tồn kho (Inventory)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chọn file (CSV hoặc Excel)
                </label>
                <input
                  id="file-input"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  className="w-full px-3 py-2 border rounded-lg"
                />
                {selectedFile && (
                  <p className="mt-2 text-sm text-gray-600">
                    Đã chọn: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                  </p>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">Lưu ý:</h3>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>File CSV phải có header row</li>
                  <li>Đối với Drugs: cần có các cột: name, batchNumber, productionDate, expiryDate</li>
                  <li>Đối với Inventory: cần có các cột: drugId, locationId, quantity, unitPrice</li>
                  <li>Kích thước file tối đa: 10MB</li>
                </ul>
              </div>

              <button
                onClick={handleImport}
                disabled={!selectedFile || importing}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {importing ? 'Đang import...' : 'Import'}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold mb-4">Export Dữ liệu</h2>
                <p className="text-gray-600 mb-4">
                  Chọn loại dữ liệu để export ra file CSV
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại dữ liệu
                </label>
                <select
                  value={exportType}
                  onChange={(e) => setExportType(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="drugs">Thuốc (Drugs)</option>
                  <option value="inventory">Tồn kho (Inventory)</option>
                  <option value="orders">Đơn hàng (Orders)</option>
                  <option value="invoices">Hóa đơn (Invoices)</option>
                </select>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-900 mb-2">Thông tin:</h3>
                <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
                  <li>Dữ liệu sẽ được export ra file CSV</li>
                  <li>File sẽ tự động download về máy</li>
                  <li>Có thể sử dụng Excel hoặc Google Sheets để mở file</li>
                </ul>
              </div>

              <button
                onClick={handleExport}
                disabled={exporting}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {exporting ? 'Đang export...' : 'Export'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportExport;

