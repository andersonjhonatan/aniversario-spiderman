const config = {
  eventDate: new Date('2026-10-18T15:00:00-03:00'),
  whatsappNumber: '', // Insira somente números em uma entrega real. Ex.: 5581999999999
};

const intro = document.querySelector('#intro');
const startButton = document.querySelector('#start-button');
const progress = document.querySelector('#scroll-progress-bar');
const toTop = document.querySelector('#to-top');
const form = document.querySelector('#rsvp-form');
const feedback = document.querySelector('#form-feedback');
const mapDialog = document.querySelector('#map-dialog');
const canvas = document.querySelector('#confetti-canvas');
const context = canvas.getContext('2d');
let audioEnabled = false;

function openInvite() {
  intro.classList.add('hidden');
  document.body.classList.remove('intro-active');
  document.querySelector('#inicio').focus?.();
  fireConfetti(150);
}

startButton.addEventListener('click', openInvite);
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !intro.classList.contains('hidden')) openInvite();
});

function updateCountdown() {
  const distance = Math.max(0, config.eventDate.getTime() - Date.now());
  const values = {
    days: Math.floor(distance / 86400000),
    hours: Math.floor((distance % 86400000) / 3600000),
    minutes: Math.floor((distance % 3600000) / 60000),
    seconds: Math.floor((distance % 60000) / 1000),
  };
  Object.entries(values).forEach(([id, value]) => {
    document.querySelector(`#${id}`).textContent = String(value).padStart(2, '0');
  });
}

updateCountdown();
setInterval(updateCountdown, 1000);

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.14 });
document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

function updateScrollUI() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.width = `${max ? (window.scrollY / max) * 100 : 0}%`;
  toTop.classList.toggle('show', window.scrollY > 600);
}
window.addEventListener('scroll', updateScrollUI, { passive: true });
updateScrollUI();
toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

const navSections = [...document.querySelectorAll('main section[id]')];
const navLinks = [...document.querySelectorAll('.nav-links a')];
const navObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    navLinks.forEach((link) => link.classList.toggle('active', link.hash === `#${entry.target.id}`));
  });
}, { rootMargin: '-35% 0px -55% 0px' });
navSections.forEach((section) => navObserver.observe(section));

const galleryTrack = document.querySelector('#gallery-track');
const galleryCards = [...document.querySelectorAll('.gallery-card')];
const galleryDots = document.querySelector('#gallery-dots');
const galleryViewport = document.querySelector('.gallery-viewport');
let slide = 0;
let touchStart = 0;

function cardsPerView() { return window.innerWidth <= 540 ? 1 : window.innerWidth <= 860 ? 2 : 3; }
function maxSlide() { return Math.max(0, galleryCards.length - cardsPerView()); }
function renderGallery() {
  slide = Math.min(Math.max(slide, 0), maxSlide());
  const gap = 19;
  const card = galleryCards[0].getBoundingClientRect().width;
  galleryTrack.style.transform = `translateX(-${slide * (card + gap)}px)`;
  galleryDots.innerHTML = '';
  for (let index = 0; index <= maxSlide(); index += 1) {
    const dot = document.createElement('button');
    dot.type = 'button'; dot.ariaLabel = `Ver grupo ${index + 1} da galeria`;
    dot.classList.toggle('active', index === slide);
    dot.addEventListener('click', () => { slide = index; renderGallery(); });
    galleryDots.append(dot);
  }
}
document.querySelector('#gallery-prev').addEventListener('click', () => { slide -= 1; renderGallery(); });
document.querySelector('#gallery-next').addEventListener('click', () => { slide += 1; renderGallery(); });
galleryViewport.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft') { slide -= 1; renderGallery(); }
  if (event.key === 'ArrowRight') { slide += 1; renderGallery(); }
});
galleryViewport.addEventListener('touchstart', (event) => { touchStart = event.changedTouches[0].screenX; }, { passive: true });
galleryViewport.addEventListener('touchend', (event) => {
  const difference = event.changedTouches[0].screenX - touchStart;
  if (Math.abs(difference) > 38) { slide += difference < 0 ? 1 : -1; renderGallery(); }
}, { passive: true });
window.addEventListener('resize', renderGallery);
renderGallery();

