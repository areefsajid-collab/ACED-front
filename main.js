const subjectNote = document.querySelector(".subject-note");
const subjectButtons = document.querySelectorAll(".subject-btn");
const socialButtons = document.querySelectorAll(".social-btn");
const hamburgerBtn = document.querySelector(".hamburger-btn");
const sidebar = document.querySelector(".sidebar");
const overlay = document.querySelector(".sidebar-overlay");
const sidebarLinks = document.querySelectorAll(".sidebar-link");
const pageViews = document.querySelectorAll(".page-view");

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

        sidebarLinks.forEach((other) => other.classList.toggle("is-active", other === link));
        pageViews.forEach((view) => {
            const isActive = view.dataset.view === viewName;
            view.classList.toggle("is-active", isActive);
            view.hidden = !isActive;
        });

        setSidebarOpen(false);
    });
});


const subjectLabels = {
    maths: "Maths",
    english: "English",
    science: "Science",
    urdu: "Urdu"
};

subjectButtons.forEach((button, index) => {
    window.setTimeout(() => {
        button.classList.add("is-visible");
    }, 280 + index * 90);

    button.addEventListener("click", (event) => {
        subjectButtons.forEach((other) => other.classList.remove("is-selected"));
        button.classList.add("is-selected");
        addRipple(button, event);

        const subject = button.dataset.subject;
        subjectNote.textContent = `${subjectLabels[subject]} worksheets are coming next.`;
        subjectNote.classList.remove("is-shown");
        void subjectNote.offsetWidth;
        subjectNote.classList.add("is-shown");
    });
});

socialButtons.forEach((link) => {
    link.addEventListener("pointerdown", () => {
        link.classList.add("is-pressed");
    });

    link.addEventListener("pointerup", () => {
        link.classList.remove("is-pressed");
    });

    link.addEventListener("pointerleave", () => {
        link.classList.remove("is-pressed");
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
