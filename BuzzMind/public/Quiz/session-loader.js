/**
 * Loads quiz data from a live game session when ?session= is in the URL.
 */
window.quizReady = (async function loadSessionQuiz() {
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get('session');
  if (!sessionId) return false;

  window.LIVE_SESSION_ID = sessionId;
  sessionStorage.setItem('gameSessionId', sessionId);

  try {
    const playerId = sessionStorage.getItem('playerId') || '';
    const res = await fetch(
      `/api/sessions/${sessionId}/quiz?playerId=${encodeURIComponent(playerId)}`,
      { credentials: 'include' },
    );
    if (!res.ok) throw new Error('Failed to load session quiz');
    const data = await res.json();

    QUIZ_DATA.title = data.title;
    QUIZ_DATA.totalTime = data.totalTime;
    QUIZ_DATA.questions = data.questions.map((q, i) => ({
      id: q.id || i + 1,
      text: q.text,
      imageUrl: (function (url) {
        if (!url) return null;
        const trimmed = String(url).trim();
        if (/^https?:\/\//i.test(trimmed)) return trimmed;
        if (trimmed.startsWith('//')) return window.location.protocol + trimmed;
        if (trimmed.startsWith('/')) return window.location.origin + trimmed;
        return window.location.origin + '/' + trimmed.replace(/^\/+/, '');
      })(q.imageUrl),
      answers: q.answers,
      answerImages: (q.answerImages || ['', '', '', '']).map((url) => {
        if (!url) return '';
        const trimmed = String(url).trim();
        if (/^https?:\/\//i.test(trimmed)) return trimmed;
        if (trimmed.startsWith('//')) return window.location.protocol + trimmed;
        if (trimmed.startsWith('/')) return window.location.origin + trimmed;
        return window.location.origin + '/' + trimmed.replace(/^\/+/, '');
      }),
      correctIndex: q.correctIndex ?? 0,
    }));

    if (typeof data.currentQuestionIndex === 'number') {
      window.SESSION_QUESTION_INDEX = data.currentQuestionIndex;
    }
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
})();
