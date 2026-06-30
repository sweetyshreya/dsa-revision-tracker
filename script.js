/* ===========================================================
   DSA TRACKER — APPLICATION LOGIC
   Read top to bottom — organized in the order things happen
   when you actually use the app.
=========================================================== */

/* ---------- 1. SPACED REPETITION SCHEDULE ----------
   The "smart" part of the app. Each successful review pushes
   the next review further away — same idea as Anki, a
   simplified version of the SM-2 algorithm.

   Review 1 -> wait 1 day
   Review 2 -> wait 3 days
   Review 3 -> wait 7 days
   Review 4 -> wait 14 days
   Review 5 -> wait 30 days

After reaching the fifth revision, the problem enters
Monthly Revision Mode.

Every future review is scheduled after 30 days to
keep the concept fresh without making the interval
too long.
------------------------------------------------------------ */
const INTERVALS = [1, 3, 7, 14, 30];

/* ---------- 2. STATE ----------
   `problems` is the single source of truth — an array of
   objects, loaded from localStorage on page load and saved
   back every time something changes.
------------------------------------------------------------ */
let problems = JSON.parse(localStorage.getItem('dsa_problems') || '[]');
let editingId = null;       // which problem is being edited (null = adding new)
let currentFilter = 'all';  // which filter tab is active

function save() {
  localStorage.setItem('dsa_problems', JSON.stringify(problems));
  render();
}

/* ---------- 3. DATE HELPERS ---------- */

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

function daysBetween(dateStr) {
  const today = new Date(todayStr());
  const target = new Date(dateStr);
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
}

function getStatus(p) {
  const diff = daysBetween(p.nextReview);
  if (diff < 0) return 'overdue';
  if (diff === 0) return 'today';
  return 'upcoming';
}

function dueLabel(p) {
  const diff = daysBetween(p.nextReview);
  if (diff < 0) {
    return { text: `Overdue by ${Math.abs(diff)} day${Math.abs(diff) > 1 ? 's' : ''}`, cls: 'urgent' };
  }
  if (diff === 0) {
    return { text: 'Due today', cls: 'today' };
  }
  return { text: `Due in ${diff} day${diff > 1 ? 's' : ''}`, cls: '' };
}

/* ---------- 4. MODAL (ADD / EDIT FORM) ---------- */

function openModal(id = null) {
  editingId = id;
  document.getElementById('modalOverlay').classList.add('open');

  if (id) {
    const p = problems.find(x => x.id === id);
    document.getElementById('modalTitle').textContent = 'Edit Problem';
    document.getElementById('probName').value = p.name;
    document.getElementById('probTopic').value = p.topic;
    document.getElementById('probDifficulty').value = p.difficulty;
  } else {
    document.getElementById('modalTitle').textContent = 'Add Problem';
    document.getElementById('probName').value = '';
    document.getElementById('probTopic').value = '';
    document.getElementById('probDifficulty').value = 'medium';
  }
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  editingId = null;
}

function saveProblem() {
  const name = document.getElementById('probName').value.trim();
  const topic = document.getElementById('probTopic').value.trim() || 'General';
  const difficulty = document.getElementById('probDifficulty').value;

  if (!name) {
    alert('Please enter a problem name.');
    return;
  }

  if (editingId) {
    const p = problems.find(x => x.id === editingId);
    p.name = name;
    p.topic = topic;
    p.difficulty = difficulty;
  } else {
    problems.push({
      id: Date.now(),
      name,
      topic,
      difficulty,
      reviewCount: 0,
      nextReview: todayStr(),
      addedOn: todayStr()
    });
  }

  closeModal();
  save();
}

/* ---------- 5. ACTIONS: REVIEW UNDO DELETE ---------- */

function markReviewed(id) {

const p = problems.find(x => x.id === id);

const interval =
INTERVALS[Math.min(p.reviewCount, INTERVALS.length-1)];

p.reviewCount++;

p.nextReview = daysFromNow(interval);

save();

if(p.reviewCount >= INTERVALS.length){

    alert(
`🎉 Great!

This problem has reached Monthly Revision Mode.

From now on, every successful revision schedules the next review after 30 days to keep the concept fresh.`
    );

}else{

    alert(
`✅ Revision completed!

Next revision scheduled after ${interval} day${interval>1?"s":""}.`
    );

}

}

