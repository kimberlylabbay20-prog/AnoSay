const TOKEN_KEY = "anosay_access_token";

const STATUS = document.getElementById("reports-status");
const LIST = document.getElementById("report-list");

const VALID_STATUSES = ["pending", "reviewed", "dismissed"];

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

async function api(url, method, body) {
    const token = requireToken();
    if (!token) {
        throw new Error("UNAUTHORIZED");
    }

    const headers = { Authorization: "Bearer " + token };
    if (body !== undefined) {
        headers["Content-Type"] = "application/json";
    }

    const response = await fetch(url, {
        method: method || "GET",
        headers: headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (response.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        window.location.href = "/ui/admin/login";
        throw new Error("UNAUTHORIZED");
    }
    if (response.status === 403) {
        throw new Error("FORBIDDEN");
    }
    if (response.status === 404) {
        throw new Error("NOT_FOUND");
    }
    if (!response.ok) {
        throw new Error("REQUEST");
    }

    return response.json();
}

function formatDate(value) {
    if (!value) return "";
    const date = new Date(value);
    return isNaN(date.getTime()) ? "" : escapeHtml(date.toLocaleDateString());
}

function reportCard(report) {
    if (!VALID_STATUSES.includes(report.status)) {
        report.status = "pending";
    }

    const options = VALID_STATUSES.map(function (status) {
        const selected = status === report.status ? " selected" : "";
        return '<option value="' + status + '"' + selected + ">" + status + "</option>";
    }).join("");

    return (
        '<div class="report-card" data-report-id="' + escapeHtml(report.id) + '">' +
        '<div class="report-head">' +
        '<span class="report-id">Report #' + escapeHtml(report.id) + "</span>" +
        '<span class="report-status ' + escapeHtml(report.status) + '">' + escapeHtml(report.status) + "</span>" +
        (formatDate(report.created_at) ? '<span class="report-date">' + formatDate(report.created_at) + "</span>" : "") +
        "</div>" +
        '<div class="report-story">Story ID: ' + escapeHtml(report.story_id) + "</div>" +
        '<p class="report-reason">' + escapeHtml(report.reason) + "</p>" +
        '<div class="report-controls">' +
        '<select class="report-select" data-status-select>' + options + "</select>" +
        '<button class="report-update" data-action="update">Update</button>' +
        "</div>" +
        "</div>"
    );
}

async function loadReports() {
    setStatus("Loading reports\u2026");

    try {
        const reports = await api("/admin/reports");

        if (!Array.isArray(reports) || reports.length === 0) {
            setStatus("");
            LIST.innerHTML = '<p class="report-empty">No reports.</p>';
            return;
        }

        setStatus("");
        LIST.innerHTML = reports.map(reportCard).join("");
    } catch (error) {
        if (error.message === "FORBIDDEN") {
            setStatus("Admin access required");
        } else if (error.message === "NOT_FOUND") {
            setStatus("Reports not found.");
        } else if (error.message !== "UNAUTHORIZED") {
            setStatus("Could not load reports.");
        }
    }
}

LIST.addEventListener("click", async function (event) {
    const button = event.target.closest(".report-update");
    if (!button) return;

    const card = event.target.closest(".report-card");
    const select = card.querySelector(".report-select");
    const reportId = card.dataset.reportId;
    const newStatus = select.value;

    button.disabled = true;

    try {
        await api("/admin/reports/" + reportId, "PUT", { status: newStatus });
        setStatus("Report #" + reportId + " updated.");
        await loadReports();
    } catch (error) {
        if (error.message === "FORBIDDEN") {
            setStatus("Admin access required");
        } else if (error.message === "NOT_FOUND") {
            setStatus("Report not found.");
        } else if (error.message !== "UNAUTHORIZED") {
            setStatus("Could not update report.");
        }
    } finally {
        button.disabled = false;
    }
});

loadReports();