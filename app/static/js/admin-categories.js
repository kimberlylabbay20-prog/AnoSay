const TOKEN_KEY = "anosay_access_token";

const STATUS = document.getElementById("categories-status");
const LIST = document.getElementById("category-list");
const FORM_NOTE = document.getElementById("form-note");
const CREATE_FORM = document.getElementById("create-form");
const NAME_INPUT = document.getElementById("category-name");
const DESC_INPUT = document.getElementById("category-description");

let CATEGORY_CACHE = {};

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (ch) {
        const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
        return map[ch];
    });
}

function setStatus(message) {
    STATUS.textContent = message;
}

function setFormNote(message) {
    FORM_NOTE.textContent = message;
}

function requireToken() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
        window.location.href = "/ui/admin/login";
        return null;
    }
    return token;
}

function errorMessage(responseError, status) {
    if (responseError) return responseError;
    switch (status) {
        case 400:
            return "A category with this name already exists.";
        case 404:
            return "Category not found.";
        case 422:
            return "Invalid category data. Name is required (up to 50 characters) and description can be up to 255 characters.";
        default:
            return null;
    }
}

function parseBody(body) {
    if (!body) return "";
    return String(body.detail !== undefined ? body.detail : body);
}

function apiMessage(status, body) {
    const raw = parseBody(body);
    return errorMessage(raw, status);
}

function parseBody(body) {
    if (!body) return "";
    return String(body.detail !== undefined ? body.detail : body);
}

function apiMessage(status, body) {
    const parsed = parseBody(body);
    const messages = { 400: "A category with this name already exists.", 404: "Category not found.", 422: "Invalid category data. Name is required (up to 50 characters) and description can be up to 255 characters." };
    return messages[status] || parsed;
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
    if (response.status === 400 || response.status === 404 || response.status === 422) {
        const message = await apiMessage(response.status, response.json ? await response.json() : {});
        throw new Error("KNOWN:" + message);
    }
    if (!response.ok) {
        throw new Error("REQUEST");
    }

    return response.json();
}

function categoryCard(category) {
    return (
        '<div class="category-card" data-category-id="' + escapeHtml(category.id) + '">' +
        '<div class="category-head">' +
        '<h3 class="category-name">' + escapeHtml(category.name) + "</h3>" +
        "</div>" +
        '<p class="category-description">' + escapeHtml(category.description || "") + "</p>" +
        '<div class="category-actions">' +
        '<button class="card-btn edit-btn" data-action="edit">Edit</button>' +
        '<button class="card-btn delete-btn" data-action="delete">Delete</button>' +
        "</div>" +
        "</div>"
    );
}

function editForm(category) {
    return (
        '<div class="category-head">' +
        '<label class="form-label" style="margin:0" for="edit-name-' + escapeHtml(category.id) + '">Name</label>' +
        '<input class="form-input edit-name" id="edit-name-' + escapeHtml(category.id) + '" type="text" maxlength="50" value="' + escapeHtml(category.name) + '">' +
        '<label class="form-label" style="margin:0" for="edit-desc-' + escapeHtml(category.id) + '">Description</label>' +
        '<input class="form-input edit-desc" id="edit-desc-' + escapeHtml(category.id) + '" type="text" maxlength="255" value="' + escapeHtml(category.description || "") + '">' +
        "</div>" +
        '<p class="category-description edit-note"></p>' +
        '<div class="category-actions">' +
        '<button class="card-btn save-btn" data-action="save">Save</button>' +
        '<button class="card-btn cancel-btn" data-action="cancel">Cancel</button>' +
        "</div>"
    );
}

async function loadCategories() {
    setStatus("Loading categories\u2026");

    let categories;
    try {
        categories = await api("/categories/");
    } catch (error) {
        if (error.message === "FORBIDDEN") {
            setStatus("Admin access required");
        } else if (error.message !== "UNAUTHORIZED" && !error.message.startsWith("KNOWN:")) {
            setStatus("Could not load categories.");
        } else if (error.message.startsWith("KNOWN:")) {
            setStatus(error.message.slice(6));
        }
        return;
    }

    if (!Array.isArray(categories) || categories.length === 0) {
        setStatus("");
        LIST.innerHTML = '<p class="category-empty">No categories yet.</p>';
        return;
    }

    setStatus("");
    CATEGORY_CACHE = {};
    categories.forEach(function (category) {
        CATEGORY_CACHE[String(category.id)] = category;
    });
    LIST.innerHTML = categories.map(categoryCard).join("");
}

CREATE_FORM.addEventListener("submit", async function (event) {
    event.preventDefault();

    const name = NAME_INPUT.value.trim();
    const description = DESC_INPUT.value.trim();

    if (!name) {
        setFormNote("Please enter a category name.");
        return;
    }

    setFormNote("");
    const button = CREATE_FORM.querySelector(".create-btn");
    button.disabled = true;

    try {
        await api("/categories/", "POST", { name: name, description: description || null });
        setFormNote("Category created.");
        NAME_INPUT.value = "";
        DESC_INPUT.value = "";
        await loadCategories();
    } catch (error) {
        if (error.message === "FORBIDDEN") {
            setFormNote("Admin access required");
        } else if (error.message.startsWith("KNOWN:")) {
            setFormNote(error.message.slice(6));
        } else if (error.message !== "UNAUTHORIZED") {
            setFormNote("Could not create category.");
        }
    } finally {
        button.disabled = false;
    }
});

LIST.addEventListener("click", async function (event) {
    const button = event.target.closest(".card-btn");
    if (!button) return;

    const card = event.target.closest(".category-card");
    const categoryId = card.dataset.categoryId;
    const action = button.dataset.action;

    if (action === "edit") {
        const category = CATEGORY_CACHE[categoryId];
        card.innerHTML = category ? editForm(category) : "";
        return;
    }

    if (action === "cancel") {
        await loadCategories();
        return;
    }

    if (action === "save") {
        const name = card.querySelector(".edit-name").value.trim();
        const description = card.querySelector(".edit-desc").value.trim();
        const note = card.querySelector(".edit-note");

        if (!name) {
            note.textContent = "Please enter a category name.";
            return;
        }

        button.disabled = true;
        try {
            await api("/categories/" + categoryId, "PUT", { name: name, description: description || null });
            setStatus("Category updated.");
            await loadCategories();
        } catch (error) {
            if (error.message === "FORBIDDEN") {
                note.textContent = "Admin access required";
            } else if (error.message.startsWith("KNOWN:")) {
                note.textContent = error.message.slice(6);
            } else if (error.message !== "UNAUTHORIZED") {
                note.textContent = "Could not update category.";
            }
        } finally {
            button.disabled = false;
        }
        return;
    }

    if (action === "delete") {
        button.disabled = true;
        try {
            await api("/categories/" + categoryId, "DELETE");
            setStatus("Category deleted.");
            await loadCategories();
        } catch (error) {
            if (error.message === "FORBIDDEN") {
                setStatus("Admin access required");
            } else if (error.message.startsWith("KNOWN:")) {
                setStatus(error.message.slice(6));
            } else if (error.message !== "UNAUTHORIZED") {
                setStatus("Could not delete category.");
            }
        } finally {
            button.disabled = false;
        }
    }
});

loadCategories();