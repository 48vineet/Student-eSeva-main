import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { api } from '../api/api';
import { Upload, FileText, CheckCircle, AlertCircle, X, Download } from 'lucide-react';

const ExamDataUpload = ({ onClose, onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [examType, setExamType] = useState('unit_test_1');
  const [uploadedFile, setUploadedFile] = useState(null);

  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploadedFile(file);
    setUploading(true);
    setError('');
    setMessage('Uploading and processing data...');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('exam_type', examType);

    console.log('Uploading file:', {
      fileName: file.name,
      fileSize: file.size,
      examType: examType,
      formDataKeys: Array.from(formData.keys())
    });

    try {
      const response = await api.uploadFile(formData);
      console.log('Upload response:', response);

      setMessage(`Successfully updated ${response.updatedCount} student records`);
      
      // Show success message briefly and then close modal
      // Add delay to allow backend risk calculation to complete
      setTimeout(() => {
        if (onUploadSuccess) {
          onUploadSuccess();
        }
      }, 2000); // Increased to 2 seconds to allow risk calculation
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.error || err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    multiple: false,
  });

  const examTypeOptions = [
    { value: 'unit_test_1', label: 'Unit Test 1', color: 'blue' },
    { value: 'unit_test_2', label: 'Unit Test 2', color: 'green' },
    { value: 'mid_sem', label: 'Mid Semester', color: 'yellow' },
    { value: 'end_sem', label: 'End Semester', color: 'purple' },
  ];

  const getExamTypeColor = (type) => {
    const option = examTypeOptions.find(opt => opt.value === type);
    return option?.color || 'blue';
  };

  const downloadSampleFile = () => {
    const csvContent = `Student ID,Student Name,Math,Science,English,History,Physics,Chemistry,Biology,Computer Science
ST001,John Doe,85,92,78,88,90,87,89,95
ST002,Jane Smith,92,88,95,91,89,93,87,92
ST003,Bob Johnson,78,85,82,79,84,81,83,88
ST004,Alice Brown,95,89,93,96,92,94,91,97
ST005,Charlie Wilson,88,91,85,87,86,89,88,90`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sample_exam_data_${examType}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Upload className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Upload Exam Data</h3>
            <p className="text-sm text-gray-500">Upload student exam results and grades</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>

      {/* Exam Type Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Select Exam Type
        </label>
        <div className="grid grid-cols-2 gap-3">
          {examTypeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setExamType(option.value)}
              className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                examType === option.value
                  ? `border-${option.color}-500 bg-${option.color}-50 text-${option.color}-700`
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              }`}
            >
              <div className="text-sm font-medium">{option.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* File Upload Area */}
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
          isDragActive
            ? 'border-blue-400 bg-blue-50 scale-105'
            : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
        } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} disabled={uploading} />
        
        {uploading ? (
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
            </div>
            <div>
              <p className="text-lg font-medium text-blue-600">Uploading...</p>
              <p className="text-sm text-gray-500">Please wait while we process your file</p>
            </div>
          </div>
        ) : uploadedFile ? (
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <p className="text-lg font-medium text-green-600">File Ready</p>
              <p className="text-sm text-gray-500">{uploadedFile.name}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <p className="text-lg font-medium text-gray-700">
                {isDragActive ? 'Drop your file here' : 'Choose file or drag and drop'}
              </p>
              <p className="text-sm text-gray-500">Excel files only (.xlsx, .xls)</p>
            </div>
          </div>
        )}
      </div>

      {/* Sample File Download */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Need a sample file?</h4>
            <p className="text-xs text-gray-500">Download our template to see the correct format</p>
          </div>
          <button 
            onClick={downloadSampleFile}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Download Template</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div className="bg-green-50 border-2 border-green-300 rounded-lg p-6 animate-pulse">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <h4 className="text-lg font-bold text-green-800">🎉 Upload Successful!</h4>
              <p className="text-sm text-green-700 mt-1">{message}</p>
              <p className="text-xs text-green-600 mt-2">Redirecting to dashboard...</p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm font-medium text-red-800">{error}</p>
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
                <li>• Student ID (unique identifier)</li>
                <li>• Subject columns (Math, Science, English, etc.)</li>
                <li>• Grades must be numeric values (0-100)</li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-700"><strong>Optional columns:</strong></span>
              </div>
              <ul className="ml-6 space-y-1 text-sm text-blue-700">
                <li>• Student Name</li>
                <li>• Semester</li>
                <li>• Academic Year</li>
                <li>• Exam Type</li>
              </ul>
            </div>

            <div className="bg-blue-100 border border-blue-300 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Important:</strong> This upload will create new student records if they don't exist. 
                Make sure Student IDs are unique and consistent across all uploads.
              </p>
            </div>
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
                <th className="px-3 py-2 text-left font-medium text-gray-700">Math</th>
                <th className="px-3 py-2 text-left font-medium text-gray-700">Science</th>
                <th className="px-3 py-2 text-left font-medium text-gray-700">English</th>
                <th className="px-3 py-2 text-left font-medium text-gray-700">History</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              <tr>
                <td className="px-3 py-2 text-gray-600">ST001</td>
                <td className="px-3 py-2 text-gray-600">John Doe</td>
                <td className="px-3 py-2 text-gray-600">85</td>
                <td className="px-3 py-2 text-gray-600">92</td>
                <td className="px-3 py-2 text-gray-600">78</td>
                <td className="px-3 py-2 text-gray-600">88</td>
              </tr>
              <tr>
                <td className="px-3 py-2 text-gray-600">ST002</td>
                <td className="px-3 py-2 text-gray-600">Jane Smith</td>
                <td className="px-3 py-2 text-gray-600">92</td>
                <td className="px-3 py-2 text-gray-600">88</td>
                <td className="px-3 py-2 text-gray-600">95</td>
                <td className="px-3 py-2 text-gray-600">91</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            Cancel
          </button>
        )}
        <button
          onClick={() => {
            if (uploadedFile) {
              // Trigger upload again or close modal
              onClose?.();
            }
          }}
          disabled={!uploadedFile || uploading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {uploading ? 'Uploading...' : 'Upload File'}
        </button>
      </div>
    </div>
  );
};

export default ExamDataUpload;
