let students = [];
let editingId = null;
let classId = null;
let drafts = [];
let currentClass = null;

function getClassIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('classId');
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidName(name) {
  return /^[a-zA-Z\s\-']{2,}$/.test(name);
}

function showError(id, message) {
  document.querySelector(id).textContent = message;
}

function clearErrors(...ids) {
  ids.forEach((id) => (document.querySelector(id).textContent = ''));
}

function escapeHTML(value) {
  if (window.Dash?.escapeHTML) return window.Dash.escapeHTML(value);
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function initials(name) {
  if (window.Dash?.initials) return window.Dash.initials(name);
  return (
    String(name || '?')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || '?'
  );
}

function gradeClass(g) {
  const grade = Number(g);
  if (!Number.isFinite(grade)) return 'grade-empty';
  if (grade >= 85) return 'grade-high';
  if (grade >= 70) return 'grade-mid';
  return 'grade-low';
}

function boundedNumber(value, min, max) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.max(min, Math.min(max, Math.round(n)));
}

function updateClassSummary(cls) {
  const enrolled = students.length;
  const title = document.querySelector('#class-banner-title');
  const copy = document.querySelector('#class-banner-copy');
  const enrolledBadge = document.querySelector('.enrolled-badge');

  if (title) title.textContent = cls?.name ? `${cls.name} snapshot` : 'Classroom snapshot';
  if (copy) {
    copy.textContent = cls
      ? `${enrolled} enrolled student${enrolled === 1 ? '' : 's'}.`
      : 'Open a class from My Classrooms to manage roster data.';
  }
  if (enrolledBadge) enrolledBadge.textContent = `${enrolled} Enrolled`;
}

function mapStudent(s) {
  return {
    id: s._id,
    name: s.name,
    email: s.email,
    averageScore: boundedNumber(s.averageScore, 0, 100),
    accuracyAttempts: Number(s.accuracyAttempts) || 0,
    avatarUrl: s.avatarUrl || '',
    emoji: s.emoji || '',
  };
}

function setDraftMessage(message, type = '') {
  const msg = document.querySelector('#draft-launch-msg');
  if (!msg) return;
  msg.textContent = message || '';
  msg.className = `draft-launch-msg${type ? ` ${type}` : ''}`;
}

function setDraftControlsDisabled(disabled) {
  const launchBtn = document.querySelector('#launch-draft-btn');
  const refreshBtn = document.querySelector('#refresh-drafts-btn');
  if (launchBtn) launchBtn.disabled = disabled || drafts.length === 0;
  if (refreshBtn) refreshBtn.disabled = disabled;
}

function draftMeta(quiz) {
  const count = Array.isArray(quiz.questions) ? quiz.questions.length : 0;
  const label = count === 1 ? 'question' : 'questions';
  return `${quiz.title || 'Untitled draft'} - ${count} ${label}`;
}

function renderDrafts() {
  const select = document.querySelector('#draft-select');
  if (!select) return;

  select.innerHTML = '';
  if (!drafts.length) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'No draft quizzes found';
    select.appendChild(option);
    setDraftControlsDisabled(false);
    document.querySelector('#launch-draft-btn').disabled = true;
    return;
  }

  drafts.forEach((quiz) => {
    const option = document.createElement('option');
    option.value = quiz._id;
    option.textContent = draftMeta(quiz);
    select.appendChild(option);
  });
  setDraftControlsDisabled(false);
}

async function loadDrafts() {
  const select = document.querySelector('#draft-select');
  if (!select || typeof BuzzMindAPI === 'undefined') return;

  setDraftMessage('Loading your draft quizzes...');
  setDraftControlsDisabled(true);
  try {
    const list = await BuzzMindAPI.getQuizzes({ status: 'draft' });
    drafts = Array.isArray(list) ? list : [];
    renderDrafts();
    setDraftMessage(
      drafts.length
        ? 'Choose any draft quiz, then attach it to this class.'
        : 'No drafts yet. Save a draft from Quiz Builder first.',
    );
  } catch (err) {
    drafts = [];
    renderDrafts();
    setDraftMessage(err.message || 'Could not load draft quizzes.', 'error');
  }
}

function showLaunchResult(session) {
  const card = document.querySelector('#live-session-card');
  const pin = document.querySelector('#launched-pin');
  const lobby = document.querySelector('#open-prof-lobby');
  if (!card || !pin || !lobby) return;

  const lobbyUrl = `/Quiz/professor-quiz.html?session=${encodeURIComponent(session.sessionId)}`;
  pin.textContent = session.pinFormatted || session.pin || '---';
  lobby.href = lobbyUrl;
  card.hidden = false;
}

async function launchSelectedDraft() {
  const select = document.querySelector('#draft-select');
  const quizId = select?.value;
  const timeInput = document.querySelector('#draft-time');
  const totalTime = Number(timeInput?.value);
  classId = classId || getClassIdFromUrl();

  if (!classId) {
    setDraftMessage('Open this page from a class before launching a quiz.', 'error');
    return;
  }
  if (!quizId) {
    setDraftMessage('Choose a draft quiz first.', 'error');
    return;
  }
  if (!Number.isFinite(totalTime) || totalTime < 5 || totalTime > 120) {
    setDraftMessage('Quiz time must be between 5 and 120 minutes.', 'error');
    return;
  }

  setDraftControlsDisabled(true);
  setDraftMessage('Attaching draft and creating live session...');
  try {
    const session = await BuzzMindAPI.launchQuiz(quizId, {
      classId,
      totalTime: Math.round(totalTime),
    });
    sessionStorage.setItem('gameSessionId', session.sessionId);
    sessionStorage.setItem('gamePin', session.pin);
    showLaunchResult(session);
    drafts = drafts.filter((quiz) => String(quiz._id) !== String(quizId));
    renderDrafts();
    setDraftMessage('Live lobby created. Taking you there now...', 'success');
    setTimeout(() => {
      window.location.href = `/Quiz/professor-quiz.html?session=${encodeURIComponent(session.sessionId)}`;
    }, 900);
  } catch (err) {
    setDraftMessage(err.message || 'Could not launch this draft.', 'error');
  } finally {
    setDraftControlsDisabled(false);
  }
}