document.querySelectorAll('.accordion article button').forEach((button) => {
  button.addEventListener('click', () => {
    const article = button.closest('article');
    const isOpen = article.classList.toggle('open');
    button.setAttribute('aria-expanded', String(isOpen));
  });
});

function getRSVPMessage() {
  const data = new FormData(form);
  const name = data.get('guest-name')?.trim() || 'um convidado';
  return `Oi! Aqui é ${name}. Eu ${data.get('attendance')} ao aniversário de 6 anos do Pedro, no dia 18/10 às 15h. Vão ${data.get('guests')} pessoa(s) comigo.`;
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const message = getRSVPMessage();
  fireConfetti(100);
  if (config.whatsappNumber) {
    window.open(`https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
    feedback.textContent = 'Mensagem pronta! O WhatsApp será aberto em uma nova aba.';
  } else {
    feedback.textContent = 'Mensagem preparada com sucesso. Nesta demonstração, o número de WhatsApp ainda não foi definido.';
  }
});

document.querySelector('#copy-message').addEventListener('click', async () => {
  if (!form.reportValidity()) return;
  try {
    await navigator.clipboard.writeText(getRSVPMessage());
    feedback.textContent = 'Mensagem copiada. Você já pode colar no WhatsApp.';
  } catch {
    feedback.textContent = getRSVPMessage();
  }
});

document.querySelector('#map-button').addEventListener('click', () => mapDialog.showModal());
document.querySelector('#dialog-close').addEventListener('click', () => mapDialog.close());
mapDialog.addEventListener('click', (event) => { if (event.target === mapDialog) mapDialog.close(); });

document.querySelector('#sound-toggle').addEventListener('click', (event) => {
  audioEnabled = !audioEnabled;
  event.currentTarget.setAttribute('aria-pressed', String(audioEnabled));
  event.currentTarget.lastChild.textContent = audioEnabled ? ' Som ligado' : ' Som da missão';
  if (audioEnabled) playChime();
});

function playChime() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const audio = new AudioContext();
  [0, 0.13, 0.26].forEach((delay, index) => {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = 'sine'; oscillator.frequency.value = [523, 659, 784][index];
    gain.gain.setValueAtTime(0.0001, audio.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.11, audio.currentTime + delay + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + delay + 0.24);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(audio.currentTime + delay); oscillator.stop(audio.currentTime + delay + 0.26);
  });
}

function resizeCanvas() { canvas.width = window.innerWidth * devicePixelRatio; canvas.height = window.innerHeight * devicePixelRatio; context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0); }
window.addEventListener('resize', resizeCanvas); resizeCanvas();
function fireConfetti(amount) {
  const colors = ['#ef3f43', '#ffd84a', '#1554ab', '#ffffff'];
  const pieces = Array.from({ length: amount }, () => ({ x: innerWidth / 2, y: innerHeight * .35, vx: (Math.random() - .5) * 15, vy: Math.random() * -14 - 3, size: Math.random() * 7 + 4, color: colors[Math.floor(Math.random() * colors.length)], rotation: Math.random() * 6.28, spin: (Math.random() - .5) * .22, gravity: Math.random() * .18 + .11 }));
  function draw() {
    context.clearRect(0, 0, innerWidth, innerHeight);
    pieces.forEach((piece) => { piece.x += piece.vx; piece.y += piece.vy; piece.vy += piece.gravity; piece.rotation += piece.spin; });
    pieces.filter((piece) => piece.y < innerHeight + 20).forEach((piece) => { context.save(); context.translate(piece.x, piece.y); context.rotate(piece.rotation); context.fillStyle = piece.color; context.fillRect(-piece.size / 2, -piece.size / 3, piece.size, piece.size * .66); context.restore(); });
    if (pieces.some((piece) => piece.y < innerHeight + 20)) requestAnimationFrame(draw); else context.clearRect(0, 0, innerWidth, innerHeight);
  }
  draw();
}
