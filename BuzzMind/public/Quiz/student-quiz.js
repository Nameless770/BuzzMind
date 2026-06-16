/* =============================================
   student-quiz.js
   Handles the student-facing quiz experience:
   - Shows one question at a time with a timer
   - Lets student pick one answer
   - Shows correct/incorrect feedback
   - Tracks score and shows results at the end
   ============================================= */

// ---- State ----
let currentQuestionIndex = 0; // which question we're on
let score = 0; // how many correct answers
let timerInterval = null; // reference to the countdown interval
let quizEndsAt = null; // shared deadline (ms epoch) for the WHOLE quiz
let answered = false; // has the student answered the current question yet?
let studentSocket = null;
let livePoints = Number(sessionStorage.getItem('livePoints')) || 0;

// Circumference of the SVG timer ring (2 * π * r, r=26)
const RING_CIRCUMFERENCE = 163.4;

// ---- Start on page load ----
document.addEventListener('DOMContentLoaded', async () => {
  if (window.quizReady) await window.quizReady;
  if (window.LIVE_SESSION_ID && typeof BuzzMindAPI !== 'undefined') {
    try {
      const session = await BuzzMindAPI.getSession(window.LIVE_SESSION_ID);
      if (session?.pin) sessionStorage.setItem('gamePin', session.pin);

      if (session?.status !== 'active') {
        const pin = session?.pin || sessionStorage.getItem('gamePin') || '';
        const lobbyUrl = pin
          ? `/Student pages/Joined Students/Joined Students.html?pin=${encodeURIComponent(pin)}`
          : '/Student pages/Joined Students/Joined Students.html';
        window.location.href = lobbyUrl;
        return;
      }

      // Shared countdown for the whole quiz — everyone sees the same time left.
      if (session.endsAt) quizEndsAt = new Date(session.endsAt).getTime();
      // Self-paced: each student starts at the first question and advances alone.
      currentQuestionIndex = 0;
    } catch (err) {
      console.error('Failed to verify session state:', err);
    }
  }

  const nextBtn = document.getElementById('nextQuestionBtn');
  if (nextBtn) nextBtn.addEventListener('click', goToNextQuestion);

  initLiveSocket();
  startQuizTimer();
  loadQuestion(currentQuestionIndex);
});

function isCurrentLiveSession(payload) {
  if (!window.LIVE_SESSION_ID || !payload?.sessionId) return true;
  return String(payload.sessionId) === String(window.LIVE_SESSION_ID);
}

function isLiveQuiz() {
  return !!window.LIVE_SESSION_ID;
}

// Total quiz time in seconds (totalTime is configured in MINUTES).
function totalQuizSeconds() {
  return (Number(QUIZ_DATA.totalTime) || 20) * 60;
}

// Seconds remaining on the shared quiz countdown.
function remainingSeconds() {
  if (quizEndsAt) return Math.max(0, Math.round((quizEndsAt - Date.now()) / 1000));
  return totalQuizSeconds();
}

function initLiveSocket() {
  if (!window.LIVE_SESSION_ID || typeof io === 'undefined') return;
  try {
    studentSocket = io({ transports: ['websocket'], withCredentials: true });

    studentSocket.on('connect', async () => {
      try {
        if (typeof BuzzMindAPI !== 'undefined') {
          const me = await BuzzMindAPI.getMe().catch(() => null);
          const userId = me && (me.id || me._id || me.userId);
          if (userId) studentSocket.emit('user:join', userId);
        }
      } catch (err) {
        console.error('socket user join failed', err);
      }
      studentSocket.emit('session:join', window.LIVE_SESSION_ID);
    });

    // Self-paced: students navigate themselves, so we intentionally do NOT
    // follow the professor's question changes. We only react when the whole
    // quiz ends (time up / professor ends it).
    studentSocket.on('session:ended', (payload) => {
      if (!isCurrentLiveSession(payload)) return;
      clearInterval(timerInterval);
      showResults();
    });
  } catch (err) {
    console.warn('Student quiz socket unavailable', err);
  }
}

/**
 * Load and display a question by index.
 * @param {number} index
 */
