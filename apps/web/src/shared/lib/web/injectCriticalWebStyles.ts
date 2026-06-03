/** Синхронно до React — убирает белый экран до загрузки бандла. */
export function injectCriticalWebStyles(): void {
  if (typeof document === 'undefined') {
    return;
  }

  const id = 'tarot-critical-web';
  if (document.getElementById(id)) {
    return;
  }

  const style = document.createElement('style');
  style.id = id;
  style.textContent = `
    html, body, #root {
      background-color: #171f2c;
      color: #f4f4f5;
      min-height: 100%;
    }
    #root {
      display: flex;
      flex: 1;
      min-height: 100vh;
      min-height: 100dvh;
    }
  `;
  document.head.appendChild(style);
}
