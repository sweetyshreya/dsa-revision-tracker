// Grab references to the HTML elements we need, using their IDs
const addBtn = document.getElementById('addBtn');
const problemNameInput = document.getElementById('problemName');
const problemLinkInput = document.getElementById('problemLink');
const problemTagInput = document.getElementById('problemTag');
const allListDiv = document.getElementById('allList');

// This array will hold all our problems in memory
let problems = [];

const savedData = localStorage.getItem('dsaProblems');
if (savedData) {
  problems = JSON.parse(savedData);
}

renderProblems();

// When the Add button is clicked, run this function
addBtn.addEventListener('click', function() {
  
  // Get the values the user typed/selected
  const name = problemNameInput.value;
  const link = problemLinkInput.value;
  const tag = problemTagInput.value;

  // Don't add an empty problem if the name box is blank
  if (name === '') {
    alert('Please enter a problem name!');
    return;
  }

  // Create a problem object to store all its info together
  const newProblem = {
    name: name,
    link: link,
    tag: tag
  };

  // Add it to our array
  problems.push(newProblem);

  // Clear the input boxes after adding
  problemNameInput.value = '';
  problemLinkInput.value = '';

  // Re-draw the list on screen
  saveProblems();
  renderProblems();
});

// This function takes the 'problems' array and displays it on the page
function renderProblems() {
  
  allListDiv.innerHTML = '';

  const reviewListDiv = document.getElementById('reviewList');
  reviewListDiv.innerHTML = '';

  const dueProblems = getDueProblems();

  if (dueProblems.length === 0) {
    reviewListDiv.innerHTML = '<p>Nothing due today. 🎉</p>';
  } else {
    dueProblems.forEach(function(problem) {
      const reviewCard = document.createElement('div');
      reviewCard.innerHTML = `<strong>${problem.name}</strong> — ${problem.tag}`;
      reviewCard.style.padding = '8px';
      reviewCard.style.borderBottom = '1px solid #eee';
      reviewListDiv.appendChild(reviewCard);
    });
  }

  problems.forEach(function(problem, index) {
    
    const card = document.createElement('div');
    card.className = 'problem-card';

    let linkHTML = '';
    if (problem.link !== '') {
      linkHTML = `<a href="${problem.link}" target="_blank">🔗 View Problem</a>`;
    }

    card.innerHTML = `
  <div class="problem-top">
    <strong>${problem.name}</strong> 
    <span class="tag">${problem.tag}</span>
  </div>
  ${linkHTML}
  <p class="next-review">📅 Next review: ${problem.nextReview ? problem.nextReview : 'Not rated yet'}</p>
  <div class="rating-buttons">
        <button class="easy-btn" data-index="${index}">Easy</button>
        <button class="medium-btn" data-index="${index}">Medium</button>
        <button class="forgot-btn" data-index="${index}">Forgot</button>
        <button class="delete-btn" data-index="${index}">Delete</button>
      </div>
    `;

    allListDiv.appendChild(card);
  });

  attachRatingButtons();
}

function saveProblems() {
  localStorage.setItem('dsaProblems', JSON.stringify(problems));
}

function getDueProblems() {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // ignore time, only compare dates

  const dueProblems = [];

  problems.forEach(function(problem) {
    if (problem.nextReview) {
      const reviewDate = new Date(problem.nextReview);
      reviewDate.setHours(0, 0, 0, 0);

      if (reviewDate <= today) {
        dueProblems.push(problem);
      }
    }
  });

  return dueProblems;
}


function attachRatingButtons() {
  const easyBtns = document.querySelectorAll('.easy-btn');
  const mediumBtns = document.querySelectorAll('.medium-btn');
  const forgotBtns = document.querySelectorAll('.forgot-btn');

  easyBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      const index = btn.getAttribute('data-index');
      setNextReview(index, 7);
    });
  });

  mediumBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      const index = btn.getAttribute('data-index');
      setNextReview(index, 3);
    });
  });

  forgotBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      const index = btn.getAttribute('data-index');
      setNextReview(index, 1);
    });
  });

  const deleteBtns = document.querySelectorAll('.delete-btn');

deleteBtns.forEach(function(btn) {
  btn.addEventListener('click', function() {
    const index = btn.getAttribute('data-index');
    
    const confirmDelete = confirm('Delete this problem?');
    if (confirmDelete) {
      problems.splice(index, 1);
      saveProblems();
      renderProblems();
    }
  });
});
}

function setNextReview(index, daysFromNow) {
  
  // Get today's date
  const today = new Date();

  // Create a new date by adding daysFromNow to today
  const nextDate = new Date();
  nextDate.setDate(today.getDate() + daysFromNow);

  // Update the problem in our array with this new review date
  problems[index].nextReview = nextDate.toDateString();

  // Re-draw the page so the change is visible
  saveProblems();
  renderProblems();
}