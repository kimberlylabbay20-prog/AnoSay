const TOKEN_KEY = "anosay_access_token";

const STATUS = document.getElementById("stories-status");
const GRID = document.getElementById("story-grid");
const TAB_BUTTONS = document.querySelectorAll(".tab");

const TAB_SOURCES = {
    pending: "/admin/stories/pending",
    approved: "/admin/stories/approved",
    rejected: "/admin/stories/rejected",
};

let currentTab = "pending";

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (ch) {
        const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
        return map[ch];
    });
}

function setStatus(message) {
    STATUS.textContent = message;
}

function requireToken() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
        window.location.href = "/ui/admin/login";
        return null;
    }
    return token;
}

async function api(url, method) {
    const token = requireToken();
    if (!token) {
        throw new Error("UNAUTHORIZED");
    }

    const response = await fetch(url, {
        method: method || "GET",
        headers: { Authorization: "Bearer " + token },
    });

    if (response.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        window.location.href = "/ui/admin/login";
        throw new Error("UNAUTHORIZED");
    }
    if (response.status === 403) {
        throw new Error("FORBIDDEN");
    }
    if (!response.ok) {
        throw new Error("REQUEST");
    }

    return response.json();
}

function truncate(text, max) {
    return text.length > max ? text.slice(0, max) + "\u2026" : text;
}

function storyCard(story, tab) {
    const tags = Array.isArray(story.tags)
        ? story.tags.map(function (t) { return '<span class="story-tag">' + escapeHtml(t) + "</span>"; }).join("")
        : "";

    let dateText = "";
    if (story.created_at) {
        const date = new Date(story.created_at);
        dateText = isNaN(date.getTime()) ? "" : escapeHtml(date.toLocaleDateString());
    }

    let actions = "";
    if (tab === "pending") {
        actions =
            '<button class="story-action approve" data-action="approve" data-id="' + escapeHtml(story.id) + '">Approve</button>' +
            '<button class="story-action reject" data-action="reject" data-id="' + escapeHtml(story.id) + '">Reject</button>' +
            '<button class="story-action delete" data-action="delete" data-id="' + escapeHtml(story.id) + '">Delete</button>';
    } else {
        actions =
            '<button class="story-action delete" data-action="delete" data-id="' + escapeHtml(story.id) + '">Delete</button>';
    }

    return (
        '<div class="story-card">' +
        '<h3 class="story-title">' + escapeHtml(story.title) + "</h3>" +
        '<div class="story-meta">' +
        '<span class="story-category">' + escapeHtml(story.category) + "</span>" +
        (dateText ? '<span class="story-date">' + dateText + "</span>" : "") +
        "</div>" +
        "<p class=\"story-preview\">" + escapeHtml(truncate(story.content || "", 140)) + "</p>" +
        (tags ? '<div class="story-tags">' + tags + "</div>" : "") +
        '<div class="story-actions">' + actions + "</div>" +
        "</div>"
    );
}

async function loadTab(tab) {
    currentTab = tab;

    TAB_BUTTONS.forEach(function (button) {
        button.classList.toggle("active", button.dataset.tab === tab);
    });

    setStatus("Loading " + tab + " stories\u2026");

    try {
        const stories = await api(TAB_SOURCES[tab]);
        setStatus("");

        if (!Array.isArray(stories) || stories.length === 0) {
            GRID.innerHTML = '<p class="story-empty">No ' + tab + " stories.</p>";
            return;
        }

        GRID.innerHTML = stories.map(function (story) { return storyCard(story, tab); }).join("");
    } catch (error) {
        if (error.message === "FORBIDDEN") {
            setStatus("Admin access required");
        } else if (error.message !== "UNAUTHORIZED") {
            setStatus("Could not load " + tab + " stories.");
        }
    }
}

GRID.addEventListener("click", async function (event) {
    const button = event.target.closest(".story-action");
    if (!button) return;

    const id = button.dataset.id;
    const action = button.dataset.action;
    const token = requireToken();
    if (!token) return;

    const urlMap = {
        approve: "/admin/stories/" + id + "/approve",
        reject: "/admin/stories/" + id + "/reject",
        delete: "/admin/stories/" + id,
    };

    const methodMap = { approve: "PUT", reject: "PUT", delete: "DELETE" };

    try {
        const response = await fetch(urlMap[action], {
            method: methodMap[action],
            headers: { Authorization: "Bearer " + token },
        });

        if (response.status === 401) {
            localStorage.removeItem(TOKEN_KEY);
            window.location.href = "/ui/admin/login";
            return;
        }
        if (response.status === 403) {
            setStatus("Admin access required");
            return;
        }
        if (!response.ok) {
            setStatus("Could not " + action + " story.");
            return;
        }

        setStatus("Story " + action + "d.");
        await loadTab(currentTab);
    } catch (error) {
        setStatus("Network error. Could not " + action + " story.");
    }
});

TAB_BUTTONS.forEach(function (button) {
    button.addEventListener("click", function () {
        loadTab(button.dataset.tab);
    });
});

loadTab("pending");