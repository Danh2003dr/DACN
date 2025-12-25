import React, { useState } from 'react';
import { importExportAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';

const ImportExport = () => {
  const [activeTab, setActiveTab] = useState('import');
  const [importType, setImportType] = useState('drugs');
  const [importFormat, setImportFormat] = useState('csv'); // csv hoặc pdf
  const [selectedFile, setSelectedFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [exportType, setExportType] = useState('drugs');
  const [exporting, setExporting] = useState(false);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const ext = file.name.split('.').pop().toLowerCase();
      
      // Kiểm tra format dựa trên importFormat
      if (importFormat === 'pdf') {
        if (ext !== 'pdf') {
          toast.error('Chỉ chấp nhận file PDF cho import từ công văn');
          return;
        }
      } else {
        if (!['csv', 'xlsx', 'xls'].includes(ext)) {
          toast.error('Chỉ chấp nhận file CSV hoặc Excel');
          return;
        }
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
      
      if (importType === 'drugs' && importFormat === 'pdf') {
        // Import từ PDF công văn Bộ Y tế
        result = await importExportAPI.importDrugsFromPDF(selectedFile);
      } else if (importType === 'drugs') {
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
      toast.error(error.response?.data?.message || 'Lỗi khi import dữ liệu');
    } finally {
      setImporting(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      toast.loading('Đang chuẩn bị file CSV...', { id: 'export-loading' });
      
      let response;
      if (exportType === 'drugs') {
        response = await importExportAPI.exportDrugs();
      } else if (exportType === 'inventory') {
        response = await importExportAPI.exportInventory();
      } else if (exportType === 'orders') {
        response = await importExportAPI.exportOrders();
      } else if (exportType === 'invoices') {
        response = await importExportAPI.exportInvoices();
      }

      // Kiểm tra nếu response là error (JSON error trong blob)
      if (response.headers && response.headers['content-type'] && response.headers['content-type'].includes('application/json')) {
        // Đây là JSON error được trả về dưới dạng blob
        const text = await response.data.text();
        const errorData = JSON.parse(text);
        toast.error(errorData.message || 'Không thể xuất file', { id: 'export-loading' });
        throw new Error(errorData.message || 'Không thể xuất file');
      }

      // Tạo blob từ response data
      const blob = new Blob([response.data], { 
        type: 'text/csv;charset=utf-8;' 
      });
      
      // Tạo URL từ blob
      const url = window.URL.createObjectURL(blob);
      
      // Tạo link download
      const link = document.createElement('a');
      link.href = url;
      
      // Lấy tên file từ Content-Disposition header hoặc tạo mới
      const contentDisposition = response.headers['content-disposition'];
      let filename = `${exportType}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.csv`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
          // Decode URI nếu cần
          try {
            filename = decodeURIComponent(filename);
          } catch (e) {
            // Nếu không decode được, dùng filename gốc
          }
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(`Export thành công: ${filename}`, { id: 'export-loading' });
    } catch (error) {
      console.error('Error exporting:', error);
      toast.error(error.response?.data?.message || error.message || 'Lỗi khi export dữ liệu', { id: 'export-loading' });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Import/Export Dữ liệu"
        subtitle="Import và export dữ liệu từ Excel/CSV (hoặc PDF công văn)"
      />

      {/* Tabs */}
      <Card className="overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50/60">
          <nav className="flex -mb-px px-6 gap-8">
            <button
              onClick={() => setActiveTab('import')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'import'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Import
            </button>
            <button
              onClick={() => setActiveTab('export')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'export'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
                  Chọn loại dữ liệu và file để import (CSV/Excel hoặc PDF công văn)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại dữ liệu
                </label>
                <Select
                  value={importType}
                  onChange={(e) => {
                    setImportType(e.target.value);
                    setSelectedFile(null);
                    document.getElementById('file-input').value = '';
                  }}
                >
                  <option value="drugs">Thuốc (Drugs)</option>
                  <option value="inventory">Tồn kho (Inventory)</option>
                </Select>
              </div>

              {importType === 'drugs' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Định dạng file
                  </label>
                  <Select
                    value={importFormat}
                    onChange={(e) => {
                      setImportFormat(e.target.value);
                      setSelectedFile(null);
                      document.getElementById('file-input').value = '';
                    }}
                  >
                    <option value="csv">CSV/Excel (Thông thường)</option>
                    <option value="pdf">PDF (Công văn Bộ Y tế)</option>
                  </Select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chọn file {importFormat === 'pdf' ? '(PDF công văn)' : '(CSV hoặc Excel)'}
                </label>
                <Input
                  id="file-input"
                  type="file"
                  accept={importFormat === 'pdf' ? '.pdf' : '.csv,.xlsx,.xls'}
                  onChange={handleFileSelect}
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
                  {importFormat === 'pdf' ? (
                    <>
                      <li>File PDF phải là công văn của Bộ Y tế về danh mục thuốc được gia hạn giấy đăng ký</li>
                      <li>Hệ thống sẽ tự động extract thông tin: Tên thuốc, Số đăng ký, Ngày hết hạn</li>
                      <li>Thông tin còn thiếu sẽ được điền mặc định (có thể chỉnh sửa sau)</li>
                    </>
                  ) : (
                    <>
                      <li>File CSV phải có header row</li>
                      <li>Đối với Drugs: cần có các cột: name, batchNumber, productionDate, expiryDate</li>
                      <li>Đối với Inventory: cần có các cột: drugId, locationId, quantity, unitPrice</li>
                    </>
                  )}
                  <li>Kích thước file tối đa: 10MB</li>
                </ul>
              </div>

              <Button onClick={handleImport} disabled={!selectedFile || importing}>
                {importing ? 'Đang import...' : 'Import'}
              </Button>
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
                <Select
                  value={exportType}
                  onChange={(e) => setExportType(e.target.value)}
                >
                  <option value="drugs">Thuốc (Drugs)</option>
                  <option value="inventory">Tồn kho (Inventory)</option>
                  <option value="orders">Đơn hàng (Orders)</option>
                  <option value="invoices">Hóa đơn (Invoices)</option>
                </Select>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-900 mb-2">Thông tin:</h3>
                <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
                  <li>Dữ liệu sẽ được export ra file CSV</li>
                  <li>File sẽ tự động download về máy</li>
                  <li>Có thể sử dụng Excel hoặc Google Sheets để mở file</li>
                </ul>
              </div>

              <Button onClick={handleExport} disabled={exporting} variant="success">
                {exporting ? 'Đang export...' : 'Export'}
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ImportExport;

