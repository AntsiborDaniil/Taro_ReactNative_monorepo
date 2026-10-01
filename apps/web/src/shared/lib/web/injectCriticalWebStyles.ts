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
      background-color: #091519;
      color: #ecedcb;
      font-family: 'Onest-Medium', system-ui, sans-serif;
      min-height: 100%;
      min-height: 100dvh;
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
