const { GoogleGenAI } = require("@google/genai");
const { geminiApiKey, geminiModel } = require("../config/env");

const DEFAULT_MODEL = geminiModel || "gemini-2.5-flash";
const MODEL_FALLBACKS = [
  DEFAULT_MODEL,
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
].filter((model, index, list) => model && list.indexOf(model) === index);

const ai = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

function buildFallbackRecommendations(riskLevel, riskFactors) {
  const explanations = [];
  const recommendations = [];

  if (riskFactors.includes("critical_attendance")) {
    explanations.push(
      "Attendance is below the critical threshold and is a major driver of current risk.",
    );
    recommendations.push({
      action: "Schedule attendance intervention",
      description:
        "Set a meeting with student and guardian to improve attendance compliance.",
      urgency: "immediate",
    });
  }

  if (
    riskFactors.includes("multiple_failures") ||
    riskFactors.includes("single_failure")
  ) {
    explanations.push(
      "Academic performance indicates failing subjects that increase risk.",
    );
    recommendations.push({
      action: "Start subject recovery plan",
      description:
        "Create a targeted study plan and weekly tracking for weak subjects.",
      urgency: riskLevel === "high" ? "immediate" : "high",
    });
  }

  if (
    riskFactors.includes("financial_stress") ||
    riskFactors.includes("pending_fees")
  ) {
    explanations.push(
      "Fee status and overdue days indicate financial stress risk.",
    );
    recommendations.push({
      action: "Initiate fee resolution support",
      description:
        "Contact guardian for a payment timeline and support options.",
      urgency: riskLevel === "high" ? "immediate" : "medium",
    });
  }

  if (recommendations.length === 0) {
    explanations.push(
      "Current indicators are stable but should be monitored regularly.",
    );
    recommendations.push({
      action: "Continue monthly monitoring",
      description:
        "Review attendance, grades, and fee status in the next monthly cycle.",
      urgency: "low",
    });
  }

  return { explanations, recommendations };
}

function sanitizeRecommendations(items = []) {
  return items
    .filter((item) => item && item.action)
    .map((item) => ({
      action: String(item.action).slice(0, 200),
      description: String(item.description || "").slice(0, 500),
      urgency: ["immediate", "high", "medium", "low"].includes(
        String(item.urgency).toLowerCase(),
      )
        ? String(item.urgency).toLowerCase()
        : "medium",
    }));
}

function buildFallbackStudentSummary(student, coursePerformance = []) {
  const courseLines =
    coursePerformance.length > 0
      ? coursePerformance
          .slice(0, 8)
          .map(
            (course) =>
              `- ${course.subject}: avg ${course.averageScore} (${course.status})`,
          )
          .join("\n")
      : "- Course-wise performance data is limited in current records.";

  const attendance = Number(student?.attendance_rate || 0);
  const riskLevel = String(student?.risk_level || "N/A");
  const riskScore = Number(student?.risk_score || 0);
  const feeStatus = student?.fees_status || student?.fee_status || "N/A";
  const daysOverdue = Number(student?.days_overdue || 0);

  const problems = [];
  if (attendance > 0 && attendance < 75) {
    problems.push(
      `Low attendance (${attendance}%) may be affecting learning continuity.`,
    );
  } else if (attendance === 0) {
    problems.push("Attendance data is missing or not yet uploaded.");
  }

  if (coursePerformance.some((c) => String(c.status).toLowerCase() === "failing")) {
    problems.push("One or more subjects are below the pass criteria.");
  } else if (coursePerformance.length === 0) {
    problems.push("Course performance data is limited in current records.");
  }

  if (
    String(feeStatus).toLowerCase().includes("overdue") ||
    String(feeStatus).toLowerCase().includes("pending") ||
    daysOverdue > 0
  ) {
    problems.push(
      `Fee status indicates possible financial stress (${feeStatus}${
        daysOverdue > 0 ? `, ${daysOverdue} days overdue` : ""
      }).`,
    );
  }

  if (problems.length === 0) {
    problems.push("No major issues detected from the available records.");
  }

  return [
    `Student Summary for ${student?.name || "Student"} (${student?.student_id || "N/A"})`,
    "",
    "1) Student Details",
    `- Name: ${student?.name || "N/A"}`,
    `- Student ID: ${student?.student_id || "N/A"}`,
    `- Class/Year: ${student?.class_year || student?.current_academic_year || "N/A"}`,
    `- Major: ${student?.major || "N/A"}`,
    `- Attendance: ${attendance}%`,
    `- Fee Status: ${feeStatus}`,
    `- Risk Level: ${riskLevel}`,
    `- Risk Score: ${riskScore}/100`,
    "",
    "2) What Problem the Student is Dealing With",
    ...problems.map((p) => `- ${p}`),
    "",
    "3) How to Overcome (Practical Steps)",
    "- Create a weekly study plan (60–90 mins/day) focused on the weakest subjects.",
    "- Use past papers + daily practice questions; track mistakes in a notebook.",
    "- Attend all classes for the next 2 weeks and avoid missing lectures.",
    "- Meet a mentor/counselor every 2 weeks to review progress and obstacles.",
    "- If fees are pending/overdue, agree on a payment timeline and support options.",
    "",
    "Course Performance (from available records):",
    courseLines,
  ].join("\n");
}

