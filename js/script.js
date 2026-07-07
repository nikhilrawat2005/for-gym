// Mobile nav toggle
const burger = document.getElementById('burger');
const navLinks = document.getElementById('navLinks');
burger.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});
navLinks.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => navLinks.classList.remove('open'));
});

// Live capacity meter animation
window.addEventListener('load', () => {
  const fill = document.getElementById('meterFill');
  const pct = document.getElementById('meterPct');
  const value = 62;
  setTimeout(() => { fill.style.width = value + '%'; }, 400);

  // subtle live fluctuation
  setInterval(() => {
    const newVal = Math.max(35, Math.min(90, value + Math.floor(Math.random() * 11) - 5));
    fill.style.width = newVal + '%';
    pct.textContent = newVal;
  }, 6000);
});

// Contact form - Save submissions to Firebase Firestore
const form = document.getElementById('joinForm');
const note = document.getElementById('formNote');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Get inputs
  const nameInput = form.querySelector('input[type="text"]');
  const phoneInput = form.querySelector('input[type="tel"]');
  const clubSelect = form.querySelector('select');
  const dateInput = form.querySelector('input[type="date"]');
  const submitBtn = form.querySelector('button[type="submit"]');

  const leadData = {
    name: nameInput.value.trim(),
    phone: phoneInput.value.trim(),
    club: clubSelect.value,
    visitDate: dateInput.value,
    status: 'New',
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  try {
    submitBtn.disabled = true;
    submitBtn.textContent = "Saving...";
    
    // Save to Firestore 'leads' collection
    await db.collection('leads').add(leadData);

    note.style.color = "#4caf50";
    note.textContent = "Thanks! A coach from your nearest club will call you within 24 hours.";
    form.reset();
  } catch (error) {
    console.error("Error adding lead: ", error);
    note.style.color = "#ff3333";
    note.textContent = "Failed to submit request. Please try again or call us directly.";
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Claim Free Week";
  }
});
