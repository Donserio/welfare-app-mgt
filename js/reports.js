// District Report Form Wizard Logic

const WelfareReports = {
    currentStep: 1,
    totalSteps: 10,
    activeDraft: null,

    // Step configuration details
    steps: [
        { num: 1, title: "Reporting Info" },
        { num: 2, title: "Membership" },
        { num: 3, title: "Collections" },
        { num: 4, title: "Assistance" },
        { num: 5, title: "Outings" },
        { num: 6, title: "Projects" },
        { num: 7, title: "Visits" },
        { num: 8, title: "Empowerment" },
        { num: 9, title: "Education" },
        { num: 10, title: "Summary" }
    ],

    init() {
        // Step bubble header generator
        this.renderStepHeaders();

        // Register action events
        document.getElementById("wizard-next-btn").addEventListener("click", () => this.nextStep());
        document.getElementById("wizard-prev-btn").addEventListener("click", () => this.prevStep());
        document.getElementById("wizard-draft-btn").addEventListener("click", () => this.saveDraftAction(true));
        document.getElementById("wizard-submit-btn").addEventListener("click", () => this.submitReportAction());
        
        // Custom dynamic row actions
        document.getElementById("form-assistance-add-btn").addEventListener("click", () => this.addAssistanceRow());
        document.getElementById("form-outings-add-btn").addEventListener("click", () => this.addOutingRow());
        document.getElementById("form-projects-add-btn").addEventListener("click", () => this.addProjectRow());

        // Field change calculations
        document.getElementById("form-fin-due").addEventListener("input", () => this.calculateTotalFunds());
        document.getElementById("form-fin-extra").addEventListener("input", () => this.calculateTotalFunds());
        document.getElementById("form-fin-opening").addEventListener("input", () => this.calculateTotalFunds());
        
        // Hide / Show sub-panels based on selectors
        document.getElementById("form-skills-held").addEventListener("change", (e) => {
            document.getElementById("form-skills-details-panel").style.display = e.target.value === "Yes" ? "block" : "none";
        });
        document.getElementById("form-edu-supplies").addEventListener("change", (e) => {
            document.getElementById("form-edu-supplies-details-panel").style.display = e.target.value === "Yes" ? "block" : "none";
        });
        
        // Reload draft when Month or Year changes
        document.getElementById("form-info-month").addEventListener("change", () => this.loadActiveReportOrDraft());
        document.getElementById("form-info-year").addEventListener("change", () => this.loadActiveReportOrDraft());

        // Supplementary report events
        document.getElementById("create-supp-report-btn").addEventListener("click", () => this.openSupplementaryForm());
        document.getElementById("cancel-supp-report-btn").addEventListener("click", () => this.closeSupplementaryForm());
        document.getElementById("supp-form-cancel-btn").addEventListener("click", () => this.closeSupplementaryForm());
        document.getElementById("supp-add-custom-field-btn").addEventListener("click", () => this.addSupplementaryField("", "text", ""));
        document.getElementById("supp-add-preset-field-btn").addEventListener("click", () => this.addSupplementaryPresetFields());
        document.getElementById("supplementary-report-form").addEventListener("submit", (e) => {
            e.preventDefault();
            this.submitSupplementaryReport();
        });

        window.WelfareReports = this;
    },

    refresh() {
        // Re-align role fields on dashboard or form load
        const ctx = WelfareStore.getCurrentContext();
        if (ctx.role === "district") {
            const btn = document.getElementById("dist-start-report-btn");
            if (btn) btn.style.display = "inline-flex";
            document.getElementById("dist-report-card-title").textContent = `Submit ${this.getMonthName(5)} 2026 Report`;
        }
    },

    getMonthName(monthNum) {
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        return months[monthNum - 1] || "May";
    },

    renderStepHeaders() {
        const headerContainer = document.getElementById("wizard-progress-headers");
        headerContainer.innerHTML = "";
        this.steps.forEach(step => {
            const div = document.createElement("div");
            div.className = `wizard-step-indicator ${step.num === 1 ? 'active' : ''}`;
            div.id = `step-indicator-${step.num}`;
            div.innerHTML = `
                <div class="step-number">${step.num}</div>
                <span>${step.title}</span>
            `;
            headerContainer.appendChild(div);
        });
    },

    initWizard() {
        this.currentStep = 1;
        this.showStep(1);

        // Autofill District/Region data from context
        const ctx = WelfareStore.getCurrentContext();
        document.getElementById("form-info-region").value = ctx.regionName;
        document.getElementById("form-info-district").value = ctx.districtName;
        document.getElementById("form-info-secretary").value = ctx.userName;
        document.getElementById("form-info-email").value = ctx.email;

        // Default to current selection
        document.getElementById("form-info-month").value = "5";
        document.getElementById("form-info-year").value = "2026";

        // Load if exists
        this.loadActiveReportOrDraft();
    },

    showStep(stepNum) {
        // Hide all steps
        const stepsElements = document.querySelectorAll(".wizard-step-content");
        stepsElements.forEach(s => s.classList.remove("active"));

        // Show targets
        const targetStep = document.querySelector(`.wizard-step-content[data-step="${stepNum}"]`);
        if (targetStep) targetStep.classList.add("active");

        // Update indicators
        for (let i = 1; i <= this.totalSteps; i++) {
            const ind = document.getElementById(`step-indicator-${i}`);
            if (ind) {
                ind.classList.remove("active", "completed");
                if (i === stepNum) {
                    ind.classList.add("active");
                } else if (i < stepNum) {
                    ind.classList.add("completed");
                }
            }
        }

        // Manage button displays
        document.getElementById("wizard-prev-btn").style.visibility = stepNum === 1 ? "hidden" : "visible";
        
        if (stepNum === this.totalSteps) {
            document.getElementById("wizard-next-btn").style.display = "none";
            document.getElementById("wizard-submit-btn").style.display = "inline-flex";
        } else {
            document.getElementById("wizard-next-btn").style.display = "inline-flex";
            document.getElementById("wizard-submit-btn").style.display = "none";
        }

        this.currentStep = stepNum;
        
        // Auto-save progress
        this.saveDraftAction(false);
    },

    nextStep() {
        if (this.validateStep(this.currentStep)) {
            if (this.currentStep < this.totalSteps) {
                this.showStep(this.currentStep + 1);
            }
        }
    },

    prevStep() {
        if (this.currentStep > 1) {
            this.showStep(this.currentStep - 1);
        }
    },

    validateStep(stepNum) {
        const activeContainer = document.querySelector(`.wizard-step-content[data-step="${stepNum}"]`);
        const inputs = activeContainer.querySelectorAll("[required]");
        let isValid = true;
        
        inputs.forEach(input => {
            if (!input.value.trim()) {
                input.style.borderColor = "var(--danger)";
                isValid = false;
            } else {
                input.style.borderColor = "var(--border)";
            }
        });

        if (!isValid) {
            alert("Please fill out all required fields marked with * before moving to the next section.");
        }
        return isValid;
    },

    // Financial sums calculator
    calculateTotalFunds() {
        const openVal = parseFloat(document.getElementById("form-fin-opening").value) || 0;
        const dueVal = parseFloat(document.getElementById("form-fin-due").value) || 0;
        const extraVal = parseFloat(document.getElementById("form-fin-extra").value) || 0;
        
        const total = openVal + dueVal + extraVal;
        document.getElementById("form-fin-total-calc").textContent = "₦" + total.toLocaleString();
    },

    // Repeatable rows for Assistance Provided
    addAssistanceRow(data = {}) {
        const container = document.getElementById("form-assistance-repeater");
        const rowId = "assist-row-" + Date.now() + Math.random().toString(36).substr(2, 5);
        const div = document.createElement("div");
        div.className = "repeating-grid-row";
        div.id = rowId;

        div.innerHTML = `
            <div class="repeating-grid-row-header">
                <span>Assistance Record</span>
                <button type="button" class="repeating-grid-delete" onclick="document.getElementById('${rowId}').remove()"><i class="fa-solid fa-trash-can"></i> Remove</button>
            </div>
            <div class="form-row-2">
                <div class="form-group">
                    <label class="form-label">Category <span class="required">*</span></label>
                    <select class="form-control" name="assist-category" required>
                        <option value="Widow Support" ${data.category === "Widow Support" ? "selected" : ""}>Widow Support</option>
                        <option value="Orphan Support" ${data.category === "Orphan Support" ? "selected" : ""}>Orphan Support</option>
                        <option value="Sick/Hospital Support" ${data.category === "Sick/Hospital Support" ? "selected" : ""}>Sick/Hospital Support</option>
                        <option value="Emergency Support" ${data.category === "Emergency Support" ? "selected" : ""}>Emergency Support</option>
                        <option value="Financial Assistance" ${data.category === "Financial Assistance" ? "selected" : ""}>Financial Assistance</option>
                        <option value="Material Assistance" ${data.category === "Material Assistance" ? "selected" : ""}>Material Assistance</option>
                        <option value="Other Support" ${data.category === "Other Support" ? "selected" : ""}>Other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Number of Beneficiaries <span class="required">*</span></label>
                    <input type="number" class="form-control" name="assist-beneficiaries" required min="1" value="${data.beneficiaries || 1}">
                </div>
            </div>
            <div class="form-row-2">
                <div class="form-group">
                    <label class="form-label">Estimated Value (₦) <span class="required">*</span></label>
                    <input type="number" class="form-control" name="assist-value" required min="0" value="${data.value || ''}" placeholder="NGN Value">
                </div>
                <div class="form-group">
                    <label class="form-label">Date Provided <span class="required">*</span></label>
                    <input type="date" class="form-control" name="assist-date" required value="${data.date || ''}">
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Description of Support <span class="required">*</span></label>
                <input type="text" class="form-control" name="assist-desc" required value="${data.description || ''}" placeholder="Give a detailed description of support">
            </div>
        `;
        container.appendChild(div);
    },

    // Repeatable rows for Social Outings
    addOutingRow(data = {}) {
        const container = document.getElementById("form-outings-repeater");
        const rowId = "outing-row-" + Date.now() + Math.random().toString(36).substr(2, 5);
        const div = document.createElement("div");
        div.className = "repeating-grid-row";
        div.id = rowId;

        div.innerHTML = `
            <div class="repeating-grid-row-header">
                <span>Social Event</span>
                <button type="button" class="repeating-grid-delete" onclick="document.getElementById('${rowId}').remove()"><i class="fa-solid fa-trash-can"></i> Remove</button>
            </div>
            <div class="form-row-2">
                <div class="form-group">
                    <label class="form-label">Event Type <span class="required">*</span></label>
                    <select class="form-control" name="outing-type" required>
                        <option value="Nikkah" ${data.type === "Nikkah" ? "selected" : ""}>Nikkah</option>
                        <option value="Aqiqah" ${data.type === "Aqiqah" ? "selected" : ""}>Aqiqah</option>
                        <option value="Janazah" ${data.type === "Janazah" ? "selected" : ""}>Janazah</option>
                        <option value="Aminul Qur'an" ${data.type === "Aminul Qur'an" ? "selected" : ""}>Aminul Qur'an</option>
                        <option value="Other" ${data.type === "Other" ? "selected" : ""}>Other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Event Date <span class="required">*</span></label>
                    <input type="date" class="form-control" name="outing-date" required value="${data.date || ''}">
                </div>
            </div>
            <div class="form-row-3" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 12px;">
                <div class="form-group">
                    <label class="form-label">Attendees <span class="required">*</span></label>
                    <input type="number" class="form-control" name="outing-attendees" required min="0" value="${data.attendees || 0}">
                </div>
                <div class="form-group">
                    <label class="form-label">Beneficiaries <span class="required">*</span></label>
                    <input type="number" class="form-control" name="outing-beneficiaries" required min="0" value="${data.beneficiaries || 0}">
                </div>
                <div class="form-group">
                    <label class="form-label">Assistance (₦)</label>
                    <input type="number" class="form-control" name="outing-assistance" min="0" value="${data.assistance || 0}">
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Brief Description of Event</label>
                <input type="text" class="form-control" name="outing-desc" value="${data.description || ''}" placeholder="e.g. Members attended, assistance detail">
            </div>
        `;
        container.appendChild(div);
    },

    // Repeatable rows for Projects
    addProjectRow(data = {}) {
        const container = document.getElementById("form-projects-repeater");
        const rowId = "project-row-" + Date.now() + Math.random().toString(36).substr(2, 5);
        const div = document.createElement("div");
        div.className = "repeating-grid-row";
        div.id = rowId;

        div.innerHTML = `
            <div class="repeating-grid-row-header">
                <span>Project Record</span>
                <button type="button" class="repeating-grid-delete" onclick="document.getElementById('${rowId}').remove()"><i class="fa-solid fa-trash-can"></i> Remove</button>
            </div>
            <div class="form-row-2">
                <div class="form-group">
                    <label class="form-label">Quarterly Project Title <span class="required">*</span></label>
                    <input type="text" class="form-control" name="proj-title" required value="${data.title || ''}" placeholder="e.g. Ramadan Food Hampers">
                </div>
                <div class="form-group">
                    <label class="form-label">Applicable Quarter <span class="required">*</span></label>
                    <select class="form-control" name="proj-quarter" required>
                        <option value="Q1" ${data.quarter === "Q1" ? "selected" : ""}>Q1 (Jan-Mar)</option>
                        <option value="Q2" ${data.quarter === "Q2" ? "selected" : ""}>Q2 (Apr-Jun)</option>
                        <option value="Q3" ${data.quarter === "Q3" ? "selected" : ""}>Q3 (Jul-Sep)</option>
                        <option value="Q4" ${data.quarter === "Q4" ? "selected" : ""}>Q4 (Oct-Dec)</option>
                    </select>
                </div>
            </div>
            <div class="form-row-2">
                <div class="form-group">
                    <label class="form-label">Number of Beneficiaries <span class="required">*</span></label>
                    <input type="number" class="form-control" name="proj-beneficiaries" required min="1" value="${data.beneficiaries || 1}">
                </div>
                <div class="form-group">
                    <label class="form-label">Volunteers Involved <span class="required">*</span></label>
                    <input type="number" class="form-control" name="proj-volunteers" required min="0" value="${data.volunteers || 0}">
                </div>
            </div>
            <div class="form-row-2">
                <div class="form-group">
                    <label class="form-label">Collaboration with Humanity First? <span class="required">*</span></label>
                    <select class="form-control" name="proj-hf" required>
                        <option value="Yes" ${data.humanityFirst === "Yes" ? "selected" : ""}>Yes</option>
                        <option value="No" ${data.humanityFirst === "No" || !data.humanityFirst ? "selected" : ""}>No</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Project Attachments Placeholder</label>
                    <input type="file" class="form-control" disabled>
                    <span class="form-control-helper">File attachments enabled in production database</span>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Activities Executed & Challenges Faced <span class="required">*</span></label>
                <textarea class="form-control" name="proj-activities" required rows="2" placeholder="List activities completed and describe challenges faced">${data.activities || ''}</textarea>
            </div>
        `;
        container.appendChild(div);
    },

    // Build JSON data representing current form state
    collectFormData(status = "draft") {
        const ctx = WelfareStore.getCurrentContext();
        const monthVal = parseInt(document.getElementById("form-info-month").value);
        const yearVal = parseInt(document.getElementById("form-info-year").value);

        // Assistance Provided Array Compile
        const assistance = [];
        const assistRows = document.querySelectorAll("#form-assistance-repeater .repeating-grid-row");
        assistRows.forEach(row => {
            assistance.push({
                category: row.querySelector("[name='assist-category']").value,
                beneficiaries: parseInt(row.querySelector("[name='assist-beneficiaries']").value) || 0,
                value: parseFloat(row.querySelector("[name='assist-value']").value) || 0,
                date: row.querySelector("[name='assist-date']").value,
                description: row.querySelector("[name='assist-desc']").value
            });
        });

        // Social Outings Array Compile
        const events = [];
        const outingRows = document.querySelectorAll("#form-outings-repeater .repeating-grid-row");
        outingRows.forEach(row => {
            events.push({
                type: row.querySelector("[name='outing-type']").value,
                date: row.querySelector("[name='outing-date']").value,
                attendees: parseInt(row.querySelector("[name='outing-attendees']").value) || 0,
                beneficiaries: parseInt(row.querySelector("[name='outing-beneficiaries']").value) || 0,
                assistance: parseFloat(row.querySelector("[name='outing-assistance']").value) || 0,
                description: row.querySelector("[name='outing-desc']").value
            });
        });

        // Projects Array Compile
        const projects = [];
        const projRows = document.querySelectorAll("#form-projects-repeater .repeating-grid-row");
        projRows.forEach(row => {
            projects.push({
                title: row.querySelector("[name='proj-title']").value,
                quarter: row.querySelector("[name='proj-quarter']").value,
                beneficiaries: parseInt(row.querySelector("[name='proj-beneficiaries']").value) || 0,
                volunteers: parseInt(row.querySelector("[name='proj-volunteers']").value) || 0,
                humanityFirst: row.querySelector("[name='proj-hf']").value,
                activities: row.querySelector("[name='proj-activities']").value
            });
        });

        return {
            id: `rep-${ctx.regionId.replace('region-', '')}-${ctx.districtId.replace('dist-', '')}-${yearVal}-${monthVal.toString().padStart(2, '0')}`,
            regionId: ctx.regionId,
            districtId: ctx.districtId,
            month: monthVal,
            year: yearVal,
            status: status,
            submittedBy: document.getElementById("form-info-secretary").value,
            presidentName: document.getElementById("form-info-president").value,
            email: document.getElementById("form-info-email").value,
            submittedDate: new Date().toISOString().split('T')[0],
            revisionComments: this.activeDraft ? this.activeDraft.revisionComments : "",
            data: {
                membership: {
                    total: parseInt(document.getElementById("form-stats-members").value) || 0,
                    aged: parseInt(document.getElementById("form-stats-aged").value) || 0,
                    widows: parseInt(document.getElementById("form-stats-widows").value) || 0,
                    orphans: parseInt(document.getElementById("form-stats-orphans").value) || 0
                },
                collections: {
                    openingBalance: parseFloat(document.getElementById("form-fin-opening").value) || 0,
                    dueCollected: parseFloat(document.getElementById("form-fin-due").value) || 0,
                    donationsReceived: parseFloat(document.getElementById("form-fin-extra").value) || 0,
                    closingBalance: 0 // calculated in store.js
                },
                assistance: assistance,
                events: events,
                projects: projects,
                visits: {
                    home: parseInt(document.getElementById("form-visits-home").value) || 0,
                    hospital: parseInt(document.getElementById("form-visits-hospital").value) || 0,
                    elderly: parseInt(document.getElementById("form-visits-elderly").value) || 0,
                    community: parseInt(document.getElementById("form-visits-community").value) || 0,
                    mosqueCleaning: document.getElementById("form-visits-mosque-cleaning").value === "Yes"
                },
                skills: {
                    held: document.getElementById("form-skills-held").value === "Yes",
                    title: document.getElementById("form-skills-title").value,
                    category: document.getElementById("form-skills-category").value,
                    participants: parseInt(document.getElementById("form-skills-participants").value) || 0,
                    duration: document.getElementById("form-skills-duration").value,
                    starterPacks: parseInt(document.getElementById("form-skills-packs").value) || 0,
                    starterPacksValue: parseFloat(document.getElementById("form-skills-packs-value").value) || 0
                },
                education: {
                    sponsored: parseInt(document.getElementById("form-edu-sponsored").value) || 0,
                    apprentices: 0,
                    scholarships: 0,
                    literacyClasses: parseInt(document.getElementById("form-edu-literacy").value) || 0,
                    schoolSupplies: document.getElementById("form-edu-supplies").value === "Yes",
                    schoolSuppliesBeneficiaries: parseInt(document.getElementById("form-edu-supplies-beneficiaries").value) || 0,
                    schoolSuppliesDesc: document.getElementById("form-edu-supplies-desc").value
                },
                summary: {
                    achievements: document.getElementById("form-sum-achievements").value,
                    challenges: document.getElementById("form-sum-challenges").value,
                    supportNeeded: document.getElementById("form-sum-support").value,
                    remarks: document.getElementById("form-sum-remarks").value
                }
            }
        };
    },

    saveDraftAction(showPopup = false) {
        const report = this.collectFormData("draft");
        WelfareStore.saveReport(report);
        if (showPopup) {
            alert("Draft auto-saved successfully in your local browser storage.");
        }
    },

    submitReportAction() {
        // Validate final step before submission
        if (!this.validateStep(this.currentStep)) return;

        if (confirm("Are you sure you want to submit this monthly report to the regional office? Once submitted, it will be locked from edits unless returned by your Regional Secretary for correction.")) {
            const report = this.collectFormData("pending");
            WelfareStore.saveReport(report);
            alert("Success! Your welfare report has been submitted to the Region for review.");
            
            // Go back to dashboard
            navigateTo("district-dashboard-view");
            if (window.WelfareDashboard) window.WelfareDashboard.refresh();
        }
    },

    loadActiveReportOrDraft() {
        const ctx = WelfareStore.getCurrentContext();
        const monthVal = parseInt(document.getElementById("form-info-month").value);
        const yearVal = parseInt(document.getElementById("form-info-year").value);
        
        // Find existing report
        const report = WelfareStore.getReportByParams(ctx.districtId, monthVal, yearVal);
        this.activeDraft = report || null;

        // Clear repeaters
        document.getElementById("form-assistance-repeater").innerHTML = "";
        document.getElementById("form-outings-repeater").innerHTML = "";
        document.getElementById("form-projects-repeater").innerHTML = "";

        if (report) {
            // Populate stats
            document.getElementById("form-stats-members").value = report.data.membership.total || "";
            document.getElementById("form-stats-aged").value = report.data.membership.aged || "";
            document.getElementById("form-stats-widows").value = report.data.membership.widows || "";
            document.getElementById("form-stats-orphans").value = report.data.membership.orphans || "";

            // Collections
            document.getElementById("form-fin-opening").value = report.data.collections.openingBalance || 0;
            document.getElementById("form-fin-due").value = report.data.collections.dueCollected || "";
            document.getElementById("form-fin-extra").value = report.data.collections.donationsReceived || "";
            
            // Repeaters populate
            if (report.data.assistance) {
                report.data.assistance.forEach(a => this.addAssistanceRow(a));
            }
            if (report.data.events) {
                report.data.events.forEach(e => this.addOutingRow(e));
            }
            if (report.data.projects) {
                report.data.projects.forEach(p => this.addProjectRow(p));
            }

            // Visits
            document.getElementById("form-visits-home").value = report.data.visits.home || "";
            document.getElementById("form-visits-hospital").value = report.data.visits.hospital || "";
            document.getElementById("form-visits-elderly").value = report.data.visits.elderly || "";
            document.getElementById("form-visits-community").value = report.data.visits.community || "";
            document.getElementById("form-visits-mosque-cleaning").value = report.data.visits.mosqueCleaning ? "Yes" : "No";

            // Skills
            const skillHeld = report.data.skills.held ? "Yes" : "No";
            document.getElementById("form-skills-held").value = skillHeld;
            document.getElementById("form-skills-details-panel").style.display = skillHeld === "Yes" ? "block" : "none";
            document.getElementById("form-skills-title").value = report.data.skills.title || "";
            document.getElementById("form-skills-category").value = report.data.skills.category || "";
            document.getElementById("form-skills-participants").value = report.data.skills.participants || "";
            document.getElementById("form-skills-duration").value = report.data.skills.duration || "";
            document.getElementById("form-skills-packs").value = report.data.skills.starterPacks || "";
            document.getElementById("form-skills-packs-value").value = report.data.skills.starterPacksValue || "";

            // Education
            document.getElementById("form-edu-sponsored").value = report.data.education.sponsored || "";
            document.getElementById("form-edu-literacy").value = report.data.education.literacyClasses || "";
            const suppliesDist = report.data.education.schoolSupplies ? "Yes" : "No";
            document.getElementById("form-edu-supplies").value = suppliesDist;
            document.getElementById("form-edu-supplies-details-panel").style.display = suppliesDist === "Yes" ? "block" : "none";
            document.getElementById("form-edu-supplies-beneficiaries").value = report.data.education.schoolSuppliesBeneficiaries || "";
            document.getElementById("form-edu-supplies-desc").value = report.data.education.schoolSuppliesDesc || "";

            // Summary
            document.getElementById("form-sum-achievements").value = report.data.summary.achievements || "";
            document.getElementById("form-sum-challenges").value = report.data.summary.challenges || "";
            document.getElementById("form-sum-support").value = report.data.summary.supportNeeded || "";
            document.getElementById("form-sum-remarks").value = report.data.summary.remarks || "";
        } else {
            // Load blank fields with default values
            document.getElementById("form-stats-members").value = "";
            document.getElementById("form-stats-aged").value = "";
            document.getElementById("form-stats-widows").value = "";
            document.getElementById("form-stats-orphans").value = "";
            document.getElementById("form-fin-opening").value = 0;
            document.getElementById("form-fin-due").value = "";
            document.getElementById("form-fin-extra").value = "";
            
            document.getElementById("form-visits-home").value = "";
            document.getElementById("form-visits-hospital").value = "";
            document.getElementById("form-visits-elderly").value = "";
            document.getElementById("form-visits-community").value = "";
            document.getElementById("form-visits-mosque-cleaning").value = "No";

            document.getElementById("form-skills-held").value = "No";
            document.getElementById("form-skills-details-panel").style.display = "none";
            document.getElementById("form-skills-title").value = "";
            document.getElementById("form-skills-category").value = "";
            document.getElementById("form-skills-participants").value = "";
            document.getElementById("form-skills-duration").value = "";
            document.getElementById("form-skills-packs").value = "";
            document.getElementById("form-skills-packs-value").value = "";

            document.getElementById("form-edu-sponsored").value = "";
            document.getElementById("form-edu-literacy").value = "";
            document.getElementById("form-edu-supplies").value = "No";
            document.getElementById("form-edu-supplies-details-panel").style.display = "none";
            document.getElementById("form-edu-supplies-beneficiaries").value = "";
            document.getElementById("form-edu-supplies-desc").value = "";

            document.getElementById("form-sum-achievements").value = "";
            document.getElementById("form-sum-challenges").value = "";
            document.getElementById("form-sum-support").value = "";
            document.getElementById("form-sum-remarks").value = "";

            // Seed one blank assistance row for convenience
            this.addAssistanceRow();
        }

        this.calculateTotalFunds();
    },

    initSupplementaryView() {
        this.renderSupplementaryList();
        this.closeSupplementaryForm(); 
    },

    renderSupplementaryList() {
        const tableBody = document.getElementById("supplementary-reports-table-body");
        tableBody.innerHTML = "";

        const ctx = WelfareStore.getCurrentContext();
        let reports = WelfareStore.getSupplementaryReports();

        if (ctx.role === "region") {
            reports = reports.filter(r => r.regionId === ctx.regionId);
        }

        if (reports.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 30px; color: var(--text-muted);">No supplementary reports created yet.</td></tr>`;
            return;
        }

        reports.forEach(r => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><strong>${r.title}</strong></td>
                <td>${r.regionName || 'National'}</td>
                <td>${this.getMonthName(r.month)} ${r.year}</td>
                <td><span class="badge" style="background-color: var(--primary-ultra-light); color: var(--primary);">${r.fields.length} Fields</span></td>
                <td>${r.submittedDate}</td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="WelfareReports.viewSupplementaryDetail('${r.id}')"><i class="fa-solid fa-eye"></i> View</button>
                    <button class="btn btn-danger btn-sm" onclick="WelfareReports.deleteSupplementaryReport('${r.id}')"><i class="fa-solid fa-trash-can"></i> Delete</button>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    },

    openSupplementaryForm() {
        const ctx = WelfareStore.getCurrentContext();
        
        document.getElementById("supp-form-title").value = "";
        document.getElementById("supp-form-region").value = ctx.regionName || "National Secretariat";
        document.getElementById("supp-form-by").value = ctx.userName;
        document.getElementById("supp-form-month").value = "5";
        document.getElementById("supp-form-year").value = "2026";
        document.getElementById("supp-form-fields-repeater-container").innerHTML = "";

        this.addSupplementaryField("", "text", "");

        document.getElementById("supplementary-list-panel").style.display = "none";
        document.getElementById("supplementary-form-panel").style.display = "block";
    },

    closeSupplementaryForm() {
        document.getElementById("supplementary-list-panel").style.display = "block";
        document.getElementById("supplementary-form-panel").style.display = "none";
    },

    addSupplementaryField(label = "", type = "text", value = "") {
        const container = document.getElementById("supp-form-fields-repeater-container");
        const rowId = "supp-field-row-" + Date.now() + Math.random().toString(36).substr(2, 5);
        const div = document.createElement("div");
        div.className = "repeating-grid-row";
        div.id = rowId;

        div.innerHTML = `
            <div class="repeating-grid-row-header">
                <span>Dynamic Field Form Input</span>
                <button type="button" class="repeating-grid-delete" onclick="document.getElementById('${rowId}').remove()"><i class="fa-solid fa-trash-can"></i> Remove Field</button>
            </div>
            <div class="form-row-2">
                <div class="form-group">
                    <label class="form-label">Field Name / Question Label <span class="required">*</span></label>
                    <input type="text" class="form-control" name="supp-field-label" required value="${label}" placeholder="e.g. Total Food Packs Distributed">
                </div>
                <div class="form-group">
                    <label class="form-label">Field Type <span class="required">*</span></label>
                    <select class="form-control" name="supp-field-type" required onchange="WelfareReports.handleSuppFieldTypeChange(this, '${rowId}')">
                        <option value="text" ${type === "text" ? "selected" : ""}>Text / Description</option>
                        <option value="number" ${type === "number" ? "selected" : ""}>Number</option>
                        <option value="boolean" ${type === "boolean" ? "selected" : ""}>Yes / No Toggle</option>
                    </select>
                </div>
            </div>
            <div class="form-group" id="${rowId}-answer-container">
                <label class="form-label">Field Answer / Response <span class="required">*</span></label>
                ${this.getSuppAnswerInputHTML(type, value)}
            </div>
        `;
        container.appendChild(div);
    },

    handleSuppFieldTypeChange(selectEl, rowId) {
        const type = selectEl.value;
        const container = document.getElementById(`${rowId}-answer-container`);
        container.innerHTML = `
            <label class="form-label">Field Answer / Response <span class="required">*</span></label>
            ${this.getSuppAnswerInputHTML(type, "")}
        `;
    },

    getSuppAnswerInputHTML(type, value) {
        if (type === "number") {
            return `<input type="number" class="form-control" name="supp-field-value" required value="${value}" placeholder="Enter numbers only">`;
        } else if (type === "boolean") {
            return `
                <select class="form-control" name="supp-field-value" required>
                    <option value="Yes" ${value === "Yes" ? "selected" : ""}>Yes</option>
                    <option value="No" ${value === "No" || !value ? "selected" : ""}>No</option>
                </select>
            `;
        } else {
            return `<input type="text" class="form-control" name="supp-field-value" required value="${value}" placeholder="Enter answer details...">`;
        }
    },

    addSupplementaryPresetFields() {
        const presets = [
            { label: "Consolidated Regional Spending (₦)", type: "number" },
            { label: "Key Regional / National Project Undertaken", type: "text" },
            { label: "Number of Active Volunteers in Project", type: "number" },
            { label: "Did we collaborate with Humanity First this month?", type: "boolean" },
            { label: "General Remarks & Success Stories", type: "text" }
        ];

        const container = document.getElementById("supp-form-fields-repeater-container");
        if (container.children.length === 1) {
            const firstRowLabelInput = container.querySelector("[name='supp-field-label']");
            if (firstRowLabelInput && firstRowLabelInput.value === "") {
                container.innerHTML = "";
            }
        }

        presets.forEach(p => this.addSupplementaryField(p.label, p.type, ""));
    },

    submitSupplementaryReport() {
        const ctx = WelfareStore.getCurrentContext();
        const title = document.getElementById("supp-form-title").value;
        const monthVal = parseInt(document.getElementById("supp-form-month").value);
        const yearVal = parseInt(document.getElementById("supp-form-year").value);

        const fieldRows = document.querySelectorAll("#supp-form-fields-repeater-container .repeating-grid-row");
        if (fieldRows.length === 0) {
            alert("Please add at least one field to submit a report.");
            return;
        }

        const fields = [];
        let isValid = true;

        fieldRows.forEach(row => {
            const labelInput = row.querySelector("[name='supp-field-label']");
            const typeSelect = row.querySelector("[name='supp-field-type']");
            const valueInput = row.querySelector("[name='supp-field-value']");

            if (!labelInput.value.trim() || !valueInput.value.trim()) {
                labelInput.style.borderColor = !labelInput.value.trim() ? "var(--danger)" : "var(--border)";
                valueInput.style.borderColor = !valueInput.value.trim() ? "var(--danger)" : "var(--border)";
                isValid = false;
            } else {
                labelInput.style.borderColor = "var(--border)";
                valueInput.style.borderColor = "var(--border)";
            }

            fields.push({
                label: labelInput.value,
                type: typeSelect.value,
                value: valueInput.value
            });
        });

        if (!isValid) {
            alert("Please fill out all labels and answers for dynamic fields.");
            return;
        }

        const report = {
            role: ctx.role,
            regionId: ctx.regionId,
            regionName: ctx.regionName,
            title: title,
            month: monthVal,
            year: yearVal,
            submittedBy: ctx.userName,
            submittedDate: new Date().toISOString().split('T')[0],
            fields: fields
        };

        WelfareStore.saveSupplementaryReport(report);
        alert("Supplementary report successfully submitted!");
        this.renderSupplementaryList();
        this.closeSupplementaryForm();
    },

    viewSupplementaryDetail(id) {
        const report = WelfareStore.getSupplementaryReports().find(r => r.id === id);
        if (!report) return;

        document.getElementById("modal-report-title").textContent = report.title.toUpperCase();
        
        let fieldRows = "";
        report.fields.forEach(f => {
            fieldRows += `
                <tr>
                    <td style="width: 40%;"><strong>${f.label}</strong></td>
                    <td style="color: var(--text-muted);">${f.value}</td>
                    <td><span class="badge" style="background-color: var(--bg-alt); color: var(--text-muted); font-size: 0.7rem; border: 1px solid var(--border);">${f.type.toUpperCase()}</span></td>
                </tr>
            `;
        });

        const bodyContainer = document.getElementById("modal-report-body-content");
        bodyContainer.innerHTML = `
            <div class="report-view-layout">
                <div class="report-view-header">
                    <h1>Lajna Imaillah Nigeria</h1>
                    <p>Supplementary Welfare Report • Created at ${report.regionName || 'National'}</p>
                </div>

                <div class="report-meta-grid">
                    <div class="meta-field"><strong>Scope:</strong> ${report.regionName || 'National Secretariat'}</div>
                    <div class="meta-field"><strong>Reporting Period:</strong> ${this.getMonthName(report.month)} ${report.year}</div>
                    <div class="meta-field"><strong>Created By:</strong> ${report.submittedBy}</div>
                    <div class="meta-field"><strong>Submission Date:</strong> ${report.submittedDate}</div>
                </div>

                <div class="report-section-title">Dynamic Fields and Responses</div>
                <table class="custom-table">
                    <thead>
                        <tr>
                            <th>Field Label / Question</th>
                            <th>Recorded Answer / Value</th>
                            <th>Field Type</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${fieldRows}
                    </tbody>
                </table>
            </div>
        `;

        const footerContainer = document.getElementById("modal-report-footer-actions");
        footerContainer.innerHTML = `
            <button class="btn btn-secondary" onclick="window.print()"><i class="fa-solid fa-print"></i> Print Report</button>
            <button class="btn btn-secondary" onclick="WelfareDashboard.closeReportModal()">Close</button>
        `;

        document.getElementById("report-detail-modal").classList.add("active");
    },

    deleteSupplementaryReport(id) {
        if (confirm("Are you sure you want to delete this supplementary report?")) {
            WelfareStore.deleteSupplementaryReport(id);
            this.renderSupplementaryList();
        }
    }
};

// Initialize form system
WelfareReports.init();
