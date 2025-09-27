# Student eSeva - Early Warning System

A comprehensive student early warning system built with React.js and Node.js that uses machine learning to predict student risk levels and provide proactive interventions.

## 🎯 Project Overview

Student eSeva is an intelligent early warning system designed to identify students at risk of academic failure, financial stress, or attendance issues. The system uses a hybrid approach combining rule-based algorithms with machine learning techniques to provide accurate risk assessments and actionable recommendations.

### Key Features

- **Multi-Role Dashboard System**: Separate dashboards for students, parents, faculty, counselors, exam department, and local guardians
- **Intelligent Risk Assessment**: ML-powered risk prediction using multiple data points
- **Real-time Data Processing**: Dynamic risk calculation based on live data updates
- **Comprehensive Reporting**: Detailed PDF reports with visual analytics
- **Email Alert System**: Automated notifications for stakeholders
- **File Upload System**: Support for Excel/CSV data imports
- **Role-based Access Control**: Secure authentication and authorization

## 🏗️ Architecture

### Frontend (React.js)
- **Framework**: React 19.1.1 with Vite
- **Styling**: Tailwind CSS 4.1.13
- **State Management**: React Context API
- **Routing**: React Router DOM 7.8.2
- **Charts**: Recharts 3.2.0
- **PDF Generation**: jsPDF 3.0.2 + html2canvas 1.4.1

### Backend (Node.js)
- **Runtime**: Node.js with Express 5.1.0
- **Database**: MongoDB with Mongoose 8.18.1
- **Authentication**: JWT (jsonwebtoken 9.0.2)
- **Security**: Helmet 8.1.0, CORS 2.8.5
- **File Processing**: Multer 2.0.2, ExcelJS 4.4.0
- **Email**: Nodemailer 7.0.6

## 🤖 Machine Learning Model

### Model Architecture

The system uses a **hybrid approach** combining rule-based algorithms with machine learning techniques:

#### 1. **Rule-Based Risk Calculator** (`riskCalculator.js`)
- **Type**: Transparent rule-based system
- **Purpose**: Primary risk assessment engine
- **Features**:
  - Dynamic configuration loading from database
  - Multi-factor risk scoring
  - Grade progression analysis
  - Attendance pattern recognition
  - Financial stress indicators

#### 2. **JavaScript ML Service** (`jsMlService.js`)
- **Type**: Custom JavaScript implementation
- **Purpose**: ML-powered risk prediction
- **Algorithm**: Weighted scoring with probability distribution
- **Features**:
  - Dynamic weight adjustment
  - Probability-based risk classification
  - Real-time configuration updates

### Risk Assessment Factors

#### **Attendance Analysis**
```javascript
// Critical attendance threshold
if (attendance_rate < 75%) {
  score += 40; // Critical risk
} else if (attendance_rate < 85%) {
  score += 20; // Warning level
}
```

#### **Academic Performance**
```javascript
// Failing subjects analysis
if (failing_count >= 2) {
  score += 35; // High risk
} else if (failing_count >= 1) {
  score += 15; // Medium risk
}
```

#### **Financial Status**
```javascript
// Fee overdue analysis
if (days_overdue >= 30) {
  score += 25; // Financial stress
} else if (isPending) {
  score += 10; // Pending fees
}
```

#### **Grade Progression Analysis**
```javascript
// Trend analysis across exams
const declinePercentage = (start - end) / start * 100;
if (declinePercentage > 15) {
  trend = 'declining'; // Risk indicator
}
```

### ML Algorithm Details

#### **Risk Scoring Formula**
```javascript
Risk Score = (Attendance Weight × Attendance Score) + 
             (Academic Weight × Academic Score) + 
             (Financial Weight × Financial Score)
```

#### **Probability Distribution**
```javascript
// High Risk (score >= 60)
probabilities = {
  high: Math.min(0.99, score / 100),
  medium: Math.max(0.01, (score - 60) / 40 * 0.3),
  low: Math.max(0.01, 1 - (score / 100))
}
```

#### **Dynamic Configuration**
- **Weights**: Adjustable via admin panel
- **Thresholds**: Configurable risk boundaries
- **Real-time Updates**: Immediate effect on risk calculations

### Regression Techniques Used

1. **Linear Regression**: For grade progression analysis
2. **Weighted Scoring**: For multi-factor risk assessment
3. **Probability Distribution**: For risk level classification
4. **Trend Analysis**: For performance pattern recognition

## 📊 Data Models

### Student Model
```javascript
{
  student_id: String,
  name: String,
  email: String,
  parent_email: String,
  attendance_rate: Number,
  grades: [{
    subject: String,
    score: Number,
    examType: String
  }],
  unit_test_1_grades: [GradeObject],
  unit_test_2_grades: [GradeObject],
  mid_sem_grades: [GradeObject],
  end_sem_grades: [GradeObject],
  fee_status: String,
  fees_status: String,
  days_overdue: Number,
  risk_level: String,
  risk_score: Number,
  risk_factors: [String],
  recommendations: [RecommendationObject]
}
```

