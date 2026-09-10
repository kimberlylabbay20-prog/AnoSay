const TOKEN_KEY = "anosay_access_token";

const LOGIN_FORM = document.getElementById("login-form");
const ERROR_AREA = document.getElementById("login-error");

function showError(message) {
    ERROR_AREA.textContent = message;
    ERROR_AREA.style.display = "block";
}

function clearError() {
    ERROR_AREA.textContent = "";
    ERROR_AREA.style.display = "none";
}

LOGIN_FORM.addEventListener("submit", async function (event) {
    event.preventDefault();
    clearError();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const submitButton = LOGIN_FORM.querySelector("button[type='submit']");

    if (!username || !password) {
        showError("Please enter both username and password.");
        return;
    }

    submitButton.disabled = true;

    try {
        const response = await fetch("/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: username, password: password }),
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem(TOKEN_KEY, data.access_token);
            window.location.href = "/ui/admin/dashboard";
            return;
        }

        if (response.status === 401) {
            showError("Invalid username or password.");
        } else {
            showError("Something went wrong. Please try again.");
        }
    } catch (error) {
        showError("Network error. Please try again.");
    } finally {
        submitButton.disabled = false;
    }
});