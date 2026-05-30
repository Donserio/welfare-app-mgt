// Application Router, Theme Controller, and Role Switching Coordinator

document.addEventListener("DOMContentLoaded", () => {
    // 1. Initialize Theme from local storage or system preference
    initTheme();

    // 2. Initialize Routing & Role Coordination
    initRoleSwitcher();
    
    // 3. Setup global event handlers
    setupGlobalEvents();

    // 4. Setup mobile drawer navigation
    initMobileNav();
});

// Theme Logic
function initTheme() {
    const savedTheme = localStorage.getItem("lajna_theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
    updateThemeIcon(savedTheme);

    const themeToggle = document.getElementById("theme-toggle");
    themeToggle.addEventListener("click", () => {
        const currentTheme = document.documentElement.getAttribute("data-theme");
        const newTheme = currentTheme === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", newTheme);
        localStorage.setItem("lajna_theme", newTheme);
        updateThemeIcon(newTheme);
    });
}

function updateThemeIcon(theme) {
    const icon = document.getElementById("theme-icon");
    if (theme === "dark") {
        icon.className = "fa-solid fa-sun";
    } else {
        icon.className = "fa-solid fa-moon";
    }
}

// Role Switcher & Sidebar Navigation Builder
function initRoleSwitcher() {
    const selector = document.getElementById("role-selector-dropdown");
    const activeRole = WelfareStore.getActiveRole();
    selector.value = activeRole;

    // Trigger initial render for active role
    switchRoleContext(activeRole);

    selector.addEventListener("change", (e) => {
        const newRole = e.target.value;
        WelfareStore.setActiveRole(newRole);
        switchRoleContext(newRole);
    });
}

function switchRoleContext(roleString) {
    // 1. Fetch details about active role
    const ctx = WelfareStore.getCurrentContext();

    // 2. Update Header Profile Card
    document.getElementById("user-name").textContent = ctx.userName;
    document.getElementById("user-role-label").textContent = ctx.roleTitle;
    document.getElementById("user-avatar").textContent = ctx.userName.charAt(0);
    document.getElementById("user-avatar").title = `${ctx.userName} (${ctx.districtName || ctx.regionName})`;

    // 3. Build Sidebar Navigation Links dynamically
    buildSidebarMenu(ctx);

    // 4. Reset views (hide all, show the active home view for the role)
    let initialView = "district-dashboard-view";
    if (ctx.role === "region") {
        initialView = "regional-dashboard-view";
    } else if (ctx.role === "national") {
        initialView = "national-dashboard-view";
    }

    // 5. Navigate to initial view
    navigateTo(initialView);

    // 6. Trigger data refreshes in dashboards and views
    if (window.WelfareDashboard) window.WelfareDashboard.refresh();
    if (window.WelfareReports) window.WelfareReports.refresh();
    if (window.WelfareBeneficiaries) window.WelfareBeneficiaries.refresh();
}

function buildSidebarMenu(ctx) {
    const menuContainer = document.getElementById("sidebar-menu-items");
    menuContainer.innerHTML = ""; // Clear existing

    const menuConfigs = {
        district: [
            { id: "district-dashboard-view", label: "Dashboard", icon: "fa-gauge-high" },
            { id: "report-submission-view", label: "Submit Report", icon: "fa-file-circle-plus" },
            { id: "beneficiaries-view", label: "Beneficiary Registry", icon: "fa-id-card" }
        ],
        region: [
            { id: "regional-dashboard-view", label: "Dashboard", icon: "fa-chart-simple" },
            { id: "reports-directory-view", label: "All District Submissions", icon: "fa-folder-tree" },
            { id: "supplementary-reports-view", label: "Supplementary Reports", icon: "fa-folder-plus" },
            { id: "beneficiaries-view", label: "Beneficiary Directory", icon: "fa-id-card" }
        ],
        national: [
            { id: "national-dashboard-view", label: "Dashboard", icon: "fa-globe" },
            { id: "reports-directory-view", label: "National Submissions", icon: "fa-folder-tree" },
            { id: "supplementary-reports-view", label: "Supplementary Reports", icon: "fa-folder-plus" },
            { id: "beneficiaries-view", label: "National Beneficiaries", icon: "fa-id-card" }
        ]
    };

    const items = menuConfigs[ctx.role] || menuConfigs.district;

    items.forEach(item => {
        const li = document.createElement("li");
        li.className = "menu-item";
        li.id = `menu-item-${item.id}`;
        
        const a = document.createElement("a");
        a.href = `#${item.id}`;
        a.innerHTML = `<i class="fa-solid ${item.icon}"></i> <span>${item.label}</span>`;
        a.addEventListener("click", (e) => {
            e.preventDefault();
            navigateTo(item.id);
        });

        li.appendChild(a);
        menuContainer.appendChild(li);
    });
}

// Router Navigation Core
function navigateTo(viewId) {
    // 1. Toggle Active Link Class in Sidebar
    const menuItems = document.querySelectorAll(".sidebar-menu .menu-item");
    menuItems.forEach(item => item.classList.remove("active"));
    
    const activeMenuItem = document.getElementById(`menu-item-${viewId}`);
    if (activeMenuItem) {
        activeMenuItem.classList.add("active");
    }

    // 2. Toggle Tab View Display in Main container
    const views = document.querySelectorAll(".page-container > .tab-content");
    views.forEach(view => view.classList.remove("active"));

    const activeView = document.getElementById(viewId);
    if (activeView) {
        activeView.classList.add("active");
    }

    // Close mobile drawer if open
    const sidebar = document.querySelector(".sidebar");
    if (sidebar) {
        sidebar.classList.remove("open");
    }

    // 3. Dynamically set Header title matching views
    const viewTitleMappings = {
        "district-dashboard-view": "District Dashboard",
        "regional-dashboard-view": "Regional Dashboard",
        "national-dashboard-view": "National Administrator",
        "report-submission-view": "Submit Monthly Report",
        "beneficiaries-view": "Beneficiary Database",
        "reports-directory-view": "Welfare Submissions Directory",
        "supplementary-reports-view": "Supplementary Reports Portal"
    };

    const titleElement = document.getElementById("current-view-title");
    titleElement.textContent = viewTitleMappings[viewId] || "Lajna Welfare";

    // 4. Perform actions specific to views
    if (viewId === "report-submission-view" && window.WelfareReports) {
        // Reset or init submission wizard
        window.WelfareReports.initWizard();
    }
    if (viewId === "supplementary-reports-view" && window.WelfareReports) {
        window.WelfareReports.initSupplementaryView();
    }
}

// Global modal triggers and form cancel clicks
function setupGlobalEvents() {
    // Esc key closes modals
    window.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            const openModals = document.querySelectorAll(".modal-overlay.active");
            openModals.forEach(modal => modal.classList.remove("active"));
        }
    });

    // Clicks on modal overlays closes them
    const overlays = document.querySelectorAll(".modal-overlay");
    overlays.forEach(overlay => {
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) {
                overlay.classList.remove("active");
            }
        });
    });
}

// Mobile navigation drawer toggle wire-up
function initMobileNav() {
    const sidebar = document.querySelector(".sidebar");
    const menuToggleBtn = document.getElementById("menu-toggle-btn");
    const menuCloseBtn = document.getElementById("menu-close-btn");

    if (menuToggleBtn && sidebar) {
        menuToggleBtn.addEventListener("click", () => {
            sidebar.classList.add("open");
        });
    }

    if (menuCloseBtn && sidebar) {
        menuCloseBtn.addEventListener("click", () => {
            sidebar.classList.remove("open");
        });
    }

    // Close drawer when clicking outside the sidebar on mobile
    document.addEventListener("click", (e) => {
        if (window.innerWidth <= 768 && sidebar.classList.contains("open")) {
            if (!sidebar.contains(e.target) && !menuToggleBtn.contains(e.target)) {
                sidebar.classList.remove("open");
            }
        }
    });
}

window.navigateTo = navigateTo;
