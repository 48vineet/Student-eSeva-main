const mongoose = require('mongoose');
const Config = require('./models/Config');
const connectDB = require('./config/db');

async function createConfig() {
  try {
    connectDB();
    
    // Check if config already exists
    let config = await Config.findOne();
    if (config) {
      console.log('Config already exists:', config);
      return config;
    }

    // Create default config
    config = new Config({
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

    await config.save();
    console.log('Config created:', config);
    return config;
  } catch (error) {
    console.error('Error creating config:', error);
  } finally {
    mongoose.connection.close();
  }
}

createConfig();
