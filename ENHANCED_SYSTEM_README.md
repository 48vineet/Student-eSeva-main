# Enhanced Student Early Warning System

## Overview

The Enhanced Student Early Warning System is a comprehensive, role-based platform designed to identify, monitor, and support at-risk students through intelligent risk assessment and collaborative intervention workflows. The system now supports multiple user roles with tailored functionalities and secure access controls.

## 🚀 Key Features

### 1. Role-Based Access Control (RBAC)
- **Counselor**: Full system access, action management, student oversight
- **Faculty**: Attendance data upload and student monitoring
- **Exam Department**: Exam data upload and academic performance tracking
- **Student**: Personal dashboard and action history viewing
- **Parent/Guardian**: Ward monitoring and action approval workflow

### 2. Enhanced ML Risk Assessment
- **Grade Progression Analysis**: Tracks performance across unit tests, mid-semester, and end-semester exams
- **Declining Performance Detection**: Identifies students with dropping grades
- **Multi-factor Risk Scoring**: Combines attendance, academic performance, and financial status
- **Dynamic Configuration**: Adjustable thresholds and weights

### 3. Action Management & Approval Workflow
- **Counselor Actions**: Create and manage recommended actions for students
- **Parent/Guardian Approval**: Review, approve, or reject actions with reasoning
- **Status Tracking**: Real-time action status updates
- **Email Notifications**: Automated alerts for action requests and status changes

### 4. Role-Specific Dashboards
- **Tailored Interfaces**: Each role has a customized dashboard
- **Data Filtering**: Role-appropriate data access and filtering
- **Action Management**: Integrated action creation and approval workflows

## 🏗️ System Architecture

### Backend (Node.js/Express)
```
backend/
├── models/
│   ├── User.js              # User authentication and roles
│   ├── Student.js           # Enhanced student data model
│   └── Config.js            # System configuration
├── controllers/
│   ├── authController.js    # Authentication logic
│   ├── studentController.js # Student management with RBAC
│   └── uploadController.js  # Role-based file uploads
├── middleware/
│   └── auth.js              # Authentication and authorization
├── services/
│   ├── riskCalculator.js    # Enhanced risk assessment
│   ├── emailService.js      # Email notifications
│   └── jsMlService.js       # ML risk prediction
└── routes/
    ├── authRoutes.js        # Authentication endpoints
    ├── studentRoutes.js     # Student management endpoints
    └── uploadRoutes.js      # File upload endpoints
```

### Frontend (React/Vite)
```
frontend/src/
├── components/
│   ├── dashboards/          # Role-specific dashboards
│   ├── LoginPage.jsx        # User authentication
│   ├── SignupPage.jsx       # User registration
│   └── ActionManagement.jsx # Action workflow components
├── context/
│   ├── AuthContext.jsx      # Authentication state
│   └── StudentContext.jsx   # Student data management
└── utils/
    └── formatDate.js        # Date formatting utilities
```

## 🔧 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB
- npm or yarn

