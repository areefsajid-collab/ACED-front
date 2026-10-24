const API = location.hostname === "localhost" || location.hostname === "127.0.0.1"
    ? "http://localhost:5000/api"
    : "https://aced-backend.onrender.com/api";

const views = document.querySelectorAll(".view");
const sidebar = document.querySelector(".sidebar");
const overlay = document.querySelector(".overlay");
const menuBtn = document.querySelector(".menu-btn");
const headerAuth = document.getElementById("header-auth");

const subjects = {
    maths: "Maths",
    english: "English",
    science: "Science",
    urdu: "Urdu"
};

const GRADES = [1, 2, 3, 4, 5, 6, 7, 8];

// Hash routes:
// #home, #about, #contacts, #login, #profile, #progress
// #subject/maths, #grade/maths/4, #worksheet/12
const state = {
    subject: null,
    grade: null,
    worksheetId: null,
    doneIds: new Set(),
    progressGrade: 1
};
let authMode = "login";

// ---------- Session (stored in the browser) ----------
const session = {
    get token() { return localStorage.getItem("aced_token"); },
    get refresh() { return localStorage.getItem("aced_refresh"); },
    get user() {
        try { return JSON.parse(localStorage.getItem("aced_user")); } catch { return null; }
    },
    save(token, refresh, user) {
        localStorage.setItem("aced_token", token);
        localStorage.setItem("aced_refresh", refresh);
        if (user) localStorage.setItem("aced_user", JSON.stringify(user));
    },
    saveUser(user) { localStorage.setItem("aced_user", JSON.stringify(user)); },
    clear() {
        ["aced_token", "aced_refresh", "aced_user"].forEach((k) => localStorage.removeItem(k));
    }
};

// Picks up tokens after Google sign-in, then cleans the URL
function captureGoogleTokens() {
    if (!location.hash.includes("token=")) return;
    const params = new URLSearchParams(location.hash.slice(1));
    session.save(params.get("token"), params.get("refresh"), null);
    history.replaceState(null, "", `${location.pathname}#home`);
}

async function loadProfile() {
    try {
        const data = await apiFetch("/auth/profile");
        session.saveUser(data.user);
        updateAuthUI();
    } catch {
        // The next protected request will log the user out if the session is dead
    }
}

