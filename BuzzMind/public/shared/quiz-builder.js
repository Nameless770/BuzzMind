/* Shared light-theme quiz builder - used by professor and admin QuizBuild pages.
   Requires buzzmind-api.js + shared/dashboard.js loaded first. */
(function () {
  if (typeof BuzzMindAPI === 'undefined' || typeof Dash === 'undefined') return;
  const E = Dash.escapeHTML;
  const container = document.getElementById('questionsContainer');
  if (!container) return;

  const LETTERS = ['A', 'B', 'C', 'D'];
  let questions = [];

  function blank() {
    return {
      text: '',
      imageUrl: '',
      answers: ['', '', '', ''],
      answerImages: ['', '', '', ''],
      correctIndex: 0,
    };
  }

  function checkMark() {
    return `<span class="ic">${Dash.icon('check')}</span>`;
  }

  function ensureAnswerImages(q) {
    if (!Array.isArray(q.answerImages)) {
      q.answerImages = ['', '', '', ''];
    }
    while (q.answerImages.length < 4) q.answerImages.push('');
    if (q.answerImages.length > 4) q.answerImages = q.answerImages.slice(0, 4);
  }

  function questionHtml(q, i) {
    ensureAnswerImages(q);
    const choices = [0, 1, 2, 3]
      .map((j) => {
        const hasAnswerImg = !!q.answerImages[j];
        return `
        <div class="qb-choice ${q.correctIndex === j ? 'correct' : ''}" data-choice="${j}">
          <span class="lt">${LETTERS[j]}</span>
          <div class="qb-answer-main">
            <input type="text" data-answer="${j}" value="${E(q.answers[j])}" placeholder="Answer ${LETTERS[j]}..." />
            <div class="qb-answer-img-wrap">
              <img class="qb-answer-img-prev" data-answer-img="${j}" src="${hasAnswerImg ? E(q.answerImages[j]) : ''}" alt="" style="display:${hasAnswerImg ? 'block' : 'none'}" />
              <label class="btn btn-sm btn-ghost qb-answer-img-btn" title="${hasAnswerImg ? 'Change answer image' : 'Add answer image'}">
                <span class="ic">${Dash.icon('image')}</span>
                <input type="file" accept="image/*" data-act="answerimg" data-answer-img-input="${j}" style="display:none" />
              </label>
              <button type="button" class="btn btn-sm btn-ghost qb-answer-img-remove" data-act="answerimgremove" data-answer-img-remove="${j}" style="display:${hasAnswerImg ? 'inline-flex' : 'none'}" title="Remove answer image">Remove</button>
            </div>
          </div>
          <button type="button" class="pick" data-act="pick" title="Mark as correct">${q.correctIndex === j ? checkMark() : ''}</button>
        </div>`;
      })
      .join('');
    const hasImg = !!q.imageUrl;
    return `<div class="card qb-q" data-idx="${i}">
      <div class="qb-q-head">
        <span class="qb-q-num">${i + 1}</span>
        <button type="button" class="btn btn-sm btn-danger" data-act="del" title="Delete question"><span class="ic">${Dash.icon('trash')}</span></button>
      </div>
      <textarea data-field="text" placeholder="Write your question here...">${E(q.text)}</textarea>
      <div class="qb-img-wrap">
        <img class="qb-img-prev" data-img src="${hasImg ? E(q.imageUrl) : ''}" alt="" style="display:${hasImg ? 'block' : 'none'}" />
        <label class="btn btn-sm">
          <span class="ic">${Dash.icon('image')}</span> <span data-imglabel>${hasImg ? 'Change image' : 'Add image'}</span>
          <input type="file" accept="image/*" data-act="img" style="display:none" />
        </label>
        <button type="button" class="btn btn-sm btn-ghost" data-act="imgremove" style="display:${hasImg ? 'inline-flex' : 'none'}">Remove</button>
      </div>
      <div class="qb-choices">${choices}</div>
    </div>`;
  }

  function syncFromDom() {
    container.querySelectorAll('.qb-q').forEach((card) => {
      const i = Number(card.dataset.idx);
      const q = questions[i];
      if (!q) return;
      q.text = card.querySelector('[data-field="text"]').value;
      card.querySelectorAll('[data-answer]').forEach((inp) => {
        q.answers[Number(inp.dataset.answer)] = inp.value;
      });
    });
  }

  function render() {
    container.innerHTML = questions.map(questionHtml).join('');
  }

  container.addEventListener('click', (e) => {
    const card = e.target.closest('.qb-q');
    if (!card) return;
    const i = Number(card.dataset.idx);

    if (e.target.closest('[data-act="pick"]')) {
      const j = Number(e.target.closest('[data-choice]').dataset.choice);
      questions[i].correctIndex = j;
      card.querySelectorAll('[data-choice]').forEach((c) => {
        const cj = Number(c.dataset.choice);
        c.classList.toggle('correct', cj === j);
        c.querySelector('.pick').innerHTML = cj === j ? checkMark() : '';
      });
      return;
    }

    if (e.target.closest('[data-act="del"]')) {
      syncFromDom();
      questions.splice(i, 1);
      if (!questions.length) questions.push(blank());
      render();
      return;
    }

    if (e.target.closest('[data-act="imgremove"]')) {
      questions[i].imageUrl = '';
      const img = card.querySelector('[data-img]');
      if (img) {
        img.src = '';
        img.style.display = 'none';
      }
      const label = card.querySelector('[data-imglabel]');
      if (label) label.textContent = 'Add image';
      const btn = card.querySelector('[data-act="imgremove"]');
      if (btn) btn.style.display = 'none';
      return;
    }

    if (e.target.closest('[data-act="answerimgremove"]')) {
      const j = Number(e.target.closest('[data-act="answerimgremove"]').dataset.answerImgRemove);
      ensureAnswerImages(questions[i]);
      questions[i].answerImages[j] = '';
      const img = card.querySelector(`[data-answer-img="${j}"]`);
      if (img) {
        img.src = '';
        img.style.display = 'none';
      }
      const btn = card.querySelector(`[data-act="answerimgremove"][data-answer-img-remove="${j}"]`);
      if (btn) btn.style.display = 'none';
      const label = card.querySelector(`[data-answer-img-input="${j}"]`)?.closest('label');
      if (label) label.title = 'Add answer image';
    }
  });

  container.addEventListener('change', async (e) => {
    const fileInput = e.target.closest('[data-act="img"], [data-act="answerimg"]');
    if (!fileInput || !fileInput.files || !fileInput.files[0]) return;
    const card = fileInput.closest('.qb-q');
    const i = Number(card.dataset.idx);
    try {
      const { url } = await BuzzMindAPI.uploadFile(fileInput.files[0]);
      if (fileInput.dataset.act === 'answerimg') {
        const j = Number(fileInput.dataset.answerImgInput);
        ensureAnswerImages(questions[i]);
        questions[i].answerImages[j] = url;
        const img = card.querySelector(`[data-answer-img="${j}"]`);
        if (img) {
          img.src = url;
          img.style.display = 'block';
        }
        const removeBtn = card.querySelector(
          `[data-act="answerimgremove"][data-answer-img-remove="${j}"]`,
        );
        if (removeBtn) removeBtn.style.display = 'inline-flex';
        const label = fileInput.closest('label');
        if (label) label.title = 'Change answer image';
      } else {
        questions[i].imageUrl = url;
        const img = card.querySelector('[data-img]');
        img.src = url;
        img.style.display = 'block';
        card.querySelector('[data-imglabel]').textContent = 'Change image';
        card.querySelector('[data-act="imgremove"]').style.display = 'inline-flex';
      }
      Dash.toast('Image uploaded.');
    } catch (err) {
      Dash.toast(err.message || 'Image upload failed', 'error');
    } finally {
      fileInput.value = '';
    }
  });

  document.getElementById('addQuestionBtn').addEventListener('click', () => {
    syncFromDom();
    questions.push(blank());
    render();
    const last = container.querySelector('.qb-q:last-child textarea');
    if (last) last.focus();
  });

  const importBtn = document.getElementById('importTriviaBtn');
  if (importBtn) {
    importBtn.addEventListener('click', async () => {
      const amount = Number(document.getElementById('trAmount').value) || 5;
      const difficulty = document.getElementById('trDifficulty').value;
      importBtn.disabled = true;
      try {
        const { questions: imported } = await BuzzMindAPI.importTrivia({ amount, difficulty });
        if (!imported || !imported.length) {
          Dash.toast('No questions returned. Try again.', 'error');
          return;
        }
        syncFromDom();
        const mapped = imported.map((q) => ({
          text: q.text || '',
          imageUrl: '',
          answerImages: ['', '', '', ''],
          answers: (q.answers || ['', '', '', '']).slice(0, 4),
          correctIndex: Number.isInteger(q.correctIndex) ? q.correctIndex : 0,
        }));
        const onlyBlank =
          questions.length === 1 &&
          !questions[0].text.trim() &&
          questions[0].answers.every((a) => !a.trim());
        questions = onlyBlank ? mapped : questions.concat(mapped);
        render();
        Dash.toast(`Imported ${mapped.length} question${mapped.length === 1 ? '' : 's'} from Open Trivia DB.`);
      } catch (err) {
        Dash.toast(err.message || 'Import failed', 'error');
      } finally {
        importBtn.disabled = false;
      }
    });
  }

  function collect() {
    syncFromDom();
    const title = document.getElementById('quizTitle').value.trim();
    const totalTime = Number(document.getElementById('quizTime').value) || 20;
    if (!title) {
      Dash.toast('Quiz title is required.', 'error');
      return null;
    }
    const cleaned = [];
    for (let i = 0; i < questions.length; i += 1) {
      const q = questions[i];
      const text = q.text.trim();
      const answers = q.answers.map((a) => a.trim());
      ensureAnswerImages(q);
      if (!text) {
        Dash.toast(`Question ${i + 1} needs question text.`, 'error');
        return null;
      }
      if (answers.some((a) => !a)) {
        Dash.toast(`Question ${i + 1} needs all four answers.`, 'error');
        return null;
      }
      cleaned.push({
        text,
        imageUrl: q.imageUrl || null,
        answers,
        answerImages: q.answerImages.slice(0, 4),
        correctIndex: q.correctIndex,
      });
    }
    if (!cleaned.length) {
      Dash.toast('Add at least one question.', 'error');
      return null;
    }
    return { title, totalTime, questions: cleaned };
  }

  async function save() {
    const payload = collect();
    if (!payload) return;
    const saveDraftBtn = document.getElementById('saveDraftBtn') || document.getElementById('saveBtn');
    if (saveDraftBtn) saveDraftBtn.disabled = true;
    try {
      await BuzzMindAPI.createQuiz({ ...payload, status: 'draft' });
      Dash.toast('Draft saved.');
      questions = [blank()];
      document.getElementById('quizTitle').value = '';
      render();
    } catch (err) {
      Dash.toast(err.message || 'Could not save quiz', 'error');
    } finally {
      if (saveDraftBtn) saveDraftBtn.disabled = false;
      if (saveDraftBtn) saveDraftBtn.blur();
    }
  }

  const saveDraftBtn = document.getElementById('saveDraftBtn') || document.getElementById('saveBtn');
  if (saveDraftBtn) saveDraftBtn.addEventListener('click', save);

  questions = [blank()];
  render();
  Dash.boot('quiz');
})();
