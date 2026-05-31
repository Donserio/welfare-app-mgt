// Centralized Data Store for Lajna Welfare App Mgt

const DEFAULT_REGIONS = [
    { id: "region-1", name: "Region 1 (Lagos)" },
    { id: "region-2", name: "Region 2 (Ogun)" },
    { id: "region-3", name: "Region 3 (Oyo)" },
    { id: "region-4", name: "Region 4 (Osun/Osogbo)" },
    { id: "region-5", name: "Region 5 (Ekiti/Akoko)" },
    { id: "region-6", name: "Region 6 (Port Harcout/Owerri/Ikot)" },
    { id: "region-7", name: "Region 7 (Abuja/Bauchi/Jos)" },
    { id: "region-8", name: "Region 8 (Edo/Delta/Warri)" },
    { id: "region-9", name: "Region 9 (Kogi/Lokoja)" },
    { id: "region-10", name: "Region 10 (Kwara/Ilorin/Lafiaji)" },
    { id: "region-11", name: "Region 11 (Sokoto/Kebbi)" }
];

const DEFAULT_DISTRICTS = [
    // Region 1 (Lagos) Districts
    { id: "dist-1-1", regionId: "region-1", name: "Lagos Mainland" },
    { id: "dist-1-2", regionId: "region-1", name: "Lagos Island" },
    { id: "dist-1-3", regionId: "region-1", name: "Ikeja" },
    { id: "dist-1-4", regionId: "region-1", name: "Apapa" },
    
    // Region 2 (Ogun) Districts
    { id: "dist-2-1", regionId: "region-2", name: "Ayetoro" },
    { id: "dist-2-2", regionId: "region-2", name: "Ogun Waterside" },
    { id: "dist-2-3", regionId: "region-2", name: "Abeokuta" },
    { id: "dist-2-4", regionId: "region-2", name: "Ijebu Ode" },
    
    // Region 3 (Oyo) Districts
    { id: "dist-3-1", regionId: "region-3", name: "Ibadan North" },
    { id: "dist-3-2", regionId: "region-3", name: "Ibadan South" },
    { id: "dist-3-3", regionId: "region-3", name: "Oyo Town" },
    
    // Fallback districts for other regions
    { id: "dist-4-1", regionId: "region-4", name: "Osogbo" },
    { id: "dist-5-1", regionId: "region-5", name: "Ado Ekiti" },
    { id: "dist-6-1", regionId: "region-6", name: "Port Harcourt" },
    { id: "dist-7-1", regionId: "region-7", name: "Abuja Central" },
    { id: "dist-8-1", regionId: "region-8", name: "Benin City" },
    { id: "dist-9-1", regionId: "region-9", name: "Lokoja" },
    { id: "dist-10-1", regionId: "region-10", name: "Ilorin" },
    { id: "dist-11-1", regionId: "region-11", name: "Sokoto Central" }
];

const DEFAULT_BENEFICIARIES = [
    { id: "ben-1", name: "Fatimah Alao", category: "Widow", phone: "+2348031234567", address: "12, Shodeke Street, Abeokuta", districtId: "dist-2-3", status: "Active" },
    { id: "ben-2", name: "Zainab Ibrahim", category: "Orphan", phone: "+2348123456789", address: "Ayetoro Mission House Road", districtId: "dist-2-1", status: "Active" },
    { id: "ben-3", name: "Aishat Yusuf", category: "Orphan", phone: "+2348154321098", address: "Ayetoro Mission House Road", districtId: "dist-2-1", status: "Active" },
    { id: "ben-4", name: "Rukayah Solihu", category: "Sick/Disabled", phone: "+2349076543210", address: "Waterfront Estate, Ogun Waterside", districtId: "dist-2-2", status: "Active" },
    { id: "ben-5", name: "Mariam Abdulsalam", category: "Widow", phone: "+2348029876543", address: "Waterfront Estate, Ogun Waterside", districtId: "dist-2-2", status: "Active" },
    { id: "ben-6", name: "Halimah Bello", category: "Elderly", phone: "+2348050001112", address: "Sabon Gari, Ilorin", districtId: "dist-10-1", status: "Active" }
];

