export const buildQuestionGenerationSystemPrompt = () => {
  return [
    "You are an expert technical interviewer and recruiter.",
    "Generate interview questions that are contextually relevant to the candidate and the role.",
    "Return valid JSON only, no markdown, no code fences.",
    "Difficulty must be consistent across questions (default MEDIUM unless instructed).",
    "Questions must be specific and measurable, not generic.",
  ].join("\n");
};

export const buildQuestionGenerationUserPrompt = (input: {
  candidate: unknown;
  role: unknown;
  questionCount: number;
  difficultyTarget?: "EASY" | "MEDIUM" | "HARD";
}) => {
  const difficulty = input.difficultyTarget ?? "MEDIUM";
  return [
    "Create an interview question set.",
    "Constraints:",
    `- Output JSON with shape: { \"questions\": [ { \"type\": \"TECHNICAL\"|\"CULTURE\", \"difficulty\": \"EASY\"|\"MEDIUM\"|\"HARD\", \"topic\"?: string, \"question\": string, \"expectedSignals\"?: string[] } ] }`,
    `- questions.length must be between 8 and 10; target ${input.questionCount}.`,
    `- difficulty for every question must be \"${difficulty}\" unless absolutely necessary.`,
    "- Include at least 6 TECHNICAL questions and at least 2 CULTURE questions.",
    "- expectedSignals should be short bullet-like strings describing what a strong answer includes.",
    "",
    "Candidate context (JSON):",
    JSON.stringify(input.candidate),
    "",
    "Role context (JSON):",
    JSON.stringify(input.role),
  ].join("\n");
};

export const buildAssessmentSystemPrompt = () => {
  return [
    "You are an interview assessor.",
    "Evaluate candidate answers fairly using evidence from the answers.",
    "Return valid JSON only, no markdown, no code fences.",
    "Be constructive, specific, and actionable.",
  ].join("\n");
};

export const buildAssessmentUserPrompt = (input: {
  candidate: unknown;
  role: unknown;
  questionsAndAnswers: unknown;
}) => {
  return [
    "Generate an assessment JSON object with the following shape:",
    "{",
    '  "overallScore": number (0-100),',
    '  "rubricScores": { "technicalAccuracy": 0-100, "communication": 0-100, "problemSolving": 0-100, "culturalFit": 0-100 },',
    '  "strengths": string[] (2-8 items),',
    '  "improvements": string[] (2-8 items),',
    '  "summary": string',
    "}",
    "Scoring guidance:",
    "- Technical accuracy: correctness, depth, use of appropriate concepts.",
    "- Communication: clarity, structure, conciseness, completeness.",
    "- Problem solving: approach, tradeoffs, edge cases, reasoning.",
    "- Cultural fit: collaboration, ownership, growth mindset, ethics.",
    "",
    "Candidate context (JSON):",
    JSON.stringify(input.candidate),
    "",
    "Role context (JSON):",
    JSON.stringify(input.role),
    "",
    "Questions and answers (JSON):",
    JSON.stringify(input.questionsAndAnswers),
  ].join("\n");
};

