import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ModalUserMenu from "../components/ModalUserMenu";
import {
  AlertTriangle,
  Upload,
  Settings as SettingsIcon,
  BarChart3,
  Users,
  TrendingUp,
  Bell,
  Shield,
  Zap,
  Star,
  ArrowRight,
  CheckCircle,
  Target,
  Sparkles,
  Activity,
  BookOpen,
  Award,
  Clock,
  Database,
  Eye,
  Heart,
  Lightbulb,
  Rocket,
  Globe,
} from "lucide-react";

const Home = () => {
  const [currentFeature, setCurrentFeature] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: Upload,
      title: "Smart Data Upload",
      description: "Drag & drop Excel/CSV files for instant student risk analysis",
      color: "from-blue-500 to-cyan-500",
      bgColor: "from-blue-50 to-cyan-50",
    },
    {
      icon: BarChart3,
      title: "Real-time Analytics",
      description: "Interactive dashboards with live student performance monitoring",
      color: "from-emerald-500 to-teal-500",
      bgColor: "from-emerald-50 to-teal-50",
    },
    {
      icon: Bell,
      title: "Intelligent Alerts",
      description: "Automated notifications for at-risk students and stakeholders",
      color: "from-purple-500 to-pink-500",
      bgColor: "from-purple-50 to-pink-50",
    },
  ];

  const stats = [
    { icon: Users, label: "Students Monitored", value: "10,000+", color: "text-blue-600" },
    { icon: TrendingUp, label: "Success Rate", value: "94%", color: "text-emerald-600" },
    { icon: Clock, label: "Response Time", value: "< 2min", color: "text-orange-600" },
    { icon: Shield, label: "Data Security", value: "100%", color: "text-purple-600" },
  ];

  const riskLevels = [
    {
      level: "High Risk",
      icon: AlertTriangle,
      color: "from-red-500 to-rose-500",
      bgColor: "from-red-50 to-rose-50",
      borderColor: "border-red-200",
      criteria: "Attendance < 75% OR 2+ subjects failing OR fees overdue 30+ days",
      count: "15%",
    },
    {
      level: "Medium Risk",
      icon: Target,
      color: "from-yellow-500 to-orange-500",
      bgColor: "from-yellow-50 to-orange-50",
      borderColor: "border-yellow-200",
      criteria: "Attendance 75-85% OR 1 subject failing OR grades declining",
      count: "25%",
    },
    {
      level: "Low Risk",
      icon: CheckCircle,
      color: "from-green-500 to-emerald-500",
      bgColor: "from-green-50 to-emerald-50",
      borderColor: "border-green-200",
      criteria: "Attendance > 85% AND passing all subjects AND fees current",
      count: "60%",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      {/* Enhanced Navigation */}
      <nav className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center">
            {/* Logo Section */}
            <Link to="/" className="group flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-white group-hover:text-cyan-300 transition-colors duration-300">
                  Student eSeva
                </span>
                <span className="text-sm text-white/70 group-hover:text-white/90 transition-colors duration-300">
                  AI-Powered Student Monitoring
                </span>
              </div>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-2">
              <Link
                to="/"
                className="px-4 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 font-medium"
              >
                Home
              </Link>
              <Link
                to="/dashboard"
                className="px-4 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 font-medium"
              >
                Dashboard
              </Link>
              {isAuthenticated && user?.role === 'counselor' && (
                <Link
                  to="/settings"
                  className="px-4 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 font-medium"
                >
                  Settings
                </Link>
              )}
            </div>

            {/* Auth Section */}
            <div className="flex items-center space-x-3">
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  {/* User Info */}
                  <div className="hidden sm:flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {user?.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-white font-semibold text-sm">
                        {user?.username || 'User'}
                      </span>
                      <span className="text-white/70 text-xs capitalize">
                        {user?.role?.replace('-', ' ') || 'User'}
                      </span>
                    </div>
                  </div>
                  <ModalUserMenu />
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/login"
                    className="px-6 py-2 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 font-medium"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-20">
          <div className={`transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 mb-8 border border-white/20">
              <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
              <span className="text-white/90 font-medium">AI-Powered Student Monitoring</span>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-blue-100 to-cyan-100 bg-clip-text text-transparent leading-tight">
              Student Early Warning
              <span className="block bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                System
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-white/80 max-w-4xl mx-auto leading-relaxed mb-12">
              Transform student success with intelligent risk detection, real-time analytics, 
              and proactive intervention strategies powered by advanced machine learning.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link
                to="/dashboard"
                className="group relative inline-flex items-center px-10 py-5 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 text-white text-lg font-bold rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <Rocket className="w-6 h-6 mr-3 group-hover:rotate-12 transition-transform duration-300" />
                <span>Launch Dashboard</span>
                <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>

              <Link
                to="/settings"
                className="group inline-flex items-center px-10 py-5 bg-white/10 backdrop-blur-sm text-white text-lg font-semibold rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105"
              >
                <SettingsIcon className="w-6 h-6 mr-3 group-hover:rotate-90 transition-transform duration-300" />
                <span>Configure System</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-6 mb-20 transform transition-all duration-1000 delay-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          {stats.map((stat, index) => (
            <div
              key={index}
              className="group bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105"
              style={{animationDelay: `${index * 0.1}s`}}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-xl bg-white/20 group-hover:bg-white/30 transition-colors duration-300`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                  <div className="text-white/70 text-sm">{stat.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Features Section */}
        <div className="mb-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Powerful Features
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              Everything you need to identify, monitor, and support at-risk students
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`group relative bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 ${
                  currentFeature === index ? 'ring-2 ring-white/30' : ''
                }`}
                style={{animationDelay: `${index * 0.2}s`}}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative">
                  <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${feature.color} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-cyan-300 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-white/70 leading-relaxed group-hover:text-white/90 transition-colors duration-300">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Levels Table */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Risk Assessment Matrix
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              Our intelligent system categorizes students based on comprehensive risk factors
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left py-4 px-6 text-white/90 font-semibold">Risk Level</th>
                    <th className="text-left py-4 px-6 text-white/90 font-semibold">Percentage</th>
                    <th className="text-left py-4 px-6 text-white/90 font-semibold">Criteria</th>
                    <th className="text-left py-4 px-6 text-white/90 font-semibold">Action Required</th>
                  </tr>
                </thead>
                <tbody>
                  {riskLevels.map((risk, index) => (
                    <tr key={index} className="border-b border-white/10 hover:bg-white/5 transition-colors duration-200">
                      <td className="py-6 px-6">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg bg-gradient-to-r ${risk.color}`}>
                            <risk.icon className="w-5 h-5 text-white" />
                          </div>
                          <span className="text-white font-semibold text-lg">{risk.level}</span>
                        </div>
                      </td>
                      <td className="py-6 px-6">
                        <div className={`inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r ${risk.bgColor} border ${risk.borderColor}`}>
                          <span className={`font-bold text-lg ${risk.color.replace('from-', 'text-').replace(' to-', '-')}`}>
                            {risk.count}
                          </span>
                        </div>
                      </td>
                      <td className="py-6 px-6 text-white/80 leading-relaxed">
                        {risk.criteria}
                      </td>
                      <td className="py-6 px-6">
                        <div className="flex items-center space-x-2">
                          {index === 0 && <Bell className="w-4 h-4 text-red-400" />}
                          {index === 1 && <Eye className="w-4 h-4 text-yellow-400" />}
                          {index === 2 && <Heart className="w-4 h-4 text-green-400" />}
                          <span className="text-white/80 text-sm">
                            {index === 0 ? 'Immediate Intervention' : index === 1 ? 'Monitor Closely' : 'Continue Support'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-cyan-600/20 backdrop-blur-sm rounded-3xl p-12 border border-white/20">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Ready to Transform Student Success?
              </h2>
              <p className="text-xl text-white/80 mb-8 leading-relaxed">
                Join thousands of educators who are already using our platform to identify 
                and support at-risk students before it's too late.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <Link
                  to="/dashboard"
                  className="group relative inline-flex items-center px-12 py-6 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 text-white text-xl font-bold rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <Database className="w-7 h-7 mr-4 group-hover:rotate-12 transition-transform duration-300" />
                  <span>Start Monitoring Now</span>
                  <ArrowRight className="w-6 h-6 ml-4 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