function loadQuestion(index) {
  // Reset answered flag
  answered = false;

  const question = QUIZ_DATA.questions[index];
  const totalQuestions = QUIZ_DATA.questions.length;

  // Update question badge: "QUESTION 2 OF 4"
  const badge = document.getElementById('questionBadge');
  safeSetText(badge, `QUESTION ${index + 1} OF ${totalQuestions}`);

  // Update question text (safe — no innerHTML)
  const questionTextEl = document.getElementById('questionText');
  safeSetText(questionTextEl, question.text);

  // Show/hide image — validate URL before displaying
  const imageWrapper = document.getElementById('questionImageWrapper');
  const imgEl = document.getElementById('questionImage');
  if (question.imageUrl && isValidImageUrl(question.imageUrl)) {
    imgEl.src = question.imageUrl; // URL already validated
    imageWrapper.style.display = 'block';
  } else {
    imageWrapper.style.display = 'none';
    imgEl.src = '';
  }

  // Render the 4 answer buttons
  renderAnswers(question);

  // Hide old feedback + the self-paced Next button until they answer
  const feedback = document.getElementById('feedbackBanner');
  if (feedback) feedback.style.display = 'none';
  hideNextButton();
}

/**
 * Build the 4 answer choice buttons.
 * Uses safeSetText everywhere — no innerHTML.
 * @param {Object} question
 */
function renderAnswers(question) {
  const grid = document.getElementById('answersGrid');
  grid.innerHTML = ''; // clear old buttons (this is safe — no user content)
  const answerImages = Array.isArray(question.answerImages)
    ? question.answerImages
    : ['', '', '', ''];

  question.answers.forEach((answerText, i) => {
    const btn = document.createElement('button');
    btn.className = `answer-btn ${ANSWER_CLASSES[i]}`;
    btn.setAttribute('data-index', i); // store answer index

    // Shape icon
    const shape = document.createElement('span');
    shape.className = 'answer-shape';
    safeSetText(shape, ANSWER_SHAPES[i]); // safe

    const content = document.createElement('span');
    content.className = 'answer-content';

    // Answer text — use safeSetText, NOT innerHTML
    const text = document.createElement('span');
    text.className = 'answer-text';
    safeSetText(text, sanitizeText(answerText)); // sanitized + safe
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

    // Click handler
    btn.addEventListener('click', () => handleAnswer(i));

    grid.appendChild(btn);
  });
}

/**
 * Handle the student selecting an answer.
 * @param {number} selectedIndex - which answer they clicked (0-3)
 */
async function handleAnswer(selectedIndex) {
  if (answered) return;
  answered = true;
  // NOTE: do not stop timerInterval here — it's the shared whole-quiz countdown.

  const question = QUIZ_DATA.questions[currentQuestionIndex];
  let isCorrect = selectedIndex === question.correctIndex;

  if (window.LIVE_SESSION_ID && typeof BuzzMindAPI !== 'undefined') {
    try {
      const result = await BuzzMindAPI.submitAnswer(window.LIVE_SESSION_ID, {
        playerId: sessionStorage.getItem('playerId'),
        displayName: sessionStorage.getItem('playerName'),
        questionIndex: currentQuestionIndex,
        answerIndex: selectedIndex,
      });
      isCorrect = result.correct;
      question.correctIndex = result.correctIndex;
      livePoints = Number(result.score) || livePoints;
      sessionStorage.setItem('livePoints', livePoints);
      if (result.correct) score++;
    } catch (err) {
      console.error(err);
      // Already answered (e.g. on reconnect) or time up — let them move on.
      revealAnswers(question.correctIndex, selectedIndex);
      showWaitingFeedback(err.message || 'Could not submit your answer.');
      showNextButton();
      return;
    }
  } else if (isCorrect) {
    score++;
  }

  // Visually mark correct and wrong answers
  revealAnswers(question.correctIndex, selectedIndex);

  // Show feedback banner, then let the student advance themselves.
  showFeedback(isCorrect);
  showNextButton();
}

/**
 * Reveal the self-paced "Next question" button (becomes "See results" on the
 * final question). The student controls the pace — no waiting for the professor.
 */
function showNextButton() {
  const btn = document.getElementById('nextQuestionBtn');
  if (!btn) return;
  const isLast = currentQuestionIndex >= QUIZ_DATA.questions.length - 1;
  safeSetText(btn, isLast ? 'See results' : 'Next question');
  btn.style.display = 'inline-flex';
}

function hideNextButton() {
  const btn = document.getElementById('nextQuestionBtn');
  if (btn) btn.style.display = 'none';
}

/**
 * Advance to the next question (or finish) — triggered by the student.
 */
function goToNextQuestion() {
  hideNextButton();
  currentQuestionIndex++;
  if (currentQuestionIndex < QUIZ_DATA.questions.length) {
    loadQuestion(currentQuestionIndex);
  } else {
    showResults();
  }
}

/**
 * Highlight the correct answer and dim wrong ones.
 * @param {number} correctIndex
 * @param {number} selectedIndex
 */
