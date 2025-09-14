import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle, AlertCircle, X, Download } from 'lucide-react';

const FeesUpload = ({ onClose, onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);

  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    setUploadStatus(null);
    setUploadedFile(file);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('dataType', 'fees');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/upload/fees', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();
      
      if (result.success) {
        setUploadStatus('success');
        
        // Show success message briefly and then close modal
        setTimeout(() => {
          if (onUploadSuccess) {
            onUploadSuccess();
          }
        }, 800); // Reduced to 0.8 seconds for faster response
      } else {
        setUploadStatus('error');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false
  });

  const downloadSample = () => {
    // Create a sample CSV content
    const sampleData = `Student ID,Student Name,Fees Status,Amount Paid,Amount Due,Due Date
ST001,John Smith,Complete,50000,0,2025-01-15
ST002,Sarah Johnson,Partial,30000,20000,2025-01-15
ST003,Michael Brown,Due,0,50000,2025-01-15
ST004,Emily Davis,Complete,50000,0,2025-01-15
ST005,David Wilson,Overdue,25000,25000,2024-12-15`;

    const blob = new Blob([sampleData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_fees_status.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 w-full max-w-4xl mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Upload className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Upload Fees Status</h2>
              <p className="text-sm text-gray-500">Upload student fees data and payment status</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Upload Area */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
              isDragActive
                ? 'border-green-400 bg-green-50 scale-105'
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input {...getInputProps()} disabled={uploading} />
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                {uploading ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                ) : (
                  <Upload className="w-8 h-8 text-green-600" />
                )}
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {uploading ? 'Uploading Fees Data...' : 'Upload Fees Data'}
                </h3>
                <div className="text-sm text-gray-600">
                  {isDragActive ? (
                    <span className="text-green-600 font-medium">Drop the file here...</span>
                  ) : (
                    <>
                      <span className="font-medium text-green-600 hover:text-green-500">
                        Click to upload
                      </span>{' '}
                      or drag and drop your file
                    </>
                  )}
                </div>
                <p className="text-xs text-gray-500">Excel files (.xlsx, .xls) or CSV files (.csv)</p>
              </div>
            </div>
          </div>

          {/* Success/Error Messages */}
          {uploadStatus === 'success' && (
            <div className="rounded-xl bg-green-50 border-2 border-green-300 p-6 animate-pulse">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-lg font-bold text-green-800">🎉 Upload Successful!</h4>
                  <p className="text-sm text-green-700 mt-2">Fees data has been uploaded and processed successfully.</p>
                  <p className="text-xs text-green-600 mt-2">Redirecting to dashboard...</p>
                </div>
              </div>
            </div>
          )}

          {uploadStatus === 'error' && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-red-800">Upload Failed</h4>
                  <p className="text-sm text-red-700 mt-1">Please check your file format and try again.</p>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-start space-x-3">
              <FileText className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-blue-800">File Format Requirements</h4>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-700"><strong>Required columns:</strong></span>
                  </div>
                  <ul className="ml-6 space-y-1 text-sm text-blue-700">
                    <li>• Student ID (must match existing students)</li>
                    <li>• Fees Status (Complete, Partial, Due, Overdue)</li>
                    <li>• Amount Paid (numeric value)</li>
                    <li>• Amount Due (numeric value)</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-700"><strong>Optional columns:</strong></span>
                  </div>
                  <ul className="ml-6 space-y-1 text-sm text-blue-700">
                    <li>• Student Name</li>
                    <li>• Due Date (YYYY-MM-DD format)</li>
                  </ul>
                </div>

                <button
                  onClick={downloadSample}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Sample File</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sample Data */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
            <h4 className="text-sm font-medium text-gray-800 mb-3">Sample Data Format:</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Student ID</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Student Name</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Fees Status</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Amount Paid</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Amount Due</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Due Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  <tr>
                    <td className="px-3 py-2 text-gray-600">ST001</td>
                    <td className="px-3 py-2 text-gray-600">John Smith</td>
                    <td className="px-3 py-2 text-gray-600">Complete</td>
                    <td className="px-3 py-2 text-gray-600">50000</td>
                    <td className="px-3 py-2 text-gray-600">0</td>
                    <td className="px-3 py-2 text-gray-600">2025-01-15</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-gray-600">ST002</td>
                    <td className="px-3 py-2 text-gray-600">Sarah Johnson</td>
                    <td className="px-3 py-2 text-gray-600">Partial</td>
                    <td className="px-3 py-2 text-gray-600">30000</td>
                    <td className="px-3 py-2 text-gray-600">20000</td>
                    <td className="px-3 py-2 text-gray-600">2025-01-15</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* File Info */}
        {uploadedFile && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-700">{uploadedFile.name}</p>
                <p className="text-xs text-gray-500">
                  {(uploadedFile.size / 1024).toFixed(1)} KB • Ready for upload
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (uploadedFile && !uploading) {
                onClose();
                if (onUploadSuccess) onUploadSuccess();
              }
            }}
            disabled={!uploadedFile || uploading || uploadStatus !== 'success'}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {uploading ? 'Uploading...' : uploadStatus === 'success' ? 'Done' : 'Upload File'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeesUpload;