function renderRoster(list) {
  const tbody = document.querySelector('#roster-body');
  tbody.innerHTML = '';

  document.querySelector('#roster-count').textContent =
    `Showing ${list.length} of ${students.length} students`;
  updateClassSummary(currentClass);

  if (!list.length) {
    tbody.innerHTML = `<tr class="roster-empty-row"><td colspan="3">${
      students.length ? 'No students match your search.' : 'No students enrolled yet.'
    }</td></tr>`;
    return;
  }

  list.forEach((s) => {
    const tr = document.createElement('tr');
    const fallbackAvatar = s.emoji || initials(s.name);
    const avatar = window.Dash?.avatarHTML
      ? Dash.avatarHTML(s.name, s.id || s.email, s.avatarUrl, 'student-avatar')
      : `<div class="student-avatar">${escapeHTML(fallbackAvatar)}</div>`;
    const scoreText = s.averageScore === null ? '--' : `${s.averageScore}%`;
    const scoreTitle = s.accuracyAttempts
      ? ` title="${escapeHTML(`${s.accuracyAttempts} quiz attempt${s.accuracyAttempts === 1 ? '' : 's'}`)}"`
      : '';
    tr.innerHTML = `
      <td>
        <div class="student-info">
          ${avatar}
          <div>
            <div class="student-name">${escapeHTML(s.name)}</div>
            <div class="student-email">${escapeHTML(s.email)}</div>
          </div>
        </div>
      </td>
      <td><span class="grade-badge ${gradeClass(s.averageScore)}"${scoreTitle}>${escapeHTML(scoreText)}</span></td>
      <td>
        <div class="action-btns">
          <button class="btn-delete" data-id="${escapeHTML(s.id)}" type="button" title="Delete student" aria-label="Delete ${escapeHTML(s.name)}">
            <span class="ic">${window.Dash ? Dash.icon('trash') : ''}</span>
          </button>
        </div>
      </td>`;
    tbody.appendChild(tr);
  });

  document.querySelectorAll('.btn-delete').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      if (classId && typeof BuzzMindAPI !== 'undefined') {
        try {
          const cls = await BuzzMindAPI.deleteStudent(classId, id);
          students = cls.students.map(mapStudent);
          currentClass = cls;
        } catch (err) {
          console.error(err);
          return;
        }
      } else {
        return;
      }
      renderRoster(students);
    });
  });
}

async function loadClassRoster() {
  classId = getClassIdFromUrl();
  if (!classId || typeof BuzzMindAPI === 'undefined') {
    currentClass = null;
    students = [];
    const title = document.querySelector('.page-title, h1, .class-title, .current-class-name');
    if (title) title.textContent = 'Classroom Management';
    renderRoster(students);
    return;
  }

  try {
    const cls = await BuzzMindAPI.getClass(classId);
    currentClass = cls;
    students = cls.students.map(mapStudent);
    const title = document.querySelector('.page-title, h1, .class-title, .current-class-name');
    if (title) title.textContent = cls.name;
    renderRoster(students);
  } catch (err) {
    console.error(err);
    currentClass = null;
    students = [];
    renderRoster([]);
  }
}

document.querySelector('#search-input')?.addEventListener('input', (e) => {
  const q = e.target.value.toLowerCase();
  renderRoster(
    students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q),
    ),
  );
});

document.querySelector('#refresh-drafts-btn')?.addEventListener('click', loadDrafts);
document.querySelector('#launch-draft-btn')?.addEventListener('click', launchSelectedDraft);

const addModal = document.querySelector('#add-modal');

document.querySelector('#add-student-btn').onclick = () => {
  addModal.style.display = 'flex';
};

document.querySelector('#cancel-add').onclick = () => {
  addModal.style.display = 'none';
};

document.querySelector('#confirm-add').onclick = async () => {
  const name = document.querySelector('#new-name').value.trim();
  const email = document.querySelector('#new-email').value.trim();

  clearErrors('#add-name-error', '#add-email-error');

  if (!isValidName(name)) {
    showError('#add-name-error', 'Invalid name');
    return;
  }
  if (!isValidEmail(email)) {
    showError('#add-email-error', 'Invalid email');
    return;
  }

  if (!classId || typeof BuzzMindAPI === 'undefined') {
    showError('#add-email-error', 'Open a saved class before adding students.');
    return;
  }

  try {
    const cls = await BuzzMindAPI.addStudent(classId, { name, email });
    currentClass = cls;
    students = cls.students.map(mapStudent);
  } catch (err) {
    showError('#add-email-error', err.message);
    return;
  }

  addModal.style.display = 'none';
  document.querySelector('#new-name').value = '';
  document.querySelector('#new-email').value = '';
  renderRoster(students);
};

document.querySelectorAll('.modal-overlay').forEach((m) => {
  m.onclick = (e) => {
    if (e.target === m) m.style.display = 'none';
  };
});

document.addEventListener('DOMContentLoaded', async () => {
  if (window.Dash?.boot) await window.Dash.boot('classes');
  await loadClassRoster();
  await loadDrafts();
});
