(function () {
    var STATUS = document.getElementById("stories-status");
    var GRID   = document.getElementById("story-grid");
    var SEARCH = document.getElementById("search-input");
    var SEARCH_BTN = document.getElementById("search-btn");
    var CATEGORY = document.getElementById("category-select");
    var LATEST_BTN = document.getElementById("latest-btn");

    function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, function (ch) {
            var map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
            return map[ch];
        });
    }

    function truncate(text, max) {
        if (!text) return "";
        text = String(text);
        return text.length <= max ? text : text.slice(0, max) + "…";
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
            '<div class="story-card" data-story-id="' + escapeHtml(story.id) + '">' +
            '<h3 class="story-title">' + escapeHtml(story.title) + "</h3>" +
            '<div class="story-meta">' +
            '<span class="story-cat">' + escapeHtml(story.category) + "</span>" +
            tags +
            (formatDate(story.created_at)
                ? '<span class="story-date">' + formatDate(story.created_at) + "</span>"
                : "") +
            "</div>" +
            '<p class="story-excerpt" data-full="' + escapeHtml(story.content) + '">' +
            escapeHtml(truncate(story.content, 180)) +
            "</p>" +
            '<button class="btn-readmore" data-action="readmore">Read More</button>' +
            "</div>"
        );
    }

    function renderStories(stories) {
        if (!Array.isArray(stories) || stories.length === 0) {
            STATUS.textContent = "";
            GRID.innerHTML = '<p class="story-empty">No stories found.</p>';
            return;
        }
        STATUS.textContent = "";
        GRID.innerHTML = stories.map(storyCard).join("");
    }

    function setLoading(message) {
        STATUS.textContent = message || "";
        GRID.innerHTML = "";
    }

    async function apiFetch(url) {
        var response = await fetch(url);
        if (!response.ok) throw new Error("REQUEST");
        return response.json();
    }

    /* ── load categories ── */
    async function loadCategories() {
        try {
            var categories = await apiFetch("/categories/");
            if (!Array.isArray(categories)) return;
            categories.forEach(function (cat) {
                var opt = document.createElement("option");
                opt.value = cat.name;
                opt.textContent = cat.name;
                CATEGORY.appendChild(opt);
            });
        } catch (e) {
            /* categories optional, keep default */
        }
    }

    /* ── load stories ── */
    async function loadAll() {
        setLoading("Loading stories\u2026");
        try {
            var stories = await apiFetch("/stories/");
            renderStories(stories);
        } catch (e) {
            setStatus("Could not load stories.");
        }
    }

    async function searchStories(keyword) {
        setLoading("Searching\u2026");
        try {
            var stories = await apiFetch("/stories/search?keyword=" + encodeURIComponent(keyword));
            renderStories(stories);
        } catch (e) {
            setStatus("Could not search stories.");
        }
    }

    async function filterByCategory(category) {
        setLoading("Loading\u2026");
        try {
            var stories = await apiFetch("/stories/category/" + encodeURIComponent(category));
            renderStories(stories);
        } catch (e) {
            setStatus("Could not load stories for this category.");
        }
    }

    async function loadLatest() {
        setLoading("Loading latest\u2026");
        try {
            var stories = await apiFetch("/stories/latest");
            renderStories(stories);
        } catch (e) {
            setStatus("Could not load latest stories.");
        }
    }

    function setStatus(msg) {
        STATUS.textContent = msg;
    }

    /* ── event handlers ── */
    SEARCH.addEventListener("keydown", function (e) {
        if (e.key === "Enter") SEARCH_BTN.click();
    });

    SEARCH_BTN.addEventListener("click", function () {
        var keyword = SEARCH.value.trim();
        if (!keyword) { loadAll(); return; }
        searchStories(keyword);
    });

    CATEGORY.addEventListener("change", function () {
        var value = CATEGORY.value;
        if (!value) { loadAll(); return; }
        filterByCategory(value);
    });

    LATEST_BTN.addEventListener("click", function () {
        SEARCH.value = "";
        CATEGORY.value = "";
        loadLatest();
    });

    GRID.addEventListener("click", function (event) {
        var btn = event.target.closest("[data-action='readmore']");
        if (!btn) return;
        var card = event.target.closest(".story-card");
        var excerpt = card.querySelector(".story-excerpt");
        var full = excerpt.getAttribute("data-full");
        if (!full) return;
        if (btn.textContent === "Read More") {
            excerpt.textContent = full;
            btn.textContent = "Show Less";
        } else {
            excerpt.textContent = truncate(full, 180);
            btn.textContent = "Read More";
        }
    });

    /* ── init ── */
    loadCategories();
    loadAll();
})();