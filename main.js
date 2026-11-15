import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { games, repos, links, quips } from './data.js';
import { startBounty } from './game.js';

const $ = id => document.getElementById(id);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const lerp = THREE.MathUtils.lerp;

/* ------------------------------------------------------------------ */
/* renderer: низкое разрешение + nearest upscale = PS1                 */
/* ------------------------------------------------------------------ */

const canvas = $('view');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
renderer.setPixelRatio(1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.BasicShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x010203);
scene.fog = new THREE.Fog(0x010203, 1.6, 4.2);

const camera = new THREE.PerspectiveCamera(50, 1, 0.02, 20);
const snap = { value: new THREE.Vector2(160, 120) };
let camReady = false;

function resize() {
    const px = Math.max(2, Math.round(Math.min(innerWidth, innerHeight) / 260));
    const w = Math.ceil(innerWidth / px), h = Math.ceil(innerHeight / px);
    renderer.setSize(w, h, false);
    camera.aspect = innerWidth / innerHeight;
    // на узких экранах отъезжаем, чтобы стол и полка влезали
    const portrait = camera.aspect < 1;
    camera.fov = portrait ? 62 : 50;
    camera.updateProjectionMatrix();
    if (camReady) setHome(portrait);
    snap.value.set(w / 2.2, h / 2.2);
}
addEventListener('resize', resize);
resize();

// дрожание вершин как на PS1
function psx(material) {
    material.onBeforeCompile = shader => {
        shader.uniforms.uSnap = snap;
        shader.vertexShader = 'uniform vec2 uSnap;\n' + shader.vertexShader.replace(
            '#include <project_vertex>',
            `#include <project_vertex>
            gl_Position.xy = floor(gl_Position.xy / gl_Position.w * uSnap + 0.5) / uSnap * gl_Position.w;`
        );
    };
    return material;
}

/* ------------------------------------------------------------------ */
/* canvas-текстуры                                                     */
/* ------------------------------------------------------------------ */

function canvasTex(w, h, draw) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    draw(ctx, w, h);
    const t = new THREE.CanvasTexture(c);
    t.flipY = false;                    // UV из glTF
    t.colorSpace = THREE.SRGBColorSpace;
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.LinearFilter;
    t.generateMipmaps = false;
    t.userData = { ctx, draw };
    return t;
}

function fitText(ctx, text, maxW, size, font) {
    do { ctx.font = `${size}px ${font}`; size -= 2; } while (ctx.measureText(text).width > maxW && size > 8);
}

const spineTex = g => canvasTex(64, 512, (ctx, w, h) => {
    ctx.fillStyle = '#e8e4d8'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = g.color; ctx.fillRect(0, 0, w, 70); ctx.fillRect(0, h - 40, w, 40);
    ctx.fillStyle = '#111'; ctx.fillRect(0, 70, w, 4);
    ctx.save();
    ctx.translate(w / 2 + 2, 90); ctx.rotate(Math.PI / 2);
    ctx.fillStyle = '#111'; ctx.textBaseline = 'middle';
    fitText(ctx, g.title.toUpperCase(), h - 150, 40, '"Pixelify Sans"');
    ctx.fillText(g.title.toUpperCase(), 0, 0);
    ctx.restore();
    ctx.fillStyle = '#fff'; ctx.font = '22px "Pixelify Sans"'; ctx.textAlign = 'center';
    ctx.fillText('VHS', w / 2, 44);
});

const floppyTex = r => canvasTex(256, 192, (ctx, w, h) => {
    ctx.fillStyle = '#f2efe6'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = r.color; ctx.fillRect(0, 0, w, 26);
    ctx.strokeStyle = '#9ab'; ctx.lineWidth = 2;
    for (let y = 70; y < h; y += 34) { ctx.beginPath(); ctx.moveTo(10, y); ctx.lineTo(w - 10, y); ctx.stroke(); }
    ctx.fillStyle = '#1a1a40';
    fitText(ctx, r.name, w - 30, 48, '"Permanent Marker"');
    ctx.fillText(r.name, 14, 100);
    ctx.font = '22px "Permanent Marker"';
    ctx.fillText(r.lang, 16, 160);
});