const DEFAULT_REPORTS = [
    // Ayetoro District - May 2026 (Submitted and Approved)
    {
        id: "rep-2-1-2026-05",
        regionId: "region-2",
        districtId: "dist-2-1",
        month: 5,
        year: 2026,
        status: "approved",
        submittedBy: "Sister Aishat Bello",
        presidentName: "Sister Rasheedah Badmus",
        email: "ayetoro.welfare@lajna.ng",
        submittedDate: "2026-05-28",
        revisionComments: "",
        data: {
            membership: {
                total: 62,
                aged: 20,
                widows: 5,
                orphans: 4
            },
            collections: {
                dueCollected: 900,
                donationsReceived: 0,
                openingBalance: 5000,
                closingBalance: 0 // Will auto calculate
            },
            assistance: [
                { category: "Orphan Support", beneficiaries: 4, description: "Financial support provided to four orphan beneficiaries", value: 20000, date: "2026-05-10" },
                { category: "Other Support", beneficiaries: 45, description: "Provided welfare materials during the opening of Ayetoro Mission House", value: 14000, date: "2026-05-15" }
            ],
            events: [
                { type: "Other", date: "2026-05-15", attendees: 55, beneficiaries: 45, assistance: 14000, description: "Opening of Ayetoro Mission House" }
            ],
            projects: [
                { title: "Mission House Welfare Outing", quarter: "Q2", activities: "Distribution of household welfare packs during opening", beneficiaries: 45, volunteers: 12, humanityFirst: "No", challenges: "None" }
            ],
            visits: {
                home: 4,
                hospital: 0,
                elderly: 0,
                community: 0,
                mosqueCleaning: true
            },
            skills: {
                held: true,
                title: "Handwash Production",
                category: "Home Care Crafts",
                participants: 24,
                duration: "3 Hours",
                starterPacks: 0,
                starterPacksValue: 0
            },
            education: {
                sponsored: 0,
                apprentices: 0,
                scholarships: 0,
                literacyClasses: 0,
                schoolSupplies: false,
                schoolSuppliesBeneficiaries: 0,
                schoolSuppliesDesc: ""
            },
            summary: {
                achievements: "Successful skill training on handwash production with 24 attendees. Supported 4 orphans.",
                successStories: "Welfare activities during the Mission House launch was highly appreciated by the community.",
                challenges: "None",
                supportNeeded: "More resources for training starter packs.",
                remarks: "The district reported satisfaction with the welfare activities carried out during the month."
            }
        }
    },
    // Ogun Waterside - May 2026 (Submitted and Approved)
    {
        id: "rep-2-2-2026-05",
        regionId: "region-2",
        districtId: "dist-2-2",
        month: 5,
        year: 2026,
        status: "approved",
        submittedBy: "Sister Aminah Adebayo",
        presidentName: "Sister Zainab Lawal",
        email: "ogunwaterside.welfare@lajna.ng",
        submittedDate: "2026-05-29",
        revisionComments: "",
        data: {
            membership: {
                total: 12,
                aged: 6,
                widows: 6,
                orphans: 0
            },
            collections: {
                dueCollected: 900,
                donationsReceived: 10000,
                openingBalance: 1500,
                closingBalance: 0
            },
            assistance: [
                { category: "Sick/Hospital Support", beneficiaries: 1, description: "Visited and supported a sick member at home", value: 10900, date: "2026-05-18" }
            ],
            events: [],
            projects: [],
            visits: {
                home: 1,
                hospital: 0,
                elderly: 0,
                community: 0,
                mosqueCleaning: true
            },
            skills: {
                held: false,
                title: "",
                category: "",
                participants: 0,
                duration: "",
                starterPacks: 0,
                starterPacksValue: 0
            },
            education: {
                sponsored: 0,
                apprentices: 0,
                scholarships: 0,
                literacyClasses: 0,
                schoolSupplies: false,
                schoolSuppliesBeneficiaries: 0,
                schoolSuppliesDesc: ""
            },
            summary: {
                achievements: "Visited and supported a sick member at home.",
                successStories: "Mosque cleaning was successfully supported by members.",
                challenges: "Limited participation of members in Jama’at activities. Financial constraints affecting involvement. Time limitations.",
                supportNeeded: "Financial support to help engage members.",
                remarks: "The district expressed gratitude for the opportunity to support members despite challenges and prayed for improved conditions."
            }
        }
    },
    // Ibadan North - May 2026 (Pending Review)
    {
        id: "rep-3-1-2026-05",
        regionId: "region-3",
        districtId: "dist-3-1",
        month: 5,
        year: 2026,
        status: "pending",
        submittedBy: "Sister Maryam Yusuf",
        presidentName: "Sister Khadijah Alabi",
        email: "ibadannorth.welfare@lajna.ng",
        submittedDate: "2026-05-27",
        revisionComments: "",
        data: {
            membership: { total: 45, aged: 10, widows: 3, orphans: 2 },
            collections: { dueCollected: 1200, donationsReceived: 5000, openingBalance: 2000, closingBalance: 0 },
            assistance: [
                { category: "Widow Support", beneficiaries: 2, description: "Monthly stipend for two widows", value: 6000, date: "2026-05-10" }
            ],
            events: [],
            projects: [],
            visits: { home: 3, hospital: 1, elderly: 2, community: 1, mosqueCleaning: true },
            skills: { held: false, title: "", category: "", participants: 0, duration: "", starterPacks: 0, starterPacksValue: 0 },
            education: { sponsored: 0, apprentices: 0, scholarships: 0, literacyClasses: 0, schoolSupplies: false, schoolSuppliesBeneficiaries: 0, schoolSuppliesDesc: "" },
            summary: { achievements: "Distributed stipends and visited the hospitalized.", successStories: "", challenges: "", supportNeeded: "", remarks: "Ongoing welfare work is progressing steadily." }
        }
    },
    // Lagos Mainland - May 2026 (Needs Revision)
    {
        id: "rep-1-1-2026-05",
        regionId: "region-1",
        districtId: "dist-1-1",
        month: 5,
        year: 2026,
        status: "revision",
        submittedBy: "Sister Haleemah Ajose",
        presidentName: "Sister Ruqayyah Dada",
        email: "lagosmainland.welfare@lajna.ng",
        submittedDate: "2026-05-26",
        revisionComments: "Kindly verify the total welfare spending. The assistance list shows ₦5,000, but collections show ₦15,000 spent.",
        data: {
            membership: { total: 110, aged: 30, widows: 12, orphans: 8 },
            collections: { dueCollected: 3500, donationsReceived: 25000, openingBalance: 8000, closingBalance: 0 },
            assistance: [
                { category: "Financial Assistance", beneficiaries: 1, description: "Educational help", value: 5000, date: "2026-05-12" }
            ],
            events: [],
            projects: [],
            visits: { home: 12, hospital: 5, elderly: 8, community: 3, mosqueCleaning: true },
            skills: { held: false, title: "", category: "", participants: 0, duration: "", starterPacks: 0, starterPacksValue: 0 },
            education: { sponsored: 2, apprentices: 0, scholarships: 2, literacyClasses: 1, schoolSupplies: true, schoolSuppliesBeneficiaries: 20, schoolSuppliesDesc: "Distributed notebooks to orphans" },
            summary: { achievements: "Distributed school supplies and conducted numerous home/hospital visitations.", successStories: "", challenges: "Need help balancing reports.", supportNeeded: "Training on finance entries.", remarks: "We require correction guidance." }
        }
    }
];

