(function () {
    var STATUS = document.getElementById("latest-status");
    var GRID   = document.getElementById("story-grid");

    function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, function (ch) {
            var map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
            return map[ch];
        });
    }

    function truncate(text, max) {
        if (!text) return "";
        text = String(text);
        return text.length > max ? text.slice(0, max) + "…" : text;
    }

    function formatDate(value) {
        if (!value) return "";
        var d = new Date(value);
        return isNaN(d.getTime()) ? "" : escapeHtml(d.toLocaleDateString());
    }

    function storyCard(story) {
        var tags = Array.isArray(story.tags)
            ? story.tags.map(function (t) {
                  return '<span class="story-tag">' + escapeHtml(t) + "</span>";
              }).join("")
            : "";

        return (
            '<div class="story-card">' +
            '<h3 class="story-title">' + escapeHtml(story.title) + "</h3>" +
            '<div class="story-meta">' +
            '<span class="story-cat">' + escapeHtml(story.category) + "</span>" +
            tags +
            (formatDate(story.created_at)
                ? '<span class="story-date">' + formatDate(story.created_at) + "</span>"
                : "") +
            "</div>" +
            '<p class="story-excerpt">' + escapeHtml(truncate(story.content, 200)) + "</p>" +
            "</div>"
        );
    }

    async function loadLatest() {
        STATUS.textContent = "Loading stories\u2026";

        try {
            var response = await fetch("/stories/latest");

            if (!response.ok) {
                throw new Error("REQUEST");
            }

            var stories = await response.json();

            if (!Array.isArray(stories) || stories.length === 0) {
                STATUS.textContent = "";
                GRID.innerHTML = '<p class="story-empty">No stories yet. Be the first to share yours.</p>';
                return;
            }

            STATUS.textContent = "";
            GRID.innerHTML = stories.map(storyCard).join("");
        } catch (e) {
            STATUS.textContent = "";
            GRID.innerHTML = '<p class="story-empty">Could not load stories right now.</p>';
        }
    }

    loadLatest();
})();