const TOKEN_KEY = "anosay_access_token";
const STATUS = document.getElementById("dashboard-status");

const COUNT_TARGETS = {
    pending: document.querySelector('[data-count="pending"]'),
    approved: document.querySelector('[data-count="approved"]'),
    reports: document.querySelector('[data-count="reports"]'),
};

const COUNT_SOURCES = {
    pending: "/admin/stories/pending",
    approved: "/admin/stories/approved",
    reports: "/admin/reports",
};

function setStatus(message) {
    STATUS.textContent = message;
}

function setLoadingState() {
    setStatus("Loading dashboard data...");
    for (const key in COUNT_TARGETS) {
        COUNT_TARGETS[key].textContent = "\u2026";
    }
}

async function fetchCount(url, token) {
    const response = await fetch(url, {
        headers: { Authorization: "Bearer " + token },
    });

    if (response.status === 401) {
        return "UNAUTHORIZED";
    }
    if (response.status === 403) {
        return "FORBIDDEN";
    }
    if (!response.ok) {
        return "ERROR";
    }

    const data = await response.json();
    return Array.isArray(data) ? data.length : 0;
}

async function loadDashboard() {
    const token = localStorage.getItem(TOKEN_KEY);

    if (!token) {
        setStatus("Admin sign-in required");
        return;
    }

    let finishedState = "";
    setLoadingState();

    for (const key in COUNT_SOURCES) {
        const result = await fetchCount(COUNT_SOURCES[key], token);

        if (result === "UNAUTHORIZED") {
            localStorage.removeItem(TOKEN_KEY);
            setStatus("Admin sign-in required");
            return;
        }
        if (result === "FORBIDDEN") {
            setStatus("Admin access required");
            return;
        }
        if (result === "ERROR") {
            finishedState = "Could not load some dashboard data";
            continue;
        }

        COUNT_TARGETS[key].textContent = String(result);
    }

    setStatus(finishedState);
}

loadDashboard();