// Application Router, Theme Controller, and Role Switching Coordinator

document.addEventListener("DOMContentLoaded", async () => {
    // 0. Set dropdown defaults dynamically based on current date
    initializeDropdownDefaults();

    // 0.1 Dynamic template interpolation of period placeholders
    interpolatePeriodTemplates();

    // 1. Initialize Theme from local storage or system preference
    initTheme();

    // Wait for store initialization (which fetches serverless credentials and connects to Supabase backend)
    if (window.WelfareStore && window.WelfareStore.initPromise) {
        try {
            await window.WelfareStore.initPromise;
        } catch (e) {
            console.error("Error waiting for WelfareStore initialization:", e);
        }
    }

    // 2. Initialize Routing & Role Coordination
    initRoleSwitcher();
    
    // 3. Setup global event handlers
    setupGlobalEvents();

    // 4. Setup mobile drawer navigation
    initMobileNav();

    // 5. Setup Supabase UI panel listeners
    initSupabaseUI();

    // 6. Setup Login UI listeners
    initLoginUI();

    // 7. Verify current login state
    checkLoginState();
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
    const regionSelect = document.getElementById("role-simulator-region-select");
    const districtSelect = document.getElementById("role-simulator-district-select");
    if (!regionSelect || !districtSelect) return;

    const activeRole = WelfareStore.getActiveRole();

    // 1. Build and synchronize selectors on load
    buildSimulationSelectors(activeRole);

    // 2. Trigger initial render
    switchRoleContext(activeRole);

    // 3. Register Event Listeners
    regionSelect.addEventListener("change", (e) => {
        const val = e.target.value;
        if (val === "national") {
            WelfareStore.setActiveRole("national");
            updateDistrictSelect("national");
            switchRoleContext("national");
        } else {
            // Default to region level when region changes
            updateDistrictSelect(val, "region-level");
            WelfareStore.setActiveRole(val);
            switchRoleContext(val);
        }
    });

    districtSelect.addEventListener("change", (e) => {
        const val = e.target.value;
        if (val === "region-level") {
            const regId = regionSelect.value;
            WelfareStore.setActiveRole(regId);
            switchRoleContext(regId);
        } else {
            WelfareStore.setActiveRole(val);
            switchRoleContext(val);
        }
    });
}

function buildSimulationSelectors(activeRole) {
    const regionSelect = document.getElementById("role-simulator-region-select");
    const districtSelect = document.getElementById("role-simulator-district-select");
    if (!regionSelect || !districtSelect) return;

    // 1. Populate Region dropdown
    regionSelect.innerHTML = "";
    
    // Add National option
    const natOpt = document.createElement("option");
    natOpt.value = "national";
    natOpt.textContent = "National Administrator";
    regionSelect.appendChild(natOpt);

    // Add all regions from database
    const regions = WelfareStore.getRegions();
    regions.forEach(r => {
        const opt = document.createElement("option");
        opt.value = r.id;
        opt.textContent = r.name;
        regionSelect.appendChild(opt);
    });

    // 2. Determine current active state
    let activeRegion = "national";
    let activeDistrictVal = "region-level";

    if (activeRole && activeRole !== "national") {
        if (activeRole.startsWith("region-")) {
            activeRegion = activeRole;
            activeDistrictVal = "region-level";
        } else if (activeRole.startsWith("district-")) {
            // Find region of this district
            const distId = activeRole.replace("district-", "dist-");
            const district = WelfareStore.getDistricts().find(d => d.id === distId);
            if (district) {
                activeRegion = district.regionId;
                activeDistrictVal = activeRole;
            }
        }
    }

    // Set value on region dropdown
    regionSelect.value = activeRegion;

    // 3. Populate district dropdown based on active region
    updateDistrictSelect(activeRegion, activeDistrictVal);
}

function updateDistrictSelect(regionId, selectedDistrictVal) {
    const districtSelect = document.getElementById("role-simulator-district-select");
    if (!districtSelect) return;

    if (regionId === "national") {
        districtSelect.style.display = "none";
        districtSelect.innerHTML = "";
        return;
    }

    districtSelect.innerHTML = "";
    
    // Default option: view region level
    const regionLevelOpt = document.createElement("option");
    regionLevelOpt.value = "region-level";
    regionLevelOpt.textContent = "Region Level (View)";
    districtSelect.appendChild(regionLevelOpt);

    // Populate all districts for this region
    const districts = WelfareStore.getDistrictsByRegion(regionId);
    districts.forEach(d => {
        const opt = document.createElement("option");
        opt.value = `district-${d.id.replace("dist-", "")}`;
        opt.textContent = `District: ${d.name}`;
        districtSelect.appendChild(opt);
    });

    // Show it
    districtSelect.style.display = "inline-block";
    
    // Set selected value
    if (selectedDistrictVal) {
        districtSelect.value = selectedDistrictVal;
    }
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
            { id: "reports-history-view", label: "Report History", icon: "fa-history" },
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

    // Add logout item dynamically if Supabase is connected
    if (WelfareStore.isSupabaseEnabled) {
        const li = document.createElement("li");
        li.className = "menu-item";
        li.style.marginTop = "auto";
        
        const a = document.createElement("a");
        a.href = "#logout";
        a.innerHTML = `<i class="fa-solid fa-right-from-bracket" style="color: var(--danger);"></i> <span style="color: var(--danger); font-weight: 600;">Sign Out</span>`;
        a.addEventListener("click", (e) => {
            e.preventDefault();
            if (confirm("Are you sure you want to sign out?")) {
                WelfareStore.logoutUser();
            }
        });
        li.appendChild(a);
        menuContainer.appendChild(li);
    }
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
        "reports-history-view": "Report Submission History",
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
    if (viewId === "reports-history-view" && window.WelfareDashboard) {
        window.WelfareDashboard.renderHistoryTable();
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

function interpolatePeriodTemplates() {
    const now = new Date();
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const currentMonthName = months[now.getMonth()];
    const currentYear = now.getFullYear();
    const periodText = `${currentMonthName} ${currentYear}`;

    function walk(node) {
        if (node.nodeType === 3) { // Text node
            if (node.nodeValue.includes("${currentMonthName} ${currentYear}")) {
                node.nodeValue = node.nodeValue.replace(/\${currentMonthName} \${currentYear}/g, periodText);
            }
        } else if (node.nodeType === 1) { // Element node
            for (let child of node.childNodes) {
                walk(child);
            }
        }
    }
    walk(document.body);
}

function initializeDropdownDefaults() {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const pairs = [
        ["reg-filter-month", "reg-filter-year"],
        ["nat-filter-month", "nat-filter-year"],
        ["dir-filter-month", "dir-filter-year"],
        ["supp-form-month", "supp-form-year"],
        ["form-info-month", "form-info-year"]
    ];

    pairs.forEach(([mId, yId]) => {
        const mEl = document.getElementById(mId);
        const yEl = document.getElementById(yId);
        if (mEl) mEl.value = String(currentMonth);
        if (yEl) yEl.value = String(currentYear);
    });
}

window.navigateTo = navigateTo;

function initSupabaseUI() {
    const dbToggle = document.getElementById("db-config-toggle");
    const dbModal = document.getElementById("supabase-modal");
    const closeBtn = document.getElementById("close-supabase-modal");
    const configForm = document.getElementById("supabase-config-form");
    const disconnectBtn = document.getElementById("supabase-disconnect-btn");
    const urlInput = document.getElementById("supabase-url-input");
    const keyInput = document.getElementById("supabase-key-input");
    const statusDiv = document.getElementById("supabase-connection-status");
    const dbIcon = document.getElementById("db-status-icon");

    if (!dbToggle || !dbModal) return;

    // Toggle Modal
    dbToggle.addEventListener("click", () => {
        urlInput.value = localStorage.getItem("lajna_supabase_url") || "";
        keyInput.value = localStorage.getItem("lajna_supabase_key") || "";
        statusDiv.style.display = "none";
        
        if (WelfareStore.isSupabaseEnabled) {
            disconnectBtn.style.display = "inline-block";
        } else {
            disconnectBtn.style.display = "none";
        }
        dbModal.classList.add("active");
    });

    // Close Modal on Esc or overlay click (rely on app.js global events for .modal-overlay)
    closeBtn.addEventListener("click", () => {
        dbModal.classList.remove("active");
    });

    // Handle Connect
    configForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const url = urlInput.value.trim();
        const key = keyInput.value.trim();

        statusDiv.style.display = "block";
        statusDiv.style.background = "var(--bg-alt)";
        statusDiv.style.color = "var(--text)";
        statusDiv.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Connecting to Supabase...`;

        try {
            await WelfareStore.initSupabase(url, key);

            // Connection success
            localStorage.setItem("lajna_supabase_url", url);
            localStorage.setItem("lajna_supabase_key", key);

            statusDiv.style.background = "rgba(5, 150, 105, 0.1)";
            statusDiv.style.color = "var(--success)";
            statusDiv.innerHTML = `<i class="fa-solid fa-circle-check"></i> Connected! Synchronizing datastore...`;

            // Update UI status icon
            dbIcon.style.color = "var(--success)";
            dbIcon.title = "Connected to Supabase PostgreSQL Database";

            checkLoginState();

            setTimeout(() => {
                dbModal.classList.remove("active");
            }, 1200);

        } catch (err) {
            statusDiv.style.background = "rgba(220, 38, 38, 0.1)";
            statusDiv.style.color = "var(--danger)";
            statusDiv.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Connection failed: ${err.message}. Ensure your schema is built.`;
        }

    });

    // Handle Disconnect
    disconnectBtn.addEventListener("click", () => {
        localStorage.removeItem("lajna_supabase_url");
        localStorage.removeItem("lajna_supabase_key");
        
        WelfareStore.supabaseClient = null;
        WelfareStore.isSupabaseEnabled = false;

        dbIcon.style.color = "var(--text-muted)";
        dbIcon.title = "Offline LocalStorage Mock Mode (Click to configure)";
        
        dbModal.classList.remove("active");
        alert("Switched back to Offline LocalStorage Mock Mode.");
        
        // Refresh active views to display local storage data cache
        if (window.WelfareDashboard) window.WelfareDashboard.refresh();
        checkLoginState();
    });

    // Initial Status Check
    if (WelfareStore.isSupabaseEnabled) {
        dbIcon.style.color = "var(--success)";
        dbIcon.title = "Connected to Supabase PostgreSQL Database";
    } else {
        dbIcon.style.color = "var(--text-muted)";
        dbIcon.title = "Offline LocalStorage Mock Mode (Click to configure)";
    }
}

