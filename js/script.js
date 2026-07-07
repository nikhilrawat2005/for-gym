// ============================================================
// AUTH — Nav Sign-In / User State
// ============================================================
const ADMIN_EMAIL = "nikhil2005114@gmail.com";

const navSignInBtn    = document.getElementById('navSignInBtn');
const navAdminLink    = document.getElementById('navAdminLink');
const navUserChip     = document.getElementById('navUserChip');
const navUserPhoto    = document.getElementById('navUserPhoto');
const navUserName     = document.getElementById('navUserName');
const navSignOutBtn   = document.getElementById('navSignOutBtn');

const signinOverlay        = document.getElementById('signinModalOverlay');
const modalCloseBtn        = document.getElementById('modalCloseBtn');
const modalEmailSignInBtn  = document.getElementById('modalEmailSignInBtn');
const modalGoogleSignInBtn = document.getElementById('modalGoogleSignInBtn');
const modalEmail           = document.getElementById('modalEmail');
const modalPassword        = document.getElementById('modalPassword');
const modalError           = document.getElementById('modalError');

// Open / Close modal
navSignInBtn.addEventListener('click', () => signinOverlay.classList.add('open'));
modalCloseBtn.addEventListener('click', () => closeModal());
signinOverlay.addEventListener('click', (e) => { if (e.target === signinOverlay) closeModal(); });

function closeModal() {
  signinOverlay.classList.remove('open');
  modalError.style.display = 'none';
  modalEmail.value = '';
  modalPassword.value = '';
}

function showModalError(msg) {
  modalError.textContent = msg;
  modalError.style.display = 'block';
}

// Email + Password sign-in from modal
modalEmailSignInBtn.addEventListener('click', () => {
  const email    = modalEmail.value.trim();
  const password = modalPassword.value;
  if (!email || !password) { showModalError('Please enter email and password.'); return; }
  modalError.style.display = 'none';
  modalEmailSignInBtn.textContent = 'Signing in...';
  modalEmailSignInBtn.disabled = true;
  auth.signInWithEmailAndPassword(email, password)
    .then(() => closeModal())
    .catch((err) => showModalError(err.message))
    .finally(() => {
      modalEmailSignInBtn.textContent = 'Sign In';
      modalEmailSignInBtn.disabled = false;
    });
});

// Google sign-in from modal
modalGoogleSignInBtn.addEventListener('click', () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  modalError.style.display = 'none';
  auth.signInWithPopup(provider)
    .then(() => closeModal())
    .catch((err) => showModalError(err.message));
});

// Sign-out from nav
navSignOutBtn.addEventListener('click', () => auth.signOut());

// Auth state observer — updates nav dynamically
auth.onAuthStateChanged((user) => {
  // Reset all
  navSignInBtn.style.display  = 'none';
  navAdminLink.style.display  = 'none';
  navUserChip.style.display   = 'none';
  navSignOutBtn.style.display = 'none';

  if (!user) {
    // Not logged in → show Sign In button
    navSignInBtn.style.display = 'flex';
    return;
  }

  if (user.email === ADMIN_EMAIL) {
    // Admin → show Admin Panel link
    navAdminLink.style.display  = 'inline-flex';
    navSignOutBtn.style.display = 'block';
  } else {
    // Normal user → show photo + name chip
    navUserPhoto.src = user.photoURL
      || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80';
    // Show first name only to keep it compact
    const firstName = (user.displayName || user.email).split(' ')[0];
    navUserName.textContent = firstName;
    navUserChip.style.display   = 'flex';
    navSignOutBtn.style.display = 'block';
  }
});

// ============================================================
// MOBILE NAV TOGGLE
// ============================================================
const burger = document.getElementById('burger');
const navLinks = document.getElementById('navLinks');
burger.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});
navLinks.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => navLinks.classList.remove('open'));
});

// ============================================================
// LIVE CAPACITY METER
// ============================================================
window.addEventListener('load', () => {
  const fill = document.getElementById('meterFill');
  const pct  = document.getElementById('meterPct');
  const value = 62;
  setTimeout(() => { fill.style.width = value + '%'; }, 400);

  setInterval(() => {
    const newVal = Math.max(35, Math.min(90, value + Math.floor(Math.random() * 11) - 5));
    fill.style.width = newVal + '%';
    pct.textContent  = newVal;
  }, 6000);
});

// ============================================================
// CONTACT FORM — Save to Firebase Firestore
// ============================================================
const form = document.getElementById('joinForm');
const note = document.getElementById('formNote');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const nameInput  = form.querySelector('input[type="text"]');
  const phoneInput = form.querySelector('input[type="tel"]');
  const clubSelect = form.querySelector('select');
  const dateInput  = form.querySelector('input[type="date"]');
  const submitBtn  = form.querySelector('button[type="submit"]');

  const leadData = {
    name:      nameInput.value.trim(),
    phone:     phoneInput.value.trim(),
    club:      clubSelect.value,
    visitDate: dateInput.value,
    status:    'New',
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  try {
    submitBtn.disabled    = true;
    submitBtn.textContent = "Saving...";
    await db.collection('leads').add(leadData);
    note.style.color = "#4caf50";
    note.textContent = "Thanks! A coach from your nearest club will call you within 24 hours.";
    form.reset();
  } catch (error) {
    console.error("Error adding lead: ", error);
    note.style.color = "#ff3333";
    note.textContent = "Failed to submit. Please try again or call us directly.";
  } finally {
    submitBtn.disabled    = false;
    submitBtn.textContent = "Claim Free Week";
  }
});
