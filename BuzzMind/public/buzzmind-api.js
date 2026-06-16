//  **Shared BuzzMind API client — include on pages that call the backend**
const BuzzMindAPI = {
  async request(url, options = {}) {
    const res = await fetch(url, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || res.statusText);
    return data;
  },

  getMe() {
    return this.request('/api/auth/me');
  },

  logout() {
    return this.request('/api/auth/logout', { method: 'POST' });
  },

  getProfile() {
    return this.request('/api/users/profile');
  },

  updateProfile(body) {
    return this.request('/api/users/profile', {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  updatePassword(body) {
    return this.request('/api/users/password', {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  getClasses() {
    return this.request('/api/classes');
  },

  createClass(body) {
    return this.request('/api/classes', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  getClass(id) {
    return this.request(`/api/classes/${id}`);
  },

  updateClass(classId, body) {
    return this.request(`/api/classes/${classId}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  addStudent(classId, body) {
    return this.request(`/api/classes/${classId}/students`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  deleteClass(classId) {
    return this.request(`/api/classes/${classId}`, { method: 'DELETE' });
  },

  deleteStudent(classId, studentId) {
    return this.request(`/api/classes/${classId}/students/${studentId}`, {
      method: 'DELETE',
    });
  },

  createQuiz(body) {
    return this.request('/api/quizzes', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  getQuizzes(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/api/quizzes${qs ? `?${qs}` : ''}`);
  },

  updateQuiz(quizId, body) {
    return this.request(`/api/quizzes/${quizId}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  launchQuiz(quizId, body = {}) {
    return this.request(`/api/quizzes/${quizId}/launch`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  importTrivia({ amount = 5, difficulty = '' } = {}) {
    const qs = new URLSearchParams({ amount: String(amount) });
    if (difficulty) qs.set('difficulty', difficulty);
    return this.request(`/api/quizzes/import/trivia?${qs.toString()}`);
  },

  joinSession(pin, displayName) {
    const body = { pin };
    if (displayName) body.displayName = displayName;
    return this.request('/api/sessions/join', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  getSessionByPin(pin) {
    return this.request(`/api/sessions/pin/${pin}`);
  },

  getSession(id) {
    return this.request(`/api/sessions/${id}`);
  },

  getSessionQuiz(id) {
    return this.request(`/api/sessions/${id}/quiz`);
  },

  startSession(id) {
    return this.request(`/api/sessions/${id}/start`, { method: 'POST' });
  },

  nextQuestion(id) {
    return this.request(`/api/sessions/${id}/next`, { method: 'POST' });
  },

  endSession(id) {
    return this.request(`/api/sessions/${id}/end`, { method: 'POST' });
  },

  submitAnswer(sessionId, body) {
    return this.request(`/api/sessions/${sessionId}/answer`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  getLeaderboard(sessionId) {
    return this.request(`/api/sessions/${sessionId}/leaderboard`);
  },

  getProfessors() {
    return this.request('/api/admin/professors');
  },

  createProfessor(body) {
    return this.request('/api/admin/professors', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  deleteProfessor(id) {
    return this.request(`/api/admin/professors/${id}`, { method: 'DELETE' });
  },

  getReports() {
    return this.request('/api/reports');
  },

  getLibrary() {
    return this.request('/api/quizzes/library');
  },

  // ---- Admin: professors ----
  updateProfessor(id, body) {
    return this.request(`/api/admin/professors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  // ---- Admin: users (all roles) ----
  getUsers(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/api/admin/users${qs ? `?${qs}` : ''}`);
  },
  createUser(body) {
    return this.request('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  updateUser(id, body) {
    return this.request(`/api/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },
  deleteUser(id) {
    return this.request(`/api/admin/users/${id}`, { method: 'DELETE' });
  },

  // ---- Admin: classes ----
  getAdminClasses() {
    return this.request('/api/admin/classes');
  },
  getAdminClass(id) {
    return this.request(`/api/admin/classes/${id}`);
  },
  createAdminClass(body) {
    return this.request('/api/admin/classes', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  updateAdminClass(id, body) {
    return this.request(`/api/admin/classes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },
  deleteAdminClass(id) {
    return this.request(`/api/admin/classes/${id}`, { method: 'DELETE' });
  },
  addClassStudent(id, body) {
    return this.request(`/api/admin/classes/${id}/students`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  removeClassStudent(id, studentId) {
    return this.request(`/api/admin/classes/${id}/students/${studentId}`, {
      method: 'DELETE',
    });
  },
  attachQuiz(classId, quizId) {
    return this.request(`/api/admin/classes/${classId}/quizzes`, {
      method: 'POST',
      body: JSON.stringify({ quizId }),
    });
  },
  detachQuiz(classId, quizId) {
    return this.request(`/api/admin/classes/${classId}/quizzes/${quizId}`, {
      method: 'DELETE',
    });
  },
  getAdminQuizzes() {
    return this.request('/api/admin/quizzes');
  },

  // ---- Admin: analytics + messages ----
  getAnalytics() {
    return this.request('/api/admin/analytics');
  },
  getMessages() {
    return this.request('/api/admin/messages');
  },
  updateMessage(id, status) {
    return this.request(`/api/admin/messages/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },
  deleteMessage(id) {
    return this.request(`/api/admin/messages/${id}`, { method: 'DELETE' });
  },

  // ---- Overviews ----
  getStudentOverview(id) {
    return this.request(`/api/overview/student/${id}`);
  },
  getProfessorOverview(id) {
    return this.request(`/api/overview/professor/${id}`);
  },

  // ---- Assignments + submissions ----
  getAssignments(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/api/assignments${qs ? `?${qs}` : ''}`);
  },
  createAssignment(body) {
    return this.request('/api/assignments', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  getAssignment(id) {
    return this.request(`/api/assignments/${id}`);
  },
  updateAssignment(id, body) {
    return this.request(`/api/assignments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },
  deleteAssignment(id) {
    return this.request(`/api/assignments/${id}`, { method: 'DELETE' });
  },
  submitAssignment(id, body) {
    return this.request(`/api/assignments/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  getSubmissions(id) {
    return this.request(`/api/assignments/${id}/submissions`);
  },
  gradeSubmission(assignmentId, submissionId, body) {
    return this.request(
      `/api/assignments/${assignmentId}/submissions/${submissionId}/grade`,
      { method: 'PUT', body: JSON.stringify(body) },
    );
  },

  // ---- File upload (images + docs) ----
  async uploadFile(file) {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/uploads/file', {
      method: 'POST',
      credentials: 'include',
      body: form,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || res.statusText);
    return data;
  },

  // ---- Contact ----
  sendContact(body) {
    return this.request('/api/contact', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  // ---- Chat ----
  getChatContacts() {
    return this.request('/api/chat/contacts');
  },
  getConversation(userId) {
    return this.request(`/api/chat/with/${userId}`);
  },
  sendChat(userId, text) {
    return this.request(`/api/chat/with/${userId}`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  },
  getChatUnread() {
    return this.request('/api/chat/unread');
  },
};

if (typeof window !== 'undefined') window.BuzzMindAPI = BuzzMindAPI;

// Load shared i18n (English ⇄ Arabic) on every page that includes this client.
if (
  typeof document !== 'undefined' &&
  !window.__buzzI18n &&
  !document.querySelector('script[data-i18n-loader]')
) {
  const i18nScript = document.createElement('script');
  i18nScript.src = '/shared/i18n.js';
  i18nScript.setAttribute('data-i18n-loader', '');
  document.head.appendChild(i18nScript);
}
