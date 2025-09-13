import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { api } from '../api/api';
import { Upload, FileText, CheckCircle, AlertCircle, X, Download } from 'lucide-react';

const ExamDataUpload = ({ onClose, onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [examType, setExamType] = useState('end_sem');
  const [uploadedFile, setUploadedFile] = useState(null);

  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploadedFile(file);
    setUploading(true);
    setError('');
    setMessage('');

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
      
      // Call the success callback to refresh data
      if (onUploadSuccess) {
        onUploadSuccess();
      }
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
          <button className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
            <Download className="w-4 h-4" />
            <span className="text-sm">Download Template</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-sm font-medium text-green-800">{message}</p>
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
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">File Format Requirements</h4>
        <div className="space-y-1 text-xs text-blue-800">
          <p><strong>Required columns:</strong> Student ID, Subject grades (Math, Science, English, etc.)</p>
          <p><strong>Optional columns:</strong> Student Name, Semester, Academic Year</p>
          <p><strong>Grade format:</strong> Numeric values between 0-100</p>
          <p><strong>File types:</strong> .xlsx or .xls only</p>
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
