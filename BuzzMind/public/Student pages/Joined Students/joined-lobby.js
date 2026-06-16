const params = new URLSearchParams(window.location.search);
const pinFromUrl = params.get('pin');
const sessionFromUrl = params.get('session');
const gamePin = pinFromUrl || sessionStorage.getItem('gamePin') || '';
let activeSessionId = sessionFromUrl || sessionStorage.getItem('gameSessionId') || '';
let lobbySocket = null;

function setText(selector, value) {
  const el = document.querySelector(selector);
  if (el) el.textContent = value;
}

function renderPlayers(players = []) {
  const grid = document.querySelector('.players-grid');
  if (!grid) return;
  grid.innerHTML = '';

  players.forEach((player) => {
    const card = document.createElement('div');
    card.className = 'player-card';
    const name = player.displayName || 'Player';
    if (window.BuzzAvatar) {
      card.innerHTML = `${BuzzAvatar.html(name, player.id || name, player.avatarUrl, 36)}<span class="player-name"></span>`;
      card.querySelector('.player-name').textContent = name;
    } else {
      card.textContent = name;
    }
    grid.appendChild(card);
  });

  setText('.players-count', players.length);
}

async function fillNavAvatar() {
  if (typeof BuzzMindAPI === 'undefined' || !window.BuzzAvatar) return;
  const el = document.querySelector('.nav-actions .avatar');
  if (!el) return;
  try {
    const me = await BuzzMindAPI.getMe();
    BuzzAvatar.apply(el, me.name || 'You', me.avatarUrl, me.id || me.name);
  } catch (_) {
    /* not logged in */
  }
}

function goToQuiz(sessionId) {
  if (!sessionId) return;
  window.location.href = `/Quiz/student-quiz.html?session=${sessionId}`;
}

function isCurrentSession(payload) {
  if (!payload?.sessionId || !activeSessionId) return true;
  return String(payload.sessionId) === String(activeSessionId);
}

function joinSocketRoom() {
  if (lobbySocket?.connected && activeSessionId) {
    lobbySocket.emit('session:join', activeSessionId);
  }
}

function applySessionState(session) {
  if (!session) return;
  activeSessionId = activeSessionId || session.sessionId;
  if (activeSessionId) sessionStorage.setItem('gameSessionId', activeSessionId);
  setText('.pin-number', session.pinFormatted || gamePin);
  setText(
    '.status-pill',
    session.status === 'active' ? 'QUIZ STARTED' : 'WAITING FOR PROFESSOR TO START...',
  );
  renderPlayers(session.players || []);
  joinSocketRoom();
}

function initLobbySocket() {
  if (typeof io === 'undefined') return;
  try {
    lobbySocket = io({ transports: ['websocket'], withCredentials: true });

    lobbySocket.on('connect', async () => {
      try {
        if (typeof BuzzMindAPI !== 'undefined') {
          const me = await BuzzMindAPI.getMe().catch(() => null);
          const userId = me && (me.id || me._id || me.userId);
          if (userId) lobbySocket.emit('user:join', userId);
        }
      } catch (err) {
        console.error('socket user join failed', err);
      }
      joinSocketRoom();
    });

    lobbySocket.on('session:playersUpdated', (payload) => {
      if (!isCurrentSession(payload)) return;
      applySessionState(payload);
    });

    lobbySocket.on('session:started', (payload) => {
      if (!isCurrentSession(payload)) return;
      const sessionId = payload.sessionId || activeSessionId;
      if (sessionId) goToQuiz(sessionId);
    });

    lobbySocket.on('session:ended', (payload) => {
      if (!isCurrentSession(payload)) return;
      setText('.status-pill', 'SESSION ENDED');
    });
  } catch (err) {
    console.warn('Lobby socket unavailable', err);
  }
}

async function refreshLobby() {
  if (!gamePin || typeof BuzzMindAPI === 'undefined') return;

  try {
    const session = await BuzzMindAPI.getSessionByPin(gamePin);
    const sessionId = sessionFromUrl || session.sessionId;
    activeSessionId = sessionId;
    applySessionState(session);
    if (session.status === 'active' && session.questionOpen) {
      goToQuiz(sessionId);
    }
  } catch (err) {
    setText('.status-pill', err.message || 'SESSION NOT FOUND');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  setText('.pin-number', gamePin ? gamePin.replace(/(\d{3})(\d{3})/, '$1 $2') : '---');

  fillNavAvatar();
  initLobbySocket();
  refreshLobby();
  setInterval(refreshLobby, 2000);
});
