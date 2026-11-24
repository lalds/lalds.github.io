"use strict";

const prefix = "anon-chat:v1:";
const profileKey = prefix + "tab";
const get = (id) => document.getElementById(id);
const messageField = get("message");
let activeRoom = "";

function newProfile() {
  return { id: crypto.randomUUID(), room: "" };
}

function showError(error) {
  get("status").textContent = error.message;
}

function readProfile() {
  try {
    const profile = JSON.parse(sessionStorage.getItem(profileKey));
    if (typeof profile?.id === "string" && typeof profile.room === "string") return profile;
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
  }
  return newProfile();
}

function roomExists(code) {
  return localStorage.getItem(prefix + "room:" + code) !== null;
}

function openRoom(code) {
  if (code && !roomExists(code)) throw new Error("Комната с таким кодом не найдена.");
  sessionStorage.setItem(profileKey, JSON.stringify({ id: profile.id, room: code }));
  activeRoom = code;
  get("status").textContent = "";
  get("welcome").hidden = Boolean(code);
  get("chat").hidden = !code;
  get("room").textContent = code;
  get("identity").textContent = "Вы — " + alias(profile.id);
  messageField.value = "";
  if (code) renderHistory();
}

function alias(id) {
  return "Гость " + id.slice(0, 6).toUpperCase();
}

function renderHistory() {
  const history = get("history");
  const messagePrefix = prefix + "message:" + activeRoom + ":";
  const messages = Object.keys(localStorage)
    .filter((key) => key.startsWith(messagePrefix))
    .map((key) => {
      try {
        return JSON.parse(localStorage.getItem(key));
      } catch {
        return null;
      }
    })
    .filter((item) => typeof item?.id === "string" &&
      typeof item.author === "string" && typeof item.text === "string" &&
      Number.isFinite(item.createdAt) && Math.abs(item.createdAt) <= 8.64e15)
    .sort((first, second) => first.createdAt - second.createdAt ||
      first.id.localeCompare(second.id));
  history.replaceChildren();
  if (!messages.length) history.textContent = "Сообщений пока нет.";
  for (const item of messages) {
    const entry = document.createElement("article");
    entry.className = item.author === profile.id ? "entry mine" : "entry";
    const meta = document.createElement("small");
    const time = new Date(item.createdAt).toLocaleTimeString("ru", {
      hour: "2-digit", minute: "2-digit"
    });
    meta.textContent = alias(item.author) + " · " + time;
    const body = document.createElement("p");
    body.textContent = item.text;
    entry.append(meta, body);
    history.append(entry);
  }
  history.scrollTop = history.scrollHeight;
}

let profile;
try {
  profile = readProfile();
  openRoom(roomExists(profile.room) ? profile.room : "");
} catch {
  get("status").textContent = "Для работы откройте сайт через localhost или HTTPS и разрешите сохранение данных.";
}

get("create").addEventListener("click", () => {
  try {
    let code;
    do {
      code = crypto.randomUUID().slice(0, 8).toUpperCase();
    } while (roomExists(code));
    localStorage.setItem(prefix + "room:" + code, JSON.stringify({
      code, createdAt: Date.now()
    }));
    openRoom(code);
  } catch (error) {
    showError(error);
  }
});

get("join").addEventListener("submit", (event) => {
  event.preventDefault();
  try {
    const code = get("code").value.trim().toUpperCase();
    if (!/^[0-9A-F]{8}$/.test(code)) throw new Error("Введите восемь знаков от 0 до 9 или от A до F.");
    openRoom(code);
  } catch (error) {
    showError(error);
  }
});

get("send").addEventListener("submit", (event) => {
  event.preventDefault();
  const text = messageField.value.trim();
  if (!text || text.length > 1000) {
    showError(new Error("Введите сообщение длиной от 1 до 1000 символов."));
    return;
  }
  try {
    if (!activeRoom || !roomExists(activeRoom)) throw new Error("Комната больше недоступна.");
    const item = { id: crypto.randomUUID(), author: profile.id, text, createdAt: Date.now() };
    const key = prefix + "message:" + activeRoom + ":" + item.id;
    localStorage.setItem(key, JSON.stringify(item));
    messageField.value = "";
    get("status").textContent = "";
    renderHistory();
    messageField.focus();
  } catch (error) {
    showError(error);
  }
});

get("leave").addEventListener("click", () => {
  try {
    openRoom("");
    get("create").focus();
  } catch (error) {
    showError(error);
  }
});

window.addEventListener("storage", (event) => {
  if (event.storageArea !== localStorage || !activeRoom) return;
  if (!roomExists(activeRoom)) {
    openRoom("");
    get("status").textContent = "Данные комнаты удалены из браузера.";
  } else if (event.key?.startsWith(prefix + "message:" + activeRoom + ":")) {
    renderHistory();
  }
});
