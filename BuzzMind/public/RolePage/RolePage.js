let selectedRole = null;

function selectRole(card) {
  document
    .querySelectorAll('.role-card')
    .forEach((c) => c.classList.remove('selected'));

  card.classList.add('selected');
  selectedRole = card.dataset.role;

  const radio = card.querySelector('input[name="role"]');
  if (radio) radio.checked = true;

  const btn = document.getElementById('continue-btn');
  const hint = document.getElementById('cta-hint');
  const lock = document.getElementById('lock-icon');

  btn.classList.add('unlocked');
  btn.disabled = false;
  lock.textContent = '▶';
  hint.classList.add('hidden');
}

function handleContinue() {
  const selectedInput = document.querySelector('input[name="role"]:checked');
  if (!selectedInput) {
    const hint = document.getElementById('cta-hint');

    hint.classList.remove('hidden');
    hint.style.color = '#c0392b';
    hint.textContent = 'PLEASE CHOOSE A ROLE FIRST!';

    setTimeout(() => {
      hint.style.color = '';
      hint.textContent = 'CHOOSE A ROLE TO UNLOCK THE NEXT LEVEL';
    }, 2500);

    return false;
  }

  return true;
}
