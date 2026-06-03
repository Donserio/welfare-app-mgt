// Dashboard Views, Aggregated Analytics, Review Workflows, and SVG Charting Engine

const WelfareDashboard = {
    activeReportIdInModal: null,

    init() {
        // Form details modal close
        document.getElementById("close-report-modal").addEventListener("click", () => this.closeReportModal());
        
        // Revision feedback submission
        document.getElementById("revision-form").addEventListener("submit", (e) => {
            e.preventDefault();
            this.submitRevisionFeedback();
        });
        document.getElementById("close-revision-modal").addEventListener("click", () => this.closeRevisionModal());
        document.getElementById("cancel-revision-btn").addEventListener("click", () => this.closeRevisionModal());

        // Setup filter change events for Directory View
        document.getElementById("dir-filter-region").addEventListener("change", () => this.renderDirectoryTable());
        document.getElementById("dir-filter-status").addEventListener("change", () => this.renderDirectoryTable());
        document.getElementById("dir-filter-month").addEventListener("change", () => this.renderDirectoryTable());
        document.getElementById("dir-filter-year").addEventListener("change", () => this.renderDirectoryTable());

        // Setup filter change events for Regional Dashboard
        document.getElementById("reg-filter-month").addEventListener("change", () => this.refresh());
        document.getElementById("reg-filter-year").addEventListener("change", () => this.refresh());

        // Setup filter change events for National Dashboard
        document.getElementById("nat-filter-month").addEventListener("change", () => this.refresh());
        document.getElementById("nat-filter-year").addEventListener("change", () => this.refresh());

        // Populating region filter dropdown in Submissions directory
        this.populateRegionFilterDropdown();

        // Export events
        document.getElementById("export-regional-summary-csv").addEventListener("click", () => {
            const ctx = WelfareStore.getCurrentContext();
            const month = parseInt(document.getElementById("reg-filter-month").value) || 5;
            const year = parseInt(document.getElementById("reg-filter-year").value) || 2026;
            WelfareExport.exportRegionalSummaryToCSV(ctx.regionId, month, year);
        });

        // History View filter change events
        document.getElementById("history-filter-status").addEventListener("change", () => this.renderHistoryTable());
        document.getElementById("history-filter-month").addEventListener("change", () => this.renderHistoryTable());
        document.getElementById("history-filter-year").addEventListener("change", () => this.renderHistoryTable());
        
        // Select All listener
        document.getElementById("history-select-all").addEventListener("change", (e) => {
            const checkboxes = document.querySelectorAll(".history-row-checkbox:not(:disabled)");
            checkboxes.forEach(cb => cb.checked = e.target.checked);
            this.toggleHistoryBulkActions();
        });

        // Bulk Delete Action listener
        document.getElementById("history-bulk-delete-btn").addEventListener("click", () => this.deleteSelectedDrafts());

        // Notifications Clear All
        document.getElementById("dist-clear-notifs-btn").addEventListener("click", () => {
            const ctx = WelfareStore.getCurrentContext();
            WelfareStore.clearNotifications(ctx.role, ctx.districtId || ctx.regionId);
            this.renderNotifications();
        });

        // Regional Notifications Clear All
        const regClearBtn = document.getElementById("reg-clear-notifs-btn");
        if (regClearBtn) {
            regClearBtn.addEventListener("click", () => {
                const ctx = WelfareStore.getCurrentContext();
                WelfareStore.clearNotifications(ctx.role, ctx.regionId);
                this.renderNotifications();
            });
        }

        // Enforce chronological boundaries on History filters
        WelfareStore.enforcePeriodLimits("history-filter-month", "history-filter-year");

        // Enforce chronological boundaries on filters
        WelfareStore.enforcePeriodLimits("reg-filter-month", "reg-filter-year");
        WelfareStore.enforcePeriodLimits("nat-filter-month", "nat-filter-year");
        WelfareStore.enforcePeriodLimits("dir-filter-month", "dir-filter-year");

        // User Profile Edit Modal controls
        document.getElementById("close-user-edit-modal").addEventListener("click", () => this.closeUserEditModal());
        document.getElementById("cancel-user-edit-btn").addEventListener("click", () => this.closeUserEditModal());
        document.getElementById("user-edit-form").addEventListener("submit", (e) => {
            e.preventDefault();
            this.saveUserProfileEdit();
        });
        document.getElementById("edit-user-region").addEventListener("change", () => this.updateUserEditDistricts());
        document.getElementById("edit-user-role").addEventListener("change", () => this.adjustUserEditScopeFields());
        document.getElementById("user-search-input").addEventListener("input", () => this.renderUsersDirectory());

        window.WelfareDashboard = this;
    },

    refresh() {
        const ctx = WelfareStore.getCurrentContext();
        
        if (ctx.role === "district") {
            this.renderDistrictDashboard(ctx);
        } else if (ctx.role === "region") {
            this.renderRegionalDashboard(ctx);
        } else if (ctx.role === "national") {
            this.renderNationalDashboard();
        }

        // Always render submissions directory tables when refreshing
        this.renderDirectoryTable();
    },

    populateRegionFilterDropdown() {
        const dropdown = document.getElementById("dir-filter-region");
        dropdown.innerHTML = '<option value="all">All Regions</option>';
        WelfareStore.getRegions().forEach(r => {
            const opt = document.createElement("option");
            opt.value = r.id;
            opt.textContent = r.name;
            dropdown.appendChild(opt);
        });
    },

    getMonthName(monthNum) {
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        return months[monthNum - 1] || "May";
    },

    // -------------------------------------------------------------
    // 1. DISTRICT DASHBOARD CONTROLLER
    // -------------------------------------------------------------
    renderDistrictDashboard(ctx) {
        const beneficiaries = WelfareStore.getBeneficiaries().filter(b => b.districtId === ctx.districtId);
        const reports = WelfareStore.getReports().filter(r => r.districtId === ctx.districtId);
        
        // Members stats - dynamically check the current month/year
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        const currentMonthName = this.getMonthName(currentMonth);

        const activeReport = WelfareStore.getReportByParams(ctx.districtId, currentMonth, currentYear);
        
        let membersCount = 0;
        let agedCount = 0;
        let widowsCount = 0;
        let orphansCount = 0;

        if (activeReport && activeReport.data) {
            membersCount = activeReport.data.membership.total;
            agedCount = activeReport.data.membership.aged;
            widowsCount = activeReport.data.membership.widows;
            orphansCount = activeReport.data.membership.orphans;
        } else {
            // Estimate based on database beneficiaries count
            membersCount = ctx.districtId === "dist-2-1" ? 62 : (ctx.districtId === "dist-2-2" ? 12 : 30);
            agedCount = beneficiaries.filter(b => b.category === "Elderly").length;
            widowsCount = beneficiaries.filter(b => b.category === "Widow").length;
            orphansCount = beneficiaries.filter(b => b.category === "Orphan").length;
        }

        document.getElementById("dist-metric-members").textContent = membersCount;
        document.getElementById("dist-metric-vulnerable").textContent = agedCount + widowsCount;
        document.getElementById("dist-metric-aged-count").textContent = agedCount;
        document.getElementById("dist-metric-widows-count").textContent = widowsCount;

        // Render Report Status Box
        const statusEl = document.getElementById("dist-metric-report-status");
        const statusBox = document.getElementById("dist-status-icon-box");
        const statusDate = document.getElementById("dist-metric-report-date");
        const alertBanner = document.getElementById("district-revision-alert");
        const entryBtn = document.getElementById("dist-start-report-btn");

        alertBanner.style.display = "none";

        // Update dashboard status and card titles dynamically
        const statusTitleEl = document.getElementById("dist-report-status-title");
        if (statusTitleEl) {
            statusTitleEl.textContent = `Report Status (${currentMonthName} ${currentYear})`;
        }
        const cardTitleEl = document.getElementById("dist-report-card-title");
        if (cardTitleEl) {
            cardTitleEl.textContent = `Submit ${currentMonthName} ${currentYear} Report`;
        }

        if (activeReport) {
            statusDate.textContent = `Status of ${currentMonthName} ${currentYear} Report`;
            
            if (activeReport.status === "approved") {
                statusEl.textContent = "Approved";
                statusEl.style.color = "var(--success)";
                statusBox.style.color = "var(--success)";
                statusBox.style.backgroundColor = "var(--success-light)";
                entryBtn.innerHTML = `<i class="fa-solid fa-eye"></i> View ${currentMonthName} Report`;
            } else if (activeReport.status === "pending") {
                statusEl.textContent = "Pending Review";
                statusEl.style.color = "var(--warning)";
                statusBox.style.color = "var(--warning)";
                statusBox.style.backgroundColor = "var(--warning-light)";
                entryBtn.innerHTML = '<i class="fa-solid fa-file-invoice"></i> Edit Submission';
            } else if (activeReport.status === "revision") {
                statusEl.textContent = "Revision Requested";
                statusEl.style.color = "var(--danger)";
                statusBox.style.color = "var(--danger)";
                statusBox.style.backgroundColor = "var(--danger-light)";
                entryBtn.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Modify and Resubmit';
                
                // Show revision feedback alert
                alertBanner.style.display = "flex";
                document.getElementById("district-revision-comment-text").innerHTML = `
                    <strong>Regional Feedback:</strong> "${activeReport.revisionComments || 'Kindly review your calculations.'}"
                `;
            } else {
                statusEl.textContent = "Draft saved";
                statusEl.style.color = "var(--text-muted)";
                statusBox.style.color = "var(--text-muted)";
                statusBox.style.backgroundColor = "var(--bg-alt)";
                entryBtn.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Continue Drafting';
            }
        } else {
            statusEl.textContent = "Not Started";
            statusEl.style.color = "var(--text-light)";
            statusBox.style.color = "var(--text-light)";
            statusBox.style.backgroundColor = "var(--bg-alt)";
            statusDate.textContent = `No data entered for ${currentMonthName} ${currentYear}`;
            entryBtn.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Begin Data Entry';
        }

        // District Recent Submissions History Table
        const recentTable = document.getElementById("district-recent-reports-table");
        recentTable.innerHTML = "";
        
        if (reports.length === 0) {
            recentTable.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px; color:var(--text-muted);">No reports created yet.</td></tr>`;
        } else {
            reports.forEach(r => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td><strong>${this.getMonthName(r.month)} ${r.year}</strong></td>
                    <td>${r.submittedBy || 'N/A'}</td>
                    <td><span class="badge badge-${r.status === 'revision' ? 'revision' : (r.status === 'pending' ? 'pending' : (r.status === 'approved' ? 'approved' : 'draft'))}">${(r.status || 'draft').toUpperCase()}</span></td>
                    <td>
                        <button class="btn btn-secondary btn-sm" onclick="WelfareDashboard.viewReportDetails('${r.id}')">
                            <i class="fa-solid fa-folder-open"></i> View
                        </button>
                    </td>
                `;
                recentTable.appendChild(tr);
            });
        }

        // Setup begin button redirection
        entryBtn.onclick = () => {
            navigateTo("report-submission-view");
        };

        // Render notifications
        this.renderNotifications();
    },

    // -------------------------------------------------------------
    // 2. REGIONAL DASHBOARD CONTROLLER
    // -------------------------------------------------------------
    renderRegionalDashboard(ctx) {
        const selectedMonth = parseInt(document.getElementById("reg-filter-month").value) || 5;
        const selectedYear = parseInt(document.getElementById("reg-filter-year").value) || 2026;

        // Dynamic Header titles matching selected months
        document.querySelector("#regional-dashboard-view .card-title").innerHTML = 
            `<i class="fa-solid fa-list-check"></i> District Submission Checklist (${this.getMonthName(selectedMonth)} ${selectedYear})`;
        document.querySelector("#regional-summary-table-card .card-title").innerHTML = 
            `<i class="fa-solid fa-table"></i> Regional Summary Table (${this.getMonthName(selectedMonth)} ${selectedYear})`;
        
        document.querySelector("#regional-dashboard-view .metric-card:nth-child(1) .metric-footer").textContent = 
            `Submission Progress (${this.getMonthName(selectedMonth)} ${selectedYear})`;

        const districts = WelfareStore.getDistrictsByRegion(ctx.regionId);
        const reports = WelfareStore.getReports().filter(r => r.regionId === ctx.regionId && r.month == selectedMonth && r.year == selectedYear);
        
        const submittedReports = reports.filter(r => r.status !== "draft");
        const approvedReports = reports.filter(r => r.status === "approved");

        // Calculate card metrics
        document.getElementById("reg-metric-reporting").textContent = `${submittedReports.length}/${districts.length}`;
        
        let totalSpend = 0;
        let totalCollected = 0;

        approvedReports.forEach(r => {
            if (r.data && r.data.assistance) {
                totalSpend += r.data.assistance.reduce((sum, item) => sum + (parseFloat(item.value) || 0), 0);
            }
            if (r.data && r.data.collections) {
                totalCollected += (parseFloat(r.data.collections.dueCollected) || 0) + (parseFloat(r.data.collections.donationsReceived) || 0);
            }
        });

        document.getElementById("reg-metric-spending").textContent = "₦" + totalSpend.toLocaleString();
        document.getElementById("reg-metric-collections").textContent = "₦" + totalCollected.toLocaleString();

        // 1. Render District Submissions Checklist Table
        const checklistTable = document.getElementById("regional-district-checklist-table");
        checklistTable.innerHTML = "";

        districts.forEach(d => {
            const report = reports.find(r => r.districtId === d.id);
            const tr = document.createElement("tr");

            let subDateStr = "—";
            let emailStr = `${d.name.toLowerCase().replace(/\s+/g, '')}.welfare@lajna.ng`;
            let spendStr = "₦0";
            let statusBadge = `<span class="badge badge-draft" style="background-color: var(--border); color: var(--text-light);"><i class="fa-solid fa-clock"></i> NOT STARTED</span>`;
            let actionBtn = `<button class="btn btn-secondary btn-sm" disabled><i class="fa-solid fa-ban"></i> No Data</button>`;

            if (report) {
                subDateStr = report.submittedDate || "—";
                emailStr = report.email || emailStr;
                
                const repSpend = report.data && report.data.assistance ? 
                    report.data.assistance.reduce((sum, item) => sum + (parseFloat(item.value) || 0), 0) : 0;
                spendStr = "₦" + repSpend.toLocaleString();

                if (report.status === "approved") {
                    statusBadge = `<span class="badge badge-approved">APPROVED</span>`;
                    actionBtn = `<button class="btn btn-secondary btn-sm" onclick="WelfareDashboard.viewReportDetails('${report.id}')"><i class="fa-solid fa-eye"></i> View</button>`;
                } else if (report.status === "pending") {
                    statusBadge = `<span class="badge badge-pending">PENDING REVIEW</span>`;
                    actionBtn = `<button class="btn btn-accent btn-sm" onclick="WelfareDashboard.viewReportDetails('${report.id}')"><i class="fa-solid fa-square-check"></i> Review</button>`;
                } else if (report.status === "revision") {
                    statusBadge = `<span class="badge badge-revision">REVISION SENT</span>`;
                    actionBtn = `<button class="btn btn-secondary btn-sm" onclick="WelfareDashboard.viewReportDetails('${report.id}')"><i class="fa-solid fa-eye"></i> View Revision</button>`;
                } else if (report.status === "draft") {
                    statusBadge = `<span class="badge badge-draft">DRAFT IN PROGRESS</span>`;
                    actionBtn = `<button class="btn btn-secondary btn-sm" disabled><i class="fa-solid fa-lock"></i> Hidden</button>`;
                }
            }

            tr.innerHTML = `
                <td><strong>${d.name}</strong></td>
                <td>${subDateStr}</td>
                <td><span style="font-size: 0.8rem;">${emailStr}</span></td>
                <td>${spendStr}</td>
                <td>${statusBadge}</td>
                <td>${actionBtn}</td>
            `;
            checklistTable.appendChild(tr);
        });

        // Update Regional Summary Table
        this.renderRegionalSummaryTable(approvedReports);

        // Render regional notifications feed
        this.renderNotifications();
    },

    renderRegionalSummaryTable(approvedReports) {
        const rowsContainer = document.getElementById("regional-summary-metrics-rows");
        rowsContainer.innerHTML = "";

        const summaryIndicator = document.getElementById("regional-summary-indicator");
        summaryIndicator.textContent = `${approvedReports.length} Approved Districts Included`;
        summaryIndicator.className = approvedReports.length > 0 ? "badge badge-approved" : "badge badge-draft";

        // Aggregation logic matching user's metrics
        let totalMembers = 0;
        let totalAged = 0;
        let totalWidows = 0;
        let totalOrphans = 0;
        let totalDue = 0;
        let totalDonations = 0;
        let totalSpending = 0;
        let totalHomeVisits = 0;
        let skillProgsCount = 0;
        let skillParticipants = 0;

        approvedReports.forEach(r => {
            const data = r.data;
            if (data) {
                totalMembers += parseInt(data.membership.total) || 0;
                totalAged += parseInt(data.membership.aged) || 0;
                totalWidows += parseInt(data.membership.widows) || 0;
                totalOrphans += parseInt(data.membership.orphans) || 0;
                
                totalDue += parseFloat(data.collections.dueCollected) || 0;
                totalDonations += parseFloat(data.collections.donationsReceived) || 0;
                
                totalSpending += (data.assistance || []).reduce((sum, item) => sum + (parseFloat(item.value) || 0), 0);
                totalHomeVisits += parseInt(data.visits.home) || 0;
                
                if (data.skills && data.skills.held) {
                    skillProgsCount += 1;
                    skillParticipants += parseInt(data.skills.participants) || 0;
                }
            }
        });

        const indicators = [
            { label: "Districts Reporting (Approved)", value: approvedReports.length },
            { label: "Lajna Members", value: totalMembers.toLocaleString() },
            { label: "Aged Lajna", value: totalAged.toLocaleString() },
            { label: "Widows", value: totalWidows.toLocaleString() },
            { label: "Orphans", value: totalOrphans.toLocaleString() },
            { label: "Welfare Due Collected", value: "₦" + totalDue.toLocaleString() },
            { label: "Additional Donations Received", value: "₦" + totalDonations.toLocaleString() },
            { label: "Total Welfare Spending", value: "₦" + totalSpending.toLocaleString() },
            { label: "Home Visits Conducted", value: totalHomeVisits.toLocaleString() },
            { label: "Skill Acquisition Programmes Held", value: skillProgsCount },
            { label: "Participants in Skill Acquisition", value: skillParticipants }
        ];

        indicators.forEach(ind => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><strong>${ind.label}</strong></td>
                <td style="text-align: right; padding-right: 40px; font-weight: 700; color: var(--primary); font-size: 1.05rem;">${ind.value}</td>
            `;
            rowsContainer.appendChild(tr);
        });
    },

    // -------------------------------------------------------------
    // 3. NATIONAL DASHBOARD CONTROLLER
    // -------------------------------------------------------------
    renderNationalDashboard() {
        const selectedMonth = parseInt(document.getElementById("nat-filter-month").value) || 5;
        const selectedYear = parseInt(document.getElementById("nat-filter-year").value) || 2026;

        document.querySelector("#national-dashboard-view .metric-card:nth-child(1) .metric-footer").textContent = 
            `Submission Progress (${this.getMonthName(selectedMonth)} ${selectedYear})`;
        document.querySelector("#national-dashboard-view .dashboard-card .card-title").innerHTML = 
            `<i class="fa-solid fa-chart-column"></i> Financial Comparison by Region (${this.getMonthName(selectedMonth)} ${selectedYear})`;

        const districts = WelfareStore.getDistricts();
        const reports = WelfareStore.getReports().filter(r => r.month == selectedMonth && r.year == selectedYear);
        const submitted = reports.filter(r => r.status !== "draft");
        const approved = reports.filter(r => r.status === "approved");

        // Aggregated Card Stats
        const rate = districts.length > 0 ? Math.round((submitted.length / districts.length) * 100) : 0;
        document.getElementById("nat-metric-rate").textContent = `${rate}%`;
        document.getElementById("nat-metric-sub-detail").textContent = `${submitted.length}/${districts.length} Districts Submitted`;

        let totalCollected = 0;
        let totalBeneficiaries = 0;
        
        reports.forEach(r => {
            if (r.data) {
                totalCollected += (parseFloat(r.data.collections.dueCollected) || 0) + (parseFloat(r.data.collections.donationsReceived) || 0);
                
                // Sum beneficiaries in assistance arrays
                if (r.data.assistance) {
                    totalBeneficiaries += r.data.assistance.reduce((sum, item) => sum + (parseInt(item.beneficiaries) || 0), 0);
                }
            }
        });

        document.getElementById("nat-metric-collections").textContent = "₦" + totalCollected.toLocaleString();
        document.getElementById("nat-metric-beneficiaries").textContent = totalBeneficiaries;

        // 1. Build and Draw SVG Bar Chart (Collections vs Spending by Region)
        this.drawNationalSVGChart();

        // 2. Render Region Progress Table
        const progressTable = document.getElementById("national-region-progress-table");
        progressTable.innerHTML = "";

        WelfareStore.getRegions().forEach(reg => {
            const regDists = WelfareStore.getDistrictsByRegion(reg.id);
            const regReps = reports.filter(r => r.regionId === reg.id && r.status !== "draft");
            const regAppr = reports.filter(r => r.regionId === reg.id && r.status === "approved");
            
            const rate = regDists.length > 0 ? Math.round((regReps.length / regDists.length) * 100) : 0;

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><strong>${reg.name}</strong></td>
                <td>${regDists.length}</td>
                <td>${regReps.length} Submitted</td>
                <td>
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span style="font-weight:600; width:35px;">${rate}%</span>
                        <div style="flex:1; background-color:var(--border); height:6px; border-radius:3px; overflow:hidden; min-width:60px;">
                            <div style="background-color:${rate === 100 ? 'var(--success)' : 'var(--accent)'}; width:${rate}%; height:100%;"></div>
                        </div>
                    </div>
                </td>
            `;
            progressTable.appendChild(tr);
        });
    },

    drawNationalSVGChart() {
        const container = document.getElementById("national-financial-chart");
        container.innerHTML = ""; // Clear existing

        const selectedMonth = parseInt(document.getElementById("nat-filter-month").value) || 5;
        const selectedYear = parseInt(document.getElementById("nat-filter-year").value) || 2026;

        const regions = WelfareStore.getRegions().slice(0, 3); // Take first 3 regions for clean visualization (Lagos, Ogun, Oyo)
        const reports = WelfareStore.getReports().filter(r => r.month == selectedMonth && r.year == selectedYear);

        // Find max financial value for scaling
        let maxVal = 20000; // base minimum scale
        const chartData = regions.map(reg => {
            let col = 0;
            let spend = 0;
            const regReps = reports.filter(r => r.regionId === reg.id);
            
            regReps.forEach(r => {
                if (r.data) {
                    col += (parseFloat(r.data.collections.dueCollected) || 0) + (parseFloat(r.data.collections.donationsReceived) || 0);
                    spend += (r.data.assistance || []).reduce((sum, item) => sum + (parseFloat(item.value) || 0), 0);
                }
            });

            if (col > maxVal) maxVal = col;
            if (spend > maxVal) maxVal = spend;

            return {
                name: reg.name.replace('Region ', '').split(' ')[0], // short name
                collected: col,
                spent: spend
            };
        });

        // Render custom SVG chart
        let barsHtml = "";
        const chartWidth = 400;
        const chartHeight = 220;

        chartData.forEach((data, index) => {
            const colPct = maxVal > 0 ? (data.collected / maxVal) * 85 : 0; // max 85% height
            const spendPct = maxVal > 0 ? (data.spent / maxVal) * 85 : 0;
            
            barsHtml += `
                <div class="chart-bar-wrapper">
                    <div class="chart-bar-group">
                        <!-- Collections Bar -->
                        <div class="chart-bar-1" style="height: ${colPct}%;" title="Collected: ₦${data.collected.toLocaleString()}">
                            <span class="chart-bar-tooltip">Collected: ₦${data.collected.toLocaleString()}</span>
                        </div>
                        <!-- Spending Bar -->
                        <div class="chart-bar-2" style="height: ${spendPct}%;" title="Spent: ₦${data.spent.toLocaleString()}">
                            <span class="chart-bar-tooltip">Spent: ₦${data.spent.toLocaleString()}</span>
                        </div>
                    </div>
                    <div class="chart-axis-label" title="${data.name}">${data.name}</div>
                </div>
            `;
        });

        container.innerHTML = barsHtml;
    },

    // -------------------------------------------------------------
    // 4. SUBMISSIONS DIRECTORY VIEW
    // -------------------------------------------------------------
    renderDirectoryTable() {
        const tableBody = document.getElementById("directory-reports-table");
        if (!tableBody) return;
        
        tableBody.innerHTML = "";

        const ctx = WelfareStore.getCurrentContext();
        const regionSelect = document.getElementById("dir-filter-region");
        if (regionSelect) {
            if (ctx.role === "region") {
                regionSelect.value = ctx.regionId;
                regionSelect.style.display = "none";
            } else {
                regionSelect.style.display = "inline-block";
                if (regionSelect.style.display === "none") {
                    regionSelect.value = "all";
                }
            }
        }

        const regionFilter = regionSelect ? regionSelect.value : "all";
        const statusFilter = document.getElementById("dir-filter-status").value;
        const monthFilter = document.getElementById("dir-filter-month").value;
        const yearFilter = document.getElementById("dir-filter-year").value;
        
        let list = WelfareStore.getReports();

        // Scope constraint based on active role
        if (ctx.role === "region") {
            list = list.filter(r => r.regionId === ctx.regionId);
        }

        // Apply filters
        if (regionFilter !== "all") {
            list = list.filter(r => r.regionId === regionFilter);
        }
        if (statusFilter !== "all") {
            list = list.filter(r => r.status === statusFilter);
        }
        if (monthFilter !== "all") {
            list = list.filter(r => r.month == monthFilter);
        }
        if (yearFilter !== "all") {
            list = list.filter(r => r.year == yearFilter);
        }

        // Filter drafts from directory for Admin view, except their own district drafts if they switch roles
        if (ctx.role !== "district") {
            list = list.filter(r => r.status !== "draft" || r.regionId === ctx.regionId);
        }

        if (list.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 30px; color: var(--text-muted);">No reports found matching the filters.</td></tr>`;
            return;
        }

        list.forEach(r => {
            const region = WelfareStore.getRegions().find(reg => reg.id === r.regionId);
            const district = WelfareStore.getDistricts().find(d => d.id === r.districtId);
            
            const totalSpend = r.data && r.data.assistance ? 
                r.data.assistance.reduce((sum, item) => sum + (parseFloat(item.value) || 0), 0) : 0;

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${region ? region.name.replace('Region ', '') : 'Unknown'}</td>
                <td><strong>${district ? district.name : 'Unknown'}</strong></td>
                <td>${this.getMonthName(r.month)} ${r.year}</td>
                <td>${r.submittedBy || '—'}</td>
                <td><strong>₦${totalSpend.toLocaleString()}</strong></td>
                <td><span class="badge badge-${r.status === 'revision' ? 'revision' : (r.status === 'pending' ? 'pending' : (r.status === 'approved' ? 'approved' : 'draft'))}">${(r.status || 'draft').toUpperCase()}</span></td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="WelfareDashboard.viewReportDetails('${r.id}')">
                        <i class="fa-solid fa-folder-open"></i> Open Report
                    </button>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    },

    // -------------------------------------------------------------
    // 5. DETAIL REPORT VIEWER (MODAL WINDOW)
    // -------------------------------------------------------------
    viewReportDetails(reportId) {
        this.activeReportIdInModal = reportId;
        const report = WelfareStore.getReportById(reportId);
        if (!report) return;

        const region = WelfareStore.getRegions().find(r => r.id === report.regionId);
        const district = WelfareStore.getDistricts().find(d => d.id === report.districtId);

        // Header Title Set
        document.getElementById("modal-report-title").innerHTML = `
            ${district ? district.name.toUpperCase() : 'DISTRICT'} WELFARE REPORT – ${this.getMonthName(report.month).toUpperCase()} ${report.year}
        `;

        // Render Core 10 Section Data points beautifully
        const bodyContainer = document.getElementById("modal-report-body-content");
        
        let assistanceRows = "";
        let totalAssistSpend = 0;
        if (report.data.assistance && report.data.assistance.length > 0) {
            report.data.assistance.forEach(a => {
                totalAssistSpend += parseFloat(a.value) || 0;
                assistanceRows += `
                    <tr>
                        <td><strong>${a.category}</strong></td>
                        <td>${a.beneficiaries}</td>
                        <td>₦${(parseFloat(a.value) || 0).toLocaleString()}</td>
                        <td><span style="font-size:0.8rem;">${a.date}</span></td>
                        <td>${a.description}</td>
                    </tr>
                `;
            });
        } else {
            assistanceRows = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No assistance entries recorded.</td></tr>`;
        }

        let eventRows = "";
        if (report.data.events && report.data.events.length > 0) {
            report.data.events.forEach(e => {
                eventRows += `
                    <tr>
                        <td><strong>${e.type}</strong></td>
                        <td>${e.date}</td>
                        <td>${e.attendees}</td>
                        <td>${e.beneficiaries}</td>
                        <td>₦${(parseFloat(e.assistance) || 0).toLocaleString()}</td>
                        <td>${e.description}</td>
                    </tr>
                `;
            });
        } else {
            eventRows = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No social events recorded.</td></tr>`;
        }

        let projRows = "";
        if (report.data.projects && report.data.projects.length > 0) {
            report.data.projects.forEach(p => {
                projRows += `
                    <tr>
                        <td><strong>${p.title}</strong></td>
                        <td>${p.quarter}</td>
                        <td>${p.beneficiaries}</td>
                        <td>${p.volunteers}</td>
                        <td>${p.humanityFirst}</td>
                        <td>${p.activities}</td>
                    </tr>
                `;
            });
        } else {
            projRows = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No major projects recorded.</td></tr>`;
        }

        bodyContainer.innerHTML = `
            <div class="report-view-layout">
                
                <div class="report-view-header">
                    <h1>Lajna Imaillah Nigeria</h1>
                    <p>Monthly Welfare Report • ${region ? region.name : 'Unknown Region'}</p>
                </div>

                <div class="report-meta-grid">
                    <div class="meta-field"><strong>District:</strong> ${district ? district.name : 'Unknown'}</div>
                    <div class="meta-field"><strong>Reporting Period:</strong> ${this.getMonthName(report.month)} ${report.year}</div>
                    <div class="meta-field"><strong>Secretary:</strong> ${report.submittedBy || 'N/A'}</div>
                    <div class="meta-field"><strong>President:</strong> ${report.presidentName || 'N/A'}</div>
                    <div class="meta-field"><strong>Welfare Email:</strong> ${report.email || 'N/A'}</div>
                    <div class="meta-field"><strong>Submission Date:</strong> ${report.submittedDate || 'N/A'}</div>
                </div>

                ${report.status === 'revision' ? `
                    <div class="custom-alert custom-alert-danger" style="margin-bottom: 20px;">
                        <i class="fa-solid fa-circle-exclamation" style="font-size: 1.25rem;"></i>
                        <div>
                            <div class="custom-alert-title">Returned for Revision</div>
                            <div class="custom-alert-desc"><strong>Feedback:</strong> "${report.revisionComments}"</div>
                        </div>
                    </div>
                ` : ''}

                <div class="report-section-title">1. Membership Statistics</div>
                <table class="custom-table" style="margin-bottom: 20px;">
                    <thead>
                        <tr>
                            <th>Total Members</th>
                            <th>Aged Lajna (Elderly)</th>
                            <th>Widows</th>
                            <th>Orphans</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>${report.data.membership.total}</strong></td>
                            <td>${report.data.membership.aged}</td>
                            <td>${report.data.membership.widows}</td>
                            <td>${report.data.membership.orphans}</td>
                        </tr>
                    </tbody>
                </table>

                <div class="report-section-title">2. Welfare Collections</div>
                <table class="custom-table" style="margin-bottom: 20px;">
                    <thead>
                        <tr>
                            <th>Opening Balance</th>
                            <th>Due Collected</th>
                            <th>Other Donations</th>
                            <th>Total Funds Available</th>
                            <th>Estimated Spending</th>
                            <th>Closing Balance</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>₦${(parseFloat(report.data.collections.openingBalance) || 0).toLocaleString()}</td>
                            <td>₦${(parseFloat(report.data.collections.dueCollected) || 0).toLocaleString()}</td>
                            <td>₦${(parseFloat(report.data.collections.donationsReceived) || 0).toLocaleString()}</td>
                            <td style="color:var(--primary); font-weight:700;">
                                ₦${((parseFloat(report.data.collections.openingBalance) || 0) + (parseFloat(report.data.collections.dueCollected) || 0) + (parseFloat(report.data.collections.donationsReceived) || 0)).toLocaleString()}
                            </td>
                            <td style="color:var(--danger); font-weight:700;">₦${totalAssistSpend.toLocaleString()}</td>
                            <td style="font-weight:700;">
                                ₦${(report.data.collections.closingBalance || 0).toLocaleString()}
                            </td>
                        </tr>
                    </tbody>
                </table>

                <div class="report-section-title">3. Welfare Assistance Provided</div>
                <table class="custom-table" style="margin-bottom: 20px;">
                    <thead>
                        <tr>
                            <th>Welfare Category</th>
                            <th>Beneficiaries</th>
                            <th>Estimated Value</th>
                            <th>Date</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${assistanceRows}
                    </tbody>
                </table>

                <div class="report-section-title">4. Social Welfare Outings</div>
                <table class="custom-table" style="margin-bottom: 20px;">
                    <thead>
                        <tr>
                            <th>Event Type</th>
                            <th>Date</th>
                            <th>Attendees</th>
                            <th>Beneficiaries</th>
                            <th>Financial Help</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${eventRows}
                    </tbody>
                </table>

                <div class="report-section-title">5. Major Projects</div>
                <table class="custom-table" style="margin-bottom: 20px;">
                    <thead>
                        <tr>
                            <th>Project Title</th>
                            <th>Quarter</th>
                            <th>Beneficiaries</th>
                            <th>Volunteers</th>
                            <th>Humanity First Collab</th>
                            <th>Activities Executed</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${projRows}
                    </tbody>
                </table>

                <div class="report-section-title">6. Visits & Outreach</div>
                <table class="custom-table" style="margin-bottom: 20px;">
                    <thead>
                        <tr>
                            <th>Home Visits</th>
                            <th>Hospital Visits</th>
                            <th>Elderly/Housebound</th>
                            <th>Community Activities</th>
                            <th>Mosque Cleaning Support</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>${report.data.visits.home} conducted</td>
                            <td>${report.data.visits.hospital} conducted</td>
                            <td>${report.data.visits.elderly} conducted</td>
                            <td>${report.data.visits.community} activities</td>
                            <td><span style="font-weight:700; color:${report.data.visits.mosqueCleaning ? 'var(--success)' : 'var(--text-muted)'}">${report.data.visits.mosqueCleaning ? 'Yes' : 'No'}</span></td>
                        </tr>
                    </tbody>
                </table>

                <div class="report-section-title">7. Skills & Empowerment</div>
                <table class="custom-table" style="margin-bottom: 20px;">
                    <thead>
                        <tr>
                            <th>Skill Training Held?</th>
                            <th>Title / Category</th>
                            <th>Participants</th>
                            <th>Duration</th>
                            <th>Starter Packs Distributed</th>
                            <th>Starter Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>${report.data.skills.held ? 'Yes' : 'No'}</strong></td>
                            <td>${report.data.skills.held ? `${report.data.skills.title} (${report.data.skills.category})` : '—'}</td>
                            <td>${report.data.skills.held ? report.data.skills.participants : '—'}</td>
                            <td>${report.data.skills.held ? report.data.skills.duration : '—'}</td>
                            <td>${report.data.skills.starterPacks || 0}</td>
                            <td>₦${(report.data.skills.starterPacksValue || 0).toLocaleString()}</td>
                        </tr>
                    </tbody>
                </table>

                <div class="report-section-title">8. Education Support</div>
                <table class="custom-table" style="margin-bottom: 20px;">
                    <thead>
                        <tr>
                            <th>Sponsored Children</th>
                            <th>Literacy Classes (Women)</th>
                            <th>School Supplies?</th>
                            <th>Supplies Beneficiaries</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>${report.data.education.sponsored} students</td>
                            <td>${report.data.education.literacyClasses} women</td>
                            <td><strong>${report.data.education.schoolSupplies ? 'Yes' : 'No'}</strong></td>
                            <td>${report.data.education.schoolSupplies ? report.data.education.schoolSuppliesBeneficiaries : '—'}</td>
                            <td>${report.data.education.schoolSupplies ? report.data.education.schoolSuppliesDesc : '—'}</td>
                        </tr>
                    </tbody>
                </table>

                <div class="report-section-title">9. Key Achievements & Notes</div>
                <div style="background-color: var(--bg-alt); padding: 16px; border-radius: var(--radius-md); border:1px solid var(--border); font-size:0.9rem; margin-bottom: 20px;">
                    <p style="margin-bottom:10px;"><strong>Achievements / Success Stories:</strong><br>${report.data.summary.achievements || 'None'}</p>
                    <p style="margin-bottom:10px;"><strong>Challenges Encountered:</strong><br>${report.data.summary.challenges || 'None'}</p>
                    <p style="margin-bottom:10px;"><strong>Support Required:</strong><br>${report.data.summary.supportNeeded || 'None'}</p>
                    <p><strong>Remarks:</strong><br>${report.data.summary.remarks || 'None'}</p>
                </div>

                <!-- Clarification Comments Chat Section -->
                <div class="report-comments-section" style="margin-top: 30px; border-top: 1px dashed var(--border); padding-top: 20px;">
                    <h3 style="font-family: var(--font-header); font-size: 1.1rem; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                        <i class="fa-solid fa-comments" style="color: var(--primary);"></i> Clarification Chat Thread
                    </h3>
                    
                    <div class="comments-chat-box" id="modal-report-comments-box" style="max-height: 250px; overflow-y: auto; background: var(--bg-alt); padding: 16px; border-radius: var(--radius-md); border: 1px solid var(--border); margin-bottom: 12px; display: flex; flex-direction: column; gap: 12px;">
                        <div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 10px;">
                            <i class="fa-solid fa-spinner fa-spin"></i> Loading conversation...
                        </div>
                    </div>

                    <form id="modal-report-comment-form" style="display: flex; gap: 8px;">
                        <input type="text" class="form-control" id="modal-report-comment-input" required placeholder="Type a clarification message..." style="flex: 1; height: 38px;">
                        <button type="submit" class="btn btn-primary" id="modal-report-comment-send" style="height: 38px; display: inline-flex; align-items: center; justify-content: center; width: 44px; min-width: 44px; padding: 0;">
                            <i class="fa-solid fa-paper-plane"></i>
                        </button>
                    </form>
                </div>

            </div>
        `;

        // 3. Build Footer Action Buttons depending on role context
        const footerContainer = document.getElementById("modal-report-footer-actions");
        footerContainer.innerHTML = "";

        const printBtn = document.createElement("button");
        printBtn.className = "btn btn-secondary";
        printBtn.innerHTML = '<i class="fa-solid fa-print"></i> Print / Save PDF';
        printBtn.onclick = () => window.print();
        footerContainer.appendChild(printBtn);

        const ctx = WelfareStore.getCurrentContext();
        
        // Show review controls to Regional Secretary only if report status is pending
        if (ctx.role === "region" && report.status === "pending" && report.regionId === ctx.regionId) {
            
            const reviseBtn = document.createElement("button");
            reviseBtn.className = "btn btn-danger";
            reviseBtn.innerHTML = '<i class="fa-solid fa-comment-dots"></i> Request revision';
            reviseBtn.onclick = () => this.openRevisionFeedbackModal(report.id);
            footerContainer.appendChild(reviseBtn);

            const approveBtn = document.createElement("button");
            approveBtn.className = "btn btn-primary";
            approveBtn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Approve Report';
            approveBtn.onclick = () => this.approveReportAction(report.id);
            footerContainer.appendChild(approveBtn);
        }

        const closeBtn = document.createElement("button");
        closeBtn.className = "btn btn-secondary";
        closeBtn.textContent = "Close";
        closeBtn.onclick = () => this.closeReportModal();
        footerContainer.appendChild(closeBtn);

        this.initReportComments(report.id);
        document.getElementById("report-detail-modal").classList.add("active");
    },

    closeReportModal() {
        if (this.commentsInterval) {
            clearInterval(this.commentsInterval);
            this.commentsInterval = null;
        }
        document.getElementById("report-detail-modal").classList.remove("active");
    },

    commentsInterval: null,

    async initReportComments(reportId) {
        if (this.commentsInterval) {
            clearInterval(this.commentsInterval);
        }

        // Render initially
        await this.renderReportComments(reportId);

        // Bind comment form submit listener
        const form = document.getElementById("modal-report-comment-form");
        if (form) {
            const newForm = form.cloneNode(true);
            form.parentNode.replaceChild(newForm, form);

            newForm.addEventListener("submit", async (e) => {
                e.preventDefault();
                const input = document.getElementById("modal-report-comment-input");
                const sendBtn = document.getElementById("modal-report-comment-send");
                const commentText = input.value.trim();

                if (!commentText) return;

                sendBtn.disabled = true;
                sendBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;

                try {
                    await WelfareStore.addComment(reportId, commentText);
                    input.value = "";
                    await this.renderReportComments(reportId);
                } catch (err) {
                    alert(`Failed to send message: ${err.message}`);
                } finally {
                    sendBtn.disabled = false;
                    sendBtn.innerHTML = `<i class="fa-solid fa-paper-plane"></i>`;
                }
            });
        }

        // Set up 5s polling for auto-refresh
        this.commentsInterval = setInterval(() => {
            this.renderReportComments(reportId, true);
        }, 5000);
    },

    async renderReportComments(reportId, silent = false) {
        const chatBox = document.getElementById("modal-report-comments-box");
        if (!chatBox) return;

        if (!silent) {
            chatBox.innerHTML = `
                <div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 10px;">
                    <i class="fa-solid fa-spinner fa-spin"></i> Loading conversation...
                </div>
            `;
        }

        try {
            const comments = await WelfareStore.getComments(reportId);
            const activeProfile = JSON.parse(localStorage.getItem("lajna_active_session_profile"));
            const currentUserId = activeProfile ? activeProfile.id : null;

            if (comments.length === 0) {
                chatBox.innerHTML = `
                    <div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 15px; background: var(--bg-alt); border-radius: var(--radius-sm); border: 1px dashed var(--border);">
                        No comments yet. Start the conversation below.
                    </div>
                `;
                return;
            }

            chatBox.innerHTML = "";
            comments.forEach(c => {
                const isMe = c.author_id === currentUserId;
                const bubble = document.createElement("div");
                
                const alignStyle = isMe ? "margin-left: auto; background: var(--primary); color: white;" : "margin-right: auto; background: var(--surface); border: 1px solid var(--border);";
                const maxWidth = "max-width: 80%; padding: 10px 14px; border-radius: var(--radius-md); box-shadow: var(--shadow-sm); font-size: 0.88rem; line-height: 1.4;";
                const borderRad = isMe ? "border-bottom-right-radius: 2px;" : "border-bottom-left-radius: 2px;";

                const timeStr = new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const dateStr = new Date(c.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' });

                bubble.style.cssText = `${alignStyle} ${maxWidth} ${borderRad}`;
                bubble.innerHTML = `
                    <div style="font-weight: 700; font-size: 0.72rem; margin-bottom: 4px; color: ${isMe ? 'rgba(255,255,255,0.85)' : 'var(--text-muted)'};">
                        ${c.author_name}
                    </div>
                    <div style="word-break: break-word;">${c.comment_text}</div>
                    <div style="text-align: right; font-size: 0.68rem; margin-top: 4px; color: ${isMe ? 'rgba(255,255,255,0.7)' : 'var(--text-light)'};">
                        ${dateStr} ${timeStr}
                    </div>
                `;
                chatBox.appendChild(bubble);
            });

            chatBox.scrollTop = chatBox.scrollHeight;
        } catch (e) {
            console.error("Failed to render report comments:", e);
            if (!silent) {
                chatBox.innerHTML = `<div style="text-align: center; color: var(--danger); font-size: 0.85rem; padding: 10px;">Failed to load comments: ${e.message}</div>`;
            }
        }
    },

    // Approval Actions
    approveReportAction(reportId) {
        if (confirm("Are you sure you want to approve this monthly welfare report? This will consolidate the figures into your regional summary and notify the National Secretariat.")) {
            WelfareStore.updateReportStatus(reportId, "approved", "");
            this.closeReportModal();
            this.refresh();
            alert("Report successfully approved!");
        }
    },

    openRevisionFeedbackModal(reportId) {
        document.getElementById("revision-report-id").value = reportId;
        document.getElementById("revision-feedback-text").value = "";
        
        // Show revision modal overlay
        document.getElementById("revision-modal").classList.add("active");
    },

    closeRevisionModal() {
        document.getElementById("revision-modal").classList.remove("active");
    },

    submitRevisionFeedback() {
        const reportId = document.getElementById("revision-report-id").value;
        const feedback = document.getElementById("revision-feedback-text").value;

        if (!feedback.trim()) {
            alert("Feedback comments are required to send report back.");
            return;
        }

        WelfareStore.updateReportStatus(reportId, "revision", feedback);
        
        // Add revision comment to the two-way message board thread
        WelfareStore.addComment(reportId, `Revision Requested: ${feedback}`).then(() => {
            if (this.activeReportIdInModal === reportId) {
                this.renderReportComments(reportId);
            }
        }).catch(err => {
            console.error("Failed to post initial revision comment:", err);
        });
        
        this.closeRevisionModal();
        this.closeReportModal();
        this.refresh();
        alert("Report sent back to District with feedback notes.");
    },

    renderNotifications() {
        const ctx = WelfareStore.getCurrentContext();
        const container = ctx.role === "region" ? 
            (document.getElementById("regional-notifications-list") || document.getElementById("district-notifications-list")) : 
            (document.getElementById("district-notifications-list") || document.getElementById("regional-notifications-list"));
        if (!container) return;

        container.innerHTML = "";

        const allNotifications = WelfareStore.getNotifications();
        const filtered = allNotifications.filter(n => 
            n.recipientRole === ctx.role && 
            (n.recipientId === null || n.recipientId === (ctx.districtId || ctx.regionId))
        );

        if (filtered.length === 0) {
            container.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 20px; font-size: 0.9rem;">No new notifications.</div>`;
            return;
        }

        filtered.forEach(n => {
            const div = document.createElement("div");
            div.className = `notification-item notif-${n.type || 'info'}`;
            div.style.cssText = "padding: 10px 12px; margin-bottom: 8px; border-radius: var(--radius-sm); font-size: 0.82rem; border-left: 4px solid var(--primary-light); background: var(--bg-alt); display: flex; flex-direction: column; gap: 4px;";
            
            // Customize colors based on type
            if (n.type === "success") {
                div.style.borderLeftColor = "var(--success)";
                div.style.backgroundColor = "rgba(5, 150, 105, 0.05)";
            } else if (n.type === "warning") {
                div.style.borderLeftColor = "var(--warning)";
                div.style.backgroundColor = "rgba(217, 119, 6, 0.05)";
            } else if (n.type === "danger") {
                div.style.borderLeftColor = "var(--danger)";
                div.style.backgroundColor = "rgba(220, 38, 38, 0.05)";
            }

            const timeStr = new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const dateStr = new Date(n.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });

            div.innerHTML = `
                <div style="display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--text-muted); font-weight: 600;">
                    <span>${(n.type || 'info').toUpperCase()}</span>
                    <span>${dateStr} ${timeStr}</span>
                </div>
                <div style="color: var(--text); line-height: 1.3;">${n.message}</div>
            `;
            container.appendChild(div);
        });

        // Mark as read
        WelfareStore.markNotificationsAsRead(ctx.role, ctx.districtId || ctx.regionId);
    },

    renderHistoryTable() {
        const ctx = WelfareStore.getCurrentContext();
        const tableBody = document.getElementById("history-reports-table");
        if (!tableBody) return;

        tableBody.innerHTML = "";
        
        // Reset bulk selection checkbox
        document.getElementById("history-select-all").checked = false;
        this.toggleHistoryBulkActions();

        const statusFilter = document.getElementById("history-filter-status").value;
        const monthFilter = document.getElementById("history-filter-month").value;
        const yearFilter = document.getElementById("history-filter-year").value;

        let reports = WelfareStore.getReports().filter(r => r.districtId === ctx.districtId);

        // Apply filters
        if (statusFilter !== "all") {
            reports = reports.filter(r => r.status === statusFilter);
        }
        if (monthFilter !== "all") {
            reports = reports.filter(r => r.month == monthFilter);
        }
        if (yearFilter !== "all") {
            reports = reports.filter(r => r.year == yearFilter);
        }

        if (reports.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:30px; color:var(--text-muted);">No matching reports found in submission history.</td></tr>`;
            return;
        }

        reports.forEach(r => {
            const tr = document.createElement("tr");
            
            // Only drafts can be selected for deletion
            const canDelete = r.status === "draft";
            const checkboxMarkup = canDelete 
                ? `<input type="checkbox" class="history-row-checkbox" value="${r.id}" onclick="WelfareDashboard.toggleHistoryBulkActions()">`
                : `<input type="checkbox" disabled class="history-row-checkbox" value="${r.id}" title="Only drafts can be bulk deleted.">`;

            // Calculate closing balance
            let closingBalStr = "₦0";
            if (r.data && r.data.collections && r.data.collections.closingBalance !== undefined) {
                closingBalStr = "₦" + parseFloat(r.data.collections.closingBalance).toLocaleString();
            } else if (r.data && r.data.collections) {
                const openVal = parseFloat(r.data.collections.openingBalance) || 0;
                const dueVal = parseFloat(r.data.collections.dueCollected) || 0;
                const extraVal = parseFloat(r.data.collections.donationsReceived) || 0;
                const spendVal = (r.data.assistance || []).reduce((sum, item) => sum + (parseFloat(item.value) || 0), 0);
                closingBalStr = "₦" + (openVal + dueVal + extraVal - spendVal).toLocaleString();
            }

            // Actions markup
            let actionsMarkup = "";
            if (r.status === "draft") {
                actionsMarkup = `
                    <button class="btn btn-secondary btn-sm" onclick="WelfareDashboard.editReport(${r.month}, ${r.year})" title="Edit Draft">
                        <i class="fa-solid fa-pen-to-square"></i> Edit
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="WelfareDashboard.deleteReport('${r.id}')" title="Delete Draft">
                        <i class="fa-solid fa-trash-can"></i> Delete
                    </button>
                `;
            } else if (r.status === "revision") {
                actionsMarkup = `
                    <button class="btn btn-primary btn-sm" onclick="WelfareDashboard.editReport(${r.month}, ${r.year})" title="Modify and Resubmit">
                        <i class="fa-solid fa-pen-to-square"></i> Modify
                    </button>
                `;
            } else {
                actionsMarkup = `
                    <button class="btn btn-secondary btn-sm" onclick="WelfareDashboard.viewReportDetails('${r.id}')" title="View Details">
                        <i class="fa-solid fa-folder-open"></i> View
                    </button>
                `;
            }

            tr.innerHTML = `
                <td style="text-align: center;">${checkboxMarkup}</td>
                <td><strong>${this.getMonthName(r.month)} ${r.year}</strong></td>
                <td>${r.submittedBy || 'N/A'}</td>
                <td>${closingBalStr}</td>
                <td><span class="badge badge-${r.status === 'revision' ? 'revision' : (r.status === 'pending' ? 'pending' : (r.status === 'approved' ? 'approved' : 'draft'))}">${(r.status || 'draft').toUpperCase()}</span></td>
                <td>
                    <div style="display: flex; gap: 8px;">
                        ${actionsMarkup}
                    </div>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    },

    toggleHistoryBulkActions() {
        const checkedBoxes = document.querySelectorAll(".history-row-checkbox:checked");
        const container = document.getElementById("history-bulk-actions-container");
        if (!container) return;

        if (checkedBoxes.length > 0) {
            container.style.display = "block";
        } else {
            container.style.display = "none";
        }
    },

    deleteReport(id) {
        if (confirm("Are you sure you want to delete this report draft? This action cannot be undone.")) {
            if (WelfareStore.deleteReport(id)) {
                this.refresh();
                this.renderHistoryTable();
            }
        }
    },

    deleteSelectedDrafts() {
        const checkedBoxes = document.querySelectorAll(".history-row-checkbox:checked");
        const ids = Array.from(checkedBoxes).map(cb => cb.value);
        if (ids.length === 0) return;

        if (confirm(`Are you sure you want to delete the ${ids.length} selected draft(s)? This action cannot be undone.`)) {
            if (WelfareStore.deleteReports(ids)) {
                this.refresh();
                this.renderHistoryTable();
            }
        }
    },

    editReport(month, year) {
        navigateTo("report-submission-view");
        document.getElementById("form-info-month").value = String(month);
        document.getElementById("form-info-year").value = String(year);
        // Force the wizard to load the draft/revision data
        document.getElementById("form-info-month").dispatchEvent(new Event("change"));
    },

    usersList: [],

    async initUserManagementView() {
        try {
            document.getElementById("users-directory-tbody").innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 20px;">
                        <i class="fa-solid fa-spinner fa-spin"></i> Fetching profiles...
                    </td>
                </tr>
            `;

            // Populate Region Select in the modal (one-time setup)
            const regions = WelfareStore.getRegions();
            const editRegionSelect = document.getElementById("edit-user-region");
            editRegionSelect.innerHTML = "";
            regions.forEach(r => {
                const opt = document.createElement("option");
                opt.value = r.id;
                opt.textContent = r.name;
                editRegionSelect.appendChild(opt);
            });

            this.usersList = await WelfareStore.getProfiles();
            this.renderUsersDirectory();
        } catch (e) {
            console.error("Error loading user directory:", e);
            document.getElementById("users-directory-tbody").innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: var(--danger); padding: 20px;">
                        <i class="fa-solid fa-circle-xmark"></i> Failed to load profiles: ${e.message}
                    </td>
                </tr>
            `;
        }
    },

    renderUsersDirectory() {
        const tbody = document.getElementById("users-directory-tbody");
        const searchText = (document.getElementById("user-search-input").value || "").toLowerCase().trim();
        
        const regions = WelfareStore.getRegions();
        const districts = WelfareStore.getDistricts();

        // Filter users
        const filtered = this.usersList.filter(user => {
            const name = (user.user_name_display || "").toLowerCase();
            const email = (user.username || "").toLowerCase();
            return name.includes(searchText) || email.includes(searchText);
        });

        if (filtered.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 20px;">
                        No users found.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = "";
        filtered.forEach(user => {
            const tr = document.createElement("tr");

            // Role Badge
            let roleBadge = "";
            if (user.role === "national") {
                roleBadge = `<span class="badge badge-accent"><i class="fa-solid fa-crown"></i> National</span>`;
            } else if (user.role === "region") {
                roleBadge = `<span class="badge badge-primary"><i class="fa-solid fa-map"></i> Region</span>`;
            } else {
                roleBadge = `<span class="badge badge-secondary"><i class="fa-solid fa-building"></i> District</span>`;
            }

            // Scope descriptions
            const region = regions.find(r => r.id === user.region_id);
            const district = districts.find(d => d.id === user.district_id);

            const regionName = region ? region.name : (user.role === "national" ? "All Regions" : "None");
            const districtName = district ? district.name : (user.role === "national" || user.role === "region" ? "All Districts" : "None");

            tr.innerHTML = `
                <td><strong>${user.user_name_display || "Welfare Secretary"}</strong></td>
                <td>${user.username}</td>
                <td>${roleBadge}</td>
                <td>${regionName}</td>
                <td>${districtName}</td>
                <td>
                    <button class="btn btn-secondary btn-sm edit-user-btn" style="padding: 4px 8px; font-size: 0.8rem;">
                        <i class="fa-solid fa-user-pen"></i> Edit
                    </button>
                </td>
            `;

            // Click listener
            tr.querySelector(".edit-user-btn").addEventListener("click", () => this.openUserEditModal(user));

            tbody.appendChild(tr);
        });
    },

    openUserEditModal(user) {
        document.getElementById("edit-user-id").value = user.id;
        document.getElementById("edit-user-name").value = user.user_name_display || "";
        document.getElementById("edit-user-role").value = user.role || "district";
        
        if (user.region_id) {
            document.getElementById("edit-user-region").value = user.region_id;
        }
        
        this.adjustUserEditScopeFields();
        this.updateUserEditDistricts();

        if (user.district_id) {
            document.getElementById("edit-user-district").value = user.district_id;
        }

        document.getElementById("user-edit-modal").classList.add("active");
    },

    closeUserEditModal() {
        document.getElementById("user-edit-modal").classList.remove("active");
    },

    adjustUserEditScopeFields() {
        const role = document.getElementById("edit-user-role").value;
        const regionGroup = document.getElementById("edit-user-region-group");
        const districtGroup = document.getElementById("edit-user-district-group");

        const regionSelect = document.getElementById("edit-user-region");
        const districtSelect = document.getElementById("edit-user-district");

        if (role === "national") {
            regionGroup.style.display = "none";
            regionSelect.required = false;
            districtGroup.style.display = "none";
            districtSelect.required = false;
        } else if (role === "region") {
            regionGroup.style.display = "block";
            regionSelect.required = true;
            districtGroup.style.display = "none";
            districtSelect.required = false;
        } else {
            regionGroup.style.display = "block";
            regionSelect.required = true;
            districtGroup.style.display = "block";
            districtSelect.required = true;
        }
    },

    updateUserEditDistricts() {
        const selectedRegion = document.getElementById("edit-user-region").value;
        const districtSelect = document.getElementById("edit-user-district");
        if (!districtSelect) return;
        
        const districts = WelfareStore.getDistrictsByRegion(selectedRegion);
        districtSelect.innerHTML = "";
        
        districts.forEach(d => {
            const opt = document.createElement("option");
            opt.value = d.id;
            opt.textContent = d.name;
            districtSelect.appendChild(opt);
        });
    },

    async saveUserProfileEdit() {
        const saveBtn = document.getElementById("save-user-edit-btn");
        const prevText = saveBtn.innerHTML;
        saveBtn.disabled = true;
        saveBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Saving...`;

        try {
            const userId = document.getElementById("edit-user-id").value;
            const name = document.getElementById("edit-user-name").value.trim();
            const role = document.getElementById("edit-user-role").value;
            const regionId = (role !== "national") ? document.getElementById("edit-user-region").value : null;
            const districtId = (role === "district") ? document.getElementById("edit-user-district").value : null;

            await WelfareStore.updateUserProfile(userId, {
                user_name_display: name,
                role: role,
                region_id: regionId,
                district_id: districtId
            });

            this.closeUserEditModal();
            
            // Reload user directory list
            this.usersList = await WelfareStore.getProfiles();
            this.renderUsersDirectory();

            // Refresh current context if admin edited themselves
            const activeProfile = JSON.parse(localStorage.getItem("lajna_active_session_profile"));
            if (activeProfile && activeProfile.id === userId) {
                window.location.reload();
            }
        } catch (e) {
            alert(`Failed to save changes: ${e.message}`);
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = prevText;
        }
    }
};

// Initialize
WelfareDashboard.init();
