(function () {
    var form = document.getElementById("submit-form");
    var titleInput = document.getElementById("title");
    var contentInput = document.getElementById("content");
    var categorySelect = document.getElementById("category");
    var tagsInput = document.getElementById("tags");
    var messageEl = document.getElementById("form-message");
    var submitBtn = document.getElementById("submit-btn");
    var clearBtn = document.getElementById("clear-btn");
    var successState = document.getElementById("success-state");

    function showMessage(text, type) {
        messageEl.textContent = text;
        messageEl.className = "form-message " + type;
    }

    function clearMessage() {
        messageEl.textContent = "";
        messageEl.className = "form-message";
    }

    /* ── load categories ── */
    async function loadCategories() {
        try {
            var response = await fetch("/categories/");
            if (!response.ok) return;
            var categories = await response.json();
            if (!Array.isArray(categories)) return;

            categories.forEach(function (cat) {
                var option = document.createElement("option");
                option.value = cat.name;
                option.textContent = cat.name;
                categorySelect.appendChild(option);
            });
        } catch (e) {
            /* categories unavailable — user can still type if needed */
        }
    }

    /* ── form submit ── */
    form.addEventListener("submit", async function (e) {
        e.preventDefault();
        clearMessage();

        var title = titleInput.value.trim();
        var content = contentInput.value.trim();
        var category = categorySelect.value;
        var tagsRaw = tagsInput.value.trim();

        /* validation */
        if (!title) {
            showMessage("Please enter a title.", "error");
            titleInput.focus();
            return;
        }
        if (title.length > 150) {
            showMessage("Title must be 150 characters or fewer.", "error");
            titleInput.focus();
            return;
        }
        if (!content) {
            showMessage("Please write your story.", "error");
            contentInput.focus();
            return;
        }
        if (!category) {
            showMessage("Please choose a category.", "error");
            categorySelect.focus();
            return;
        }

        /* parse tags */
        var tags = [];
        if (tagsRaw) {
            tags = tagsRaw.split(",").map(function (t) { return t.trim(); }).filter(function (t) { return t.length > 0; });
        }

        /* disable button while posting */
        submitBtn.disabled = true;
        submitBtn.textContent = "Submitting\u2026";

        try {
            var response = await fetch("/stories/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: title,
                    content: content,
                    category: category,
                    tags: tags,
                }),
            });

            if (!response.ok) {
                var errorData = await response.json().catch(function () { return null; });
                var detail = (errorData && errorData.detail) ? errorData.detail : "Something went wrong. Please try again.";
                showMessage(detail, "error");
                return;
            }

            /* success */
            form.classList.add("hidden");
            successState.classList.remove("hidden");

        } catch (err) {
            showMessage("Network error. Please check your connection and try again.", "error");
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = "Submit Story";
        }
    });

    /* ── clear button ── */
    clearBtn.addEventListener("click", function () {
        form.reset();
        clearMessage();
    });

    /* ── init ── */
    loadCategories();
})();