### User Model
```javascript
{
  username: String,
  email: String,
  password: String (hashed),
  role: String, // student, parent, faculty, counselor, exam-department, local-guardian
  student_id: String, // for students
  ward_student_id: String, // for parents/guardians
  department: String, // for faculty
  isActive: Boolean
}
```

### Config Model
```javascript
{
  attendanceWeight: Number,
  academicWeight: Number,
  financialWeight: Number,
  attendanceCritical: Number,
  attendanceWarning: Number,
  passCriteria: Number,
  failingHigh: Number,
  failingMedium: Number,
  overdueDays: Number
}
```

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- npm or yarn

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Configure your .env file with MongoDB URI, JWT secret, etc.
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Environment Variables
```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/student-eseva
JWT_SECRET=your_jwt_secret_here
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
ML_SERVICE_URL=http://localhost:5001
```

## 📦 NPM Packages

### Backend Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| `express` | ^5.1.0 | Web framework |
| `mongoose` | ^8.18.1 | MongoDB ODM |
| `jsonwebtoken` | ^9.0.2 | JWT authentication |
| `bcryptjs` | ^3.0.2 | Password hashing |
| `cors` | ^2.8.5 | Cross-origin requests |
| `helmet` | ^8.1.0 | Security headers |
| `express-rate-limit` | ^8.1.0 | Rate limiting |
| `multer` | ^2.0.2 | File upload handling |
| `exceljs` | ^4.4.0 | Excel file processing |
| `csv-parser` | ^3.2.0 | CSV file parsing |
| `nodemailer` | ^7.0.6 | Email sending |
| `axios` | ^1.11.0 | HTTP client |
| `dotenv` | ^17.2.2 | Environment variables |
| `form-data` | ^4.0.4 | Form data handling |
| `ml-matrix` | ^6.12.1 | Matrix operations for ML |
| `ml-kmeans` | ^6.0.0 | K-means clustering |
| `ml-regression-multivariate-linear` | ^2.0.4 | Multivariate linear regression |

### Frontend Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| `react` | ^19.1.1 | UI framework |
| `react-dom` | ^19.1.1 | React DOM rendering |
| `react-router-dom` | ^7.8.2 | Client-side routing |
| `axios` | ^1.11.0 | HTTP client |
| `tailwindcss` | ^4.1.13 | CSS framework |
| `@tailwindcss/vite` | ^4.1.13 | Tailwind Vite plugin |
| `lucide-react` | ^0.543.0 | Icon library |
| `recharts` | ^3.2.0 | Chart library |
| `jspdf` | ^3.0.2 | PDF generation |
| `html2canvas` | ^1.4.1 | HTML to canvas conversion |
| `react-dropzone` | ^14.3.8 | File drop zone |

### Development Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| `nodemon` | ^3.1.10 | Backend auto-restart |
| `vite` | ^7.1.2 | Frontend build tool |
| `@vitejs/plugin-react` | ^5.0.0 | React Vite plugin |
| `eslint` | ^9.33.0 | Code linting |
| `@eslint/js` | ^9.33.0 | ESLint JavaScript config |
| `eslint-plugin-react-hooks` | ^5.2.0 | React hooks linting |
| `eslint-plugin-react-refresh` | ^0.4.20 | React refresh linting |

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password

### Students
- `GET /api/students` - Get all students (counselor only)
- `GET /api/students/:id` - Get student by ID
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student
- `GET /api/students/:id/actions` - Get student actions
- `POST /api/students/cleanup-duplicates` - Cleanup duplicate students

### Uploads
- `POST /api/upload/student-data` - Upload student data
- `POST /api/upload/attendance` - Upload attendance data
- `POST /api/upload/exam-data` - Upload exam data
- `POST /api/upload/fees-data` - Upload fees data
- `DELETE /api/upload/attendance/:studentId` - Delete attendance data
- `DELETE /api/upload/exam/:studentId` - Delete exam data
- `DELETE /api/upload/fees/:studentId` - Delete fees data

### Configuration
- `GET /api/config` - Get system configuration
- `PUT /api/config` - Update system configuration

### Email Alerts
- `GET /api/email-alerts` - Get email alerts
- `POST /api/email-alerts` - Create email alert
- `PUT /api/email-alerts/:id` - Update email alert
- `DELETE /api/email-alerts/:id` - Delete email alert

### Notifications
- `POST /api/notifications` - Send notifications

## 🎨 User Interface

### Dashboard Components
- **Student Dashboard**: Personal academic overview
- **Parent Dashboard**: Child's progress monitoring
- **Faculty Dashboard**: Class performance management
- **Counselor Dashboard**: Comprehensive student analysis
- **Exam Department Dashboard**: Exam data management
- **Guardian Dashboard**: Ward monitoring

### Key Features
- **Real-time Data Updates**: Live risk score calculations
- **Interactive Charts**: Visual performance analytics
- **PDF Report Generation**: Comprehensive student reports
- **File Upload Interface**: Drag-and-drop file handling
- **Responsive Design**: Mobile-friendly interface
- **Role-based Navigation**: Context-aware UI elements

