'use strict';

// The site works without a backend. Favorites and the theme are stored only
// in this browser. No network requests or personal data are sent by the code.
const root = document.documentElement;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function safeLoad(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
function safeSave(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode */ }
}

// Theme toggle
const themeButton = document.querySelector('.theme-btn');
function updateTheme(mode) {
  const isDark = mode === 'dark';
  root.dataset.theme = isDark ? 'dark' : 'light';
  if (themeButton) {
    themeButton.setAttribute('aria-label', isDark ? 'Включить светлую тему' : 'Включить тёмную тему');
    themeButton.querySelector('.theme-icon').textContent = isDark ? '☀' : '☾';
  }
  safeSave('moka-theme', isDark ? 'dark' : 'light');
}
updateTheme(safeLoad('moka-theme', 'light'));
themeButton?.addEventListener('click', () => updateTheme(root.dataset.theme === 'dark' ? 'light' : 'dark'));

// Navigation on mobile
const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.primary-nav');
function closeMenu() {
  menuButton?.setAttribute('aria-expanded', 'false');
  menuButton?.setAttribute('aria-label', 'Открыть меню');
  nav?.classList.remove('is-open');
}
menuButton?.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  nav?.classList.toggle('is-open', open);
});
nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
document.addEventListener('click', event => {
  if (nav?.classList.contains('is-open') && !nav.contains(event.target) && !menuButton?.contains(event.target)) closeMenu();
});

// Menu filtering
const filters = [...document.querySelectorAll('.filter')];
const cards = [...document.querySelectorAll('.menu-card')];
filters.forEach(button => button.addEventListener('click', () => {
  const selected = button.dataset.filter;
  filters.forEach(filter => {
    const active = filter === button;
    filter.classList.toggle('is-active', active);
    filter.setAttribute('aria-pressed', String(active));
  });
  cards.forEach(card => { card.hidden = selected !== 'all' && card.dataset.category !== selected; });
}));

// Persistent favorites
const favorites = new Set(safeLoad('moka-favorites', []));
const favoriteCount = document.getElementById('favorites-count');
const toast = document.querySelector('.toast');
let toastHandle;
function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('visible');
  window.clearTimeout(toastHandle);
  toastHandle = window.setTimeout(() => toast.classList.remove('visible'), 2200);
}
function renderFavorites() {
  document.querySelectorAll('.heart-btn').forEach(button => {
    const active = favorites.has(button.dataset.item);
    button.setAttribute('aria-pressed', String(active));
    button.setAttribute('aria-label', `${active ? 'Убрать' : 'Добавить'} ${button.dataset.item} ${active ? 'из' : 'в'} избранного`);
    button.textContent = active ? '♥' : '♡';
  });
  if (favoriteCount) favoriteCount.textContent = String(favorites.size);
  safeSave('moka-favorites', [...favorites]);
}
document.querySelectorAll('.heart-btn').forEach(button => button.addEventListener('click', () => {
  const item = button.dataset.item;
  if (favorites.has(item)) { favorites.delete(item); showToast('Убрано из избранного'); }
  else { favorites.add(item); showToast('Добавлено в избранное ♥'); }
  renderFavorites();
}));
renderFavorites();

// Reveal sections as they enter the viewport
const reveals = [...document.querySelectorAll('.reveal')];
if ('IntersectionObserver' in window && !reducedMotion) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -45px 0px', threshold: 0.08 });
  reveals.forEach(element => observer.observe(element));
} else {
  reveals.forEach(element => element.classList.add('in-view'));
}

// Scroll progress indicator
const progress = document.querySelector('.scroll-progress');
let ticking = false;
function onScroll() {
  if (ticking) return;
  ticking = true;
  window.requestAnimationFrame(() => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = `${max > 0 ? Math.min(100, window.scrollY / max * 100) : 0}%`;
    ticking = false;
  });
}
window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll);
onScroll();

document.getElementById('year').textContent = new Date().getFullYear();
