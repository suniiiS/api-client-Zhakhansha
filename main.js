const BASE_URL = 'https://jsonplaceholder.typicode.com';

const listEl = document.getElementById('list');
const statusEl = document.getElementById('status');
const detailsEl = document.getElementById('details');
const form = document.getElementById('filter-form');
const userIdInput = document.getElementById('user-id');

// Общая функция запроса: проверяет response.ok
async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Сервер вернул ошибку ${response.status}`);
  }
  return response.json();
}

function setStatus(text, isError = false) {
  statusEl.textContent = text;
  statusEl.className = isError ? 'error' : '';
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function renderPosts(posts) {
  listEl.innerHTML = posts.map(({ id, userId, title }) => `
    <article class="card" data-id="${id}">
      <h3>${escapeHtml(title)}</h3>
      <p>Автор: ${userId}</p>
      <button data-action="details">Подробнее</button>
    </article>`).join('');
}

// Список + поиск: фильтр уходит В ЗАПРОСЕ (query parameter)
async function loadPosts(userId = '') {
  setStatus('Загрузка...');
  listEl.innerHTML = '';
  try {
    const params = new URLSearchParams({ _limit: 12 });
    if (userId) params.set('userId', userId);
    const posts = await fetchJson(`${BASE_URL}/posts?${params}`);

    if (posts.length === 0) {
      setStatus('Ничего не найдено');
      return;
    }
    renderPosts(posts);
    setStatus(`Найдено: ${posts.length}`);
  } catch (err) {
    setStatus(`Не удалось загрузить данные: ${err.message}`, true);
  }
}

// Детали: два запроса ПАРАЛЛЕЛЬНО через Promise.all
async function showDetails(id) {
  detailsEl.textContent = 'Загрузка...';
  try {
    const [post, comments] = await Promise.all([
      fetchJson(`${BASE_URL}/posts/${id}`),
      fetchJson(`${BASE_URL}/posts/${id}/comments`),
    ]);
    detailsEl.innerHTML = `
      <h2>${escapeHtml(post.title)}</h2>
      <p>${escapeHtml(post.body)}</p>
      <h3>Комментарии (${comments.length})</h3>
      <ul>${comments.map((c) => `<li><b>${escapeHtml(c.email)}</b>: ${escapeHtml(c.body)}</li>`).join('')}</ul>`;
  } catch (err) {
    detailsEl.innerHTML = `<p class="error">Не удалось загрузить детали: ${escapeHtml(err.message)}</p>`;
  }
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  detailsEl.innerHTML = '';
  loadPosts(userIdInput.value.trim());
});

document.getElementById('reset').addEventListener('click', () => {
  userIdInput.value = '';
  detailsEl.innerHTML = '';
  loadPosts();
});

// Один слушатель на список (делегирование, как в лабе 5)
listEl.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action="details"]');
  if (!btn) return;
  showDetails(Number(btn.closest('.card').dataset.id));
});

loadPosts();