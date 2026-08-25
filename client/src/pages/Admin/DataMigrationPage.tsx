import React, { useState, useRef } from 'react';
import { UploadCloud, FileType, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

type ImportType = 'products' | 'batches';

const DataMigrationPage: React.FC = () => {
  const [importType, setImportType] = useState<ImportType>('products');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const downloadTemplate = () => {
    const templateContent = importType === 'products'
      ? 'name,genericName,category,form,strength,unitPrice,requiresPrescription,minStockThreshold\n' +
        'Aspirin,Acetylsalicylic Acid,OTC,Tablet,500mg,5.99,false,50\n' +
        'Amoxicillin,Amoxicillin,ANTIBIOTICS,Capsule,250mg,12.50,true,20'
      : 'productName,batchNumber,expiryDate,quantity,costPrice,shelfLocation\n' +
        'Aspirin,BATCH-001,2025-12-31,100,2.50,A-1-1\n' +
        'Amoxicillin,BATCH-002,2024-06-15,50,8.00,B-2-3';
        
    const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `sample-${importType}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePreview = async () => {
    if (!file) {
      toast.error('Please select a file to preview');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setIsUploading(true);
      const res = await api.post(`/admin/import/${importType}?dryRun=true`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPreviewData(res.data.data);
      toast.success('Preview generated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to generate preview');
    } finally {
      setIsUploading(false);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Please select a file to import');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setIsUploading(true);
      const res = await api.post(`/admin/import/${importType}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(`Successfully imported ${res.data.data.importedCount} records!`);
      setPreviewData(null);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to import data');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Data Migration</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Bulk import legacy products and inventory batches via CSV
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={downloadTemplate}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <FileType className="w-4 h-4 mr-2 text-indigo-500" />
            Download {importType === 'products' ? 'Products' : 'Batches'} Template
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700 pb-4 mb-6">
          <button
            className={`px-4 py-2 font-medium text-sm rounded-lg ${importType === 'products' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
            onClick={() => { setImportType('products'); setPreviewData(null); setFile(null); }}
          >
            Import Products
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm rounded-lg ${importType === 'batches' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
            onClick={() => { setImportType('batches'); setPreviewData(null); setFile(null); }}
          >
            Import Inventory Batches
          </button>
        </div>

        <div
          className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv"
            className="hidden"
          />
          <UploadCloud className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4" />
          <p className="text-gray-700 dark:text-gray-300 font-medium text-lg">
            {file ? file.name : 'Click or drag & drop CSV file here'}
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
            Max file size: 5MB
          </p>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          {previewData && (
            <button
              onClick={() => { setPreviewData(null); setFile(null); }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
          )}
          <button
            onClick={previewData ? handleImport : handlePreview}
            disabled={!file || isUploading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isUploading && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
            {previewData ? 'Confirm & Import' : 'Preview Data'}
          </button>
        </div>
      </div>

      {previewData && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900 dark:text-white">Validation Preview</h3>
            <div className="flex space-x-4 text-sm">
              <span className="text-green-600 dark:text-green-400 font-medium">Valid: {previewData.totalRows - previewData.failedCount}</span>
              <span className="text-red-600 dark:text-red-400 font-medium">Errors: {previewData.failedCount}</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 font-medium">Status</th>
                  {importType === 'products' ? (
                    <>
                      <th className="px-4 py-3 font-medium">Name</th>
                      <th className="px-4 py-3 font-medium">Category</th>
                      <th className="px-4 py-3 font-medium">Price</th>
                    </>
                  ) : (
                    <>
                      <th className="px-4 py-3 font-medium">Product</th>
                      <th className="px-4 py-3 font-medium">Batch No</th>
                      <th className="px-4 py-3 font-medium">Qty</th>
                    </>
                  )}
                  <th className="px-4 py-3 font-medium">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {previewData.preview.map((row: any, i: number) => (
                  <tr key={i} className={row.status === 'valid' ? 'bg-green-50/50 dark:bg-green-900/10' : 'bg-red-50/50 dark:bg-red-900/10'}>
                    <td className="px-4 py-3">
                      {row.status === 'valid' ? (
                         <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                         <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                    </td>
                    {importType === 'products' ? (
                      <>
                        <td className="px-4 py-3 text-gray-900 dark:text-white">{row.data.name || '-'}</td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{row.data.category || '-'}</td>
                        <td className="px-4 py-3 text-gray-900 dark:text-white">${row.data.unitPrice || '0'}</td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 text-gray-900 dark:text-white">{row.data.productName || '-'}</td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{row.data.batchNumber || '-'}</td>
                        <td className="px-4 py-3 text-gray-900 dark:text-white">{row.data.quantity || '0'}</td>
                      </>
                    )}
                    <td className="px-4 py-3 text-xs">
                       {row.status === 'invalid' ? (
                         <span className="text-red-600 dark:text-red-400">{JSON.stringify(row.errors)}</span>
                       ) : (
                         <span className="text-green-600 dark:text-green-400">Ready for import</span>
                       )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataMigrationPage;
