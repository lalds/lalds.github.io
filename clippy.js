// Скрепка. Комментирует всё, что видит.
// Реплики к конкретным элементам — через атрибут data-clippy="...".
(() => {
    const HIDDEN_KEY = 'clippy-hidden';

    const greetings = {
        'games.html': 'Похоже, вы пытаетесь найти игру. Здесь только хорроры. Удачи.',
        'log.html': 'Девлоги! Тут человек пишет, что проект почти готов. Уже какой раз.',
        default: 'Привет! Похоже, вы зашли на личный сайт. Хотите помощь с этим?'
    };

    const idle = [
        'Вы тут уже давно. Может, сохраниться?',
        'Совет дня: Ctrl+S не работает в реальной жизни.',
        'Я была в Office 97. Я видела вещи.',
        'Похоже, вы ничего не делаете. Я тоже. Давайте вместе.',
        'Этот сайт сделан в минимализме. Мне тут тесно, а я скрепка.',
        'Если долго смотреть в Unity, Unity крашится.',
        'Похоже, вы пытаетесь прокрастинировать. Отличный выбор.',
        'Кстати, сайт в 2024 был в стиле Geocities. Я скучаю.',
        'Попробуйте поиграть в OUTLAW. Только свет не выключайте.',
        'Нашли баг на сайте? Тут за них не платят, это не баг баунти.'
    ];

    const pokes = [
        'Ай!',
        'Не тыкай, я сгибаюсь.',
        'Похоже, вы пытаетесь меня разогнуть. Не надо.',
        'Я скрепка, а не кнопка.',
        'Ещё раз нажмёшь — открою Word.',
        'Можно меня перетащить. Нельзя меня выпрямить.'
    ];

    const pick = arr => arr[Math.floor(Math.random() * arr.length)];

    const svg = `
<svg class="clippy-body" viewBox="0 0 64 104" aria-hidden="true">
  <path d="M22 86 V26 a12 12 0 0 1 24 0 V78 a7 7 0 0 1 -14 0 V34"
        fill="none" stroke="#8c8f99" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M22 86 V26 a12 12 0 0 1 24 0 V78 a7 7 0 0 1 -14 0 V34"
        fill="none" stroke="#d9dbe0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" transform="translate(-1 -1)"/>
  <g class="clippy-eye" data-cx="20" data-cy="32">
    <ellipse cx="20" cy="32" rx="8" ry="9" fill="#fff" stroke="#222" stroke-width="1.5"/>
    <circle class="clippy-pupil" cx="20" cy="33" r="3" fill="#111"/>
    <ellipse class="clippy-lid" cx="20" cy="32" rx="8.5" ry="9.5" fill="#cfd1d6"/>
  </g>
  <g class="clippy-eye" data-cx="44" data-cy="32">
    <ellipse cx="44" cy="32" rx="8" ry="9" fill="#fff" stroke="#222" stroke-width="1.5"/>
    <circle class="clippy-pupil" cx="44" cy="33" r="3" fill="#111"/>
    <ellipse class="clippy-lid" cx="44" cy="32" rx="8.5" ry="9.5" fill="#cfd1d6"/>
  </g>
  <path d="M11 18 q9 -7 17 -1 M36 17 q8 -6 17 1" fill="none" stroke="#222" stroke-width="2" stroke-linecap="round"/>
</svg>`;

    const root = document.createElement('div');
    root.id = 'clippy';
    root.innerHTML = `
        <div class="clippy-bubble" role="status" aria-live="polite">
            <button class="clippy-close" title="Убрать скрепку">×</button>
            <div class="clippy-text"></div>
        </div>${svg}`;
    document.body.appendChild(root);

    const bubble = root.querySelector('.clippy-bubble');
    const text = root.querySelector('.clippy-text');
    const body = root.querySelector('.clippy-body');
    const eyes = [...root.querySelectorAll('.clippy-eye')];

    let hideTimer, idleTimer, lastLine = '';

    function say(line, ms = 5500) {
        if (root.classList.contains('gone') || line === lastLine && bubble.classList.contains('show')) return;
        lastLine = line;
        text.textContent = line;
        bubble.classList.add('show');
        body.classList.remove('talk');
        void body.offsetWidth;
        body.classList.add('talk');
        clearTimeout(hideTimer);
        hideTimer = setTimeout(() => bubble.classList.remove('show'), ms);
        resetIdle();
    }

    function resetIdle() {
        clearTimeout(idleTimer);
        idleTimer = setTimeout(() => say(pick(idle)), 25000 + Math.random() * 20000);
    }

    // Комментарии при наведении
    let hoverTimer;
    document.addEventListener('mouseover', e => {
        const target = e.target.closest('[data-clippy]');
        if (!target || root.contains(target)) return;
        clearTimeout(hoverTimer);
        hoverTimer = setTimeout(() => say(target.dataset.clippy), 350);
    });
    document.addEventListener('mouseout', e => {
        if (e.target.closest('[data-clippy]')) clearTimeout(hoverTimer);
    });

    // Глаза следят за курсором
    document.addEventListener('mousemove', e => {
        eyes.forEach(eye => {
            const r = eye.getBoundingClientRect();
            const dx = e.clientX - (r.left + r.width / 2);
            const dy = e.clientY - (r.top + r.height / 2);
            const a = Math.atan2(dy, dx);
            const d = Math.min(4, Math.hypot(dx, dy) / 40);
            const p = eye.querySelector('.clippy-pupil');
            p.setAttribute('cx', +eye.dataset.cx + Math.cos(a) * d);
            p.setAttribute('cy', +eye.dataset.cy + 1 + Math.sin(a) * d);
        });
    });

    // Перетаскивание / тык
    let drag = null;
    body.addEventListener('pointerdown', e => {
        const r = root.getBoundingClientRect();
        drag = { x: e.clientX, y: e.clientY, right: innerWidth - r.right, bottom: innerHeight - r.bottom, moved: false };
        body.setPointerCapture(e.pointerId);
    });
    body.addEventListener('pointermove', e => {
        if (!drag) return;
        const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
        if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
        root.style.right = Math.max(0, drag.right - dx) + 'px';
        root.style.bottom = Math.max(0, drag.bottom - dy) + 'px';
    });
    body.addEventListener('pointerup', () => {
        if (drag && !drag.moved) say(pick(pokes), 3500);
        drag = null;
    });

    // Убрать / вернуть
    root.querySelector('.clippy-close').addEventListener('click', () => {
        say('Ладно-ладно, ухожу. Двойной клик по пустому месту — и я вернусь.', 2500);
        setTimeout(() => {
            bubble.classList.remove('show');
            root.classList.add('gone');
            localStorage.setItem(HIDDEN_KEY, '1');
        }, 1800);
    });
    document.addEventListener('dblclick', e => {
        if (!root.classList.contains('gone') || e.target.closest('a, button, img')) return;
        localStorage.removeItem(HIDDEN_KEY);
        root.classList.remove('gone');
        setTimeout(() => say('Скучали? Я — да.'), 400);
    });

    // Старт
    if (localStorage.getItem(HIDDEN_KEY)) {
        root.classList.add('gone');
    } else {
        const page = location.pathname.split('/').pop();
        setTimeout(() => say(greetings[page] || greetings.default, 7000), 1200);
    }
})();
