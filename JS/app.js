
document.addEventListener("DOMContentLoaded", () => {

    if (window.lucide) {
        lucide.createIcons();
    }

    const API_URL = "http://localhost:8080/api/complaints";

    // Notification function
    function showNotification(message) {
        let toast = document.querySelector(".seevix-toast");

        if (!toast) {
            toast = document.createElement("div");
            toast.className = "seevix-toast";
            document.body.appendChild(toast);
        }

        toast.textContent = message;
        toast.classList.add("show");

        setTimeout(() => {
            toast.classList.remove("show");
        }, 3000);
    }

    // Navigation: Report Issue
    const reportButtons = document.querySelectorAll(
        "#reportButton, .report-button, [data-page='report']"
    );

    reportButtons.forEach(button => {
        button.addEventListener("click", () => {
            window.location.href = "report.html";
        });
    });

    // Navigation: sidebar links
    document.querySelectorAll("a").forEach(link => {
        const text = link.textContent.trim().toLowerCase();

        if (text.includes("track complaint")) {
            link.href = "track.html";
        }

        if (text.includes("issues map")) {
            link.href = "map.html";
        }

        if (
            text.includes("report issue") ||
            text.includes("report new issue")
        ) {
            link.href = "report.html";
        }
    });

    // Notifications
    const notificationButton = document.querySelector(
        "#notificationButton, .notification-button"
    );

    if (notificationButton) {
        notificationButton.addEventListener("click", () => {
            showNotification("You have no new notifications.");
        });
    }

    // Format priority CSS classes
    function getPriorityClass(priority) {
        const value = (priority || "").toLowerCase();

        if (value === "urgent") return "urgent";
        if (value === "high") return "high";
        if (value === "medium") return "medium";
        if (value === "low") return "low";

        return "medium";
    }

    // Format status CSS classes
    function getStatusClass(status) {
        const value = (status || "").toLowerCase();

        if (value === "resolved") return "resolved";
        if (value === "in progress") return "progress";

        return "pending";
    }

    // Update dashboard statistics
    function updateStatistics(complaints) {
        const total = complaints.length;

        const resolved = complaints.filter(
            complaint => complaint.status === "Resolved"
        ).length;

        const pending = total - resolved;

        document.getElementById("totalIssues").textContent = total;
        document.getElementById("pendingIssues").textContent = pending;
        document.getElementById("resolvedIssues").textContent = resolved;

        // AI is not connected yet, so do not display fake statistics.
        document.getElementById("aiIssues").textContent = "—";
    }

    // Display recent complaints
    function displayRecentComplaints(complaints) {
        const table = document.getElementById("complaintTable");

        table.innerHTML = "";

        if (complaints.length === 0) {
            const row = document.createElement("tr");
            const cell = document.createElement("td");

            cell.colSpan = 4;
            cell.textContent = "No complaints have been submitted yet.";
            cell.style.textAlign = "center";
            cell.style.padding = "25px";

            row.appendChild(cell);
            table.appendChild(row);

            return;
        }

        // Sort by latest submission date
        const recentComplaints = [...complaints].sort((a, b) => {
            return new Date(b.submittedAt || 0) -
                   new Date(a.submittedAt || 0);
        });

        // Display latest 5 complaints
        recentComplaints.slice(0, 5).forEach(complaint => {
            const row = document.createElement("tr");

            // Complaint title and ID
            const complaintCell = document.createElement("td");

            const title = document.createElement("strong");
            title.textContent = complaint.title || "Untitled Complaint";

            const id = document.createElement("small");
            id.textContent = "#" + complaint.id;

            complaintCell.append(title, id);

            // Category
            const categoryCell = document.createElement("td");
            categoryCell.textContent =
                complaint.category || "Uncategorised";

            // Priority
            const priorityCell = document.createElement("td");

            const priority = document.createElement("span");
            priority.className =
                "priority " + getPriorityClass(complaint.priority);

            priority.textContent = complaint.priority || "Not specified";

            priorityCell.appendChild(priority);

            // Status
            const statusCell = document.createElement("td");

            const status = document.createElement("span");
            status.className =
                "status " + getStatusClass(complaint.status);

            status.textContent = complaint.status || "Submitted";

            statusCell.appendChild(status);

            row.append(
                complaintCell,
                categoryCell,
                priorityCell,
                statusCell
            );

            table.appendChild(row);
        });
    }

    // Fetch dashboard data from Spring Boot
    async function loadDashboard() {
        try {
            const response = await fetch(API_URL);

            if (!response.ok) {
                throw new Error("Server error: " + response.status);
            }

            const complaints = await response.json();

            if (!Array.isArray(complaints)) {
                throw new Error("Invalid complaint data received.");
            }

            updateStatistics(complaints);
            displayRecentComplaints(complaints);

            console.log(
                "Dashboard loaded from PostgreSQL:",
                complaints
            );

        } catch (error) {
            console.error("Dashboard loading error:", error);

            document.getElementById("complaintTable").innerHTML =
                `<tr>
                    <td colspan="4" style="text-align:center;padding:25px;">
                        Unable to load complaints. Check your backend connection.
                    </td>
                </tr>`;

            showNotification(
                "Unable to connect to the SEEVIX backend."
            );
        }
    }

    // Initial dashboard load
    loadDashboard();

    console.log("SEEVIX dashboard connected to backend.");

});