function undoReview(id){

const p = problems.find(x=>x.id===id);

if(!p || p.reviewCount===0){

return;

}

p.reviewCount--;

const interval =
INTERVALS[Math.min(p.reviewCount,INTERVALS.length-1)];

p.nextReview = daysFromNow(interval);

save();

alert(
`↩ Last revision undone.

Next review is scheduled in ${interval} day${interval>1?"s":""}.`
);

}

function deleteProblem(id) {
  if (confirm('Remove this problem from your tracker?')) {
    problems = problems.filter(x => x.id !== id);
    save();
  }
}

/* ---------- 6. FILTERS ---------- */

function setFilter(f) {
  currentFilter = f;
  document.querySelectorAll('.filter-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.filter === f);
  });
  render();
}

/* ---------- 7. RENDERING ----------
   These functions only READ the `problems` array and turn it
   into HTML — they never change data directly.
------------------------------------------------------------ */

function renderStats() {
  const overdue = problems.filter(p => getStatus(p) === 'overdue').length;
  const today = problems.filter(p => getStatus(p) === 'today').length;
  const upcoming = problems.filter(p => getStatus(p) === 'upcoming').length;
  const total = problems.length;

  document.getElementById('statsRow').innerHTML = `
    <div class="stat-card accent-purple">
      <div class="value">${total}</div>
      <div class="label">Total Problems</div>
    </div>
    <div class="stat-card accent-red">
      <div class="value">${overdue}</div>
      <div class="label">Overdue</div>
    </div>
    <div class="stat-card accent-yellow">
      <div class="value">${today}</div>
      <div class="label">Due Today</div>
    </div>
    <div class="stat-card accent-green">
      <div class="value">${upcoming}</div>
      <div class="label">Upcoming</div>
    </div>
  `;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function render() {
  renderStats();

  let list = problems.slice();
  if (currentFilter !== 'all') {
    list = list.filter(p => getStatus(p) === currentFilter);
  }

  list.sort((a, b) => daysBetween(a.nextReview) - daysBetween(b.nextReview));

  const container = document.getElementById('problemList');

  if (list.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="emoji">🎯</div>
        <h3>${problems.length === 0 ? 'No problems yet' : 'Nothing here'}</h3>
        <p>${problems.length === 0 ? 'Add your first problem to start tracking revisions.' : 'Try a different filter.'}</p>
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(p => {
    const status = getStatus(p);
    const due = dueLabel(p);
    const statusClass = status === 'overdue' ? 'overdue' : status === 'today' ? 'due-today' : 'upcoming';

    return `
      <div class="problem-card ${statusClass}">
        <div class="problem-main">
          <div class="problem-title">${escapeHtml(p.name)}</div>
          <div class="problem-meta">
            <span class="tag topic">${escapeHtml(p.topic)}</span>
            <span class="tag difficulty-${p.difficulty}">${p.difficulty}</span>
            <span class="due-info ${due.cls}">${due.text}</span>
          </div>
        </div>
        <span class="review-count">
    Revision Count: ${p.reviewCount}
    <br>
    ${
        p.reviewCount >= INTERVALS.length
        ? "Monthly Review (Every 30 Days)"
        : `Next Interval: ${INTERVALS[p.reviewCount]} Day${INTERVALS[p.reviewCount] > 1 ? "s" : ""}`
    }
        </span>
        <div class="problem-actions">

<button class="action-btn review"
onclick="markReviewed(${p.id})">
✓ Finished Revision
</button>

<button class="action-btn undo"
onclick="undoReview(${p.id})"
${p.reviewCount===0 ? "disabled" : ""}>
↩ Undo
</button>

<button class="action-btn edit"
onclick="openModal(${p.id})">
✏ Edit
</button>

<button class="action-btn delete"
onclick="deleteProblem(${p.id})">
🗑 Delete
</button>

</div>
        
      </div>
    `;
  }).join('');
}

/* ---------- 8. EVENT LISTENERS & STARTUP ---------- */

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => setFilter(btn.dataset.filter));
});

document.getElementById('modalOverlay').addEventListener('click', (e) => {
  if (e.target.id === 'modalOverlay') closeModal();
});

render();