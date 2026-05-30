// Centralized Data Store for Lajna Welfare App Mgt

const DEFAULT_REGIONS = [
    { id: "region-1", name: "Region 1 (Lagos)" },
    { id: "region-2", name: "Region 2 (Ogun)" },
    { id: "region-3", name: "Region 3 (Oyo)" },
    { id: "region-4", name: "Region 4 (Osun)" },
    { id: "region-5", name: "Region 5 (Kwara)" },
    { id: "region-6", name: "Region 6 (Edo/Delta)" },
    { id: "region-7", name: "Region 7 (Rivers)" },
    { id: "region-8", name: "Region 8 (Enugu)" },
    { id: "region-9", name: "Region 9 (Kaduna)" },
    { id: "region-10", name: "Region 10 (Kano)" },
    { id: "region-11", name: "Region 11 (FCT Abuja)" }
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
    { id: "dist-5-1", regionId: "region-5", name: "Ilorin" },
    { id: "dist-6-1", regionId: "region-6", name: "Benin City" },
    { id: "dist-7-1", regionId: "region-7", name: "Port Harcourt" },
    { id: "dist-8-1", regionId: "region-8", name: "Enugu Central" },
    { id: "dist-9-1", regionId: "region-9", name: "Kaduna South" },
    { id: "dist-10-1", regionId: "region-10", name: "Kano Central" },
    { id: "dist-11-1", regionId: "region-11", name: "Gwagwalada" }
];

const DEFAULT_BENEFICIARIES = [
    { id: "ben-1", name: "Fatimah Alao", category: "Widow", phone: "+2348031234567", address: "12, Shodeke Street, Abeokuta", districtId: "dist-2-3", status: "Active" },
    { id: "ben-2", name: "Zainab Ibrahim", category: "Orphan", phone: "+2348123456789", address: "Ayetoro Mission House Road", districtId: "dist-2-1", status: "Active" },
    { id: "ben-3", name: "Aishat Yusuf", category: "Orphan", phone: "+2348154321098", address: "Ayetoro Mission House Road", districtId: "dist-2-1", status: "Active" },
    { id: "ben-4", name: "Rukayah Solihu", category: "Sick/Disabled", phone: "+2349076543210", address: "Waterfront Estate, Ogun Waterside", districtId: "dist-2-2", status: "Active" },
    { id: "ben-5", name: "Mariam Abdulsalam", category: "Widow", phone: "+2348029876543", address: "Waterfront Estate, Ogun Waterside", districtId: "dist-2-2", status: "Active" },
    { id: "ben-6", name: "Halimah Bello", category: "Elderly", phone: "+2348050001112", address: "Sabon Gari, Kano", districtId: "dist-10-1", status: "Active" }
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

const WelfareStore = {
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
        
        // Initial Active User Profile
        if (!localStorage.getItem("lajna_active_role")) {
            localStorage.setItem("lajna_active_role", "district-2-1"); // Default: Ayetoro District Secretary
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
        return beneficiary;
    },

    deleteBeneficiary(id) {
        const beneficiaries = this.getBeneficiaries().filter(b => b.id !== id);
        localStorage.setItem("lajna_beneficiaries", JSON.stringify(beneficiaries));
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
    }
};

// Initialize the store
WelfareStore.init();
window.WelfareStore = WelfareStore;