async function refreshAccessToken() {
    if (!session.refresh) return false;
    try {
        const res = await fetch(`${API}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken: session.refresh })
        });
        if (!res.ok) return false;
        const data = await res.json();
        localStorage.setItem("aced_token", data.token);
        return true;
    } catch {
        return false;
    }
}

// Calls the backend with the token, refreshing it once if it has expired
async function apiFetch(path, options = {}, retry = true) {
    const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
    if (session.token) headers.Authorization = `Bearer ${session.token}`;

    const res = await fetch(`${API}${path}`, { ...options, headers });

    if (res.status === 401 && retry) {
        if (await refreshAccessToken()) return apiFetch(path, options, false);
        session.clear();
        updateAuthUI();
        throw new Error("Your session has ended. Please log in again.");
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
}

async function postJson(path, body) {
    const res = await fetch(`${API}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
    return data;
}

// Creates an element with safe text (never inserts raw HTML from the server)
function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

async function loadDoneIds() {
    state.doneIds = new Set();
    if (!session.token) return;
    try {
        const data = await apiFetch("/users/progress");
        data.progress.forEach((p) => state.doneIds.add(p.worksheetId));
    } catch {
        // Not critical: the list simply won't show done ticks
    }
}

// ---------- Header login / profile ----------
function initialOf(user) {
    const source = (user && (user.name || user.email)) || "?";
    return source.trim().charAt(0).toUpperCase();
}

function updateAuthUI() {
    const loggedIn = Boolean(session.token);
    const user = session.user;

    document.getElementById("link-progress").hidden = !loggedIn;

    if (loggedIn) {
        const firstName = user && user.name ? user.name.split(" ")[0] : "Profile";
        headerAuth.href = "#profile";
        headerAuth.classList.add("is-user");
        headerAuth.setAttribute("aria-label", "My profile");
        headerAuth.innerHTML = `<span class="avatar" aria-hidden="true">${initialOf(user)}</span><span class="auth-name">${firstName}</span>`;
    } else {
        headerAuth.href = "#login";
        headerAuth.classList.remove("is-user");
        headerAuth.removeAttribute("aria-label");
        headerAuth.textContent = "Log in";
    }
}

function renderProfile() {
    const user = session.user || {};
    document.getElementById("profile-name").textContent = user.name || "Your profile";
    document.getElementById("profile-email").textContent = user.email || "";
    document.getElementById("profile-avatar").textContent = initialOf(user);
}

// ---------- Navigation ----------
function showView(name) {
    views.forEach((view) => {
        view.hidden = view.dataset.view !== name;
    });
    window.scrollTo({ top: 0, behavior: "instant" });
}

function setSidebarOpen(open) {
    sidebar.classList.toggle("is-open", open);
    sidebar.setAttribute("aria-hidden", String(!open));
    overlay.hidden = !open;
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
}

function setActiveSidebar(name) {
    document.querySelectorAll(".sidebar-link").forEach((link) => {
        link.classList.toggle("is-active", link.dataset.link === name);
    });
}

function setAuthMode(mode) {
    authMode = mode;
    const registering = mode === "register";
    document.getElementById("auth-title").textContent = registering ? "Create your account" : "Log in";
    document.getElementById("auth-name-field").hidden = !registering;
    document.getElementById("auth-submit").textContent = registering ? "Create account" : "Log in";
    document.getElementById("auth-switch-text").textContent = registering ? "Already have an account?" : "New here?";
    document.getElementById("auth-switch-btn").textContent = registering ? "Log in" : "Create an account";
    document.getElementById("auth-msg").textContent = "";
}

// ---------- Subject and grade pages ----------
function renderSubject(subject) {
    document.getElementById("subject-title").textContent = subjects[subject];
    const grid = document.getElementById("grade-grid");
    grid.innerHTML = "";
    GRADES.forEach((grade) => {
        const btn = el("button", "grade-btn");
        btn.type = "button";
        btn.innerHTML = `${grade}<span>Grade</span>`;
        btn.addEventListener("click", () => {
            location.hash = `grade/${subject}/${grade}`;
        });
        grid.appendChild(btn);
    });
}

async function renderGrade(subject, grade) {
    document.getElementById("grade-title").textContent = `${subjects[subject]}, Grade ${grade}`;
    const list = document.getElementById("topic-list");
    list.innerHTML = "";
    list.appendChild(el("p", "view-copy", "Loading worksheets..."));

    try {
        await loadDoneIds();
        const data = await apiFetch(`/worksheets?subject=${subject}&grade=${grade}`);
        list.innerHTML = "";

        if (!data.worksheets.length) {
            list.appendChild(el("div", "topic-empty", "No worksheets are ready for this grade yet. Check back soon."));
            return;
        }

        data.worksheets.forEach((ws) => {
            const card = el("button", "topic-btn");
            card.type = "button";
            const meta = el("span", "topic-meta");
            meta.appendChild(el("span", "badge", ws.difficulty));
            if (state.doneIds.has(ws.id)) meta.appendChild(el("span", "done-tag", "Done"));
            card.append(el("span", "topic-text", ws.title), meta);
            card.addEventListener("click", () => {
                location.hash = `worksheet/${ws.id}`;
            });
            list.appendChild(card);
        });
    } catch (err) {
        list.innerHTML = "";
        list.appendChild(el("div", "topic-empty", err.message));
    }
}

// ---------- Worksheet page ----------
function updateDoneButton() {
    const btn = document.getElementById("done-btn");
    btn.hidden = false;
    if (!session.token) {
        btn.textContent = "Log in to track progress";
        return;
    }
    btn.textContent = state.doneIds.has(state.worksheetId) ? "Marked as done (undo)" : "Mark as done";
}

async function toggleDone() {
    const msg = document.getElementById("done-msg");
    if (!session.token) {
        location.hash = "login";
        return;
    }

    const id = state.worksheetId;
    const wasDone = state.doneIds.has(id);
    msg.textContent = "Saving...";

    try {
        await apiFetch(`/worksheets/${id}/complete`, { method: wasDone ? "DELETE" : "POST" });
        if (wasDone) state.doneIds.delete(id);
        else state.doneIds.add(id);
        updateDoneButton();
        msg.textContent = wasDone ? "Removed from your progress." : "Saved to your progress.";
    } catch (err) {
        msg.textContent = err.message;
    }
}

async function renderWorksheet(id) {
    state.worksheetId = id;
    const body = document.getElementById("sheet-body");
    body.innerHTML = "";
    body.appendChild(el("p", "sheet-empty", "Loading worksheet..."));
    document.getElementById("done-btn").hidden = true;
    document.getElementById("download-btn").hidden = true;
    document.getElementById("done-msg").textContent = "";

    try {
        await loadDoneIds();
        const { worksheet } = await apiFetch(`/worksheets/${id}`);
        const preview = await apiFetch(`/worksheets/${id}/preview`);

        state.subject = worksheet.subject;
        state.grade = worksheet.grade;

        document.getElementById("sheet-title").textContent = worksheet.title;
        document.getElementById("sheet-meta").textContent = `${subjects[worksheet.subject]}, Grade ${worksheet.grade}`;

        const download = document.getElementById("download-btn");
        download.href = `${API}/worksheets/${id}/download`;
        download.hidden = false;

        body.innerHTML = preview.html;
        updateDoneButton();
    } catch (err) {
        body.innerHTML = "";
        body.appendChild(el("p", "sheet-empty", err.message));
    }
}

// ---------- My progress ----------
function renderProgressTabs() {
    const tabs = document.getElementById("progress-tabs");
    tabs.innerHTML = "";
    GRADES.forEach((g) => {
        const tab = el("button", g === state.progressGrade ? "grade-tab is-active" : "grade-tab", `Grade ${g}`);
        tab.type = "button";
        tab.addEventListener("click", () => {
            state.progressGrade = g;
            renderProgress();
        });
        tabs.appendChild(tab);
    });
}

async function renderProgress() {
    if (!session.token) {
        location.hash = "login";
        return;
    }

    renderProgressTabs();
    const body = document.getElementById("progress-body");
    body.innerHTML = "";
    body.appendChild(el("p", "view-copy", "Loading your progress..."));

    try {
        const data = await apiFetch("/users/progress/summary");
        const grade = state.progressGrade;

        const rows = Object.keys(subjects).map((key) => {
            const found = data.summary.find((r) => r.subject === key && r.grade === grade);
            return { key, total: found ? found.total : 0, done: found ? found.done : 0 };
        });
        const total = rows.reduce((sum, r) => sum + r.total, 0);
        const done = rows.reduce((sum, r) => sum + r.done, 0);

        body.innerHTML = "";
        body.appendChild(el("h2", "progress-heading", `Grade ${grade}`));
        body.appendChild(el("p", "view-copy", total
            ? `${done} of ${total} worksheets done`
            : "No worksheets are ready for this grade yet."));

        rows.forEach((r) => {
            const card = el("div", "progress-card");
            card.appendChild(el("h3", "progress-subject", subjects[r.key]));

            if (!r.total) {
                card.appendChild(el("p", "view-copy", "No worksheets yet"));
            } else {
                const pct = Math.round((r.done / r.total) * 100);
                const track = el("div", "progress-track");
                const fill = el("div", "progress-fill");
                fill.style.width = `${pct}%`;
                track.appendChild(fill);
                card.appendChild(track);
                card.appendChild(el("p", "progress-count", `${r.done} of ${r.total} done`));
            }
            body.appendChild(card);
        });
    } catch (err) {
        body.innerHTML = "";
        body.appendChild(el("p", "view-copy", err.message));
    }
}

// ---------- Router ----------
function route() {
    const parts = location.hash.replace("#", "").split("/").filter(Boolean);
    const [name, a, b] = parts;

    setSidebarOpen(false);

    if (name === "login") {
        if (session.token) {
            location.hash = "profile";
            return;
        }
        setActiveSidebar("login");
        setAuthMode(authMode);
        return showView("login");
    }

    if (name === "profile") {
        if (!session.token) {
            location.hash = "login";
            return;
        }
        setActiveSidebar(null);
        renderProfile();
        return showView("profile");
    }

    if (name === "progress") {
        setActiveSidebar("progress");
        showView("progress");
        return renderProgress();
    }

    if (name === "subject" && subjects[a]) {
        state.subject = a;
        renderSubject(a);
        setActiveSidebar(null);
        return showView("subject");
    }

    if (name === "grade" && subjects[a] && GRADES.includes(Number(b))) {
        state.subject = a;
        state.grade = Number(b);
        setActiveSidebar(null);
        showView("grade");
        return renderGrade(a, state.grade);
    }

    if (name === "worksheet" && /^\d+$/.test(a)) {
        setActiveSidebar(null);
        showView("worksheet");
        return renderWorksheet(Number(a));
    }

    if (name === "about" || name === "contacts") {
        setActiveSidebar(name);
        return showView(name);
    }

    setActiveSidebar("home");
    showView("home");
}

// ---------- Event listeners ----------
document.querySelectorAll(".subject-card").forEach((card) => {
    card.addEventListener("click", () => {
        location.hash = `subject/${card.dataset.subject}`;
    });
});

document.querySelectorAll("[data-link='home']").forEach((link) => {
    link.addEventListener("click", (e) => {
        e.preventDefault();
        location.hash = "home";
    });
});

document.querySelector("[data-view='subject'] [data-link='home']")?.addEventListener("click", (e) => {
    e.preventDefault();
    location.hash = "home";
});

document.getElementById("grade-back").addEventListener("click", () => {
    if (state.subject) location.hash = `subject/${state.subject}`;
});

document.getElementById("worksheet-back").addEventListener("click", () => {
    if (state.subject && state.grade) location.hash = `grade/${state.subject}/${state.grade}`;
    else location.hash = "home";
});

document.getElementById("done-btn").addEventListener("click", toggleDone);
document.getElementById("print-btn").addEventListener("click", () => window.print());

menuBtn.addEventListener("click", () => setSidebarOpen(!sidebar.classList.contains("is-open")));
overlay.addEventListener("click", () => setSidebarOpen(false));
document.addEventListener("keydown", (e) => { if (e.key === "Escape") setSidebarOpen(false); });

document.getElementById("auth-switch-btn").addEventListener("click", () => {
    setAuthMode(authMode === "login" ? "register" : "login");
});

document.getElementById("google-btn").addEventListener("click", () => {
    window.location.href = `${API}/auth/google`;
});

document.getElementById("auth-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = document.getElementById("auth-msg");
    const email = document.getElementById("auth-email").value.trim();
    const password = document.getElementById("auth-password").value;
    const name = document.getElementById("auth-name").value.trim();

    msg.textContent = "Please wait...";
    try {
        const data = authMode === "register"
            ? await postJson("/auth/register", { email, password, name })
            : await postJson("/auth/login", { email, password });

        session.save(data.token, data.refreshToken, data.user);
        e.target.reset();
        updateAuthUI();
        msg.textContent = "";
        location.hash = "profile";
    } catch (err) {
        msg.textContent = err.message;
    }
});

document.getElementById("profile-logout").addEventListener("click", () => {
    session.clear();
    updateAuthUI();
    setSidebarOpen(false);
    location.hash = "home";
});

window.addEventListener("hashchange", route);

// ---------- Start ----------
captureGoogleTokens();
updateAuthUI();
if (session.token) loadProfile();
route();