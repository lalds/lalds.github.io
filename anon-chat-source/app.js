"use strict";

const prefix = "anon-chat:v1:";
const profileKey = prefix + "tab";
const get = (id) => document.getElementById(id);
const messageField = get("message");
let activeRoom = "";
let photo = "";
let photoRequest = 0;
const roomPrefix = prefix + "room:";
const validCode = (code) => /^[0-9A-F]{8}$/.test(code);
const photoPattern = /^data:image\/webp;base64,[A-Za-z0-9+/]+=*$/;
function validPhoto(value) {
  return typeof value === "string" && value.length <= 350000 && photoPattern.test(value);
}
function clearPhoto() {
  photoRequest += 1;
  photo = "";
  get("photo").value = "";
  get("preview").hidden = true;
  get("previewImage").removeAttribute("src");
  get("sendButton").disabled = false;
}
function renderRooms() {
  const list = get("rooms");
  const codes = Object.keys(localStorage).filter((key) => key.startsWith(roomPrefix))
    .map((key) => key.slice(roomPrefix.length)).filter(validCode).sort();
  list.replaceChildren();
  if (!codes.length) {
    const empty = document.createElement("p");
    empty.textContent = "Пока нет комнат";
    list.append(empty);
  }
  for (const code of codes) {
    const button = document.createElement("button");
    button.className = "secondary";
    button.textContent = "Комната " + code;
    if (code === activeRoom) button.setAttribute("aria-current", "true");
    button.onclick = () => {
      if (code === activeRoom) return;
      try { openRoom(code); get("room").focus(); } catch (error) { showError(error); }
    };
    list.append(button);
  }
}


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
  return localStorage.getItem(roomPrefix + code) !== null;
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
  clearPhoto();
  renderRooms();
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
    entry.append(meta);
    if (item.text) entry.append(body);
    if (validPhoto(item.photo)) {
      const img = document.createElement("img");
      img.src = item.photo;
      img.alt = "Фото от " + alias(item.author);
      entry.append(img);
    }
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
    localStorage.setItem(roomPrefix + code, JSON.stringify({
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
    if (!validCode(code)) throw new Error("Введите восемь знаков от 0 до 9 или от A до F.");
    openRoom(code);
  } catch (error) {
    showError(error);
  }
});

get("send").addEventListener("submit", (event) => {
  event.preventDefault();
  const text = messageField.value.trim();
  if (get("sendButton").disabled) return;
  if ((!text && !photo) || text.length > 1000) {
    showError(new Error("Введите текст до 1000 символов или прикрепите фото."));
    return;
  }
  try {
    if (!activeRoom || !roomExists(activeRoom)) throw new Error("Комната больше недоступна.");
    const item = { id: crypto.randomUUID(), author: profile.id, text, createdAt: Date.now() };
    if (photo) item.photo = photo;
    const key = prefix + "message:" + activeRoom + ":" + item.id;
    try {
      localStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
      if (error.name === "QuotaExceededError") throw new Error("Хранилище браузера заполнено. Фото и текст остались в форме.");
      throw error;
    }
    clearPhoto();
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

get("removePhoto").onclick = clearPhoto;

get("photo").addEventListener("change", async () => {
  const file = get("photo").files[0];
  clearPhoto();
  if (!file) return;
  get("status").textContent = "";
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 8 * 1024 * 1024) {
    showError(new Error("Выберите JPEG, PNG или WebP размером до 8 МБ."));
    return;
  }
  const request = photoRequest;
  get("sendButton").disabled = true;
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 760 / Math.max(bitmap.width, bitmap.height));
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    let encoded = canvas.toDataURL("image/webp", .72);
    if (!validPhoto(encoded)) encoded = canvas.toDataURL("image/webp", .48);
    if (!validPhoto(encoded)) throw new Error("Фото не удалось сжать. Попробуйте другое изображение.");
    if (request !== photoRequest) return;
    photo = encoded;
    get("previewImage").src = photo;
    get("preview").hidden = false;
  } catch (error) {
    if (request === photoRequest) showError(new Error(error.message || "Не удалось открыть фото."));
  } finally {
    bitmap?.close();
    if (request === photoRequest) get("sendButton").disabled = false;
  }
});

window.addEventListener("storage", (event) => {
  if (event.storageArea !== localStorage || !profile) return;
  if (activeRoom && !roomExists(activeRoom)) {
    openRoom("");
    get("status").textContent = "Данные комнаты удалены из браузера.";
  } else if (!event.key || event.key.startsWith(roomPrefix)) {
    renderRooms();
  } else if (activeRoom && event.key.startsWith(prefix + "message:" + activeRoom + ":")) {
    renderHistory();
  }
});
