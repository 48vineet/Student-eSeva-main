import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Save,
  RefreshCw,
  ArrowLeft,
  Settings as SettingsIcon,
  AlertTriangle,
  CheckCircle,
  Shield,
  Users,
  TrendingUp,
  Clock,
  DollarSign,
  BookOpen,
  Target,
  Zap,
  Sparkles,
  Activity,
  BarChart3,
  Eye,
  Heart,
  Lightbulb,
  Database,
  Globe,
  Lock,
  Unlock,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Info,
  ArrowRight,
  Star,
  Award,
  Bell,
} from "lucide-react";
import { useConfig } from "../context/ConfigContext";
import { useNotification } from "../hooks/useNotification";

const Settings = () => {
  const { config, loading, error, updateConfig, fetchConfig, resetConfig } = useConfig();
  const { notifications, showSuccess, showError, removeNotification } =
    useNotification();

  const [formData, setFormData] = useState({
    attendanceCritical: 75,
    attendanceWarning: 85,
    passCriteria: 60,
    failingHigh: 2,
    failingMedium: 1,
    overdueDays: 30,
    maxAttempts: 3,
    institutionName: "Student eSeva Institution",
    academicYear: new Date().getFullYear().toString(),
    semester: "1",
    emailNotifications: true,
    smsNotifications: false,
  });

  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('attendance');

  // Load config into form when it changes
  useEffect(() => {
    if (config) {
      setFormData(config);
    }
  }, [config]);

  // Fetch config when component mounts
  useEffect(() => {
    fetchConfig();
  }, []);

  // Check for changes
  useEffect(() => {
    if (config) {
      const changed = Object.keys(formData).some(
        (key) => formData[key] !== config[key]
      );
      setHasChanges(changed);
    }
  }, [formData, config]);

  // Animation trigger
  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateConfig(formData);
      showSuccess("Configuration updated successfully!");
      setHasChanges(false);
    } catch (err) {
      showError("Failed to update configuration. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (config) {
      setFormData(config);
      setHasChanges(false);
    }
  };

  const handleRefresh = async () => {
    try {
      await fetchConfig();
      showSuccess("Configuration refreshed from server");
    } catch (err) {
      showError("Failed to refresh configuration");
    }
  };

  const tabs = [
    { id: 'attendance', label: 'Attendance', icon: Users, color: 'from-blue-500 to-cyan-500' },
    { id: 'academic', label: 'Academic', icon: BookOpen, color: 'from-emerald-500 to-teal-500' },
    { id: 'financial', label: 'Financial', icon: DollarSign, color: 'from-yellow-500 to-orange-500' },
    { id: 'institution', label: 'Institution', icon: Globe, color: 'from-indigo-500 to-purple-500' },
    { id: 'notifications', label: 'Notifications', icon: Bell, color: 'from-pink-500 to-rose-500' },
    { id: 'preview', label: 'Preview', icon: Eye, color: 'from-purple-500 to-pink-500' },
  ];

  const configSections = [
    {
      id: 'attendance',
      title: 'Attendance Thresholds',
      description: 'Set the attendance rate boundaries for risk classification',
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'from-blue-50 to-cyan-50',
      fields: [
        {
          key: 'attendanceCritical',
          label: 'Critical Attendance Threshold (%)',
          description: 'Students below this rate are marked as HIGH RISK',
          type: 'number',
          min: 0,
          max: 100,
          step: 0.1,
          riskLevel: 'HIGH',
          riskColor: 'text-red-600'
        },
        {
          key: 'attendanceWarning',
          label: 'Warning Attendance Threshold (%)',
          description: 'Students below this rate are marked as MEDIUM RISK',
          type: 'number',
          min: 0,
          max: 100,
          step: 0.1,
          riskLevel: 'MEDIUM',
          riskColor: 'text-yellow-600'
        }
      ]
    },
    {
      id: 'academic',
      title: 'Academic Performance',
      description: 'Configure pass criteria and failing subject thresholds',
      icon: BookOpen,
      color: 'from-emerald-500 to-teal-500',
      bgColor: 'from-emerald-50 to-teal-50',
      fields: [
        {
          key: 'passCriteria',
          label: 'Pass Criteria (out of 100)',
          description: 'Minimum score required to pass a subject (0-100)',
          type: 'number',
          min: 0,
          max: 100,
          riskLevel: 'INFO',
          riskColor: 'text-blue-600'
        },
        {
          key: 'failingHigh',
          label: 'High Risk Failing Subjects',
          description: 'Students failing this many or more subjects → HIGH RISK',
          type: 'number',
          min: 1,
          max: 10,
          riskLevel: 'HIGH',
          riskColor: 'text-red-600'
        },
        {
          key: 'failingMedium',
          label: 'Medium Risk Failing Subjects',
          description: 'Students failing this many subjects → MEDIUM RISK',
          type: 'number',
          min: 1,
          max: 10,
          riskLevel: 'MEDIUM',
          riskColor: 'text-yellow-600'
        }
      ]
    },
    {
      id: 'financial',
      title: 'Financial & Attempt Limits',
      description: 'Set thresholds for fee payments and subject attempts',
      icon: DollarSign,
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'from-yellow-50 to-orange-50',
      fields: [
        {
          key: 'overdueDays',
          label: 'Fee Overdue Days (High Risk)',
          description: 'Fees overdue for this many days → HIGH RISK',
          type: 'number',
          min: 1,
          max: 365,
          riskLevel: 'HIGH',
          riskColor: 'text-red-600'
        },
        {
          key: 'maxAttempts',
          label: 'Max Subject Attempts',
          description: 'Students who exhaust attempts → HIGH RISK',
          type: 'number',
          min: 1,
          max: 10,
          riskLevel: 'HIGH',
          riskColor: 'text-red-600'
        }
      ]
    },
    {
      id: 'institution',
      title: 'Institution Settings',
      description: 'Configure institution details and academic information',
      icon: Globe,
      color: 'from-indigo-500 to-purple-500',
      bgColor: 'from-indigo-50 to-purple-50',
      fields: [
        {
          key: 'institutionName',
          label: 'Institution Name',
          description: 'Name of your educational institution',
          type: 'text',
          riskLevel: 'INFO',
          riskColor: 'text-blue-600'
        },
        {
          key: 'academicYear',
          label: 'Academic Year',
          description: 'Current academic year (e.g., 2024)',
          type: 'text',
          riskLevel: 'INFO',
          riskColor: 'text-blue-600'
        },
        {
          key: 'semester',
          label: 'Current Semester',
          description: 'Current semester or term',
          type: 'select',
          options: [
            { value: '1', label: 'Semester 1' },
            { value: '2', label: 'Semester 2' },
            { value: '3', label: 'Semester 3' },
            { value: '4', label: 'Semester 4' },
            { value: '5', label: 'Semester 5' },
            { value: '6', label: 'Semester 6' },
            { value: '7', label: 'Semester 7' },
            { value: '8', label: 'Semester 8' },
            { value: 'Summer', label: 'Summer Term' },
            { value: 'Winter', label: 'Winter Term' }
          ],
          riskLevel: 'INFO',
          riskColor: 'text-blue-600'
        }
      ]
    },
    {
      id: 'notifications',
      title: 'Notification Settings',
      description: 'Configure how alerts and notifications are sent',
      icon: Bell,
      color: 'from-pink-500 to-rose-500',
      bgColor: 'from-pink-50 to-rose-50',
      fields: [
        {
          key: 'emailNotifications',
          label: 'Email Notifications',
          description: 'Send alerts via email to stakeholders',
          type: 'checkbox',
          riskLevel: 'INFO',
          riskColor: 'text-blue-600'
        },
        {
          key: 'smsNotifications',
          label: 'SMS Notifications',
          description: 'Send alerts via SMS (requires SMS service setup)',
          type: 'checkbox',
          riskLevel: 'INFO',
          riskColor: 'text-blue-600'
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link
              to="/dashboard"
              className="group flex items-center space-x-2 px-4 py-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-200 transform hover:scale-105"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-200" />
              <span>Back to Dashboard</span>
            </Link>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                <SettingsIcon className="w-8 h-8 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">System Configuration</span>
            </div>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="group flex items-center space-x-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 group-hover:rotate-180 transition-transform duration-500 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className={`text-center mb-12 transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 mb-8 border border-white/20">
            <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
            <span className="text-white/90 font-medium">AI-Powered Configuration</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-blue-100 to-cyan-100 bg-clip-text text-transparent leading-tight">
            System Configuration
          </h1>
          
          <p className="text-xl md:text-2xl text-white/80 max-w-4xl mx-auto leading-relaxed">
            Fine-tune risk assessment thresholds and system behavior to match your institution's specific needs
          </p>
        </div>

        {/* Tab Navigation */}
        <div className={`mb-8 transform transition-all duration-1000 delay-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="flex flex-wrap justify-center gap-4">
            {tabs.map((tab, index) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group relative flex items-center space-x-3 px-6 py-4 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                  activeTab === tab.id
                    ? `bg-gradient-to-r ${tab.color} text-white shadow-2xl`
                    : 'bg-white/10 backdrop-blur-sm text-white/80 hover:bg-white/20 hover:text-white border border-white/20'
                }`}
                style={{animationDelay: `${index * 0.1}s`}}
              >
                <tab.icon className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                <span>{tab.label}</span>
                {activeTab === tab.id && (
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-2xl"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Configuration Sections */}
        <div className={`transform transition-all duration-1000 delay-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          {activeTab !== 'preview' && (
            <div className="space-y-8">
              {configSections
                .filter(section => section.id === activeTab)
                .map((section) => (
                  <div
                    key={section.id}
                    className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-500 transform hover:scale-[1.02]"
                  >
                    <div className="flex items-center space-x-4 mb-8">
                      <div className={`p-4 rounded-2xl bg-gradient-to-r ${section.color}`}>
                        <section.icon className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold text-white mb-2">{section.title}</h2>
                        <p className="text-white/70 text-lg">{section.description}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {section.fields.map((field, index) => (
                        <div
                          key={field.key}
                          className="group bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 transform hover:scale-105"
                          style={{animationDelay: `${index * 0.1}s`}}
                        >
                          <label className="block text-lg font-semibold text-white mb-3">
                            {field.label}
                          </label>
                          <div className="relative">
                            {field.type === 'select' ? (
                              <select
                                value={formData[field.key]}
                                onChange={(e) => handleInputChange(field.key, e.target.value)}
                                className="w-full px-6 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white text-xl font-semibold focus:ring-4 focus:ring-white/30 focus:border-transparent transition-all duration-300 appearance-none"
                              >
                                {field.options?.map((option) => (
                                  <option key={option.value} value={option.value} className="bg-gray-800 text-white">
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            ) : field.type === 'checkbox' ? (
                              <div className="flex items-center space-x-4">
                                <input
                                  type="checkbox"
                                  checked={formData[field.key]}
                                  onChange={(e) => handleInputChange(field.key, e.target.checked)}
                                  className="w-6 h-6 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-4 focus:ring-white/30"
                                />
                                <span className="text-white/80 text-lg">
                                  {formData[field.key] ? 'Enabled' : 'Disabled'}
                                </span>
                              </div>
                            ) : (
                              <input
                                type={field.type}
                                min={field.min}
                                max={field.max}
                                step={field.step}
                                value={formData[field.key]}
                                onChange={(e) => handleInputChange(field.key, e.target.value)}
                                className="w-full px-6 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white text-xl font-semibold focus:ring-4 focus:ring-white/30 focus:border-transparent transition-all duration-300 placeholder-white/50"
                                placeholder={`Enter ${field.label.toLowerCase()}`}
                              />
                            )}
                            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                              <div className={`p-2 rounded-lg bg-gradient-to-r ${section.color}`}>
                                <Target className="w-4 h-4 text-white" />
                              </div>
                            </div>
                          </div>
                          <p className="text-white/60 mt-3 text-sm leading-relaxed">
                            {field.description}
                          </p>
                          <div className="mt-4 flex items-center space-x-2">
                            <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${section.color} text-white text-sm font-bold`}>
                              {field.riskLevel} RISK
                            </div>
                            <span className="text-white/60 text-sm">Trigger Level</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Preview Tab */}
          {activeTab === 'preview' && (
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
              <div className="flex items-center space-x-4 mb-8">
                <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500">
                  <Eye className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">Risk Assessment Preview</h2>
                  <p className="text-white/70 text-lg">See how your current settings will categorize students</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* High Risk */}
                <div className="group bg-gradient-to-br from-red-500/20 to-rose-500/20 backdrop-blur-sm rounded-2xl p-6 border border-red-500/30 hover:bg-red-500/30 transition-all duration-300 transform hover:scale-105">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-3 bg-red-500 rounded-xl">
                      <AlertTriangle className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">High Risk</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-red-200">
                      <Users className="w-4 h-4" />
                      <span>Attendance ≤ {formData.attendanceCritical}%</span>
                    </div>
                    <div className="flex items-center space-x-2 text-red-200">
                      <BookOpen className="w-4 h-4" />
                      <span>{formData.failingHigh}+ subjects failing</span>
                    </div>
                    <div className="flex items-center space-x-2 text-red-200">
                      <DollarSign className="w-4 h-4" />
                      <span>Fees overdue {formData.overdueDays}+ days</span>
                    </div>
                    <div className="flex items-center space-x-2 text-red-200">
                      <Target className="w-4 h-4" />
                      <span>Exhausted {formData.maxAttempts} attempts</span>
                    </div>
                  </div>
                </div>

                {/* Medium Risk */}
                <div className="group bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-sm rounded-2xl p-6 border border-yellow-500/30 hover:bg-yellow-500/30 transition-all duration-300 transform hover:scale-105">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-3 bg-yellow-500 rounded-xl">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">Medium Risk</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-yellow-200">
                      <Users className="w-4 h-4" />
                      <span>Attendance {formData.attendanceCritical + 0.1}-{formData.attendanceWarning}%</span>
                    </div>
                    <div className="flex items-center space-x-2 text-yellow-200">
                      <BookOpen className="w-4 h-4" />
                      <span>{formData.failingMedium} subject failing</span>
                    </div>
                    <div className="flex items-center space-x-2 text-yellow-200">
                      <DollarSign className="w-4 h-4" />
                      <span>Fees pending payment</span>
                    </div>
                    <div className="flex items-center space-x-2 text-yellow-200">
                      <TrendingUp className="w-4 h-4" />
                      <span>Grade declining trends</span>
                    </div>
                  </div>
                </div>

                {/* Low Risk */}
                <div className="group bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-sm rounded-2xl p-6 border border-green-500/30 hover:bg-green-500/30 transition-all duration-300 transform hover:scale-105">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-3 bg-green-500 rounded-xl">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">Low Risk</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-green-200">
                      <Users className="w-4 h-4" />
                      <span>Attendance &gt; {formData.attendanceWarning}%</span>
                    </div>
                    <div className="flex items-center space-x-2 text-green-200">
                      <BookOpen className="w-4 h-4" />
                      <span>All subjects passing</span>
                    </div>
                    <div className="flex items-center space-x-2 text-green-200">
                      <DollarSign className="w-4 h-4" />
                      <span>Fees current</span>
                    </div>
                    <div className="flex items-center space-x-2 text-green-200">
                      <Award className="w-4 h-4" />
                      <span>Good academic standing</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className={`mt-12 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-6 transform transition-all duration-1000 delay-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <div className="flex space-x-4">
              <button
                onClick={handleReset}
                disabled={!hasChanges || saving}
                className="group flex items-center space-x-2 px-6 py-3 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RotateCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-300" />
                <span>Reset Changes</span>
              </button>
              <button
                onClick={async () => {
                  try {
                    await resetConfig();
                    showSuccess("Configuration reset to defaults");
                    setHasChanges(false);
                  } catch (err) {
                    showError("Failed to reset configuration");
                  }
                }}
                disabled={saving}
                className="group flex items-center space-x-2 px-6 py-3 text-red-300 hover:text-red-100 bg-red-500/20 hover:bg-red-500/30 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RotateCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-300" />
                <span>Reset to Defaults</span>
              </button>
            </div>

            <div className="flex items-center space-x-6">
              {hasChanges && (
                <div className="flex items-center space-x-2 text-yellow-400 animate-pulse">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-semibold">Unsaved changes</span>
                </div>
              )}

              <button
                onClick={handleSave}
                disabled={!hasChanges || saving}
                className="group relative inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 text-white text-lg font-bold rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-300 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                    <span>Saving Configuration...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform duration-300" />
                    <span>Save Configuration</span>
                    <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform duration-300" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Notifications */}
      <div className="fixed top-4 right-4 space-y-2 z-50">
        {notifications.map((notification, index) => (
          <div
            key={notification.id}
            className={`group px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-sm border text-white transform transition-all duration-300 animate-slide-in-right hover:scale-105 ${
              notification.type === "success"
                ? "bg-gradient-to-r from-green-500 to-emerald-600 border-green-400"
                : notification.type === "error"
                ? "bg-gradient-to-r from-red-500 to-rose-600 border-red-400"
                : notification.type === "warning"
                ? "bg-gradient-to-r from-yellow-500 to-orange-600 border-yellow-400"
                : "bg-gradient-to-r from-blue-500 to-indigo-600 border-blue-400"
            }`}
            style={{animationDelay: `${index * 0.1}s`}}
          >
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {notification.type === "success" && <CheckCircle2 className="w-5 h-5" />}
                {notification.type === "error" && <XCircle className="w-5 h-5" />}
                {notification.type === "warning" && <AlertTriangle className="w-5 h-5" />}
                {!notification.type && <Info className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{notification.message}</p>
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:scale-110 transform"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Settings;
