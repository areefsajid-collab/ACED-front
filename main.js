const subjectNote = document.querySelector(".subject-note");
const subjectButtons = document.querySelectorAll(".subject-btn");
const socialButtons = document.querySelectorAll(".social-btn");
const hamburgerBtn = document.querySelector(".hamburger-btn");
const sidebar = document.querySelector(".sidebar");
const overlay = document.querySelector(".sidebar-overlay");
const sidebarLinks = document.querySelectorAll(".sidebar-link");
const pageViews = document.querySelectorAll(".page-view");

const subjectLabels = {
    maths: "Maths",
    english: "English",
    science: "Science",
    urdu: "Urdu"
};

const subjectColors = {
    maths: "#3B82F6",
    english: "#FF6B6B",
    science: "#10B981",
    urdu: "#8B5CF6"
};

function navigateTo(viewName, pushToHistory = true) {
    pageViews.forEach((view) => {
        const isActive = view.dataset.view === viewName;
        view.classList.toggle("is-active", isActive);
        view.hidden = !isActive;
    });

    sidebarLinks.forEach((link) => {
        link.classList.toggle("is-active", link.dataset.view === viewName);
    });

    subjectButtons.forEach((btn) => {
        btn.classList.toggle("is-selected", btn.dataset.subject === viewName);
    });

    if (pushToHistory) {
        history.pushState({ view: viewName }, "", `#${viewName}`);
    }

    setSidebarOpen(false);
}

window.addEventListener("popstate", (event) => {
    if (event.state && event.state.view) {
        navigateTo(event.state.view, false);
    } else {
        const viewFromHash = location.hash.replace("#", "") || "home";
        navigateTo(viewFromHash, false);
    }
});

window.addEventListener("DOMContentLoaded", () => {
    const initialView = location.hash.replace("#", "") || "home";
    navigateTo(initialView, false);
    history.replaceState({ view: initialView }, "", `#${initialView}`);
});

function setSidebarOpen(open) {
    sidebar.classList.toggle("is-open", open);
    sidebar.setAttribute("aria-hidden", String(!open));
    hamburgerBtn.setAttribute("aria-expanded", String(open));
    hamburgerBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    overlay.hidden = !open;
}

hamburgerBtn.addEventListener("click", () => {
    setSidebarOpen(!sidebar.classList.contains("is-open"));
});

overlay.addEventListener("click", () => setSidebarOpen(false));

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        setSidebarOpen(false);
    }
});

sidebarLinks.forEach((link) => {
    link.addEventListener("click", () => {
        const viewName = link.dataset.view;
        navigateTo(viewName);
    });
});

subjectButtons.forEach((button, index) => {
    window.setTimeout(() => {
        button.classList.add("is-visible");
    }, 280 + index * 90);

    button.addEventListener("click", (event) => {
        addRipple(button, event);
        const subject = button.dataset.subject;
        const emoji = { maths: "📊", english: "📚", science: "🔬", urdu: "🌍" };
        subjectNote.textContent = `${emoji[subject]} ${subjectLabels[subject]} worksheets await you!`;
        subjectNote.classList.remove("is-shown");
        void subjectNote.offsetWidth;
        subjectNote.classList.add("is-shown");

        window.setTimeout(() => {
            navigateTo(subject);
        }, 600);
    });
});

document.querySelectorAll(".grade-square").forEach((button) => {
    button.addEventListener("click", () => {
        const gradeNumber = button.dataset.grade;
        if (!gradeNumber) return;

        const activeView = document.querySelector(".page-view.is-active");
        const activeSubject = activeView ? activeView.dataset.view : "Subject";
        const formattedSubject = activeSubject.toUpperCase();

        document.getElementById("grade-view-title").textContent = `${formattedSubject} - Grade ${gradeNumber}`;
        document.getElementById("grade-view-description").textContent = "Explore topics and worksheets for this grade.";

        const topicsContainer = document.getElementById("grade-view-topics");
        topicsContainer.innerHTML = "";

        const topicCard = document.createElement("button");
        topicCard.className = "grade-square";
        topicCard.type = "button";
        topicCard.innerHTML = `
            <span class="grade-square-title">Topics Coming Soon</span>
            <span class="grade-square-divider"></span>
            <span class="grade-square-link">View Worksheets →</span>
        `;

        topicCard.addEventListener("click", () => {
            document.getElementById("worksheet-view-title").textContent = "Worksheets";
            document.getElementById("worksheet-view-description").textContent = `Grade ${gradeNumber} ${formattedSubject}`;
            document.getElementById("worksheet-view-message").textContent = "Worksheets will be uploaded here soon! Check back soon.";
            navigateTo("worksheet-view");
        });

        topicsContainer.appendChild(topicCard);
        navigateTo("grade-view");
    });
});

function addRipple(button, event) {
    const circle = document.createElement("span");
    const size = Math.max(button.offsetWidth, button.offsetHeight);
    const bounds = button.getBoundingClientRect();

    circle.className = "ripple";
    circle.style.width = `${size}px`;
    circle.style.height = `${size}px`;
    circle.style.left = `${event.clientX - bounds.left - size / 2}px`;
    circle.style.top = `${event.clientY - bounds.top - size / 2}px`;

    button.appendChild(circle);
    circle.addEventListener("animationend", () => circle.remove());
}