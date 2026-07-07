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

// Contact form (no backend — just confirms locally)
const form = document.getElementById('joinForm');
const note = document.getElementById('formNote');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  note.textContent = "Thanks! A coach from your nearest club will call you within 24 hours.";
  form.reset();
});
