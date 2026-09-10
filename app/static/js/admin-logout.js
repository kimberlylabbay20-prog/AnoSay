(function () {
    var TOKEN_KEY = "anosay_access_token";
    var btn = document.getElementById("logout-btn");
    if (!btn) return;

    btn.addEventListener("click", function () {
        localStorage.removeItem(TOKEN_KEY);
        window.location.href = "/ui/admin/login";
    });
})();