const posterTex = () => canvasTex(420, 600, (ctx, w, h) => {
    ctx.fillStyle = '#120404'; ctx.fillRect(0, 0, w, h);
    // «дом улыбок»
    ctx.strokeStyle = '#d8d2c0'; ctx.lineWidth = 9;
    ctx.beginPath(); ctx.arc(w / 2, 250, 120, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#d8d2c0';
    ctx.beginPath(); ctx.arc(w / 2 - 45, 215, 16, 0, Math.PI * 2); ctx.arc(w / 2 + 45, 215, 16, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(w / 2, 255, 70, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    ctx.strokeStyle = '#8b0000'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(w / 2 + 20, 320); ctx.lineTo(w / 2 + 25, 390); ctx.stroke();
    ctx.fillStyle = '#c1121f'; ctx.textAlign = 'center';
    ctx.font = '86px "Permanent Marker"'; ctx.fillText('NLPA', w / 2, 120);
    ctx.font = '50px "Permanent Marker"'; ctx.fillText('COLLAB', w / 2, 470);
    ctx.fillStyle = '#d8d2c0'; ctx.font = '30px "Pixelify Sans"'; ctx.fillText('— be alive —', w / 2, 540);
});

const stickyTex = (bg, lines) => canvasTex(128, 128, (ctx, w, h) => {
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#222';
    lines.forEach((l, i) => { fitText(ctx, l, w - 14, 30, '"Caveat"'); ctx.fillText(l, 7, 34 + i * 30); });
});

const screenTex = canvasTex(512, 384, (ctx, w, h) => {
    const t = performance.now();
    ctx.fillStyle = '#04140a'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#8dffb0'; ctx.font = '28px "Pixelify Sans"';
    const lines = ['ALEKSTWIN OS v2.6', '(c) 2026 NLPA COLLAB', '', 'игры: 7   репы: 5', 'скрепок: 1   багов: ∞', '',
        '> нажми на меня' + (Math.floor(t / 500) % 2 ? '_' : '')];
    lines.forEach((l, i) => ctx.fillText(l, 28, 52 + i * 40));
    ctx.fillStyle = 'rgba(0,0,0,.35)';
    for (let y = 0; y < h; y += 4) ctx.fillRect(0, y, w, 2);
    const roll = (t / 12) % (h + 80) - 40;
    ctx.fillStyle = 'rgba(141,255,176,.05)'; ctx.fillRect(0, roll, w, 40);
});

const figureTex = canvasTex(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.ellipse(128, 105, 38, 48, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(40, 256); ctx.quadraticCurveTo(50, 160, 128, 150); ctx.quadraticCurveTo(206, 160, 216, 256); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillRect(110, 98, 6, 4); ctx.fillRect(140, 98, 6, 4);
});

/* ------------------------------------------------------------------ */
/* загрузка сцены                                                      */
/* ------------------------------------------------------------------ */

const bootLog = $('boot-log');
const boot = (line) => { bootLog.textContent += line + '\n'; };
const bootLines = [
    'NLPA BIOS v2.6   (c) 2026 alekstwin',
    'CPU: AMD Paperclip @ 66 MHz ........ OK',
    'Memory test: 640K ........ хватит всем',
    'Detecting VHS drive ........ 7 cassettes',
    'Detecting floppy A: ........ 5 disks',
    'Loading clippy.dll ........ OK'
];
let bi = 0;
const bootTimer = setInterval(() => { if (bi < bootLines.length) boot(bootLines[bi++]); }, 140);

const fontsReady = Promise.all([
    document.fonts.load('40px "Pixelify Sans"'),
    document.fonts.load('40px "Permanent Marker"'),
    document.fonts.load('24px "Caveat"', 'жw'),
    document.fonts.load('40px "Pixelify Sans"', 'жw')
]).catch(() => {});

const obj = {};          // имя -> Object3D
const hoverables = [];   // меши для raycast
let room;

const loaded = new Promise((resolve, reject) => {
    new GLTFLoader().load('assets/room.glb', gltf => resolve(gltf), xhr => {
        if (xhr.total) $('enter').textContent = `[ загрузка ${Math.round(xhr.loaded / xhr.total * 100)}% ]`;
    }, reject);
});

Promise.all([loaded, fontsReady]).then(([gltf]) => {
    room = gltf.scene;
    room.traverse(o => {
        obj[o.name] = o;
        if (!o.isMesh) return;
        const s = o.material;
        const m = new THREE.MeshLambertMaterial({
            color: s.color,
            emissive: s.emissive,
            emissiveIntensity: s.emissiveIntensity ?? 1,
            name: s.name
        });
        if (s.metalness > 0.5) m.color.multiplyScalar(0.7);
        o.material = psx(m);
        o.castShadow = o.receiveShadow = true;
        hoverables.push(o);
    });
    scene.add(room);
    setupScene();
    clearInterval(bootTimer);
    while (bi < bootLines.length) boot(bootLines[bi++]);
    boot('Loading room.glb ........ OK\n\nготово.');
    $('enter').disabled = false;
    $('enter').textContent = '[ ВОЙТИ ]';
    if (location.hash === '#enter') $('enter').click();
}).catch(err => {
    console.error(err);
    boot('\nERROR: WebGL/сцена не загрузилась :(');
    $('enter').textContent = '[ текстовая версия ]';
    $('enter').disabled = false;
    $('enter').onclick = () => location.href = 'text.html';
});

/* ------------------------------------------------------------------ */
/* свет и текстуры                                                     */
/* ------------------------------------------------------------------ */

let lampLight, screenLight, lampOn = true, figure;
const basePos = new Map();

function texMat(mesh, tex, emissive = 0.25) {
    mesh.material = psx(new THREE.MeshLambertMaterial({
        map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: emissive
    }));
}

function setupScene() {
    // центр по bbox: у части мешей смещение запечено в геометрию
    const wp = name => new THREE.Box3().setFromObject(obj[name]).getCenter(new THREE.Vector3());

    // экран монитора — без освещения, сам светится
    obj.screen.material = new THREE.MeshBasicMaterial({ map: screenTex, color: 0xffffff });

    games.forEach((g, i) => obj[`vhs_${i}_spine`] && texMat(obj[`vhs_${i}_spine`], spineTex(g), 0.35));
    repos.forEach((r, i) => {
        texMat(obj[`floppy_${i}_label`], floppyTex(r), 0.2);
        obj[`floppy_${i}_body`].material = psx(new THREE.MeshLambertMaterial({ color: r.color }));
    });
    obj.lamp_bulb.castShadow = false;
    texMat(obj.poster, posterTex(), 0.12);
    texMat(obj.sticky_0, stickyTex('#f2d84b', ['не пушить', 'в main', 'в пятницу']), 0.3);
    texMat(obj.sticky_1, stickyTex('#f07aa6', ['доделать', 'KRAINOTOMY', '!!!']), 0.3);

    for (let i = 0; i < 7; i++) basePos.set(`vhs_${i}`, obj[`vhs_${i}`].position.clone());
    for (let i = 0; i < 5; i++) basePos.set(`floppy_${i}`, obj[`floppy_${i}`].position.clone());

    // лампа
    lampLight = new THREE.PointLight(0xffb36b, 1.6, 4, 1.6);
    lampLight.position.copy(wp('lamp_bulb')).add(new THREE.Vector3(0, -0.03, 0));
    lampLight.castShadow = true;
    lampLight.shadow.mapSize.set(512, 512);
    lampLight.shadow.bias = -0.004;
    lampLight.shadow.camera.near = 0.02;
    scene.add(lampLight);

    // свечение монитора
    screenLight = new THREE.PointLight(0x7dffa8, 0.45, 2.2, 1.5);
    screenLight.position.copy(wp('screen')).add(new THREE.Vector3(0, 0, 0.25));
    scene.add(screenLight);

    // луна из окна
    const moon = new THREE.SpotLight(0x7f9cff, 6, 6, 0.75, 0.6, 1);
    moon.position.set(-2.6, 2.2, -0.15);
    moon.target.position.set(0.1, 0.6, -0.4);
    scene.add(moon, moon.target);

    scene.add(new THREE.HemisphereLight(0x223355, 0x080604, 0.6));

    // кто-то за окном
    figure = new THREE.Mesh(
        new THREE.PlaneGeometry(0.5, 0.5),
        new THREE.MeshBasicMaterial({ map: figureTex, transparent: true, fog: false })
    );
    figureTex.flipY = true;
    figure.position.copy(wp('window_glass')).add(new THREE.Vector3(0.006, -0.2, 0));
    figure.rotation.y = Math.PI / 2;
    figure.visible = false;
    scene.add(figure);
}

/* ------------------------------------------------------------------ */
/* камера                                                              */
/* ------------------------------------------------------------------ */

const HOME = { pos: new THREE.Vector3(), look: new THREE.Vector3() };
function setHome(portrait) {
    HOME.pos.set(...(portrait ? [0.22, 1.3, 1.25] : [0.12, 1.2, 0.78]));
    HOME.look.set(...(portrait ? [0.2, 1.0, -0.6] : [0.05, 0.95, -0.6]));
    if (camReady && !zoomed) { cam.toPos.copy(HOME.pos); cam.toLook.copy(HOME.look); }
}
setHome(camera.aspect < 1);
const cam = { pos: HOME.pos.clone(), look: HOME.look.clone(), toPos: HOME.pos.clone(), toLook: HOME.look.clone() };
camReady = true;
const pointer = new THREE.Vector2(0, 0);
let yaw = 0, pitch = 0, zoomed = false;

function lookAround() {
    if (zoomed) return [0, 0];
    const dz = v => Math.sign(v) * Math.max(0, Math.abs(v) - 0.55) / 0.45;
    return [-pointer.x * 0.05 - dz(pointer.x) * 0.75, pointer.y * 0.02 + dz(pointer.y) * 0.18];
}

function screenFit() {
    const s = obj.screen;
    const box = new THREE.Box3().setFromObject(s);
    const c = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const fill = innerWidth < 640 ? 0.95 : 0.78;
    const dist = Math.max(size.y / fill, size.x / fill / camera.aspect) / (2 * t);
    return { pos: c.clone().add(new THREE.Vector3(0, 0, dist)), look: c };
}

function screenRect() {
    const box = new THREE.Box3().setFromObject(obj.screen);
    const pts = [
        new THREE.Vector3(box.min.x, box.min.y, box.max.z), new THREE.Vector3(box.max.x, box.max.y, box.max.z)
    ].map(p => p.project(camera));
    const x0 = (pts[0].x + 1) / 2 * innerWidth, x1 = (pts[1].x + 1) / 2 * innerWidth;
    const y0 = (1 - pts[1].y) / 2 * innerHeight, y1 = (1 - pts[0].y) / 2 * innerHeight;
    return { left: x0, top: y0, width: x1 - x0, height: y1 - y0 };
}

/* ------------------------------------------------------------------ */
/* скрепка                                                             */
/* ------------------------------------------------------------------ */

const bubble = $('bubble'), bubbleText = $('bubble-text');
let bubbleTimer, idleTimer, talkT = -10, lastLine = '';

function say(line, ms = 5500) {
    if (!line || (line === lastLine && bubble.classList.contains('show'))) return;
    lastLine = line;
    bubbleText.textContent = line;
    bubble.classList.add('show');
    talkT = clock.elapsedTime;
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => bubble.classList.remove('show'), ms);
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => say(pick(quips.idle)), 30000 + Math.random() * 25000);
}

function placeBubble() {
    if (!obj.eye_L) return;
    const p = obj.eye_L.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0.01, 0.03, 0)).project(camera);
    let x = (p.x + 1) / 2 * innerWidth, y = (1 - p.y) / 2 * innerHeight;
    if (p.z > 1 || x < 0 || x > innerWidth || y < 0 || y > innerHeight) { x = innerWidth - 20; y = innerHeight - 60; }
    bubble.style.left = Math.max(Math.min(260, innerWidth - 10), Math.min(innerWidth - 10, x)) + 'px';
    bubble.style.top = Math.max(120, y) + 'px';
}

