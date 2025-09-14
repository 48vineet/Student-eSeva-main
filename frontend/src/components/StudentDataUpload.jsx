import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Users, Mail, AlertCircle, CheckCircle } from 'lucide-react';

const StudentDataUpload = ({ onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sendEmails, setSendEmails] = useState(false);

  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    setError('');
    setMessage('Uploading and processing data...');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'student-data'); // Add type to indicate student data upload
    formData.append('send_emails', sendEmails.toString()); // Add email sending preference

    try {
      const response = await fetch('http://localhost:3001/api/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      const emailMessage = data.emailsSent ? 
        ` and sent emails to ${data.emailCount} recipients` : 
        ' (emails not sent)';
      setMessage(`Successfully uploaded ${data.createdCount} student records${emailMessage}`);
      
      // Show success message briefly and then close modal
      setTimeout(() => {
        if (onUploadSuccess) {
          onUploadSuccess();
        }
      }, 800); // Reduced to 0.8 seconds for faster response
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    multiple: false,
  });

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
          isDragActive
            ? 'border-indigo-400 bg-indigo-50 scale-105'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} disabled={uploading} />
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
            {uploading ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            ) : (
              <Upload className="w-8 h-8 text-indigo-600" />
            )}
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {uploading ? 'Uploading Student Data...' : 'Upload Student Data'}
            </h3>
            <div className="text-sm text-gray-600">
              {isDragActive ? (
                <span className="text-indigo-600 font-medium">Drop the file here...</span>
              ) : (
                <>
                  <span className="font-medium text-indigo-600 hover:text-indigo-500">
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

      {/* Email Options */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="sendEmails"
            checked={sendEmails}
            onChange={(e) => setSendEmails(e.target.checked)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label htmlFor="sendEmails" className="text-sm font-medium text-gray-700 flex items-center space-x-2">
            <Mail className="w-4 h-4" />
            <span>Send emails to students and parents automatically</span>
          </label>
        </div>
        <p className="text-xs text-gray-500 mt-2 ml-7">
          If unchecked, you can send emails later using the Email Alerts feature
        </p>
      </div>

      {/* Success Message */}
      {message && (
        <div className="rounded-xl bg-green-50 border-2 border-green-300 p-6 animate-pulse">
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-lg font-bold text-green-800">🎉 Upload Successful!</h4>
              <p className="text-sm text-green-700 mt-2">{message}</p>
              <p className="text-xs text-green-600 mt-2">Redirecting to dashboard...</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-red-800">Upload Failed</h4>
              <p className="text-sm text-red-700 mt-1">{error}</p>
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
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-700"><strong>Required columns:</strong></span>
              </div>
              <ul className="ml-6 space-y-1 text-sm text-blue-700">
                <li>• Student ID (unique identifier)</li>
                <li>• Student Name</li>
                <li>• Attendance Rate (0-100)</li>
                <li>• Student Email</li>
                <li>• Parent Email</li>
              </ul>
            </div>

            <div className="flex items-start space-x-2">
              <Mail className="w-4 h-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-700">
                <strong>Email Automation:</strong> After upload, emails will be automatically sent to both students and parents with action buttons (Taken Action/Reject).
              </div>
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
                <th className="px-3 py-2 text-left font-medium text-gray-700">Attendance Rate</th>
                <th className="px-3 py-2 text-left font-medium text-gray-700">Student Email</th>
                <th className="px-3 py-2 text-left font-medium text-gray-700">Parent Email</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              <tr>
                <td className="px-3 py-2 text-gray-600">ST001</td>
                <td className="px-3 py-2 text-gray-600">John Doe</td>
                <td className="px-3 py-2 text-gray-600">85</td>
                <td className="px-3 py-2 text-gray-600">john@student.edu</td>
                <td className="px-3 py-2 text-gray-600">parent@email.com</td>
              </tr>
              <tr>
                <td className="px-3 py-2 text-gray-600">ST002</td>
                <td className="px-3 py-2 text-gray-600">Jane Smith</td>
                <td className="px-3 py-2 text-gray-600">92</td>
                <td className="px-3 py-2 text-gray-600">jane@student.edu</td>
                <td className="px-3 py-2 text-gray-600">parent2@email.com</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StudentDataUpload;
