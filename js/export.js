// Export CSV Utility Helper functions

const WelfareExport = {
    getMonthName(monthNum) {
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        return months[monthNum - 1] || "May";
    },

    exportRegionalSummaryToCSV(regionId, month, year) {
        const regionName = WelfareStore.getRegions().find(r => r.id === regionId)?.name || "Region";
        const reports = WelfareStore.getReports().filter(r => r.regionId === regionId && r.month == month && r.year == year && r.status === "approved");

        if (reports.length === 0) {
            alert("No approved district reports found to export for this month!");
            return;
        }

        // Initialize summation accumulators
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

        reports.forEach(r => {
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

        // Construct CSV content structure
        const csvRows = [
            [`LAJNA IMAILLAH ${regionName.toUpperCase()}`],
            [`Welfare Summary Report - ${this.getMonthName(month)} ${year}`],
            [],
            [`Approved Districts Reporting`, reports.length],
            [],
            [`Welfare Indicator`, `Consolidated Total`],
            [`Lajna Members`, totalMembers],
            [`Aged Lajna`, totalAged],
            [`Widows`, totalWidows],
            [`Orphans`, totalOrphans],
            [`Welfare Due Collected`, `N${totalDue}`],
            [`Additional Donations Received`, `N${totalDonations}`],
            [`Total Welfare Spending`, `N${totalSpending}`],
            [`Home Visits Conducted`, totalHomeVisits],
            [`Skill Acquisition Programmes Held`, skillProgsCount],
            [`Participants in Skill Acquisition`, skillParticipants],
            [],
            [`Districts Included in this summary:`],
            [`District Name`, `Submitted By`, `Welfare Secretary Name`, `Submission Date`]
        ];

        reports.forEach(r => {
            const distName = WelfareStore.getDistricts().find(d => d.id === r.districtId)?.name || "Unknown";
            csvRows.push([distName, r.email, r.submittedBy, r.submittedDate]);
        });

        // Convert array to CSV string
        const csvContent = csvRows.map(e => e.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(",")).join("\n");

        // Download link execution
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        
        const cleanRegionName = regionName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        link.setAttribute("href", url);
        link.setAttribute("download", `${cleanRegionName}_welfare_summary_${this.getMonthName(month).toLowerCase()}_${year}.csv`);
        link.style.visibility = "hidden";
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

window.WelfareExport = WelfareExport;
