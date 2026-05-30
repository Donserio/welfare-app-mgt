// Beneficiary Database Management Interface

const WelfareBeneficiaries = {
    init() {
        // Modal buttons wiring
        document.getElementById("add-beneficiary-btn").addEventListener("click", () => this.openAddModal());
        document.getElementById("close-beneficiary-modal").addEventListener("click", () => this.closeModal());
        document.getElementById("cancel-beneficiary-btn").addEventListener("click", () => this.closeModal());
        
        // Form Submission
        document.getElementById("beneficiary-form").addEventListener("submit", (e) => {
            e.preventDefault();
            this.handleSave();
        });

        // Live filters
        document.getElementById("ben-search-box").addEventListener("input", () => this.renderList());
        document.getElementById("ben-filter-category").addEventListener("change", () => this.renderList());

        window.WelfareBeneficiaries = this;
    },

    refresh() {
        this.renderList();
        this.populateDistrictSelect();
    },

    populateDistrictSelect() {
        const select = document.getElementById("ben-form-district");
        select.innerHTML = "";

        const ctx = WelfareStore.getCurrentContext();
        let districts = [];

        if (ctx.role === "district") {
            // Lock to user's district
            districts = WelfareStore.getDistricts().filter(d => d.id === ctx.districtId);
            document.getElementById("ben-form-district-container").style.display = "none";
        } else if (ctx.role === "region") {
            // All districts in the region
            districts = WelfareStore.getDistrictsByRegion(ctx.regionId);
            document.getElementById("ben-form-district-container").style.display = "block";
        } else {
            // National can select all districts
            districts = WelfareStore.getDistricts();
            document.getElementById("ben-form-district-container").style.display = "block";
        }

        districts.forEach(d => {
            const opt = document.createElement("option");
            opt.value = d.id;
            opt.textContent = `${d.name} (${WelfareStore.getRegions().find(r => r.id === d.regionId).name.replace('Region ', '')})`;
            select.appendChild(opt);
        });
    },

    renderList() {
        const tableBody = document.getElementById("beneficiary-records-table");
        tableBody.innerHTML = "";

        const ctx = WelfareStore.getCurrentContext();
        const searchVal = document.getElementById("ben-search-box").value.toLowerCase();
        const categoryVal = document.getElementById("ben-filter-category").value;

        let list = WelfareStore.getBeneficiaries();

        // Scope filter based on active role context
        if (ctx.role === "district") {
            list = list.filter(b => b.districtId === ctx.districtId);
        } else if (ctx.role === "region") {
            const districtIds = WelfareStore.getDistrictsByRegion(ctx.regionId).map(d => d.id);
            list = list.filter(b => districtIds.includes(b.districtId));
        }

        // Apply drop-down category filter
        if (categoryVal !== "all") {
            list = list.filter(b => b.category === categoryVal);
        }

        // Apply text search box filter
        if (searchVal) {
            list = list.filter(b => 
                b.name.toLowerCase().includes(searchVal) || 
                b.phone.includes(searchVal) || 
                b.address.toLowerCase().includes(searchVal)
            );
        }

        if (list.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 30px; color: var(--text-muted);">No beneficiary records found.</td></tr>`;
            return;
        }

        list.forEach(b => {
            const district = WelfareStore.getDistricts().find(d => d.id === b.districtId);
            const distName = district ? district.name : "Unknown";

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><strong>${b.name}</strong></td>
                <td><span class="badge" style="background-color: var(--primary-ultra-light); color: var(--primary); padding: 2px 8px; border: 1px solid var(--border); font-size: 0.75rem;">${b.category}</span></td>
                <td>${distName}</td>
                <td>${b.phone}</td>
                <td><span style="font-size: 0.8rem; display:-webkit-box; -webkit-line-clamp:1; -webkit-box-orient:vertical; overflow:hidden;" title="${b.address}">${b.address}</span></td>
                <td><span class="badge" style="background-color: var(--success-light); color: #059669; font-size: 0.7rem;">${b.status}</span></td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="WelfareBeneficiaries.openEditModal('${b.id}')" title="Edit"><i class="fa-solid fa-user-gear"></i></button>
                    <button class="btn btn-danger btn-sm" onclick="WelfareBeneficiaries.handleDelete('${b.id}')" title="Delete"><i class="fa-solid fa-trash-can"></i></button>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    },

    openAddModal() {
        // Reset form
        document.getElementById("beneficiary-modal-title").textContent = "Register New Beneficiary";
        document.getElementById("ben-form-id").value = "";
        document.getElementById("ben-form-name").value = "";
        document.getElementById("ben-form-category").value = "Widow";
        document.getElementById("ben-form-phone").value = "";
        document.getElementById("ben-form-address").value = "";
        
        this.populateDistrictSelect();
        
        // Context auto-select
        const ctx = WelfareStore.getCurrentContext();
        if (ctx.districtId) {
            document.getElementById("ben-form-district").value = ctx.districtId;
        }

        document.getElementById("beneficiary-modal").classList.add("active");
    },

    openEditModal(id) {
        const list = WelfareStore.getBeneficiaries();
        const item = list.find(b => b.id === id);
        if (!item) return;

        document.getElementById("beneficiary-modal-title").textContent = "Edit Beneficiary Details";
        document.getElementById("ben-form-id").value = item.id;
        document.getElementById("ben-form-name").value = item.name;
        document.getElementById("ben-form-category").value = item.category;
        document.getElementById("ben-form-phone").value = item.phone;
        
        this.populateDistrictSelect();
        document.getElementById("ben-form-district").value = item.districtId;
        document.getElementById("ben-form-address").value = item.address;

        document.getElementById("beneficiary-modal").classList.add("active");
    },

    closeModal() {
        document.getElementById("beneficiary-modal").classList.remove("active");
    },

    handleSave() {
        const id = document.getElementById("ben-form-id").value;
        const name = document.getElementById("ben-form-name").value;
        const category = document.getElementById("ben-form-category").value;
        const phone = document.getElementById("ben-form-phone").value;
        const districtId = document.getElementById("ben-form-district").value;
        const address = document.getElementById("ben-form-address").value;

        const beneficiary = {
            id: id || null,
            name,
            category,
            phone,
            districtId,
            address,
            status: "Active"
        };

        WelfareStore.saveBeneficiary(beneficiary);
        this.closeModal();
        this.renderList();
        
        // Refresh stats elsewhere if needed
        if (window.WelfareDashboard) window.WelfareDashboard.refresh();
    },

    handleDelete(id) {
        if (confirm("Are you sure you want to delete this beneficiary from the database? This action is irreversible.")) {
            WelfareStore.deleteBeneficiary(id);
            this.renderList();
            if (window.WelfareDashboard) window.WelfareDashboard.refresh();
        }
    }
};

// Initialize
WelfareBeneficiaries.init();