function revealAnswers(correctIndex, selectedIndex) {
  const buttons = document.querySelectorAll('.answer-btn');
  buttons.forEach((btn, i) => {
    btn.disabled = true;
    if (i === correctIndex) {
      btn.classList.add('correct-answer');
    } else {
      btn.classList.add('wrong-answer');
    }
  });
}

function disableAnswers() {
  document.querySelectorAll('.answer-btn').forEach((btn) => {
    btn.disabled = true;
  });
}

/**
 * Show the correct/incorrect feedback banner.
 * @param {boolean} isCorrect
 */
function showFeedback(isCorrect) {
  const banner = document.getElementById('feedbackBanner');
  const icon = document.getElementById('feedbackIcon');
  const text = document.getElementById('feedbackText');

  banner.className = `feedback-banner ${isCorrect ? 'correct' : 'incorrect'}`;
  safeSetText(icon, '');
  safeSetText(
    text,
    isCorrect ? 'Correct! Great job!' : 'Not quite — keep going!',
  );
  banner.style.display = 'flex';
}

function showWaitingFeedback(message) {
  const banner = document.getElementById('feedbackBanner');
  const icon = document.getElementById('feedbackIcon');
  const text = document.getElementById('feedbackText');

  banner.className = 'feedback-banner';
  safeSetText(icon, '');
  safeSetText(text, message);
  banner.style.display = 'flex';
}

/**
 * Start the single shared countdown for the WHOLE quiz.
 * When it hits zero the quiz is over for this student.
 */
function startQuizTimer() {
  clearInterval(timerInterval);
  updateTimerDisplay(remainingSeconds());
  timerInterval = setInterval(() => {
    const secs = remainingSeconds();
    updateTimerDisplay(secs);
    if (secs <= 0) {
      clearInterval(timerInterval);
      onTimeUp();
    }
  }, 500);
}

/**
 * The whole-quiz time ran out — finish up for this student.
 */
function onTimeUp() {
  disableAnswers();
  hideNextButton();
  showWaitingFeedback("Time's up!");
  setTimeout(showResults, 800);
}

/**
 * Update the timer number (mm:ss) and SVG ring animation.
 * @param {number} seconds - seconds remaining in the whole quiz
 */
function updateTimerDisplay(seconds) {
  const numEl = document.getElementById('timerNumber');
  const ring = document.getElementById('timerRing');

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  safeSetText(numEl, `${mins}:${String(secs).padStart(2, '0')}`);

  // Ring: full at quiz start, empty when the quiz time is gone.
  const totalSeconds = totalQuizSeconds();
  const progress = totalSeconds > 0 ? seconds / totalSeconds : 0;
  const offset = RING_CIRCUMFERENCE * (1 - Math.max(0, Math.min(1, progress)));
  if (ring) {
    ring.style.strokeDashoffset = offset;
    // Turn ring red in the last 30 seconds
    if (seconds <= 30) {
      ring.classList.add('urgent');
    } else {
      ring.classList.remove('urgent');
    }
  }
}

/**
 * Hide the quiz area and show the final results screen.
 */
// REPLACE WITH THIS:
function leaderboardUrl() {
  const sessionId =
    window.LIVE_SESSION_ID || sessionStorage.getItem('gameSessionId');
  return sessionId
    ? `/Quiz/leaderboard.html?session=${encodeURIComponent(sessionId)}`
    : '/Quiz/leaderboard.html';
}

function showResults() {
  const total = QUIZ_DATA.questions.length;
  const resultsScreen = document.getElementById('resultsScreen');
  const quizArea = document.getElementById('quizArea');

  sessionStorage.setItem('finalScore', score);
  sessionStorage.setItem('totalQuestions', total);
  sessionStorage.setItem('livePoints', livePoints);
  sessionStorage.setItem(
    'playerName',
    sessionStorage.getItem('playerName') || 'Student',
  );

  if (quizArea) quizArea.style.display = 'none';
  if (resultsScreen) {
    resultsScreen.style.display = 'flex';
    const resultsScore = document.getElementById('resultsScore');
    if (resultsScore) {
      const points = Number(sessionStorage.getItem('livePoints')) || 0;
      safeSetText(
        resultsScore,
        isLiveQuiz() ? `Your score: ${points.toLocaleString()} points` : `You got ${score} / ${total} correct!`,
      );
    }
  }

  const resultsBtn = document.getElementById('resultsLeaderboardBtn');
  if (resultsBtn) {
    resultsBtn.onclick = () => {
      window.location.href = leaderboardUrl();
    };
  }

  setTimeout(() => {
    window.location.href = leaderboardUrl();
  }, 800);
}