/* ------------------------------------------------------------------ */
/* звук                                                                */
/* ------------------------------------------------------------------ */

const music = new Audio('mp3/Ambient.mp3');
music.loop = true; music.volume = 0.35;
const click = new Audio('click.mp3'); click.volume = 0.4;
const playClick = () => { const c = click.cloneNode(); c.volume = 0.4; c.play().catch(() => {}); };
let muted = false;
$('mute').onclick = () => {
    muted = !muted;
    muted ? music.pause() : music.play().catch(() => {});
    $('mute').textContent = muted ? '♪ вкл' : '♪ выкл';
};

/* ------------------------------------------------------------------ */
/* интерактив                                                          */
/* ------------------------------------------------------------------ */

const tip = $('tip');
const raycaster = new THREE.Raycaster();
let hovered = null, hoverSince = 0, commented = null;

const KEYS = /^(vhs_\d|floppy_\d|crt|clippy|lamp|mug|poster|shelf_skull|trashbin|window|sticky_\d|keyboard|mouse)$/;

function keyOf(o) {
    for (; o; o = o.parent) if (KEYS.test(o.name)) return o.name;
    return null;
}

function tipFor(key) {
    if (key.startsWith('vhs_')) return '▶ ' + games[+key.slice(4)].title;
    if (key.startsWith('floppy_')) return '💾 ' + repos[+key.slice(7)].name;
    return {
        crt: '> открыть терминал', clippy: 'скрепка', lamp: lampOn ? 'выключить свет' : 'включить свет',
        poster: 'NLPA COLLAB ↗', trashbin: 'корзина', window: 'окно', mug: 'кофе', shelf_skull: 'Йорик',
        sticky_0: 'записка', sticky_1: 'записка', keyboard: 'клавиатура', mouse: 'мышь'
    }[key];
}