async function generateForStudent({ student, risk }) {
  const fallback = buildFallbackRecommendations(
    risk.risk_level,
    risk.risk_factors || [],
  );

  if (!geminiApiKey) {
    return {
      explanation: fallback.explanations,
      recommendations: sanitizeRecommendations(fallback.recommendations),
      ai_meta: {
        provider: "none",
        model: null,
        status: "fallback-no-api-key",
      },
    };
  }

  const prompt = {
    instruction:
      "You are an academic risk analyst. Use only provided data. Return strict JSON with keys explanation (string[]) and recommendations (array of {action, description, urgency}). Do not return markdown.",
    student: {
      student_id: student.student_id,
      attendance_rate: student.attendance_rate,
      days_overdue: student.days_overdue,
      fee_status: student.fees_status || student.fee_status,
      failed_subjects: risk.failed_subjects,
    },
    risk: {
      risk_level: risk.risk_level,
      risk_score: risk.risk_score,
      risk_factors: risk.risk_factors,
      calculation_log: risk.calculation_log,
    },
    urgency_rules: [
      "high risk => at least one immediate recommendation",
      "medium risk => high/medium urgency recommendations",
      "low risk => low/medium urgency recommendations",
    ],
  };

  let lastError = null;

  for (const modelName of MODEL_FALLBACKS) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: JSON.stringify(prompt),
        config: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      });

      const text = response?.text || "";

      const parsed = JSON.parse(text);
      const explanation = Array.isArray(parsed.explanation)
        ? parsed.explanation
            .map((line) => String(line).slice(0, 300))
            .slice(0, 8)
        : fallback.explanations;

      const recommendations = sanitizeRecommendations(parsed.recommendations);

      return {
        explanation,
        recommendations:
          recommendations.length > 0
            ? recommendations
            : sanitizeRecommendations(fallback.recommendations),
        ai_meta: {
          provider: "gemini",
          model: modelName,
          status: "ok",
        },
      };
    } catch (error) {
      lastError = error;
      const statusCode = error?.status || error?.response?.status;
      const message = error?.message || error?.response?.data?.error?.message;

      console.warn(
        `Gemini model ${modelName} failed (${statusCode || "no-status"}): ${message}`,
      );

      if (statusCode && statusCode !== 404) {
        break;
      }
    }
  }

  console.error(
    "Gemini recommendation generation failed after retries:",
    lastError?.message || "unknown error",
  );
  return {
    explanation: fallback.explanations,
    recommendations: sanitizeRecommendations(fallback.recommendations),
    ai_meta: {
      provider: "gemini",
      model: MODEL_FALLBACKS[0] || null,
      status: "fallback-error",
    },
  };
}

async function generateOnePageStudentSummary({
  student,
  coursePerformance = [],
}) {
  const fallbackSummary = buildFallbackStudentSummary(
    student,
    coursePerformance,
  );

  if (!geminiApiKey || !ai) {
    return {
      summary: fallbackSummary,
      ai_meta: {
        provider: "none",
        model: null,
        status: "fallback-no-api-key",
      },
    };
  }

  const prompt = [
    "You are a student success mentor.",
    "Generate a concise one-page report in plain text (no markdown tables).",
    "You MUST follow this exact structure and headings, in this order:",
    "1) Student Details",
    "2) What Problem the Student is Dealing With",
    "3) How to Overcome (Step-by-step Plan)",
    "",
    "Rules:",
    "- Use only the provided data. If something is missing, say 'Not available' instead of guessing.",
    "- In section (2), list 3–6 bullet points that connect the problem to the data (attendance, scores, fees, risk).",
    "- In section (3), give 6–10 bullet points that are actionable and realistic for a student to follow.",
    "- Keep the tone supportive and practical.",
    "",
    `Student Data: ${JSON.stringify(student)}`,
    `Course Performance: ${JSON.stringify(coursePerformance)}`,
  ].join("\n");

  let lastError = null;

  for (const modelName of MODEL_FALLBACKS) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          temperature: 0.3,
          maxOutputTokens: 1200,
        },
      });

      const text = String(response?.text || "").trim();
      if (text) {
        return {
          summary: text,
          ai_meta: {
            provider: "gemini",
            model: modelName,
            status: "ok",
          },
        };
      }
    } catch (error) {
      lastError = error;
      const statusCode = error?.status || error?.response?.status;
      const message = error?.message || error?.response?.data?.error?.message;

      console.warn(
        `Gemini summary model ${modelName} failed (${statusCode || "no-status"}): ${message}`,
      );

      if (statusCode && statusCode !== 404) {
        break;
      }
    }
  }

  console.error(
    "Gemini one-page summary generation failed after retries:",
    lastError?.message || "unknown error",
  );

  return {
    summary: fallbackSummary,
    ai_meta: {
      provider: "gemini",
      model: MODEL_FALLBACKS[0] || null,
      status: "fallback-error",
    },
  };
}

module.exports = { generateForStudent, generateOnePageStudentSummary };
