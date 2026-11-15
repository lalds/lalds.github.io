// BUG BOUNTY — миниигра в терминале.
// Баги ползут в main. Дави их. Фичи не трогай. 0-day стоит дорого.

const W = 320, H = 240, MAIN_Y = H - 26;
const C = {
    bg: '#04140a', fg: '#8dffb0', dim: '#2f7a4a', red: '#ff5a4a',
    gold: '#ffd166', feat: '#b8ff6a', heis: '#c58bff'
};

const BUG = [
    ['..#.#..', '...#...', '.#####.', '#.###.#', '.#####.', '#.###.#', '..#.#..'],
    ['.#...#.', '...#...', '#.###.#', '.#####.', '#.###.#', '.#####.', '.#...#.']
];
const FEAT = ['.#####.', '#######', '##...##', '##.####', '##..###', '##.####', '.#####.'];

const TYPES = {
    bug:   { color: C.red,  reward: 100, speed: 1,   label: '' },
    zero:  { color: C.gold, reward: 1000, speed: 1.9, label: '0-day' },
    heis:  { color: C.heis, reward: 400, speed: 1.1, label: 'heisenbug' },
    feat:  { color: C.feat, reward: -300, speed: 0.8, label: '' }
};

export function startBounty(host, { say, playClick, onExit }) {
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    cv.className = 'bounty';
    host.appendChild(cv);
    const ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    let best = +localStorage.getItem('bounty-best') || 0;
    let phase = 'intro', raf = 0, last = performance.now();
    let bugs, parts, money, lives, t, spawnT, combo, kills, shake, friday, mainFlash, saidFeat, lastZeroSay;
    const mouse = { x: W / 2, y: H / 2 };

    function reset() {
        bugs = []; parts = []; money = 0; lives = 3; t = 0; spawnT = 0.5;
        combo = 0; kills = 0; shake = 0; friday = false; mainFlash = 0; saidFeat = false; lastZeroSay = -99;
    }
    reset();

    const level = () => Math.floor(t / 15) + 1;
    const mult = () => 1 + Math.min(4, Math.floor(combo / 3));

    function spawn() {
        const r = Math.random();
        const type = r < 0.04 + level() * 0.005 ? 'zero' : r < 0.12 ? 'heis' : r < 0.32 ? 'feat' : 'bug';
        bugs.push({
            type, x: 20 + Math.random() * (W - 40), y: 22,
            wob: 0.8 + Math.random() * 2, ph: Math.random() * 6.28,
            amp: type === 'zero' ? 70 : 18 + Math.random() * 20,
            v: (16 + level() * 4 + Math.random() * 8) * TYPES[type].speed
        });
        if (type === 'zero' && t - lastZeroSay > 8) { lastZeroSay = t; say('0-day! Лови, пока его не продали!', 2500); }
    }

    function burst(x, y, color, n = 14) {
        for (let i = 0; i < n; i++) {
            const a = Math.random() * 6.28, s = 30 + Math.random() * 70;
            parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.5 + Math.random() * 0.3, color });
        }
    }
    const floatText = (x, y, text, color) => parts.push({ x, y, vx: 0, vy: -25, life: 1, text, color });

    function hit(x, y) {
        let target = null, bestD = 13;
        for (const b of bugs) {
            const d = Math.hypot(b.x - x, b.y - y);
            if (d < bestD) { bestD = d; target = b; }
        }
        if (!target) { combo = 0; floatText(x, y, 'мимо', C.dim); return; }
        bugs.splice(bugs.indexOf(target), 1);
        playClick();
        const T = TYPES[target.type];
        if (target.type === 'feat') {
            money += T.reward; combo = 0; shake = 0.25;
            burst(target.x, target.y, C.feat, 10);
            floatText(target.x, target.y, '-$300 это фича', C.feat);
            if (!saidFeat) { saidFeat = true; say('Это не баг, это фича! Не трогай фичи.', 3000); }
            return;
        }
        kills++; combo++;
        const gain = T.reward * mult();
        money += gain;
        burst(target.x, target.y, T.color, target.type === 'zero' ? 30 : 14);
        floatText(target.x, target.y - 6, `+$${gain}`, T.color);
        if (combo === 9) say('Комбо x4! HR уже пишет оффер.', 2500);
    }

    function lose(b) {
        if (b.type === 'feat') { money += 50; floatText(b.x, MAIN_Y - 8, 'фича в релизе +$50', C.feat); return; }
        lives--; combo = 0; shake = 0.4; mainFlash = 0.5;
        burst(b.x, MAIN_Y, C.red, 20);
        floatText(b.x, MAIN_Y - 10, b.type === 'zero' ? '0-day в проде!' : 'баг в проде!', C.red);
        if (lives === 1) say('Последняя жизнь. Не пушь в main, пожалуйста.', 2500);
        if (lives <= 0) gameOver();
    }

    function gameOver() {
        phase = 'over';
        const record = money > best;
        if (record) { best = money; localStorage.setItem('bounty-best', best); }
        say(record && money > 0 ? 'Новый рекорд! Отправляй отчёт в программу.'
            : money < 500 ? 'Прод упал. Даже я бы больше нашла, а я скрепка.'
            : money < 3000 ? 'Прод упал. Но на доширак хватит.'
            : 'Ты что, тот самый, с баг баунти за 300$?', 5000);
    }

    function update(dt) {
        if (phase !== 'play') return;
        t += dt;
        if (!friday && t >= 60) {
            friday = true;
            say('Пятница, вечер, деплой. Удачи.', 3500);
        }
        spawnT -= dt;
        if (spawnT <= 0) {
            spawn();
            spawnT = Math.max(0.22, 1.1 - level() * 0.1) * (friday ? 0.55 : 1) * (0.7 + Math.random() * 0.6);
        }
        for (const b of [...bugs]) {
            b.y += b.v * dt;
            b.x += Math.sin(t * b.wob + b.ph) * b.amp * dt;
            b.x = Math.max(8, Math.min(W - 8, b.x));
            if (b.y >= MAIN_Y) { bugs.splice(bugs.indexOf(b), 1); lose(b); if (phase !== 'play') return; }
        }
    }

    function sprite(rows, x, y, color, s = 2) {
        ctx.fillStyle = color;
        const o = rows.length * s / 2;
        rows.forEach((row, j) => [...row].forEach((ch, i) => {
            if (ch === '#') ctx.fillRect(Math.round(x - o + i * s), Math.round(y - o + j * s), s, s);
        }));
    }

    function text(str, x, y, color = C.fg, size = 10, align = 'left') {
        ctx.font = `${size}px "Pixelify Sans", monospace`;
        ctx.textAlign = align; ctx.fillStyle = color;
        ctx.fillText(str, x, y);
    }

    function draw(now) {
        ctx.save();
        if (shake > 0) ctx.translate((Math.random() - 0.5) * 6 * shake, (Math.random() - 0.5) * 6 * shake);
        ctx.fillStyle = C.bg; ctx.fillRect(-4, -4, W + 8, H + 8);

        // main branch
        ctx.fillStyle = mainFlash > 0 ? C.red : C.dim;
        for (let x = 0; x < W; x += 6) ctx.fillRect(x, MAIN_Y, 4, 1);
        for (let x = 30; x < W; x += 60) ctx.fillRect(x - 2, MAIN_Y - 2, 5, 5);
        text('main', 4, MAIN_Y + 13, mainFlash > 0 ? C.red : C.dim, 10);
        text(friday ? 'ПЯТНИЦА · DEPLOY' : `prod: ${lives > 0 ? 'stable' : 'DOWN'}`, W - 4, MAIN_Y + 13, friday ? C.gold : C.dim, 10, 'right');

        if (phase === 'intro') {
            text('BUG BOUNTY', W / 2, 62, C.fg, 26, 'center');
            text('баги ползут в main. дави их мышкой.', W / 2, 88, C.fg, 10, 'center');
            sprite(BUG[0], 92, 112, C.red); text('баг  $100', 104, 116, C.fg);
            sprite(BUG[1], 92, 130, C.gold); text('0-day  $1000', 104, 134, C.fg);
            sprite(BUG[0], 92, 148, C.heis); text('heisenbug  $400 (мерцает)', 104, 152, C.fg);
            sprite(FEAT, 92, 166, C.feat); text('фича — НЕ ТРОГАТЬ', 104, 170, C.fg);
            if (Math.floor(now / 500) % 2) text('[ клик — начать ]', W / 2, 198, C.fg, 12, 'center');
            text(`рекорд: $${best}   esc — выход`, W / 2, 14, C.dim, 9, 'center');
        } else {
            for (const b of bugs) {
                if (b.type === 'heis' && Math.sin(now / 90 + b.ph * 10) < -0.2) continue;
                const frame = BUG[Math.floor(now / 150 + b.ph) % 2];
                if (b.type === 'feat') sprite(FEAT, b.x, b.y, C.feat);
                else sprite(frame, b.x, b.y, TYPES[b.type].color);
                if (TYPES[b.type].label) text(TYPES[b.type].label, b.x, b.y - 10, TYPES[b.type].color, 8, 'center');
            }
            // HUD
            text(`$${money}`, 6, 14, C.fg, 12);
            text(`x${mult()}`, 80, 14, mult() > 1 ? C.gold : C.dim, 12);
            text('▮'.repeat(Math.max(0, lives)) + '▯'.repeat(Math.max(0, 3 - lives)), W / 2, 14, C.red, 12, 'center');
            text(`lvl ${level()}`, W - 6, 14, C.dim, 12, 'right');
            ctx.fillStyle = C.dim; ctx.fillRect(0, 19, W, 1);
        }

        for (const p of parts) {
            ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 2));
            if (p.text) text(p.text, p.x, p.y, p.color, 9, 'center');
            else { ctx.fillStyle = p.color; ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 2); }
        }
        ctx.globalAlpha = 1;

        if (phase === 'over') {
            ctx.fillStyle = 'rgba(4,20,10,.85)'; ctx.fillRect(0, 0, W, H);
            text('PROD IS DOWN', W / 2, 80, C.red, 24, 'center');
            text(`награда: $${money}`, W / 2, 110, C.fg, 13, 'center');
            text(`багов задавлено: ${kills}   продержался: ${Math.floor(t)}с`, W / 2, 128, C.dim, 9, 'center');
            text(`рекорд: $${best}`, W / 2, 146, C.gold, 11, 'center');
            if (Math.floor(now / 500) % 2) text('[ клик — ещё раз ]   esc — выход', W / 2, 180, C.fg, 10, 'center');
        }

        // прицел
        ctx.fillStyle = C.fg;
        ctx.fillRect(Math.round(mouse.x) - 5, Math.round(mouse.y), 3, 1);
        ctx.fillRect(Math.round(mouse.x) + 3, Math.round(mouse.y), 3, 1);
        ctx.fillRect(Math.round(mouse.x), Math.round(mouse.y) - 5, 1, 3);
        ctx.fillRect(Math.round(mouse.x), Math.round(mouse.y) + 3, 1, 3);
        ctx.restore();
    }

    function loop(now) {
        raf = requestAnimationFrame(loop);
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        update(dt);
        for (const p of parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.text ? 0 : 120 * dt; p.life -= dt; }
        parts = parts.filter(p => p.life > 0);
        shake = Math.max(0, shake - dt); mainFlash = Math.max(0, mainFlash - dt);
        draw(now);
    }
    raf = requestAnimationFrame(loop);

    const toLocal = e => {
        const r = cv.getBoundingClientRect();
        return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H];
    };
    cv.addEventListener('pointermove', e => { [mouse.x, mouse.y] = toLocal(e); });
    cv.addEventListener('pointerdown', e => {
        e.preventDefault();
        [mouse.x, mouse.y] = toLocal(e);
        if (phase === 'play') hit(mouse.x, mouse.y);
        else { playClick(); reset(); phase = 'play'; if (best === 0) say('Похоже, вы ищете баги. Я тут ни при чём.', 3000); }
    });

    function onKey(e) {
        if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); stop(); onExit(); }
        else if (phase !== 'play' && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); e.stopImmediatePropagation(); reset(); phase = 'play'; }
        else e.stopImmediatePropagation();   // терминал не должен печатать во время игры
    }
    addEventListener('keydown', onKey, true);

    function stop() {
        cancelAnimationFrame(raf);
        removeEventListener('keydown', onKey, true);
        cv.remove();
    }
    return { stop };
}
