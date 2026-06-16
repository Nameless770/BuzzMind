/* =============================================
   professor-quiz.js
   Handles the professor's quiz control view:
   - Shows current question (display only)
   - Simulates students submitting answers
   - Countdown timer (same as student view)
   - "Next Question" button controls flow
   - Live leaderboard updates
   ============================================= */

// ---- State ----
let currentQuestionIndex = 0;
let timerInterval = null;
let quizEndsAt = null; // shared deadline (ms epoch) for the WHOLE quiz
let lobbyPollInterval = null;
let simulationTimers = [];
let submittedCount = 0; // simulation only (non-live demo)
let answeredTotal = 0; // live: total answers received across all players
let expectedTotal = 0; // live: players * questions
let scores = SESSION_STUDENTS.map((s) => ({ id: '', name: s.name, avatarUrl: '', score: 0 }));
let finalizing = false;

function rememberDeadline(data) {
  if (data && data.endsAt) quizEndsAt = new Date(data.endsAt).getTime();
}

// ---- Real-time socket (optional) ----
let __bm_socket = null;
if (typeof io !== 'undefined') {
  try {
    __bm_socket = io({ transports: ['websocket'], withCredentials: true });
    __bm_socket.on('connect', async () => {
      try {
        if (typeof BuzzMindAPI !== 'undefined') {
          const me = await BuzzMindAPI.getMe().catch(() => null);
          const userId = me && (me.id || me._id || me.userId);
          if (userId) __bm_socket.emit('user:join', userId);
        }
      } catch (e) {
        console.error('socket auth error', e);
      }
      joinLiveSessionSocket();
    });

    __bm_socket.on('session:playerJoined', (payload) => {
      try {
        if (!isCurrentLiveSession(payload)) return;
        refreshProfessorLobby();
      } catch (e) {
        console.error('playerJoined handler error', e);
      }
    });

    __bm_socket.on('session:playersUpdated', (payload) => {
      if (!isCurrentLiveSession(payload)) return;
      rememberDeadline(payload);
      const players = Array.isArray(payload.players) ? payload.players : [];
      renderLobbyPlayers(players);
      syncScores(players);
      if (typeof payload.answeredTotal === 'number') answeredTotal = payload.answeredTotal;
      if (typeof payload.expectedTotal === 'number') expectedTotal = payload.expectedTotal;
      updateSubmittedDisplay();
      updateLeaderboard();
    });

    __bm_socket.on('session:answerSubmitted', (payload) => {
      if (!isCurrentLiveSession(payload)) return;
      if (typeof payload.answeredTotal === 'number') answeredTotal = payload.answeredTotal;
      if (typeof payload.expectedTotal === 'number') expectedTotal = payload.expectedTotal;
      if (Array.isArray(payload.leaderboard)) {
        syncLeaderboard(payload.leaderboard);
      } else {
        upsertScore({
          id: payload.playerId,
          name: payload.displayName,
          score: payload.score,
        });
      }
      updateSubmittedDisplay();
      updateLeaderboard();
    });

    __bm_socket.on('session:questionChanged', (payload) => {
      if (!isCurrentLiveSession(payload)) return;
      if (typeof payload.currentQuestionIndex !== 'number') return;
      clearInterval(timerInterval);
      clearSimulationTimers();
      submittedCount = Number(payload.answeredCount) || 0;
      currentQuestionIndex = payload.currentQuestionIndex;
      loadProfQuestion(currentQuestionIndex);
    });

    __bm_socket.on('session:ended', (payload) => {
      if (!isCurrentLiveSession(payload)) return;
      if (Array.isArray(payload.leaderboard)) syncLeaderboard(payload.leaderboard);
      saveFinalScores();
    });
  } catch (e) {
    console.warn('Socket initialization failed', e);
  }
}

// ---- Start on page load ----
document.addEventListener('DOMContentLoaded', async () => {
  if (window.quizReady) await window.quizReady;
  if (window.LIVE_SESSION_ID && typeof BuzzMindAPI !== 'undefined') {
    await openLaunchLobby();
    return;
  }
  startProfessorRound();
});

function startProfessorRound() {
  joinLiveSessionSocket();
  updateSubmittedDisplay();
  updateLeaderboard();
  startProfQuizTimer();
  loadProfQuestion(currentQuestionIndex);
}

function isLiveSession() {
  return !!window.LIVE_SESSION_ID;
}

function isCurrentLiveSession(payload) {
  if (!isLiveSession() || !payload?.sessionId) return true;
  return String(payload.sessionId) === String(window.LIVE_SESSION_ID);
}

function joinLiveSessionSocket() {
  if (__bm_socket?.connected && isLiveSession()) {
    __bm_socket.emit('session:join', window.LIVE_SESSION_ID);
  }
}

