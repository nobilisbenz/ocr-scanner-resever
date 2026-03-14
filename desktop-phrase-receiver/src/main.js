const { invoke } = window.__TAURI__.core;
const { listen } = window.__TAURI__.event;
import { writeText } from '@tauri-apps/plugin-clipboard-manager';

async function init() {
  const ipEl = document.getElementById('ip-address');
  const listEl = document.getElementById('phrasesList');

  // Get IP
  try {
    const ip = await invoke('get_local_ip');
    ipEl.textContent = `Listening on http://${ip}:3000/phrase`;
  } catch (e) {
    ipEl.textContent = 'Error getting IP';
    console.error(e);
  }

  // Listen for phrases
  await listen('phrase-received', (event) => {
    const text = event.payload;
    addPhrase(text);
  });

  function addPhrase(text) {
    const item = document.createElement('div');
    item.className = 'phraseItem';
    
    const textSpan = document.createElement('span');
    textSpan.className = 'phraseText';
    textSpan.textContent = text;
    
    const btn = document.createElement('button');
    btn.className = 'copyBtn';
    btn.textContent = '⎘';
    btn.onclick = async () => {
      try {
        await writeText(text);
        btn.textContent = '✓';
        setTimeout(() => btn.textContent = '⎘', 1000);
      } catch (e) {
        console.error('Copy failed', e);
      }
    };

    item.appendChild(textSpan);
    item.appendChild(btn);
    
    // Prepend to list
    listEl.insertBefore(item, listEl.firstChild);
  }
}

init();