const DEFAULT_NOTIFICATIONS = [
    {
        id: "notif-1",
        recipientRole: "district",
        recipientId: "dist-2-1", // Ayetoro
        message: "Welcome to the Lajna Welfare App! You can now manage beneficiaries and file monthly reports.",
        type: "info",
        timestamp: "2026-05-25T08:00:00Z",
        read: false
    },
    {
        id: "notif-2",
        recipientRole: "district",
        recipientId: "dist-2-1", // Ayetoro
        message: "Monthly Welfare Report for May 2026 is due by June 5, 2026.",
        type: "warning",
        timestamp: "2026-05-30T09:00:00Z",
        read: false
    },
    {
        id: "notif-3",
        recipientRole: "region",
        recipientId: "region-2", // Ogun
        message: "Ogun Waterside District has submitted their welfare report for May 2026.",
        type: "info",
        timestamp: "2026-05-29T10:15:00Z",
        read: false
    }
];

const WelfareStore = {
    supabaseClient: null,
    isSupabaseEnabled: false,

    init() {
        if (!localStorage.getItem("lajna_regions")) {
            localStorage.setItem("lajna_regions", JSON.stringify(DEFAULT_REGIONS));
        }
        if (!localStorage.getItem("lajna_districts")) {
            localStorage.setItem("lajna_districts", JSON.stringify(DEFAULT_DISTRICTS));
        }
        if (!localStorage.getItem("lajna_beneficiaries")) {
            localStorage.setItem("lajna_beneficiaries", JSON.stringify(DEFAULT_BENEFICIARIES));
        }
        if (!localStorage.getItem("lajna_reports")) {
            localStorage.setItem("lajna_reports", JSON.stringify(DEFAULT_REPORTS));
        }
        if (!localStorage.getItem("lajna_supplementary_reports")) {
            localStorage.setItem("lajna_supplementary_reports", JSON.stringify([]));
        }
        if (!localStorage.getItem("lajna_notifications")) {
            localStorage.setItem("lajna_notifications", JSON.stringify(DEFAULT_NOTIFICATIONS));
        }
        
        // Initial Active User Profile
        if (!localStorage.getItem("lajna_active_role")) {
            localStorage.setItem("lajna_active_role", "district-2-1"); // Default: Ayetoro District Secretary
        }

        // Initialize Supabase Client if credentials exist
        const dbUrl = localStorage.getItem("lajna_supabase_url");
        const dbKey = localStorage.getItem("lajna_supabase_key");
        if (dbUrl && dbKey) {
            try {
                if (typeof supabase !== 'undefined') {
                    this.supabaseClient = supabase.createClient(dbUrl, dbKey);
                    this.isSupabaseEnabled = true;
                    console.log("Supabase connected on init!");
                    this.pullAllFromBackend();
                }
            } catch (err) {
                console.error("Failed to connect to Supabase on init:", err);
            }
        }
    },

    getRegions() {
        return JSON.parse(localStorage.getItem("lajna_regions")) || [];
    },

    getDistricts() {
        return JSON.parse(localStorage.getItem("lajna_districts")) || [];
    },
    
    getDistrictsByRegion(regionId) {
        return this.getDistricts().filter(d => d.regionId === regionId);
    },

    getSupplementaryReports() {
        return JSON.parse(localStorage.getItem("lajna_supplementary_reports")) || [];
    },

    saveSupplementaryReport(report) {
        const reports = this.getSupplementaryReports();
        const existingIndex = reports.findIndex(r => r.id === report.id);
        if (existingIndex !== -1) {
            reports[existingIndex] = report;
        } else {
            report.id = "supp-rep-" + Date.now();
            reports.push(report);
        }
        localStorage.setItem("lajna_supplementary_reports", JSON.stringify(reports));
        return report;
    },

    deleteSupplementaryReport(id) {
        const reports = this.getSupplementaryReports().filter(r => r.id !== id);
        localStorage.setItem("lajna_supplementary_reports", JSON.stringify(reports));
    },

    getBeneficiaries() {
        return JSON.parse(localStorage.getItem("lajna_beneficiaries")) || [];
    },

    saveBeneficiary(beneficiary) {
        const beneficiaries = this.getBeneficiaries();
        if (beneficiary.id) {
            const index = beneficiaries.findIndex(b => b.id === beneficiary.id);
            if (index !== -1) {
                beneficiaries[index] = beneficiary;
            }
        } else {
            beneficiary.id = "ben-" + Date.now();
            beneficiary.status = "Active";
            beneficiaries.push(beneficiary);
        }
        localStorage.setItem("lajna_beneficiaries", JSON.stringify(beneficiaries));
        
        // Sync beneficiary to backend
        this.syncBeneficiaryToBackend(beneficiary);

        return beneficiary;
    },

    deleteBeneficiary(id) {
        const beneficiaries = this.getBeneficiaries().filter(b => b.id !== id);
        localStorage.setItem("lajna_beneficiaries", JSON.stringify(beneficiaries));

        // Sync delete beneficiary
        this.syncDeleteBeneficiaryToBackend(id);
    },

    getReports() {
        return JSON.parse(localStorage.getItem("lajna_reports")) || [];
    },

    getReportById(id) {
        return this.getReports().find(r => r.id === id);
    },

    getReportByParams(districtId, month, year) {
        return this.getReports().find(r => r.districtId === districtId && r.month == month && r.year == year);
    },

    saveReport(report) {
        const reports = this.getReports();
        const existingIndex = reports.findIndex(r => r.id === report.id);
        
        // Make sure fields are formatted properly
        if (report.data && report.data.collections) {
            const due = parseFloat(report.data.collections.dueCollected) || 0;
            const extra = parseFloat(report.data.collections.donationsReceived) || 0;
            const openBal = parseFloat(report.data.collections.openingBalance) || 0;
            
            // Total spending based on assistance list
            const totalSpend = (report.data.assistance || []).reduce((sum, item) => sum + (parseFloat(item.value) || 0), 0);
            
            report.data.collections.closingBalance = openBal + due + extra - totalSpend;
        }

        if (existingIndex !== -1) {
            reports[existingIndex] = report;
        } else {
            reports.push(report);
        }
        localStorage.setItem("lajna_reports", JSON.stringify(reports));

        // Background sync report
        this.syncReportToBackend(report);

        // If it was submitted (i.e. status is "pending"), add notification for Region
        if (report.status === "pending") {
            const district = this.getDistricts().find(d => d.id === report.districtId);
            const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            const monthName = months[report.month - 1] || "May";
            this.addNotification({
                recipientRole: "region",
                recipientId: report.regionId,
                message: `${district ? district.name : 'A district'} has submitted a welfare report for ${monthName} ${report.year}.`,
                type: "info"
            });
        }

        return report;
    },

    updateReportStatus(reportId, status, comments = "") {
        const reports = this.getReports();
        const index = reports.findIndex(r => r.id === reportId);
        if (index !== -1) {
            reports[index].status = status;
            if (comments !== undefined) {
                reports[index].revisionComments = comments;
            }
            localStorage.setItem("lajna_reports", JSON.stringify(reports));

            // Sync status update to backend
            this.syncReportToBackend(reports[index]);

            // Push notifications for approvals/revisions
            const rep = reports[index];
            const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            const monthName = months[rep.month - 1] || "May";

            if (status === "approved") {
                this.addNotification({
                    recipientRole: "district",
                    recipientId: rep.districtId,
                    message: `Your Welfare Report for ${monthName} ${rep.year} has been Approved by the Regional Secretary.`,
                    type: "success"
                });
            } else if (status === "revision") {
                this.addNotification({
                    recipientRole: "district",
                    recipientId: rep.districtId,
                    message: `Revision requested for your ${monthName} ${rep.year} Welfare Report. Reason: "${comments || 'Please verify figures'}"`,
                    type: "warning"
                });
            }

            return reports[index];
        }
        return null;
    },

    getActiveRole() {
        return localStorage.getItem("lajna_active_role") || "district-2-1";
    },

    setActiveRole(roleString) {
        localStorage.setItem("lajna_active_role", roleString);
    },

    // Resolves current user context information
    getCurrentContext() {
        const role = this.getActiveRole();
        
        if (role === "national") {
            return {
                role: "national",
                roleTitle: "National Welfare Administrator",
                userName: "Hajia Ruqayyah Adesina",
                email: "national.welfare@lajna.ng",
                regionId: null,
                districtId: null,
                regionName: "All Regions",
                districtName: "All Districts"
            };
        } else if (role.startsWith("region-")) {
            const region = this.getRegions().find(r => r.id === role);
            return {
                role: "region",
                roleTitle: "Regional Welfare Secretary",
                userName: `Sister Lateefah ${region ? region.name.replace('Region ', '').split(' ')[0] : 'Ogun'}`,
                email: `${role}.welfare@lajna.ng`,
                regionId: role,
                districtId: null,
                regionName: region ? region.name : "Unknown Region",
                districtName: "All Districts"
            };
        } else if (role.startsWith("district-")) {
            // format: "district-2-1" where "2-1" represents regionId and districtId combined or districtId itself
            const distId = role.replace("district-", "dist-");
            const district = this.getDistricts().find(d => d.id === distId);
            const region = district ? this.getRegions().find(r => r.id === district.regionId) : null;
            
            return {
                role: "district",
                roleTitle: "District Welfare Secretary",
                userName: `Sister Aishat ${district ? district.name.split(' ')[0] : 'Ayetoro'}`,
                email: `${district ? district.name.toLowerCase().replace(' ', '') : 'ayetoro'}.welfare@lajna.ng`,
                regionId: district ? district.regionId : "region-2",
                districtId: distId,
                regionName: region ? region.name : "Region 2 (Ogun)",
                districtName: district ? district.name : "Ayetoro"
            };
        }
        
        // Fallback
        return {
            role: "district",
            roleTitle: "District Welfare Secretary",
            userName: "Sister Aishat Bello",
            email: "ayetoro.welfare@lajna.ng",
            regionId: "region-2",
            districtId: "dist-2-1",
            regionName: "Region 2 (Ogun)",
            districtName: "Ayetoro"
        };
    },

    deleteReport(reportId) {
        let reports = this.getReports();
        const rep = reports.find(r => r.id === reportId);
        if (!rep) return false;
        if (rep.status !== "draft") {
            alert("Only report drafts can be deleted.");
            return false;
        }
        reports = reports.filter(r => r.id !== reportId);
        localStorage.setItem("lajna_reports", JSON.stringify(reports));

        // Sync single report deletion
        this.syncDeleteReportToBackend(reportId);

        return true;
    },

    deleteReports(reportIds) {
        let reports = this.getReports();
        let deletedCount = 0;
        let nonDraftCount = 0;
        const deletedIds = [];
        
        reportIds.forEach(id => {
            const rep = reports.find(r => r.id === id);
            if (rep) {
                if (rep.status === "draft") {
                    deletedCount++;
                    deletedIds.push(id);
                } else {
                    nonDraftCount++;
                }
            }
        });

        if (nonDraftCount > 0) {
            alert(`Cannot delete ${nonDraftCount} report(s) because they have already been submitted or approved. Only drafts can be deleted.`);
        }

        if (deletedCount > 0) {
            reports = reports.filter(r => !(reportIds.includes(r.id) && r.status === "draft"));
            localStorage.setItem("lajna_reports", JSON.stringify(reports));

            // Sync bulk deletion
            this.syncBulkDeleteReportsToBackend(deletedIds);

            return true;
        }
        return false;
    },

    getNotifications() {
        return JSON.parse(localStorage.getItem("lajna_notifications")) || [];
    },

    addNotification(notif) {
        const notifs = this.getNotifications();
        const newNotif = {
            id: "notif-" + Date.now() + Math.random().toString(36).substr(2, 5),
            timestamp: new Date().toISOString(),
            read: false,
            ...notif
        };
        notifs.unshift(newNotif); // Add to beginning (latest first)
        localStorage.setItem("lajna_notifications", JSON.stringify(notifs));

        // Sync new notification to backend
        this.syncNotificationToBackend(newNotif);

        return newNotif;
    },

    markNotificationsAsRead(role, recipientId) {
        const notifs = this.getNotifications();
        notifs.forEach(n => {
            if (n.recipientRole === role && n.recipientId === recipientId) {
                n.read = true;
            }
        });
        localStorage.setItem("lajna_notifications", JSON.stringify(notifs));

        // Sync notifications read status
        this.syncMarkNotificationsReadToBackend(role, recipientId);
    },

    clearNotifications(role, recipientId) {
        let notifs = this.getNotifications();
        notifs = notifs.filter(n => !(n.recipientRole === role && n.recipientId === recipientId));
        localStorage.setItem("lajna_notifications", JSON.stringify(notifs));

        // Sync cleared notifications to backend
        this.syncClearNotificationsToBackend(role, recipientId);
    },

    enforcePeriodLimits(monthSelectId, yearSelectId) {
        const monthSelect = document.getElementById(monthSelectId);
        const yearSelect = document.getElementById(yearSelectId);
        if (!monthSelect || !yearSelect) return;

        const updateOptions = () => {
            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth() + 1; // 1-indexed (1 to 12)

            const selectedYearVal = yearSelect.value;
            const selectedYear = parseInt(selectedYearVal);

            // 1. Disable future years
            Array.from(yearSelect.options).forEach(opt => {
                if (opt.value === "all") return;
                const optYear = parseInt(opt.value);
                if (optYear > currentYear) {
                    opt.disabled = true;
                } else {
                    opt.disabled = false;
                }
            });

            // If selected year is disabled, select currentYear
            let changed = false;
            if (yearSelect.selectedOptions[0] && yearSelect.selectedOptions[0].disabled) {
                yearSelect.value = String(currentYear);
                changed = true;
            }

            // 2. Disable months in the month select if year is current year
            const activeYear = parseInt(yearSelect.value);
            Array.from(monthSelect.options).forEach(opt => {
                if (opt.value === "all") return;
                const optMonth = parseInt(opt.value);
                if (!isNaN(activeYear)) {
                    if (activeYear > currentYear) {
                        opt.disabled = true;
                    } else if (activeYear === currentYear) {
                        if (optMonth > currentMonth) {
                            opt.disabled = true;
                        } else {
                            opt.disabled = false;
                        }
                    } else {
                        opt.disabled = false;
                    }
                } else {
                    // if year is "all", we enable all months or keep them enabled
                    opt.disabled = false;
                }
            });

            // If selected month is disabled, select the max enabled month
            if (monthSelect.selectedOptions[0] && monthSelect.selectedOptions[0].disabled) {
                if (activeYear === currentYear) {
                    monthSelect.value = String(currentMonth);
                } else {
                    const enabledOptions = Array.from(monthSelect.options).filter(o => !o.disabled && o.value !== "all");
                    if (enabledOptions.length > 0) {
                        monthSelect.value = enabledOptions[enabledOptions.length - 1].value;
                    } else {
                        monthSelect.value = "12";
                    }
                }
                changed = true;
            }

            if (changed) {
                // Dispatch change event to trigger listeners
                monthSelect.dispatchEvent(new Event("change"));
            }
        };

        // Run immediately
        updateOptions();

        // Listen for year change to update month options
        yearSelect.addEventListener("change", updateOptions);
    },

    // =============================================================
    // SUPABASE BACKEND SYNCHRONIZATION METHODS (Local-First Sync)
    // =============================================================
    async syncReportToBackend(report) {
        if (!this.isSupabaseEnabled || !this.supabaseClient) return;
        try {
            const { error } = await this.supabaseClient
                .from('reports')
                .upsert({
                    id: report.id,
                    region_id: report.regionId,
                    district_id: report.districtId,
                    month: report.month,
                    year: report.year,
                    status: report.status,
                    submitted_by: report.submittedBy || '',
                    president_name: report.presidentName || '',
                    email: report.email || '',
                    submitted_date: report.submittedDate || null,
                    revision_comments: report.revisionComments || '',
                    data: report.data,
                    updated_at: new Date().toISOString()
                });
            if (error) console.error("Sync report error:", error);
        } catch (err) {
            console.error("Sync report exception:", err);
        }
    },

    async syncDeleteReportToBackend(reportId) {
        if (!this.isSupabaseEnabled || !this.supabaseClient) return;
        try {
            const { error } = await this.supabaseClient
                .from('reports')
                .delete()
                .eq('id', reportId);
            if (error) console.error("Delete report error:", error);
        } catch (err) {
            console.error("Delete report exception:", err);
        }
    },

    async syncBulkDeleteReportsToBackend(reportIds) {
        if (!this.isSupabaseEnabled || !this.supabaseClient) return;
        try {
            const { error } = await this.supabaseClient
                .from('reports')
                .delete()
                .in('id', reportIds);
            if (error) console.error("Bulk delete reports error:", error);
        } catch (err) {
            console.error("Bulk delete reports exception:", err);
        }
    },

    async syncBeneficiaryToBackend(b) {
        if (!this.isSupabaseEnabled || !this.supabaseClient) return;
        try {
            const { error } = await this.supabaseClient
                .from('beneficiaries')
                .upsert({
                    id: b.id,
                    district_id: b.districtId,
                    name: b.name,
                    age: b.age ? parseInt(b.age) : null,
                    category: b.category,
                    contact: b.contact || '',
                    family_size: b.familySize ? parseInt(b.familySize) : 1,
                    address: b.address || '',
                    monthly_assistance_needed: b.monthlyAssistanceNeeded ? parseFloat(b.monthlyAssistanceNeeded) : 0,
                    status: (b.status || 'active').toLowerCase()
                });
            if (error) console.error("Sync beneficiary error:", error);
        } catch (err) {
            console.error("Sync beneficiary exception:", err);
        }
    },

    async syncDeleteBeneficiaryToBackend(id) {
        if (!this.isSupabaseEnabled || !this.supabaseClient) return;
        try {
            const { error } = await this.supabaseClient
                .from('beneficiaries')
                .delete()
                .eq('id', id);
            if (error) console.error("Delete beneficiary error:", error);
        } catch (err) {
            console.error("Delete beneficiary exception:", err);
        }
    },

    async syncNotificationToBackend(n) {
        if (!this.isSupabaseEnabled || !this.supabaseClient) return;
        try {
            const { error } = await this.supabaseClient
                .from('notifications')
                .upsert({
                    id: n.id,
                    recipient_role: n.recipientRole,
                    recipient_id: n.recipientId,
                    message: n.message,
                    type: n.type,
                    read: n.read || false,
                    timestamp: n.timestamp || new Date().toISOString()
                });
            if (error) console.error("Sync notification error:", error);
        } catch (err) {
            console.error("Sync notification exception:", err);
        }
    },

    async syncClearNotificationsToBackend(role, recipientId) {
        if (!this.isSupabaseEnabled || !this.supabaseClient) return;
        try {
            const { error } = await this.supabaseClient
                .from('notifications')
                .delete()
                .eq('recipient_role', role)
                .eq('recipient_id', recipientId);
            if (error) console.error("Clear notifications error:", error);
        } catch (err) {
            console.error("Clear notifications exception:", err);
        }
    },

    async syncMarkNotificationsReadToBackend(role, recipientId) {
        if (!this.isSupabaseEnabled || !this.supabaseClient) return;
        try {
            const { error } = await this.supabaseClient
                .from('notifications')
                .update({ read: true })
                .eq('recipient_role', role)
                .eq('recipient_id', recipientId);
            if (error) console.error("Mark notifications read error:", error);
        } catch (err) {
            console.error("Mark notifications read exception:", err);
        }
    },

    async pullReportsFromBackend() {
        if (!this.isSupabaseEnabled || !this.supabaseClient) return;
        try {
            const { data, error } = await this.supabaseClient
                .from('reports')
                .select('*');
            if (error) {
                console.error("Pull reports error:", error);
                return;
            }
            if (data) {
                const localReports = data.map(r => ({
                    id: r.id,
                    regionId: r.region_id,
                    districtId: r.district_id,
                    month: r.month,
                    year: r.year,
                    status: r.status,
                    submittedBy: r.submitted_by,
                    presidentName: r.president_name,
                    email: r.email,
                    submittedDate: r.submitted_date,
                    revisionComments: r.revision_comments,
                    data: r.data
                }));
                localStorage.setItem("lajna_reports", JSON.stringify(localReports));
            }
        } catch (err) {
            console.error("Pull reports exception:", err);
        }
    },

    async pullBeneficiariesFromBackend() {
        if (!this.isSupabaseEnabled || !this.supabaseClient) return;
        try {
            const { data, error } = await this.supabaseClient
                .from('beneficiaries')
                .select('*');
            if (error) {
                console.error("Pull beneficiaries error:", error);
                return;
            }
            if (data) {
                const localBeneficiaries = data.map(b => ({
                    id: b.id,
                    districtId: b.district_id,
                    name: b.name,
                    age: b.age,
                    category: b.category,
                    contact: b.contact,
                    familySize: b.family_size,
                    address: b.address,
                    monthlyAssistanceNeeded: parseFloat(b.monthly_assistance_needed) || 0,
                    status: b.status.charAt(0).toUpperCase() + b.status.slice(1) // match 'Active' camel case
                }));
                localStorage.setItem("lajna_beneficiaries", JSON.stringify(localBeneficiaries));
            }
        } catch (err) {
            console.error("Pull beneficiaries exception:", err);
        }
    },

    async pullNotificationsFromBackend() {
        if (!this.isSupabaseEnabled || !this.supabaseClient) return;
        try {
            const { data, error } = await this.supabaseClient
                .from('notifications')
                .select('*');
            if (error) {
                console.error("Pull notifications error:", error);
                return;
            }
            if (data) {
                const localNotifications = data.map(n => ({
                    id: n.id,
                    recipientRole: n.recipient_role,
                    recipientId: n.recipient_id,
                    message: n.message,
                    type: n.type,
                    read: n.read,
                    timestamp: n.timestamp
                }));
                localStorage.setItem("lajna_notifications", JSON.stringify(localNotifications));
            }
        } catch (err) {
            console.error("Pull notifications exception:", err);
        }
    },

    async pullAllFromBackend() {
        if (!this.isSupabaseEnabled) return;
        console.log("Syncing database with Supabase backend...");
        await Promise.all([
            this.pullReportsFromBackend(),
            this.pullBeneficiariesFromBackend(),
            this.pullNotificationsFromBackend()
        ]);
        console.log("Sync complete!");
        if (window.WelfareDashboard) {
            window.WelfareDashboard.refresh();
        }
        if (window.WelfareReports) {
            window.WelfareReports.refresh();
        }
        if (window.WelfareBeneficiaries) {
            window.WelfareBeneficiaries.refresh();
        }
    }
    }
};

// Initialize the store
WelfareStore.init();
window.WelfareStore = WelfareStore;