## 🔒 Security Features

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcryptjs with salt rounds
- **Role-based Access Control**: Granular permissions
- **Rate Limiting**: API request throttling
- **CORS Protection**: Cross-origin security
- **Helmet Security**: HTTP header protection
- **Input Validation**: Data sanitization

## 📈 Performance Optimizations

- **Lazy Loading**: Component-based code splitting
- **Memoization**: React.memo for expensive components
- **Database Indexing**: Optimized MongoDB queries
- **Caching**: Configuration and data caching
- **Batch Processing**: Efficient file upload handling
- **Async Operations**: Non-blocking I/O operations

## 🧪 Testing

### Manual Testing
- User registration and login flows
- File upload and processing
- Risk calculation accuracy
- Email notification delivery
- PDF generation functionality

### Test Users
```javascript
// Exam Department
Email: exam@university.edu
Password: password123

// Parent User
Email: 7038vineet@gmail.com
Password: password123

// Student User
Email: teststudent2@example.com
Password: password123
```

## 🚀 Deployment

### Backend Deployment
1. Set up MongoDB Atlas or local MongoDB
2. Configure environment variables
3. Deploy to Heroku, AWS, or similar platform
4. Set up email service (Gmail SMTP recommended)

### Frontend Deployment
1. Build the React application: `npm run build`
2. Deploy to Netlify, Vercel, or similar platform
3. Configure API endpoints for production

## 🔮 Future Enhancements

- **Advanced ML Models**: Deep learning integration
- **Predictive Analytics**: Long-term trend analysis
- **Mobile App**: React Native implementation
- **Real-time Notifications**: WebSocket integration
- **Advanced Reporting**: More chart types and analytics
- **Integration APIs**: Third-party system integration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 👥 Authors

- **Vineet Mali** - Lead Developer
Machine Learning Type in Student-eSeva
📊 Classification: Hybrid Rule-Based + Custom ML System
Your project uses a unique hybrid approach that combines multiple ML techniques:
🎯 Primary ML Type: Rule-Based Expert System
What it is:
Expert System with Rule-Based Logic
Transparent Decision Tree approach
Weighted Scoring Algorithm
How it works:
🧮 Secondary ML Type: Custom JavaScript ML Service
What it is:
Custom Weighted Linear Model
Probability Distribution Classifier
Dynamic Configuration System
Algorithm Details:
📈 Specific ML Techniques Used:
1. Linear Regression
Grade Progression Analysis
Trend Detection across multiple exams
Performance Pattern Recognition
2. Weighted Scoring
Multi-factor Risk Assessment
Dynamic Weight Adjustment
Feature Importance Ranking
3. Probability Distribution
Risk Level Classification
Confidence Scoring
Uncertainty Quantification
4. Trend Analysis
Time Series Analysis for grade progression
Pattern Recognition for declining performance
Anomaly Detection for risk factors
🔍 Technical Classification:
Supervised Learning:
✅ Classification Problem (High/Medium/Low Risk)
✅ Multi-class Classification (3 risk levels)
✅ Feature Engineering (attendance, grades, fees)
Unsupervised Learning:
✅ Pattern Recognition in grade trends
✅ Anomaly Detection for risk factors
Reinforcement Learning:
❌ Not Used (no learning from feedback)
📚 ML Libraries Used:
Backend Dependencies:
Custom Implementation:
No external ML frameworks (TensorFlow, PyTorch, Scikit-learn)
Pure JavaScript implementation
Custom algorithms built from scratch
🎯 ML Model Architecture:
🏷️ Final Classification:
Primary Type:
Rule-Based Expert System with Custom ML Algorithms
Sub-categories:
Multi-class Classification
Weighted Linear Regression
Probability Distribution
Trend Analysis
Feature Engineering
Learning Paradigm:
Hybrid Approach (Rule-based + Custom ML)
Transparent Decision Making
Dynamic Configuration
Real-time Processing
💡 Why This Approach?
🎯 Interpretability: Easy to understand why decisions are made
⚡ Performance: Fast real-time calculations
🔧 Flexibility: Easy to adjust rules and weights
📊 Transparency: Clear explanation of risk factors
🛡️ Reliability: Fallback mechanisms if ML fails
🚀 Summary:
Your Student-eSeva project uses a sophisticated hybrid ML system that combines:
Rule-Based Expert System (Primary)
Custom JavaScript ML Service (Secondary)
Linear Regression for trend analysis
Probability Distribution for classification
Weighted Scoring for multi-factor assessment
This is NOT traditional deep learning or neural networks, but rather a custom-built intelligent system that's specifically designed for educational risk assessment! 🎓✨

## 📞 Support

For support and questions, please contact:
- Email: 7038vineet@gmail.com
- GitHub Issues: [Create an issue](https://github.com/your-repo/issues)

---

**Student eSeva** - Empowering education through intelligent early warning systems.