function formatPin(pin) {
  const digits = String(pin || '').replace(/\D/g, '');
  return digits.length === 6 ? `${digits.slice(0, 3)} ${digits.slice(3)}` : digits || '---';
}

function renderLobbyPlayers(players = []) {
  const countEl = document.getElementById('lobbyStudentCount');
  const listEl = document.getElementById('lobbyStudentsList');
  safeSetText(countEl, players.length);
  if (!listEl) return;
  listEl.innerHTML = '';

  if (!players.length) {
    const empty = document.createElement('div');
    empty.className = 'player-card player-card-empty';
    safeSetText(empty, 'No students joined yet.');
    listEl.appendChild(empty);
    return;
  }

  players.forEach((player) => {
    const item = document.createElement('div');
    const name = sanitizeText(player.displayName || 'Student');
    if (window.BuzzAvatar) {
      item.className = 'player-card has-avatar';
      item.innerHTML = `${BuzzAvatar.html(name, player.id || name, player.avatarUrl, 30)}<span class="player-name"></span>`;
      item.querySelector('.player-name').textContent = name;
    } else {
      item.className = 'player-card';
      safeSetText(item, name);
    }
    listEl.appendChild(item);
  });
}

function syncScores(players = []) {
  if (players.length) {
    scores = players.map((p) => ({
      id: String(p.id || p._id || ''),
      name: p.displayName || p.name || 'Student',
      avatarUrl: p.avatarUrl || '',
      score: Number(p.score) || 0,
    }));
  } else {
    scores = [];
  }
}

function syncLeaderboard(leaderboard = []) {
  scores = leaderboard.map((entry) => ({
    id: String(entry.id || entry.playerId || ''),
    name: entry.name || entry.displayName || 'Student',
    avatarUrl: entry.avatarUrl || '',
    score: Number(entry.score) || 0,
  }));
}

function upsertScore(entry) {
  const id = String(entry.id || '');
  const idx = scores.findIndex((s) => (id && s.id === id) || s.name === entry.name);
  const next = {
    id,
    name: entry.name || 'Student',
    score: Number(entry.score) || 0,
  };
  if (entry.avatarUrl) next.avatarUrl = entry.avatarUrl; // don't clobber a known avatar
  if (idx >= 0) scores[idx] = { ...scores[idx], ...next };
  else scores.push({ avatarUrl: '', ...next });
}

function clearSimulationTimers() {
  simulationTimers.forEach((timer) => clearTimeout(timer));
  simulationTimers = [];
}

function updateLobbyStatus(text) {
  const statusEl = document.getElementById('lobbyStatusText');
  safeSetText(statusEl, text);
}

function setLobbyStartDisabled(disabled) {
  const startBtn = document.getElementById('lobbyStartBtn');
  if (startBtn) startBtn.disabled = disabled;
}

function closeLaunchLobby() {
  const overlay = document.getElementById('launchLobbyOverlay');
  if (overlay) overlay.style.display = 'none';
  if (lobbyPollInterval) clearInterval(lobbyPollInterval);
  lobbyPollInterval = null;
}

async function refreshProfessorLobby() {
  if (!window.LIVE_SESSION_ID || typeof BuzzMindAPI === 'undefined') return;
  joinLiveSessionSocket();

  try {
    const session = await BuzzMindAPI.getSession(window.LIVE_SESSION_ID);
    const players = Array.isArray(session.players) ? session.players : [];
    rememberDeadline(session);

    safeSetText(document.getElementById('lobbyGamePin'), session.pinFormatted || formatPin(session.pin));
    renderLobbyPlayers(players);
    syncScores(players);
    if (typeof session.answeredTotal === 'number') answeredTotal = session.answeredTotal;
    if (typeof session.expectedTotal === 'number') expectedTotal = session.expectedTotal;
    updateSubmittedDisplay();
    updateLeaderboard();

    if (session.status === 'active') {
      currentQuestionIndex = Number(session.currentQuestionIndex) || 0;
      closeLaunchLobby();
      startProfessorRound();
      return;
    }

    if (players.length === 0) {
      updateLobbyStatus('WAITING FOR PLAYERS...');
      setLobbyStartDisabled(true);
      return;
    }
    updateLobbyStatus('READY TO START');
    setLobbyStartDisabled(false);
  } catch (err) {
    console.error('Failed to refresh lobby:', err);
    updateLobbyStatus(err.message || 'Unable to load lobby right now.');
    setLobbyStartDisabled(false);
  }
}

