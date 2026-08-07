const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';

// Helper to construct headers with auth if available
const getHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
  };
  const userString = localStorage.getItem('user');
  if (userString) {
    try {
      const user = JSON.parse(userString);
      if (user && user.id) {
        headers['X-User-Id'] = String(user.id);
      }
    } catch (e) {
      console.error("Error reading user token", e);
    }
  }
  return headers;
};

// Generic request helper
const request = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  const headers = getHeaders();
  
  // If the body is FormData (used for file uploads), remove the Content-Type header
  // so the browser sets it automatically with the correct multipart boundary.
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }
  
  const mergedOptions = {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, mergedOptions);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Something went wrong');
    }
    return data;
  } catch (error) {
    console.error(`API Error in ${endpoint}:`, error.message);
    throw error;
  }
};

export const api = {
  // Authentication
  login: async (email, password) => {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  signup: async (name, email, password) => {
    return request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  },

  loginWithFirebase: async (idToken) => {
    return request('/auth/firebase-login', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    });
  },

  getMe: async () => {
    return request('/auth/me');
  },

  // Daily entries
  getDailyEntries: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const endpoint = `/daily${query ? `?${query}` : ''}`;
    return request(endpoint);
  },

  saveDailyEntry: async (entryData) => {
    return request('/daily', {
      method: 'POST',
      body: JSON.stringify(entryData),
    });
  },

  // Attendance
  getAttendance: async () => {
    return request('/attendance');
  },

  addAttendance: async (subjectData) => {
    return request('/attendance', {
      method: 'POST',
      body: JSON.stringify(subjectData),
    });
  },

  updateAttendance: async (id, payload) => {
    return request(`/attendance/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  deleteAttendance: async (id) => {
    return request(`/attendance/${id}`, {
      method: 'DELETE',
    });
  },

  // Assignments
  getAssignments: async () => {
    return request('/assignments');
  },

  addAssignment: async (assignmentData) => {
    return request('/assignments', {
      method: 'POST',
      body: JSON.stringify(assignmentData),
    });
  },

  updateAssignment: async (id, updateData) => {
    return request(`/assignments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  },

  deleteAssignment: async (id) => {
    return request(`/assignments/${id}`, {
      method: 'DELETE',
    });
  },

  // Pomodoro
  getPomodoroStats: async () => {
    return request('/pomodoro');
  },

  logPomodoroSession: async (sessionData) => {
    return request('/pomodoro', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
  },

  // AI Analysis
  getAiAnalysis: async () => {
    return request('/ai/analysis');
  },

  getMealSuggestions: async () => {
    return request('/ai/meals');
  },

  getProductRecommendations: async (refresh = false) => {
    return request(`/ai/recommendations?refresh=${refresh}`);
  },

  // --- NEW FEATURES API WRAPPERS ---

  // AI Notes Generator
  getNotes: async () => {
    return request('/notes');
  },

  generateNote: async (topic, detailLevel) => {
    return request('/notes/generate', {
      method: 'POST',
      body: JSON.stringify({ topic, detail_level: detailLevel })
    });
  },

  uploadNote: async (formData) => {
    return request('/notes/upload', {
      method: 'POST',
      body: formData
    });
  },

  updateNote: async (id, payload) => {
    return request(`/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  deleteNote: async (id) => {
    return request(`/notes/${id}`, {
      method: 'DELETE'
    });
  },

  // AI Camera Solver
  getSolvedQuestions: async () => {
    return request('/camera');
  },

  solveQuestion: async (imageBase64, questionText = '') => {
    return request('/camera/solve', {
      method: 'POST',
      body: JSON.stringify({ image: imageBase64, question_text: questionText })
    });
  },

  deleteSolvedQuestion: async (id) => {
    return request(`/camera/${id}`, {
      method: 'DELETE'
    });
  },

  // AI Study Planner
  getStudyTasks: async () => {
    return request('/planner');
  },

  generateStudyPlan: async (subjects, examDate) => {
    return request('/planner/generate', {
      method: 'POST',
      body: JSON.stringify({ subjects, exam_date: examDate })
    });
  },

  toggleStudyTask: async (id, completed) => {
    return request(`/planner/task/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ completed })
    });
  },

  replanStudyPlan: async (examDate = null) => {
    return request('/planner/replan', {
      method: 'POST',
      body: JSON.stringify({ exam_date: examDate })
    });
  },

  // AI Quiz Generator
  getQuizHistory: async () => {
    return request('/quiz');
  },

  getQuiz: async (id) => {
    return request(`/quiz/${id}`);
  },

  generateQuiz: async (payload) => {
    return request('/quiz/generate', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  submitQuizScore: async (quizId, score, total) => {
    return request('/quiz/submit', {
      method: 'POST',
      body: JSON.stringify({ quiz_id: quizId, score, total })
    });
  },

  // Smart Revision (Spaced Repetition)
  getRevisionStatus: async () => {
    return request('/revision');
  },

  addRevisionItem: async (itemType, itemId, title) => {
    return request('/revision/add', {
      method: 'POST',
      body: JSON.stringify({ item_type: itemType, item_id: itemId, title })
    });
  },

  recordRevisionReview: async (id, remembered) => {
    return request('/revision/review', {
      method: 'POST',
      body: JSON.stringify({ id, remembered })
    });
  },

  // AI Chatbot
  sendChatbotMessage: async (message, history, pdfContext = null) => {
    return request('/chatbot/message', {
      method: 'POST',
      body: JSON.stringify({ message, history, pdf_context: pdfContext })
    });
  },

  parseChatbotPdf: async (formData) => {
    return request('/chatbot/parse-pdf', {
      method: 'POST',
      body: formData
    });
  },

  // Gamification
  getGamificationStatus: async () => {
    return request('/gamification/status');
  },

  addXP: async (xp) => {
    return request('/gamification/add-xp', {
      method: 'POST',
      body: JSON.stringify({ xp })
    });
  },

  // Smart Notifications
  getNotifications: async () => {
    return request('/notifications');
  },

  markNotificationsRead: async (id = null) => {
    return request('/notifications/mark-read', {
      method: 'POST',
      body: JSON.stringify({ id })
    });
  },
};