function commentFor(key) {
    if (key.startsWith('vhs_')) return games[+key.slice(4)].clippy;
    if (key.startsWith('floppy_')) return repos[+key.slice(7)].clippy;
    if (key === 'clippy') return null;
    if (key === 'lamp') return quips.objects.lamp;
    return quips.objects[key];
}

function pickAt(x, y) {
    pointer.set(x / innerWidth * 2 - 1, -(y / innerHeight) * 2 + 1);
    if (!room || zoomed) return null;
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(hoverables, false)[0];
    return hit ? keyOf(hit.object) : null;
}

canvas.addEventListener('pointermove', e => {
    const key = pickAt(e.clientX, e.clientY);
    if (key !== hovered) { hovered = key; hoverSince = performance.now(); }
    canvas.classList.toggle('hover', !!key);
    tip.style.left = e.clientX + 'px'; tip.style.top = e.clientY + 'px';
    tip.textContent = key ? tipFor(key) : '';
    tip.classList.toggle('show', !!key && e.pointerType === 'mouse');
});
canvas.addEventListener('pointerleave', () => { hovered = null; tip.classList.remove('show'); });

canvas.addEventListener('click', e => {
    const key = pickAt(e.clientX, e.clientY);
    if (zoomed) { closeTerm(); return; }
    if (!key) { hideCard(); return; }
    commented = key;   // не перебивать реакцию на клик комментарием наведения
    playClick();
    if (key.startsWith('vhs_')) return showGame(+key.slice(4));
    if (key.startsWith('floppy_')) return showRepo(+key.slice(7));
    switch (key) {
        case 'crt': case 'keyboard': return openTerm();
        case 'clippy': talkT = clock.elapsedTime; return say(pick(quips.poke), 3000);
        case 'lamp': toggleLamp(); tip.textContent = tipFor(key); return;
        case 'poster': return open(links[0].url, '_blank');
        default: return say(commentFor(key));
    }
});