### Backend Setup
```bash
cd backend
npm install
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Environment Variables
Create `.env` files in both backend and frontend directories:

**Backend (.env)**
```env
MONGODB_URI=mongodb://localhost:27017/student-eseva
JWT_SECRET=your-secret-key
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
FRONTEND_URL=http://localhost:5173
```

**Frontend (.env)**
```env
VITE_API_URL=http://localhost:5001
```

## 👥 User Roles & Permissions

### Counselor
- **Access**: Full system access
- **Capabilities**:
  - View all student data
  - Upload complete student datasets
  - Create and manage actions
  - Access system configuration
  - View action status and responses

### Faculty
- **Access**: Limited to attendance management
- **Capabilities**:
  - Upload attendance data
  - View student attendance information
  - Monitor attendance trends

### Exam Department
- **Access**: Limited to exam data management
- **Capabilities**:
  - Upload exam results by type (unit tests, mid-semester, end-semester)
  - View academic performance data
  - Monitor grade progression

### Student
- **Access**: Personal data only
- **Capabilities**:
  - View own academic records
  - See action history
  - Monitor personal risk status

### Parent/Guardian
- **Access**: Ward's data only
- **Capabilities**:
  - View ward's academic performance
  - Approve or reject recommended actions
  - Provide feedback on actions

## 📊 Enhanced Risk Assessment

### Grade Progression Analysis
The system now tracks detailed academic performance across multiple exam types:

1. **Unit Test 1 & 2**: Early performance indicators
2. **Mid-Semester**: Mid-term assessment
3. **End-Semester**: Final performance evaluation

### Risk Calculation Factors
- **Attendance Rate**: Current attendance percentage
- **Grade Progression**: Declining performance detection
- **Subject Performance**: Individual subject analysis
- **Financial Status**: Fee payment status
- **Historical Data**: Previous semester performance

### Risk Levels
- **High Risk**: Immediate intervention required
- **Medium Risk**: Close monitoring needed
- **Low Risk**: Standard support sufficient

## 🔄 Action Workflow

### 1. Action Creation (Counselor)
- Identify at-risk student
- Create recommended action
- Set priority and due date
- System sends email to parent/guardian

### 2. Action Review (Parent/Guardian)
- Receive email notification
- Log in to review action details
- Approve or reject with reasoning
- System notifies counselor of decision

### 3. Action Tracking (Counselor)
- Monitor action status
- View approval/rejection reasons
- Follow up as needed
- Update action details

## 📧 Email Notifications

### Action Approval Emails
- Sent to parents/guardians when new actions are created
- Include action details, priority, and due dates
- Direct links to login and review

### Status Update Emails
- Sent to counselors when actions are approved/rejected
- Include parent feedback and reasoning
- Enable follow-up actions

### Risk Alert Emails
- Sent for high-risk students
- Include detailed risk factors and recommendations
- Role-appropriate information

## 🚀 Getting Started

### 1. Run the Test Script
```bash
cd backend
node test-system.js
```

This creates test users for all roles and sample data.

### 2. Access the System
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5001

### 3. Test Credentials
- **Counselor**: counselor@test.com / password123
- **Faculty**: faculty@test.com / password123
- **Exam Dept**: exam@test.com / password123
- **Student**: student@test.com / password123
- **Guardian**: guardian@test.com / password123

## 🔒 Security Features

### Authentication
- JWT-based authentication
- Secure password hashing with bcrypt
- Session management

### Authorization
- Role-based access control
- Data filtering by user role
- Protected API endpoints

### Data Privacy
- Students can only view their own data
- Guardians can only view their ward's data
- Faculty and exam department have limited access

## 📈 Performance Monitoring

### Risk Assessment Metrics
- Real-time risk score calculation
- Grade progression tracking
- Attendance trend analysis
- Financial status monitoring

### System Analytics
- User activity tracking
- Action completion rates
- Risk level distribution
- Intervention effectiveness

## 🛠️ API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password

### Students
- `GET /api/students` - Get students (role-filtered)
- `GET /api/students/:id` - Get student by ID
- `POST /api/students/:id/recalculate` - Recalculate risk
- `GET /api/students/:id/actions` - Get student actions
- `POST /api/students/:id/actions` - Create action
- `PUT /api/students/:id/actions/:actionId` - Update action

### File Uploads
- `POST /api/upload` - Full data upload (counselor)
- `POST /api/upload/attendance` - Attendance upload (faculty)
- `POST /api/upload/exam-data` - Exam data upload (exam dept)

## 🎯 Future Enhancements

### Planned Features
- Mobile app for parents and students
- Advanced analytics dashboard
- Integration with learning management systems
- Automated intervention recommendations
- Multi-language support

### Scalability Improvements
- Microservices architecture
- Redis caching
- Database sharding
- Load balancing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**Note**: This enhanced system provides a comprehensive solution for student risk management with role-based access, advanced analytics, and collaborative workflows. The system is designed to be scalable, secure, and user-friendly for all stakeholders.
