const Config = require("../models/Config");

/**
 * Get current configuration
 */
async function getConfig(req, res) {
  try {
    let config = await Config.findOne();
    
    // If no config exists, create default one
    if (!config) {
      config = new Config();
      await config.save();
    }
    
    res.json({ 
      success: true, 
      config: {
        attendanceCritical: config.attendanceCritical,
        attendanceWarning: config.attendanceWarning,
        passCriteria: config.passCriteria,
        failingHigh: config.failingHigh,
        failingMedium: config.failingMedium,
        overdueDays: config.overdueDays,
        maxAttempts: config.maxAttempts,
        institutionName: config.institutionName,
        academicYear: config.academicYear,
        semester: config.semester,
        emailNotifications: config.emailNotifications,
        smsNotifications: config.smsNotifications,
        emailStudentRiskLevels: config.emailStudentRiskLevels,
        emailParentRiskLevels: config.emailParentRiskLevels,
        emailFrequency: config.emailFrequency,
        includeDetailedGrades: config.includeDetailedGrades,
        includeRecommendations: config.includeRecommendations,
        attendanceWeight: config.attendanceWeight,
        academicWeight: config.academicWeight,
        financialWeight: config.financialWeight,
        lastUpdated: config.lastUpdated,
        updatedBy: config.updatedBy
      }
    });
  } catch (error) {
    console.error("Error fetching config:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch configuration" 
    });
  }
}

/**
 * Update configuration
 */
async function updateConfig(req, res) {
  try {
    const updates = req.body;
    
    // Validate the updates
    const allowedFields = [
      'attendanceCritical', 'attendanceWarning', 'passCriteria', 'failingHigh', 'failingMedium',
      'overdueDays', 'maxAttempts', 'institutionName', 'academicYear', 'semester',
      'emailNotifications', 'smsNotifications', 'emailStudentRiskLevels', 'emailParentRiskLevels',
      'emailFrequency', 'includeDetailedGrades', 'includeRecommendations',
      'attendanceWeight', 'academicWeight', 'financialWeight'
    ];
    
    const filteredUpdates = {};
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });
    
    // Add metadata
    filteredUpdates.lastUpdated = new Date();
    filteredUpdates.updatedBy = req.body.updatedBy || "admin";
    
    // Use upsert to create if doesn't exist, update if exists
    const config = await Config.findOneAndUpdate(
      {}, // Empty filter to match any document
      filteredUpdates,
      { 
        upsert: true, 
        new: true, 
        runValidators: true 
      }
    );
    
    res.json({ 
      success: true, 
      message: "Configuration updated successfully",
      config: {
        attendanceCritical: config.attendanceCritical,
        attendanceWarning: config.attendanceWarning,
        passCriteria: config.passCriteria,
        failingHigh: config.failingHigh,
        failingMedium: config.failingMedium,
        overdueDays: config.overdueDays,
        maxAttempts: config.maxAttempts,
        institutionName: config.institutionName,
        academicYear: config.academicYear,
        semester: config.semester,
        emailNotifications: config.emailNotifications,
        smsNotifications: config.smsNotifications,
        emailStudentRiskLevels: config.emailStudentRiskLevels,
        emailParentRiskLevels: config.emailParentRiskLevels,
        emailFrequency: config.emailFrequency,
        includeDetailedGrades: config.includeDetailedGrades,
        includeRecommendations: config.includeRecommendations,
        attendanceWeight: config.attendanceWeight,
        academicWeight: config.academicWeight,
        financialWeight: config.financialWeight,
        lastUpdated: config.lastUpdated,
        updatedBy: config.updatedBy
      }
    });
  } catch (error) {
    console.error("Error updating config:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to update configuration",
      details: error.message
    });
  }
}

/**
 * Reset configuration to defaults
 */
async function resetConfig(req, res) {
  try {
    await Config.deleteMany({});
    
    const defaultConfig = new Config();
    await defaultConfig.save();
    
    res.json({ 
      success: true, 
      message: "Configuration reset to defaults",
      config: {
        attendanceCritical: defaultConfig.attendanceCritical,
        attendanceWarning: defaultConfig.attendanceWarning,
        passCriteria: defaultConfig.passCriteria,
        failingHigh: defaultConfig.failingHigh,
        failingMedium: defaultConfig.failingMedium,
        overdueDays: defaultConfig.overdueDays,
        maxAttempts: defaultConfig.maxAttempts,
        institutionName: defaultConfig.institutionName,
        academicYear: defaultConfig.academicYear,
        semester: defaultConfig.semester,
        emailNotifications: defaultConfig.emailNotifications,
        smsNotifications: defaultConfig.smsNotifications,
        attendanceWeight: defaultConfig.attendanceWeight,
        academicWeight: defaultConfig.academicWeight,
        financialWeight: defaultConfig.financialWeight,
        lastUpdated: defaultConfig.lastUpdated,
        updatedBy: defaultConfig.updatedBy
      }
    });
  } catch (error) {
    console.error("Error resetting config:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to reset configuration" 
    });
  }
}

module.exports = { getConfig, updateConfig, resetConfig };
