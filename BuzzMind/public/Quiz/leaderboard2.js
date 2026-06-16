const role =
  sessionStorage.getItem('buzzmindRole') ||
  sessionStorage.getItem('role') ||
  'professor';
const playerName = sessionStorage.getItem('playerName') || 'Player';

const studentCard = document.getElementById('studentCard');
const playerNameEl = document.getElementById('playerNameEl');
const scoreEl = document.getElementById('scoreEl');
const rankingsList = document.getElementById('rankingsList');
const homeBtn = document.getElementById('homeBtn');

if (role === 'student') {
  const score = sessionStorage.getItem('finalScore') || 0;
  const total = sessionStorage.getItem('totalQuestions') || 0;
  if (playerNameEl) playerNameEl.textContent = playerName;
  if (scoreEl) scoreEl.textContent = `${score} / ${total}`;
} else if (studentCard) {
  studentCard.style.display = 'none';
  document.querySelector('.lb-grid')?.classList.add('rankings-only');
}

if (homeBtn) {
  homeBtn.href =
    role === 'student'
      ? '/Student pages/Home Page/Index.html'
      : role === 'admin'
        ? '/Admin pages/Classes/index.html'
        : '/Prof page/Classes page/professor2.html';
}

let finalScores = [];
try {
  finalScores = JSON.parse(sessionStorage.getItem('finalScores') || '[]');
  if (!Array.isArray(finalScores)) finalScores = [];
} catch (_) {
  finalScores = [];
}

if (rankingsList) {
  if (finalScores.length === 0) {
    rankingsList.innerHTML =
      '<p class="lb-empty">No scores yet.</p>';
  } else {
    finalScores.forEach((entry, i) => {
      const item = document.createElement('div');
      item.className = 'lb-item';

      const rank = document.createElement('span');
      rank.className =
        'lb-rank' + (i === 0 ? ' gold' : i === 1 ? ' silver' : i === 2 ? ' bronze' : '');
      rank.textContent = `#${i + 1}`;

      const person = document.createElement('div');
      person.className = 'lb-person';
      if (window.BuzzAvatar) {
        person.innerHTML = BuzzAvatar.html(
          entry.name || 'Player',
          entry.id || entry.name,
          entry.avatarUrl,
          34,
        );
      }
      const name = document.createElement('span');
      name.className = 'lb-name';
      name.textContent = entry.name || 'Player';
      person.appendChild(name);

      const pts = document.createElement('span');
      pts.className = 'lb-score';
      pts.textContent = entry.score ? `${Number(entry.score).toLocaleString()} pts` : '0 pts';

      item.appendChild(rank);
      item.appendChild(person);
      item.appendChild(pts);
      rankingsList.appendChild(item);
    });
  }
}