function toggleLamp() {
    lampOn = !lampOn;
    say(lampOn ? quips.objects.lampOn : quips.objects.lampOff);
    if (!lampOn) setTimeout(() => { if (!lampOn) scare(true); }, 4000);
}

// карточки
const card = $('card'), cardBody = $('card-body');
function showCard(html) { cardBody.innerHTML = html; card.hidden = false; card.style.animation = 'none'; void card.offsetWidth; card.style.animation = ''; }
function hideCard() { card.hidden = true; }
card.querySelector('.card-x').onclick = hideCard;

function showGame(i) {
    const g = games[i];
    say(g.clippy);
    showCard(`
        <img src="${g.cover}" alt="">
        <h3>${g.title}</h3>
        <div class="meta"><b>${g.status}</b> · ${g.tags}</div>
        <p>${g.desc}</p>
        <a class="go" href="${g.url}" target="_blank">▶ играть на itch.io</a>
        <a class="sub" href="games.html#${g.slug}">все игры</a>`);
}

function showRepo(i) {
    const r = repos[i];
    say(r.clippy);
    showCard(`
        <h3>${r.name}</h3>
        <div class="meta"><b>${r.lang}</b> · github.com/lalds</div>
        <p>${r.desc}</p>
        <a class="go" href="${r.url}" target="_blank">открыть на GitHub</a>
        <a class="sub" href="https://github.com/lalds" target="_blank">все репы</a>`);
}

