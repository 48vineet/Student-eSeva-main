export function preparePieChartData(summary) {
  // Handle case where summary is undefined or null
  if (!summary) {
    return [
      { name: "High Risk", value: 0, color: "#ef4444", fill: "#ef4444" },
      { name: "Medium Risk", value: 0, color: "#f59e0b", fill: "#f59e0b" },
      { name: "Low Risk", value: 0, color: "#22c55e", fill: "#22c55e" },
    ];
  }

  return [
    {
      name: "High Risk",
      value: summary.high || 0,
      color: "#ef4444",
      fill: "#ef4444",
    },
    {
      name: "Medium Risk",
      value: summary.medium || 0,
      color: "#f59e0b",
      fill: "#f59e0b",
    },
    { 
      name: "Low Risk", 
      value: summary.low || 0, 
      color: "#22c55e", 
      fill: "#22c55e" 
    },
  ].filter((item) => item.value > 0);
}

export function prepareAttendanceData(students) {
  // Handle case where students is undefined or null
  if (!students || !Array.isArray(students)) {
    return [];
  }

  const ranges = {
    "90-100%": 0,
    "80-89%": 0,
    "70-79%": 0,
    "60-69%": 0,
    "Below 60%": 0,
  };

  students.forEach((student) => {
    const rate = student.attendance_rate;
    if (rate >= 90) ranges["90-100%"]++;
    else if (rate >= 80) ranges["80-89%"]++;
    else if (rate >= 70) ranges["70-79%"]++;
    else if (rate >= 60) ranges["60-69%"]++;
    else ranges["Below 60%"]++;
  });

  return Object.entries(ranges).map(([range, count]) => ({
    range,
    count,
    fill: getRangeColor(range),
  }));
}

function getRangeColor(range) {
  const colors = {
    "90-100%": "#22c55e",
    "80-89%": "#84cc16",
    "70-79%": "#eab308",
    "60-69%": "#f59e0b",
    "Below 60%": "#ef4444",
  };
  return colors[range] || "#6b7280";
}

export function getRiskColor(riskLevel) {
  const colors = {
    low: "#22c55e",
    medium: "#f59e0b",
    high: "#ef4444",
  };
  return colors[riskLevel] || "#6b7280";
}

export function getRiskBadgeClass(riskLevel) {
  const classes = {
    low: "risk-low",
    medium: "risk-medium",
    high: "risk-high",
  };
  return classes[riskLevel] || "";
}
