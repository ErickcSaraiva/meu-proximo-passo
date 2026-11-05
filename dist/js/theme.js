// Preferência visual apenas em memória: recarregar volta ao tema claro.
const root = document.documentElement;
const button = document.querySelector('#theme-toggle');
const label = button.querySelector('[data-theme-label]');
const sun = button.querySelector('[data-theme-sun]');
const moon = button.querySelector('[data-theme-moon]');

function applyTheme(dark) {
  root.dataset.theme = dark ? 'dark' : 'light';
  button.setAttribute('aria-pressed', String(dark));
  // Nome acessível estável: aria-pressed informa se o tema escuro está ativo.
  label.textContent = dark ? 'Escuro' : 'Claro';
  button.title = dark ? 'Mudar para o tema claro' : 'Mudar para o tema escuro';
  sun.toggleAttribute('hidden', dark);
  moon.toggleAttribute('hidden', !dark);
  document.querySelector('meta[name="theme-color"]').content = dark ? '#101d24' : '#164b4a';
}

button.addEventListener('click', () => applyTheme(root.dataset.theme !== 'dark'));
applyTheme(false);