addEventListener('keydown', e => {
    if (e.key === 'Escape') { zoomed ? closeTerm() : hideCard(); }
});

/* ------------------------------------------------------------------ */
/* терминал                                                            */
/* ------------------------------------------------------------------ */

const term = $('term'), out = $('term-out');
let input = '', queue = [], printing = false;

function print(html) {
    queue.push(...html.split('\n'));
    if (!printing) flush();
}
function flush() {
    printing = queue.length > 0;
    if (!printing) return renderPrompt();
    const line = document.createElement('div');
    line.innerHTML = queue.shift() || '&nbsp;';
    out.querySelector('.prompt')?.remove();
    out.appendChild(line);
    out.scrollTop = out.scrollHeight;
    setTimeout(flush, 22);
}
function renderPrompt() {
    out.querySelector('.prompt')?.remove();
    const p = document.createElement('div');
    p.className = 'prompt';
    p.innerHTML = `&gt; ${escapeHtml(input)}<span class="cursor">█</span>`;
    out.appendChild(p);
    out.scrollTop = out.scrollHeight;
}
const escapeHtml = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const cmd = name => `<span class="cmd" data-cmd="${name}">${name}</span>`;

const commands = {
    help: () => `команды: ${['about', 'code', 'games', 'log', 'links', 'play', 'clear', 'exit'].map(cmd).join(' ')}\n<span class="dim">можно кликать, можно печатать.</span>`,
    about: () => `alekstwin aka Angel
unity dev · bug hunter · lead dev @ NLPA COLLAB
C# · C++ · Python

делаю странные хоррор-игры на Unity, ковыряю движки,
ищу баги за деньги и пишу инструменты, которые никто не просил.`,
    code: () => repos.map(r => `<a href="${r.url}" target="_blank">${r.name}</a> <span class="dim">${r.lang}</span>\n  ${r.desc}`).join('\n') +
        `\n\n<a href="https://github.com/lalds" target="_blank">github.com/lalds</a>`,
    games: () => games.map(g => `<a href="${g.url}" target="_blank">${g.title}</a> <span class="dim">[${g.status}]</span>`).join('\n') +
        `\n+ KRAINOTOMY <span class="dim">(с Spectree)</span> <a href="https://spectreee.itch.io/krainotomy" target="_blank">itch</a>\n\n<a href="games.html">все игры с описанием →</a>`,
    log: () => {
        const posts = (typeof blogPosts !== 'undefined' ? blogPosts : []).slice(0, 3);
        const strip = html => new DOMParser().parseFromString(html, 'text/html').body.textContent.replace(/\s+/g, ' ').trim();
        return posts.map(p => `<span class="dim">[${p.date}]</span> ${escapeHtml(p.title)}\n  ${escapeHtml(strip(p.body).slice(0, 220))}…`).join('\n\n') +
            `\n\n<a href="log.html">весь лог →</a>`;
    },
    links: () => links.map(l => `<a href="${l.url}" target="_blank">${l.name}</a>`).join('  '),
    clear: () => { out.innerHTML = ''; return ''; },
    play: () => { setTimeout(launchGame, 400); return 'запускаю bounty.exe…'; },
    bounty: () => commands.play(),
    exit: () => { setTimeout(closeTerm, 200); return 'пока.'; },
    // секреты
    sudo: () => { say('Нет.', 2500); return 'alekstwin is not in the sudoers file. скрепка уже в курсе.'; },
    clippy: () => { say('Вы звали? Я всегда здесь. Всегда.'); return 'скрепка призвана.'; },
    deepseek: () => { say('Мы не произносим это имя в этом доме.'); return 'команда удалена из истории. как и сайт 2024 года.'; },
    'rm -rf /': () => { say('ЧТО ТЫ ДЕЛАЕШЬ'); term.style.animation = 'term-on .35s reverse'; setTimeout(closeTerm, 300); return 'удаляю…'; },
    krainotomy: () => '<a href="https://spectreee.itch.io/krainotomy" target="_blank">KRAINOTOMY</a> — демо уже вышло. Spectree, привет.',
    whoami: () => 'гость. но скрепка тебя запомнила.',
    ls: () => 'about  code  games  log  links  .secrets',
    'cat .secrets': () => 'sudo · clippy · deepseek · krainotomy · whoami · rm -rf / · play',
};