async function openLaunchLobby() {
  const overlay = document.getElementById('launchLobbyOverlay');
  const startBtn = document.getElementById('lobbyStartBtn');
  if (!overlay || !startBtn) {
    startProfessorRound();
    return;
  }

  overlay.style.display = 'flex';

  startBtn.addEventListener('click', async () => {
    if (!window.LIVE_SESSION_ID || typeof BuzzMindAPI === 'undefined') return;
    try {
      setLobbyStartDisabled(true);
      updateLobbyStatus('Starting quiz...');
      const started = await BuzzMindAPI.startSession(window.LIVE_SESSION_ID);
      rememberDeadline(started);
      if (typeof started.currentQuestionIndex === 'number') {
        currentQuestionIndex = started.currentQuestionIndex;
      }
      closeLaunchLobby();
      startProfessorRound();
    } catch (err) {
      console.error('Failed to start live session:', err);
      updateLobbyStatus(err.message || 'Could not start quiz yet.');
      setLobbyStartDisabled(false);
    }
  });

  await refreshProfessorLobby();
  lobbyPollInterval = setInterval(refreshProfessorLobby, 2000);
}

/**
 * Load and display a question for the professor view.
 * @param {number} index
 */
function loadProfQuestion(index) {
  clearSimulationTimers();
  // Reset submission counter for this question
  submittedCount = isLiveSession() ? submittedCount : 0;
  updateSubmittedDisplay();

  const question = QUIZ_DATA.questions[index];
  const total = QUIZ_DATA.questions.length;
  if (!question) return;

  // Update badge
  const badge = document.getElementById('profQuestionBadge');
  safeSetText(badge, `QUESTION ${index + 1} OF ${total}`);

  // Update question text (safe — no innerHTML)
  const textEl = document.getElementById('profQuestionText');
  safeSetText(textEl, question.text);

  // Show/hide image — validate URL before displaying
  const imgWrapper = document.getElementById('profImageWrapper');
  const imgEl = document.getElementById('profQuestionImage');
  if (question.imageUrl && isValidImageUrl(question.imageUrl)) {
    imgEl.src = question.imageUrl;
    imgWrapper.style.display = 'block';
  } else {
    imgWrapper.style.display = 'none';
    imgEl.src = '';
  }

  // Render answer options (display only for professor)
  renderProfAnswers(question);

  // Students are self-paced now, so "Next" only browses the professor's own
  // preview. "End Quiz" stays available throughout to end early for everyone.
  const nextBtn = document.getElementById('nextBtn');
  const endBtn = document.getElementById('endBtn');
  if (nextBtn) nextBtn.style.display = index === total - 1 ? 'none' : 'block';
  if (endBtn) endBtn.style.display = 'block';

  if (!isLiveSession()) simulateSubmissions();
}

/**
 * Build answer option tiles (professor sees but can't click).
 * Correct answer is visually highlighted for the professor.
 * @param {Object} question
 */
function renderProfAnswers(question) {
  const grid = document.getElementById('profAnswersGrid');
  grid.innerHTML = ''; // safe — no user content here
  const answerImages = Array.isArray(question.answerImages)
    ? question.answerImages
    : ['', '', '', ''];

  question.answers.forEach((answerText, i) => {
    const btn = document.createElement('button');
    btn.className = `answer-btn ${ANSWER_CLASSES[i]}`;
    // Highlight the correct answer for the professor
    if (i === question.correctIndex) {
      btn.classList.add('correct-answer');
    }

    const shape = document.createElement('span');
    shape.className = 'answer-shape';
    safeSetText(shape, ANSWER_SHAPES[i]);

    const content = document.createElement('span');
    content.className = 'answer-content';

    const text = document.createElement('span');
    text.className = 'answer-text';
    safeSetText(text, sanitizeText(answerText)); // safe
    content.appendChild(text);

    const imgUrl = answerImages[i];
    if (imgUrl && isValidImageUrl(imgUrl)) {
      const img = document.createElement('img');
      img.className = 'answer-image';
      img.src = imgUrl;
      img.alt = '';
      content.appendChild(img);
    }

    btn.appendChild(shape);
    btn.appendChild(content);
    grid.appendChild(btn);
  });
}

/**
 * Advance to the next question.
 * Called by the "Next Question" button.
 */
function nextQuestion() {
  // Students are self-paced, so this only flips the professor's own preview
  // forward — it does NOT advance anyone else and keeps the shared timer running.
  clearSimulationTimers();
  if (currentQuestionIndex < QUIZ_DATA.questions.length - 1) {
    currentQuestionIndex += 1;
    loadProfQuestion(currentQuestionIndex);
  }
}

/**
 * End the quiz — show a simple end state.
 */
// REPLACE WITH THIS:
async function endQuiz() {
  clearInterval(timerInterval);
  clearSimulationTimers();
  if (window.LIVE_SESSION_ID && typeof BuzzMindAPI !== 'undefined') {
    try {
      const result = await BuzzMindAPI.endSession(window.LIVE_SESSION_ID);
      if (Array.isArray(result.leaderboard)) syncLeaderboard(result.leaderboard);
    } catch (err) {
      console.error('Failed to end live session:', err);
    }
  }

  saveFinalScores();
}

