const playerName = sessionStorage.getItem('playerName') || 'Player';

const studentCard = document.getElementById('studentCard');
const playerNameEl = document.getElementById('playerNameEl');
const scoreEl = document.getElementById('scoreEl');
const rankingsList = document.getElementById('rankingsList');
const homeBtn = document.getElementById('homeBtn');

function renderRankings(entries) {
  if (!rankingsList) return;
  rankingsList.innerHTML = '';

  if (!entries.length) {
    rankingsList.innerHTML =
      '<p class="lb-empty">No scores yet.</p>';
    return;
  }

  entries.forEach((entry, i) => {
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

function setStudentScore(correct, total, points) {
  if (playerNameEl) playerNameEl.textContent = playerName;
  if (!scoreEl) return;

  if (points != null) {
    scoreEl.textContent = `${Number(points).toLocaleString()} pts`;
    const label = scoreEl.nextElementSibling;
    if (label && label.tagName === 'P') label.textContent = 'total score';
  } else {
    scoreEl.textContent = `${correct} / ${total}`;
    const label = scoreEl.nextElementSibling;
    if (label && label.tagName === 'P') label.textContent = 'correct answers';
  }
}

const STUDENT_HOME = '/Student pages/Home Page/Index.html';

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const sessionFromUrl = params.get('session');
  const sessionId =
    sessionFromUrl || sessionStorage.getItem('gameSessionId');
  if (sessionFromUrl) {
    sessionStorage.setItem('gameSessionId', sessionFromUrl);
  }
  let rankings = [];

  if (sessionId && typeof BuzzMindAPI !== 'undefined') {
    try {
      const data = await BuzzMindAPI.getLeaderboard(sessionId);
      rankings = (data.leaderboard || []).map((row) => ({
        id: row.id,
        name: row.name,
        avatarUrl: row.avatarUrl || '',
        score: row.score,
      }));

      const mine = rankings.find(
        (row) => row.name.toLowerCase() === playerName.toLowerCase(),
      );
      if (mine) {
        setStudentScore(null, null, mine.score);
      } else {
        const correct = sessionStorage.getItem('finalScore') || 0;
        const total = sessionStorage.getItem('totalQuestions') || 0;
        setStudentScore(correct, total);
      }
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
      const correct = sessionStorage.getItem('finalScore') || 0;
      const total = sessionStorage.getItem('totalQuestions') || 0;
      setStudentScore(correct, total);
    }
  } else {
    const correct = sessionStorage.getItem('finalScore') || 0;
    const total = sessionStorage.getItem('totalQuestions') || 0;
    setStudentScore(correct, total);

    try {
      rankings = JSON.parse(sessionStorage.getItem('finalScores') || '[]');
      if (!Array.isArray(rankings)) rankings = [];
    } catch (_) {
      rankings = [];
    }
  }

  renderRankings(rankings);

  if (homeBtn) {
    homeBtn.href = STUDENT_HOME;
  }
});
