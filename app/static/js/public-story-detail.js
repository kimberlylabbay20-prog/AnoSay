(function () {
    var storyView = document.getElementById("story-view");
    var notFoundView = document.getElementById("not-found-view");
    var statusLine = document.getElementById("status-line");
    var reportBtn = document.getElementById("report-btn");
    var reportModal = document.getElementById("report-modal");
    var reportForm = document.getElementById("report-form");
    var reportReason = document.getElementById("report-reason");
    var reportMessage = document.getElementById("report-message");
    var reportCancel = document.getElementById("report-cancel");
    var reportSubmit = document.getElementById("report-submit");

    var storyId = window.location.pathname.split("/").filter(Boolean).pop() || "";

    function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, function (ch) {
            var map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
            return map[ch];
        });
    }

    function formatDate(value) {
        if (!value) return "";
        var d = new Date(value);
        return isNaN(d.getTime()) ? "" : escapeHtml(d.toLocaleDateString());
    }

    function setStatus(message, type) {
        statusLine.textContent = message;
        statusLine.className = "status-line" + (type ? " " + type : "");
    }

    function clearStatus() {
        statusLine.textContent = "";
        statusLine.className = "status-line";
    }

    function hide(el) { el.classList.add("hidden"); }
    function show(el) { el.classList.remove("hidden"); }

    /* ── render story ── */
    function renderStory(story) {
        document.getElementById("story-title").textContent = story.title;
        document.getElementById("story-category").textContent = story.category;
        document.getElementById("story-content").textContent = story.content;

        var tagsEl = document.getElementById("story-tags");
        if (Array.isArray(story.tags) && story.tags.length > 0) {
            tagsEl.innerHTML = story.tags.map(function (t) {
                return '<span class="story-tag">' + escapeHtml(t) + "</span>";
            }).join("");
        } else {
            tagsEl.innerHTML = "";
        }

        document.getElementById("story-date").textContent = formatDate(story.created_at);
        document.title = story.title + " | AnoSay";

        hide(notFoundView);
        show(storyView);
        setStatus("");
    }

    async function loadStory() {
        if (!storyId) {
            show(notFoundView);
            return;
        }

        setStatus("Loading story\u2026");

        try {
            var response = await fetch("/stories/" + encodeURIComponent(storyId));
            if (!response.ok) {
                hide(storyView);
                show(notFoundView);
                if (response.status === 400) {
                    setStatus("That story ID is not valid.", "error");
                } else {
                    setStatus(response.status === 404 ? "" : "Could not load this story.", "error");
                }
                return;
            }
            var story = await response.json();
            renderStory(story);
        } catch (e) {
            hide(storyView);
            show(notFoundView);
            setStatus("Network error. Please try again.", "error");
        }
    }

    /* ── report modal ── */
    function openReport() {
        reportMessage.textContent = "";
        reportMessage.className = "report-message";
        reportReason.value = "";
        reportSubmit.disabled = false;
        reportSubmit.textContent = "Submit Report";
        show(reportModal);
        reportReason.focus();
    }

    function closeReport() {
        hide(reportModal);
    }

    reportBtn.addEventListener("click", openReport);
    reportCancel.addEventListener("click", closeReport);

    reportModal.addEventListener("click", function (e) {
        if (e.target === reportModal) closeReport();
    });

    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") closeReport();
    });

    /* ── report submit ── */
    reportForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        reportMessage.textContent = "";
        reportMessage.className = "report-message";

        var reason = reportReason.value.trim();

        if (reason.length < 5) {
            reportMessage.textContent = "Reason must be at least 5 characters.";
            reportMessage.className = "report-message error";
            reportReason.focus();
            return;
        }
        if (reason.length > 500) {
            reportMessage.textContent = "Reason must be 500 characters or fewer.";
            reportMessage.className = "report-message error";
            reportReason.focus();
            return;
        }

        reportSubmit.disabled = true;
        reportSubmit.textContent = "Submitting\u2026";

        try {
            var response = await fetch("/stories/" + encodeURIComponent(storyId) + "/reports", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason: reason }),
            });

            if (response.status === 400) {
                reportMessage.textContent = "Invalid story. The report could not be submitted.";
                reportMessage.className = "report-message error";
                return;
            }
            if (response.status === 404) {
                reportMessage.textContent = "This story no longer exists.";
                reportMessage.className = "report-message error";
                return;
            }
            if (!response.ok) {
                reportMessage.textContent = "Could not submit the report. Please try again.";
                reportMessage.className = "report-message error";
                return;
            }

            closeReport();
            setStatus("Report submitted. Thank you for helping keep AnoSay respectful.", "success");
        } catch (err) {
            reportMessage.textContent = "Network error. Please try again.";
            reportMessage.className = "report-message error";
        } finally {
            reportSubmit.disabled = false;
            reportSubmit.textContent = "Submit Report";
        }
    });

    /* ── init ── */
    loadStory();
})();