const views = document.querySelectorAll(".view");
const sidebar = document.querySelector(".sidebar");
const overlay = document.querySelector(".overlay");
const menuBtn = document.querySelector(".menu-btn");

const subjects = {
    maths: "Maths",
    english: "English",
    science: "Science",
    urdu: "Urdu"
};

const GRADES = [1, 2, 3, 4, 5, 6, 7, 8];

// Hash routes:
// #home, #about, #contacts
// #subject/maths
// #grade/maths/4
// #worksheet/maths/4/addition
const state = { subject: null, grade: null, topic: null };

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

function renderSubject(subject) {
    document.getElementById("subject-title").textContent = subjects[subject];
    const grid = document.getElementById("grade-grid");
    grid.innerHTML = "";
    GRADES.forEach((grade) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "grade-btn";
        btn.innerHTML = `${grade}<span>Grade</span>`;
        btn.addEventListener("click", () => {
            location.hash = `grade/${subject}/${grade}`;
        });
        grid.appendChild(btn);
    });
}

function renderGrade(subject, grade) {
    document.getElementById("grade-title").textContent = `${subjects[subject]}, Grade ${grade}`;
    const list = document.getElementById("topic-list");
    list.innerHTML = "";

    // Topics come from the backend in Phase 7.
    const empty = document.createElement("div");
    empty.className = "topic-empty";
    empty.textContent = "Topics are on their way. Check back soon.";
    list.appendChild(empty);
}

function renderWorksheet(subject, grade, topic) {
    document.getElementById("sheet-title").textContent =
        `${subjects[subject]}, Grade ${grade}: ${topic}`;
    const body = document.getElementById("sheet-body");
    body.innerHTML = "";

    // Placeholder questions until worksheets come from the backend.
    for (let i = 1; i <= 3; i++) {
        const q = document.createElement("div");
        q.className = "question";
        q.innerHTML = `
            <p class="question-text">${i}. Question will appear here.</p>
            <div class="answer-box"></div>
        `;
        body.appendChild(q);
    }
}

function route() {
    const parts = location.hash.replace("#", "").split("/").filter(Boolean);
    const [name, a, b, c] = parts;

    setSidebarOpen(false);

    if (name === "subject" && subjects[a]) {
        state.subject = a;
        renderSubject(a);
        setActiveSidebar(null);
        return showView("subject");
    }

    if (name === "grade" && subjects[a] && GRADES.includes(Number(b))) {
        state.subject = a;
        state.grade = Number(b);
        renderGrade(a, state.grade);
        setActiveSidebar(null);
        return showView("grade");
    }

    if (name === "worksheet" && subjects[a] && GRADES.includes(Number(b))) {
        state.subject = a;
        state.grade = Number(b);
        state.topic = c || "general";
        renderWorksheet(a, state.grade, state.topic);
        setActiveSidebar(null);
        return showView("worksheet");
    }

    if (name === "about" || name === "contacts") {
        setActiveSidebar(name);
        return showView(name);
    }

    setActiveSidebar("home");
    showView("home");
}

// Subject cards
document.querySelectorAll(".subject-card").forEach((card) => {
    card.addEventListener("click", () => {
        location.hash = `subject/${card.dataset.subject}`;
    });
});

// Logo and home links
document.querySelectorAll("[data-link='home']").forEach((el) => {
    el.addEventListener("click", (e) => {
        e.preventDefault();
        location.hash = "home";
    });
});

// Back buttons
document.querySelector("[data-view='subject'] [data-link='home']")?.addEventListener("click", (e) => {
    e.preventDefault();
    location.hash = "home";
});
document.getElementById("grade-back").addEventListener("click", () => {
    if (state.subject) location.hash = `subject/${state.subject}`;
});
document.getElementById("worksheet-back").addEventListener("click", () => {
    if (state.subject && state.grade) location.hash = `grade/${state.subject}/${state.grade}`;
});

document.getElementById("print-btn").addEventListener("click", () => window.print());

menuBtn.addEventListener("click", () => setSidebarOpen(!sidebar.classList.contains("is-open")));
overlay.addEventListener("click", () => setSidebarOpen(false));
document.addEventListener("keydown", (e) => { if (e.key === "Escape") setSidebarOpen(false); });

window.addEventListener("hashchange", route);
route();