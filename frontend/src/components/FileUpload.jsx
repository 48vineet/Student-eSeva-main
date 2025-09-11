import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  X,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  CloudUpload,
  FileSpreadsheet,
  File,
  Download,
  Sparkles,
  Zap,
  Shield,
  Info,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  BarChart3,
  Users,
  Target,
} from "lucide-react";
import { useStudents } from "../context/StudentContext";

const FileUpload = ({ onClose, onSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState([]);
  const [error, setError] = useState(null);
  const { actions } = useStudents();

  const onDrop = useCallback(
    async (acceptedFiles) => {
      setUploading(true);
      setError(null);
      setUploadResults([]);

      let lastSuccessfulResult = null;
      let hasError = false;

      for (const file of acceptedFiles) {
        try {
          const result = await actions.uploadStudents(file);

          setUploadResults((prev) => [
            ...prev,
            {
              filename: file.name,
              status: "success",
              studentsCount: result.students ? result.students.length : 0,
              summary: result.summary,
            },
          ]);

          lastSuccessfulResult = result;
        } catch (error) {
          setUploadResults((prev) => [
            ...prev,
            {
              filename: file.name,
              status: "error",
              error: error.message,
            },
          ]);
          setError(error.message);
          hasError = true;
        }
      }

      setUploading(false);

      // Call success callback only once after all files are processed
      if (lastSuccessfulResult && onSuccess) {
        onSuccess(lastSuccessfulResult);
      }
    },
    [actions, onSuccess]
  );

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } =
    useDropzone({
      onDrop,
      accept: {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
          ".xlsx",
        ],
        "application/vnd.ms-excel": [".xls"],
        "text/csv": [".csv"],
      },
      multiple: true,
    });

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900/80 via-blue-900/60 to-indigo-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-5xl w-full max-h-[95vh] flex flex-col border border-white/20 animate-fade-in-up">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 text-white rounded-t-3xl">
          <div className="absolute inset-0 bg-black/10 rounded-t-3xl"></div>
          <div className="relative flex justify-between items-start">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                <CloudUpload className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                  Upload Student Data
                </h2>
                <p className="text-blue-100 mt-1 text-lg">
                  Transform your data into actionable insights
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-white/20 rounded-xl backdrop-blur-sm text-white/80 transition-all duration-200 transform active:scale-95"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Enhanced Dropzone - More Compact */}
          <div
            {...getRootProps()}
            className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer group
              ${
                isDragActive
                  ? "border-blue-400 bg-gradient-to-br from-blue-50 to-indigo-50 scale-[1.02] shadow-xl ring-2 ring-blue-200"
                  : "border-gray-300 bg-gradient-to-br from-gray-50 to-blue-50 hover:border-blue-300 hover:shadow-lg"
              }`}
          >
            <input {...getInputProps()} />

            <div className="flex flex-col items-center space-y-4">
              {/* Animated Upload Icon */}
              <div className="relative">
                <div
                  className={`p-4 rounded-2xl transition-all duration-300 ${
                    isDragActive 
                      ? "bg-gradient-to-br from-blue-100 to-indigo-100 scale-110" 
                      : "bg-gradient-to-br from-gray-100 to-blue-100"
                  }`}
                >
                  <CloudUpload
                    className={`w-12 h-12 transition-all duration-300 ${
                      isDragActive ? "text-blue-600 scale-110" : "text-gray-500"
                    }`}
                  />
                </div>
                {isDragActive && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>

              {isDragActive ? (
                <div className="space-y-1">
                  <p className="text-xl font-bold text-blue-600 animate-pulse">
                    Drop files here...
                  </p>
                  <p className="text-blue-500">Release to upload</p>
                  <div className="flex items-center justify-center space-x-1 mt-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xl font-bold text-gray-800">
                    Drag & drop your files here
                  </p>
                  <p className="text-gray-600">
                    or click to browse from your computer
                  </p>
                  <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-2xl font-semibold transition-all duration-200 transform active:scale-95 shadow-lg">
                    <Upload className="w-4 h-4" />
                    <span>Choose Files</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              )}
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-3 right-3 opacity-20">
              <Sparkles className="w-6 h-6 text-blue-400 animate-pulse" />
            </div>
            <div className="absolute bottom-3 left-3 opacity-20">
              <Zap className="w-5 h-5 text-indigo-400 animate-pulse" style={{animationDelay: '0.5s'}} />
            </div>
          </div>

          {/* Compact Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Supported Formats Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-4 animate-fade-in-up shadow-sm hover:shadow-md transition-shadow duration-200" style={{animationDelay: '0.1s'}}>
              <div className="flex items-center space-x-2 mb-3">
                <div className="p-1.5 bg-blue-100 rounded-lg">
                  <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                </div>
                <h4 className="font-bold text-blue-800 text-sm">Supported Formats</h4>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  <span className="text-blue-700 text-sm">Excel (.xlsx, .xls)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  <span className="text-blue-700 text-sm">CSV (.csv)</span>
                </div>
              </div>
            </div>

            {/* Data Replacement Warning */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-4 animate-fade-in-up shadow-sm hover:shadow-md transition-shadow duration-200" style={{animationDelay: '0.2s'}}>
              <div className="flex items-center space-x-2 mb-3">
                <div className="p-1.5 bg-amber-100 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                </div>
                <h4 className="font-bold text-amber-800 text-sm">Important</h4>
              </div>
              <p className="text-amber-700 text-sm leading-relaxed">
                New upload will <strong className="text-amber-900">replace all existing data</strong>.
              </p>
            </div>

            {/* Quick Requirements */}
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100 rounded-2xl p-4 animate-fade-in-up shadow-sm hover:shadow-md transition-shadow duration-200" style={{animationDelay: '0.3s'}}>
              <div className="flex items-center space-x-2 mb-3">
                <div className="p-1.5 bg-emerald-100 rounded-lg">
                  <Target className="w-4 h-4 text-emerald-600" />
                </div>
                <h4 className="font-bold text-emerald-800 text-sm">Required Columns</h4>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  <span className="text-emerald-700 text-sm">Student ID or Name</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Info className="w-3 h-3 text-emerald-500" />
                  <span className="text-emerald-700 text-sm">Other fields optional</span>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Requirements - Collapsible */}
          <div className="bg-gradient-to-br from-gray-50 to-blue-50 border border-gray-100 rounded-2xl p-4 animate-fade-in-up shadow-sm" style={{animationDelay: '0.4s'}}>
            <details className="group">
              <summary className="flex items-center space-x-2 cursor-pointer list-none">
                <div className="p-1.5 bg-gray-100 rounded-lg group-open:bg-blue-100 transition-colors">
                  <Info className="w-4 h-4 text-gray-600 group-open:text-blue-600" />
                </div>
                <h4 className="font-bold text-gray-800 group-open:text-blue-800">Detailed Column Requirements</h4>
                <ArrowRight className="w-4 h-4 text-gray-500 group-open:rotate-90 transition-transform" />
              </summary>
              
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Essential Columns */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-emerald-600" />
                      <h5 className="font-semibold text-emerald-900 text-sm">Essential (at least one)</h5>
                    </div>
                    <div className="space-y-1.5 pl-6">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-700 text-sm">Student ID, ID, or any identifier</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-700 text-sm">Student Name, Name, or Student</span>
                      </div>
                    </div>
                  </div>

                  {/* Optional Columns */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Info className="w-4 h-4 text-emerald-600" />
                      <h5 className="font-semibold text-emerald-900 text-sm">Optional (with defaults)</h5>
                    </div>
                    <div className="space-y-1.5 pl-6">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-700 text-sm">Email, Parent Email</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <BarChart3 className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-700 text-sm">Attendance Rate, Grades</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-700 text-sm">Fee Status, Days Overdue</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </details>
          </div>

          {/* Enhanced Upload Progress - More Compact */}
          {uploading && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6 animate-fade-in-up shadow-sm">
              <div className="flex items-center space-x-3 mb-4">
                <div className="relative">
                  <div className="animate-spin rounded-full h-6 w-6 border-3 border-blue-200 border-t-blue-600"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Zap className="w-3 h-3 text-blue-600 animate-pulse" />
                  </div>
                </div>
                <div>
                  <p className="text-lg font-bold text-blue-800">Processing files...</p>
                  <p className="text-blue-600 text-sm">Analyzing and importing student data</p>
                </div>
              </div>
              
              {/* Animated Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-blue-700">
                  <span>Upload Progress</span>
                  <span>60%</span>
                </div>
                <div className="bg-blue-200 rounded-full h-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full animate-pulse relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                  </div>
                </div>
                <div className="flex items-center justify-center space-x-1 text-blue-600">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Upload Results - More Compact */}
          {uploadResults.length > 0 && (
            <div className="space-y-3 animate-fade-in-up">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-green-100 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <h4 className="text-lg font-bold text-gray-900">Upload Results</h4>
              </div>
              
              <div className="grid gap-3">
                {uploadResults.map((result, index) => (
                  <div
                    key={index}
                    className={`relative overflow-hidden rounded-2xl border transition-all duration-300 animate-fade-in-up shadow-sm ${
                      result.status === "success"
                        ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-100"
                        : "bg-gradient-to-br from-red-50 to-rose-50 border-red-100"
                    }`}
                    style={{animationDelay: `${index * 0.1}s`}}
                  >
                    <div className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${
                          result.status === "success" 
                            ? "bg-green-100" 
                            : "bg-red-100"
                        }`}>
                          {result.status === "success" ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-600" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <File className="w-3 h-3 text-gray-500" />
                            <p className={`font-bold ${
                              result.status === "success"
                                ? "text-green-900"
                                : "text-red-900"
                            }`}>
                              {result.filename}
                            </p>
                          </div>
                          
                          <p className={`text-sm ${
                            result.status === "success"
                              ? "text-green-700"
                              : "text-red-700"
                          }`}>
                            {result.status === "success"
                              ? `${result.studentsCount} students processed successfully`
                              : result.error}
                          </p>
                          
                          {result.status === "success" && result.summary && (
                            <div className="mt-3 grid grid-cols-3 gap-2">
                              <div className="text-center p-2 bg-red-100 rounded-lg">
                                <div className="text-lg font-bold text-red-600">{result.summary.high}</div>
                                <div className="text-xs text-red-700">High Risk</div>
                              </div>
                              <div className="text-center p-2 bg-yellow-100 rounded-lg">
                                <div className="text-lg font-bold text-yellow-600">{result.summary.medium}</div>
                                <div className="text-xs text-yellow-700">Medium Risk</div>
                              </div>
                              <div className="text-center p-2 bg-green-100 rounded-lg">
                                <div className="text-lg font-bold text-green-600">{result.summary.low}</div>
                                <div className="text-xs text-green-700">Low Risk</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Enhanced Error Display - More Compact */}
          {error && (
            <div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-100 rounded-2xl p-4 animate-fade-in-up shadow-sm">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-red-100 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <p className="font-bold text-red-800">Upload Error</p>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Footer - More Compact */}
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 border-t border-gray-100 p-4 rounded-b-3xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2 text-gray-600">
              <Shield className="w-3 h-3" />
              <span className="text-xs">Secure file processing</span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-2xl font-semibold transition-all duration-200 transform active:scale-95 shadow-sm text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
