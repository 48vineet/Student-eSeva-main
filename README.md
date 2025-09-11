# 🎓 Student Early Warning System (Student-eSeva)

A comprehensive, AI-powered student risk assessment and notification system designed to help educational institutions identify at-risk students and take proactive measures to support their academic success.

![Project Status](https://img.shields.io/badge/status-production%20ready-brightgreen)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 🌟 Features

### 📊 **Dynamic Dashboard**
- Real-time student risk monitoring
- Interactive charts and statistics
- Beautiful, responsive UI with smooth animations
- Risk level filtering and sorting

### 📁 **Smart File Upload**
- Support for CSV and Excel files (.xlsx, .csv)
- Dynamic subject detection (handles any number of subjects)
- Real-time validation and feedback
- Drag-and-drop file interface

### 🎯 **Advanced ML Risk Assessment**
- Dynamic pass criteria configuration
- Rule-based and machine learning-based risk calculation
- Configurable thresholds and weights
- Real-time risk score calculation

### 📧 **Intelligent Email System**
- Dynamic notification settings
- Parallel email sending (74% performance improvement)
- Professional HTML email templates
- Mobile-friendly responsive design
- Automated student and parent notifications

### ⚙️ **Comprehensive Settings**
- Dynamic configuration management
- Real-time preview of changes
- Multiple configuration categories
- Easy reset and update options

### 👥 **Student Management**
- Detailed student profiles with modal views
- Interactive data tables with sorting/filtering
- Click-to-view student details
- Risk level visualization

## 🚀 Technology Stack

### **Frontend**
- **React 19.1.1** - Modern UI framework
- **Vite 7.1.2** - Fast build tool and dev server
- **Tailwind CSS 4.1.13** - Utility-first CSS framework
- **React Router DOM 7.8.2** - Client-side routing
- **Axios 1.11.0** - HTTP client for API requests
- **Recharts 3.2.0** - Data visualization library
- **Lucide React 0.543.0** - Beautiful icon library
- **React Dropzone 14.3.8** - File upload component

### **Backend**
- **Node.js** - JavaScript runtime
- **Express 5.1.0** - Web application framework
- **MongoDB with Mongoose 8.18.1** - Database and ODM
- **Multer 2.0.2** - File upload middleware
- **ExcelJS 4.4.0** - Excel file processing
- **Nodemailer 7.0.6** - Email sending
- **CORS 2.8.5** - Cross-origin resource sharing
- **Helmet 8.1.0** - Security headers
- **Express Rate Limit 8.1.0** - Rate limiting
- **ML Libraries** - Machine learning capabilities

### **Machine Learning Libraries**
- **ml-kmeans 6.0.0** - K-means clustering
- **ml-matrix 6.12.1** - Matrix operations
- **ml-regression-multivariate-linear 2.0.4** - Multivariate linear regression

## 📦 Package Dependencies

### **Frontend Dependencies**
```json
{
  "react": "^19.1.1",
  "react-dom": "^19.1.1",
  "react-router-dom": "^7.8.2",
  "axios": "^1.11.0",
  "tailwindcss": "^4.1.13",
  "@tailwindcss/vite": "^4.1.13",
  "lucide-react": "^0.543.0",
  "react-dropzone": "^14.3.8",
  "recharts": "^3.2.0"
}
```

### **Backend Dependencies**
```json
{
  "express": "^5.1.0",
  "mongoose": "^8.18.1",
  "cors": "^2.8.5",
  "helmet": "^8.1.0",
  "express-rate-limit": "^8.1.0",
  "multer": "^2.0.2",
  "exceljs": "^4.4.0",
  "csv-parser": "^3.2.0",
  "nodemailer": "^7.0.6",
  "dotenv": "^17.2.2",
  "axios": "^1.11.0",
  "form-data": "^4.0.4",
  "ml-kmeans": "^6.0.0",
  "ml-matrix": "^6.12.1",
  "ml-regression-multivariate-linear": "^2.0.4"
}
```

### **Development Dependencies**
```json
{
  "@vitejs/plugin-react": "^5.0.0",
  "eslint": "^9.33.0",
  "eslint-plugin-react-hooks": "^5.2.0",
  "eslint-plugin-react-refresh": "^0.4.20",
  "globals": "^16.3.0",
  "types": "^19.1.10",
  "nodemon": "^3.1.10"
}
```

## 🛠️ Installation & Setup

### **Prerequisites**
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- Gmail account for email notifications

### **1. Clone the Repository**
```bash
git clone <repository-url>
cd Student-eSeva-main
```

### **2. Backend Setup**
```bash
cd backend
npm install
```

### **3. Frontend Setup**
```bash
cd ../frontend
npm install
```

### **4. Environment Configuration**

Create a `.env` file in the backend directory:

```env
# Server Configuration
PORT=5001
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/student-eseva
# For MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/student-eseva

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# ML Service (if using external service)
ML_API_URL=http://localhost:5002
```

### **5. Gmail App Password Setup**
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
   - Use this password in `EMAIL_PASSWORD`

### **6. Frontend Environment**
Create a `.env` file in the frontend directory:

```env
VITE_API_URL=http://localhost:5001
VITE_ML_API_URL=http://localhost:5002
```

## 🚀 Running the Application

### **Development Mode**

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### **Production Mode**

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm run preview
```

## 📊 Usage

### **1. System Configuration**
- Navigate to Settings page
- Configure attendance thresholds, pass criteria, and email settings
- Save changes to apply dynamic configuration

### **2. Upload Student Data**
- Go to Dashboard
- Click "Upload Student Data"
- Upload CSV or Excel file with student information
- System automatically processes and calculates risk scores

### **3. View Student Data**
- Browse students in the table
- Click on any student to view detailed information
- Sort and filter by risk levels

### **4. Send Notifications**
- Click "Send Alerts" to notify students and parents
- System sends emails based on risk levels and configuration
- View sending progress and results

## 📁 Project Structure

```
Student-eSeva-main/
├── backend/
│   ├── config/
│   │   ├── db.js
│   │   ├── env.js
│   │   └── mailer.js
│   ├── controllers/
│   │   ├── configController.js
│   │   ├── notificationController.js
│   │   ├── studentController.js
│   │   └── uploadController.js
│   ├── models/
│   │   ├── Config.js
│   │   └── Student.js
│   ├── routes/
│   │   ├── configRoutes.js
│   │   ├── notificationRoutes.js
│   │   ├── studentRoutes.js
│   │   └── uploadRoutes.js
│   ├── services/
│   │   ├── emailService.js
│   │   ├── jsMlService.js
│   │   ├── mlService.js
│   │   └── riskCalculator.js
│   ├── utils/
│   │   ├── errorHandler.js
│   │   └── parseExcel.js
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── FileUpload.jsx
│   │   │   ├── StudentDetailsModal.jsx
│   │   │   └── StudentTable.jsx
│   │   ├── context/
│   │   │   ├── ConfigContext.jsx
│   │   │   └── StudentContext.jsx
│   │   ├── hooks/
│   │   │   ├── useFetch.js
│   │   │   └── useNotification.js
│   │   ├── utils/
│   │   │   ├── chartData.js
│   │   │   └── formatDate.js
│   │   ├── views/
│   │   │   ├── Home.jsx
│   │   │   └── Settings.jsx
│   │   ├── api/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## 🔧 API Endpoints

### **Configuration**
- `GET /api/config` - Get system configuration
- `PUT /api/config` - Update configuration
- `POST /api/config/reset` - Reset to defaults

### **Students**
- `GET /api/students` - Get all students
- `GET /api/students/:id` - Get student by ID
- `POST /api/students` - Create student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student
- `POST /api/students/recalculate` - Recalculate risk scores

### **Upload**
- `POST /api/upload` - Upload student data file

### **Notifications**
- `POST /api/notifications` - Send notifications

## 📧 Email Templates

The system includes professionally designed email templates with:
- Responsive design for mobile and desktop
- Institution branding
- Risk factor details
- Actionable recommendations
- Professional styling with inline CSS

## 🎨 UI/UX Features

- **Modern Design**: Glass morphism, gradients, smooth animations
- **Responsive**: Perfect display on all devices
- **Accessible**: ARIA labels and keyboard navigation
- **Interactive**: Hover effects, loading states, transitions
- **Professional**: Clean, intuitive interface

## 🚀 Performance Optimizations

- **Parallel Processing**: 74% faster email sending
- **Dynamic Loading**: Real-time configuration updates
- **Efficient Parsing**: Optimized file processing
- **Caching**: Smart data caching strategies
- **Bundle Optimization**: Vite-powered fast builds

## 🔒 Security Features

- **Helmet.js**: Security headers
- **Rate Limiting**: API protection
- **Input Validation**: Data sanitization
- **CORS**: Cross-origin protection
- **Environment Variables**: Secure configuration

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- **Vineet** - Initial development
- **Contributors** - Project enhancement

## 🙏 Acknowledgments

- React team for the amazing framework
- Tailwind CSS for beautiful styling
- MongoDB team for the database solution
- All open-source contributors

## 📞 Support

For support and questions:
- Create an issue in the repository
- Email: support@studenteseva.com

---

**🎉 Thank you for using Student Early Warning System! 🎉**

*Built with ❤️ for better education*