function run(raw) {
    const c = raw.trim().toLowerCase();
    print(`<span class="dim">&gt; ${escapeHtml(raw)}</span>`);
    if (!c) return;
    const f = commands[c];
    const res = f ? f() : `${escapeHtml(c)}: команда не найдена. попробуй ${cmd('help')}`;
    if (res) print(res + '\n');
}

out.addEventListener('click', e => {
    const c = e.target.closest('[data-cmd]');
    if (c) { playClick(); run(c.dataset.cmd); }
});

addEventListener('keydown', e => {
    if (!zoomed || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Enter') { const v = input; input = ''; run(v); }
    else if (e.key === 'Backspace') input = input.slice(0, -1);
    else if (e.key.length === 1) input += e.key;
    else return;
    e.preventDefault();
    if (!printing) renderPrompt();
});

let termFirst = true;
function openTerm() {
    if (zoomed) return;
    hideCard();
    zoomed = true;
    const f = screenFit();
    cam.toPos.copy(f.pos); cam.toLook.copy(f.look);
    tip.classList.remove('show');
    setTimeout(() => {
        if (!zoomed) return;
        term.hidden = false;
        if (termFirst) {
            termFirst = false;
            print(`ALEKSTWIN OS v2.6 — добро пожаловать.\n<span class="dim">Esc или клик мимо экрана — выйти.</span>\n`);
            run('help');
        }
        say('Похоже, вы пытаетесь пользоваться терминалом. Наберите help. Или не набирайте.', 4500);
    }, 650);
}
let game = null;
function launchGame() {
    if (game || !zoomed) return;
    out.hidden = true;
    game = startBounty(term, {
        say, playClick,
        onExit: () => { game = null; out.hidden = false; renderPrompt(); }
    });
}

function closeTerm() {
    if (game) { game.stop(); game = null; out.hidden = false; }
    zoomed = false;
    term.hidden = true;
    term.style.animation = '';
    cam.toPos.copy(HOME.pos); cam.toLook.copy(HOME.look);
}

/* ------------------------------------------------------------------ */
/* жуть                                                                */
/* ------------------------------------------------------------------ */

let flickerUntil = 0;
function scare(force = false) {
    if (zoomed && !force) return;
    flickerUntil = clock.elapsedTime + 1.4;
    if (force || Math.random() < 0.5) {
        figure.visible = true;
        setTimeout(() => {
            figure.visible = false;
            if (yaw > 0.35) say(quips.objects.figure, 4000);  // смотрел на окно
        }, 1600);
    }
}
setInterval(() => { if (room && document.visibilityState === 'visible') scare(); }, 45000);

/* ------------------------------------------------------------------ */
/* цикл                                                                */
/* ------------------------------------------------------------------ */

const clock = new THREE.Clock();
const tmp = new THREE.Vector3();

function frame() {
    requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
    if (!room) return;

    // камера
    const k = 1 - Math.pow(0.002, dt);
    cam.pos.lerp(cam.toPos, k); cam.look.lerp(cam.toLook, k);
    const [ty, tp] = lookAround();
    yaw = lerp(yaw, ty, 1 - Math.pow(0.02, dt)); pitch = lerp(pitch, tp, 1 - Math.pow(0.02, dt));
    camera.position.copy(cam.pos);
    if (!zoomed) camera.position.y += Math.sin(t * 0.7) * 0.004;   // дыхание
    camera.lookAt(cam.look);
    camera.rotateY(yaw); camera.rotateX(pitch);

    if (zoomed && !term.hidden) {
        const r = screenRect();
        Object.assign(term.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px', fontSize: (r.height / 25) + 'px' });
    }

    // кассеты и дискеты
    for (let i = 0; i < 7; i++) {
        const o = obj[`vhs_${i}`], b = basePos.get(`vhs_${i}`);
        o.position.z = lerp(o.position.z, b.z + (hovered === `vhs_${i}` ? 0.06 : 0), 0.2);
    }
    for (let i = 0; i < 5; i++) {
        const o = obj[`floppy_${i}`], b = basePos.get(`floppy_${i}`);
        o.position.y = lerp(o.position.y, b.y + (hovered === `floppy_${i}` ? 0.03 : 0), 0.2);
    }

    // комментарии при наведении (с задержкой)
    if (hovered && hovered !== commented && performance.now() - hoverSince > 450) {
        commented = hovered;
        say(commentFor(hovered));
    }

    // скрепка
    const body = obj.clippy_body, since = t - talkT;
    body.rotation.z = Math.sin(t * 1.3) * 0.05;
    body.position.y = since < 0.6 ? Math.abs(Math.sin(since * Math.PI * 3.3)) * 0.012 * (1 - since / 0.6) : 0;
    const brow = since < 1.5 ? 0.003 : 0;
    obj.brow_L.position.y = lerp(obj.brow_L.position.y, 0.0175 + brow, 0.2);
    obj.brow_R.position.y = lerp(obj.brow_R.position.y, 0.0175 + brow, 0.2);
    raycaster.setFromCamera(pointer, camera);
    raycaster.ray.at(0.7, tmp);
    obj.eye_L.lookAt(tmp); obj.eye_R.lookAt(tmp);
    const blink = (t % 4.3) < 0.12 ? 0.1 : 1;
    obj.eye_L.scale.y = obj.eye_R.scale.y = blink;
    placeBubble();

    // свет
    const flick = t < flickerUntil ? (Math.random() < 0.5 ? 0.05 : 1) : 1;
    lampLight.intensity = lampOn ? 1.6 * flick : 0;
    obj.lamp_bulb.material.emissiveIntensity = lampOn ? 8 * flick : 0;
    screenLight.intensity = 0.45 + Math.sin(t * 50) * 0.02;

    if (Math.floor(t * 12) !== screenTex.userData.f) {
        screenTex.userData.f = Math.floor(t * 12);
        screenTex.userData.draw(screenTex.userData.ctx, 512, 384);
        screenTex.needsUpdate = true;
    }

    renderer.render(scene, camera);
}
frame();

/* ------------------------------------------------------------------ */
/* вход                                                                */
/* ------------------------------------------------------------------ */

$('enter').addEventListener('click', () => {
    if (!room) return;
    $('boot').classList.add('out');
    music.play().catch(() => {});
    playClick();
    setTimeout(() => say(quips.greet, 8000), 1400);
});