function saveFinalScores() {
  if (finalizing) return;
  finalizing = true;
  const sorted = [...scores].sort((a, b) => b.score - a.score);
  sessionStorage.setItem('finalScores', JSON.stringify(sorted));
  sessionStorage.setItem('quizTitle', QUIZ_DATA.title);

  setTimeout(() => {
    window.location.href = '/Quiz/leaderboard2.html';
  }, 800);
}

/**
 * Start the professor's countdown timer.
 * When it hits 0, auto-advance is optional (professor still controls).
 */
function profRemainingSeconds() {
  if (quizEndsAt) return Math.max(0, Math.round((quizEndsAt - Date.now()) / 1000));
  return (Number(QUIZ_DATA.totalTime) || 20) * 60;
}

/**
 * Start the single shared whole-quiz countdown for the professor's monitor.
 * When it reaches zero (live), the quiz is ended for everyone.
 */
function startProfQuizTimer() {
  clearInterval(timerInterval);
  updateProfTimerDisplay(profRemainingSeconds());
  timerInterval = setInterval(() => {
    const secs = profRemainingSeconds();
    updateProfTimerDisplay(secs);
    if (secs <= 0) {
      clearInterval(timerInterval);
      if (isLiveSession()) endQuiz();
    }
  }, 500);
}

/**
 * Update the professor's timer text (mm:ss).
 * @param {number} seconds
 */
function updateProfTimerDisplay(seconds) {
  const el = document.getElementById('profTimer');
  if (!el) return;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  safeSetText(el, `${m}:${String(s).padStart(2, '0')}`);
  // Red in the last 30s; otherwise let the gradient style show.
  el.style.color = seconds <= 30 ? '#ef4444' : '';
}

/**
 * Update the "answers submitted" stat card and bar.
 */
function updateSubmittedDisplay() {
  const countEl = document.getElementById('submittedCount');
  const bar = document.getElementById('submittedBar');
  let done;
  let total;
  if (isLiveSession()) {
    // Self-paced: show total answers received across the whole quiz.
    done = answeredTotal;
    total = expectedTotal || scores.length * (QUIZ_DATA.questions?.length || 0);
  } else {
    done = submittedCount;
    total = scores.length;
  }
  safeSetText(countEl, `${done} / ${total}`);
  if (bar) bar.style.width = `${total > 0 ? (done / total) * 100 : 0}%`;
}

/**
 * Simulate students submitting answers during the timer.
 * Each simulated student randomly picks an answer;
 * if it's the correct index their score increases.
 */
function simulateSubmissions() {
  const question = QUIZ_DATA.questions[currentQuestionIndex];
  if (!question) return;
  const correctIndex = question.correctIndex;

  scores.forEach((student, i) => {
    // Random delay: each student submits within the question time
    const delay = Math.random() * Math.max(1, QUIZ_DATA.totalTime - 2) * 1000;

    const timer = setTimeout(() => {
      // Randomly answer (weighted towards correct to feel realistic)
      const randomAnswer = Math.random() < 0.65 ? correctIndex : Math.floor(Math.random() * 4);

      if (randomAnswer === correctIndex) {
        // Award points (faster answer = more points, simplified here)
        scores[i].score += 1000;
      }

      submittedCount++;
      updateSubmittedDisplay();

      // Update leaderboard each time someone submits
      updateLeaderboard();
    }, delay);
    simulationTimers.push(timer);
  });
}

/**
 * Sort scores and re-render the leaderboard list.
 * Uses safeSetText throughout — no innerHTML with data.
 */
function updateLeaderboard() {
  // Sort descending by score
  const sorted = [...scores].sort((a, b) => b.score - a.score);

  const list = document.getElementById('leaderboardList');
  if (!list) return;

  list.innerHTML = ''; // safe — we're about to repopulate with controlled data

  // Show top 5
  sorted.slice(0, 5).forEach((student, i) => {
    const item = document.createElement('li');
    item.className = 'leaderboard-item';

    // Rank
    const rank = document.createElement('span');
    rank.className = `lb-rank rank-${i + 1}`;
    safeSetText(rank, `#${i + 1}`);

    // Avatar + name (sanitized before display)
    const person = document.createElement('div');
    person.className = 'lb-person';
    if (window.BuzzAvatar) {
      person.innerHTML = BuzzAvatar.html(
        student.name,
        student.id || student.name,
        student.avatarUrl,
        28,
      );
    }
    const name = document.createElement('span');
    name.className = 'lb-name';
    safeSetText(name, sanitizeText(student.name));
    person.appendChild(name);

    // Score
    const scoreEl = document.createElement('span');
    scoreEl.className = 'lb-score';
    safeSetText(scoreEl, student.score.toLocaleString());

    item.appendChild(rank);
    item.appendChild(person);
    item.appendChild(scoreEl);
    list.appendChild(item);
  });
}