function checkLoginState() {
    const appContainer = document.getElementById("app-container");
    const loginContainer = document.getElementById("login-container");
    const roleSwitcher = document.querySelector(".role-switcher-container");

    if (WelfareStore.isSupabaseEnabled) {
        const hasSession = localStorage.getItem("lajna_active_session_profile");
        if (hasSession) {
            appContainer.style.display = "flex";
            loginContainer.style.display = "none";
            
            // Build current role context
            const ctx = WelfareStore.getCurrentContext();
            
            // Determine if the logged-in user is a national administrator
            let realUserRole = "district";
            try {
                const prof = JSON.parse(hasSession);
                realUserRole = prof.role;
            } catch (e) {
                console.error("Error parsing user profile session:", e);
            }

            if (realUserRole === "national") {
                if (roleSwitcher) {
                    roleSwitcher.style.display = "flex";
                    // Synchronize selector dropdown values dynamically
                    const activeRole = WelfareStore.getActiveRole();
                    buildSimulationSelectors(activeRole);
                }
            } else {
                if (roleSwitcher) roleSwitcher.style.display = "none";
            }
            
            switchRoleContext(ctx.role);
        } else {
            if (roleSwitcher) roleSwitcher.style.display = "none";
            appContainer.style.display = "none";
            loginContainer.style.display = "flex";
        }
    } else {
        // Show mock switcher in offline mock mode
        if (roleSwitcher) roleSwitcher.style.display = "flex";
        appContainer.style.display = "flex";
        loginContainer.style.display = "none";
    }
}


function initLoginUI() {
    const loginForm = document.getElementById("login-form");
    const emailInput = document.getElementById("login-email");
    const passwordInput = document.getElementById("login-password");
    const errorDiv = document.getElementById("login-error-message");
    const submitBtn = document.getElementById("login-submit-btn");

    if (!loginForm) return;

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        // Reset state
        errorDiv.style.display = "none";
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Signing In...`;

        try {
            await WelfareStore.loginUser(email, password);
            // Clear inputs
            emailInput.value = "";
            passwordInput.value = "";
            checkLoginState();
        } catch (err) {
            errorDiv.textContent = `Login failed: ${err.message}`;
            errorDiv.style.display = "block";
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = "Sign In";
        }
    });
}
