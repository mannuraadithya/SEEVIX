const API_URL = "http://localhost:8080/api/complaints";

const tableBody = document.getElementById("complaintsTableBody");

const totalCount = document.getElementById("totalCount");
const submittedCount = document.getElementById("submittedCount");
const progressCount = document.getElementById("progressCount");
const resolvedCount = document.getElementById("resolvedCount");

const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const priorityFilter = document.getElementById("priorityFilter");
const statusFilter = document.getElementById("statusFilter");

const resultCount = document.getElementById("resultCount");
const refreshButton = document.getElementById("refreshButton");

const complaintModal = document.getElementById("complaintModal");
const closeModal = document.getElementById("closeModal");
const modalTitle = document.getElementById("modalTitle");
const complaintDetails = document.getElementById("complaintDetails");

let allComplaints = [];
let selectedComplaint = null;

// Load complaints from backend
async function loadComplaints() {
    tableBody.textContent = "Loading complaints...";

    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Unable to fetch complaints.");
        }

        allComplaints = await response.json();

        updateStatistics();
        populateCategoryFilter();
        applyFilters();

    } catch (error) {
        console.error(error);

        tableBody.textContent =
            "Unable to load complaints. Make sure the backend is running.";
    }
}

// Update dashboard statistics
function updateStatistics() {
    totalCount.textContent = allComplaints.length;

    submittedCount.textContent = allComplaints.filter(
        complaint => complaint.status === "Submitted"
    ).length;

    progressCount.textContent = allComplaints.filter(
        complaint => complaint.status === "In Progress"
    ).length;

    resolvedCount.textContent = allComplaints.filter(
        complaint => complaint.status === "Resolved"
    ).length;
}

// Populate category dropdown
function populateCategoryFilter() {
    const selectedValue = categoryFilter.value;

    const categories = [
        ...new Set(
            allComplaints
                .map(complaint => complaint.category)
                .filter(Boolean)
        )
    ].sort();

    categoryFilter.replaceChildren();

    const allOption = document.createElement("option");
    allOption.value = "";
    allOption.textContent = "All Categories";
    categoryFilter.appendChild(allOption);

    categories.forEach(category => {
        const option = document.createElement("option");
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });

    categoryFilter.value = categories.includes(selectedValue)
        ? selectedValue
        : "";
}

// Apply search and filters
function applyFilters() {
    const search = searchInput.value.trim().toLowerCase();
    const category = categoryFilter.value;
    const priority = priorityFilter.value;
    const status = statusFilter.value;

    const filtered = allComplaints.filter(complaint => {
        const matchesSearch =
            String(complaint.id).includes(search) ||
            (complaint.title || "").toLowerCase().includes(search);

        const matchesCategory =
            !category || complaint.category === category;

        const matchesPriority =
            !priority || complaint.priority === priority;

        const matchesStatus =
            !status || complaint.status === status;

        return (
            matchesSearch &&
            matchesCategory &&
            matchesPriority &&
            matchesStatus
        );
    });

    renderComplaints(filtered);
}

// Render complaint table
function renderComplaints(complaints) {
    tableBody.replaceChildren();

    resultCount.textContent = `${complaints.length} complaints`;

    if (complaints.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 7;
        cell.textContent = "No complaints found.";
        cell.style.textAlign = "center";
        cell.style.padding = "25px";

        row.appendChild(cell);
        tableBody.appendChild(row);
        return;
    }

    complaints.forEach(complaint => {
        const row = document.createElement("tr");

        const values = [
    `#${complaint.id}`,
    complaint.title || "Untitled",
    complaint.category || "N/A",
    complaint.priority || "N/A",
    formatDate(complaint.submittedAt),
    complaint.status || "Submitted"
];

        values.forEach((value, index) => {
            const cell = document.createElement("td");

            if (index === 3) {
                cell.appendChild(createBadge(value, "priority"));
            } else if (index === 5) {
                cell.appendChild(createBadge(value, "status"));
            } else {
                cell.textContent = value;
            }

            if (index === 0) {
                cell.classList.add("complaint-id");
            }

            if (index === 1) {
                cell.classList.add("complaint-name");
            }

            row.appendChild(cell);
        });

        const actionCell = document.createElement("td");
        const viewButton = document.createElement("button");

        viewButton.textContent = "View";
        viewButton.className = "view-complaint-btn";

        viewButton.addEventListener("click", () => {
            openComplaintDetails(complaint.id);
        });

        actionCell.appendChild(viewButton);
        row.appendChild(actionCell);

        tableBody.appendChild(row);
    });
}

// Create priority and status badges
function createBadge(value, type) {
    const badge = document.createElement("span");
    const safeValue = value || "N/A";

    badge.textContent = safeValue;

    const className = safeValue
        .toLowerCase()
        .replace(/\s+/g, "-");

    badge.className = `${type}-badge ${className}`;

    return badge;
}

// Format date
function formatDate(dateValue) {
    if (!dateValue) return "N/A";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) return "N/A";

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

// Open complaint details modal
function openComplaintDetails(id) {
    selectedComplaint = allComplaints.find(
        complaint => complaint.id === id
    );

    if (!selectedComplaint) return;

    modalTitle.textContent =
        selectedComplaint.title || "Complaint Details";

    complaintDetails.replaceChildren();

    const details = [
        ["Complaint ID", `#${selectedComplaint.id}`],
        ["Category", selectedComplaint.category],
        ["Priority", selectedComplaint.priority],
        ["Current Status", selectedComplaint.status],
        ["Submitted On", formatDate(selectedComplaint.submittedAt)],
        ["Address", selectedComplaint.address],
        ["Description", selectedComplaint.description],
        ["Image Filename", selectedComplaint.imageName],
        ["Latitude", selectedComplaint.latitude],
        ["Longitude", selectedComplaint.longitude]
    ];

    details.forEach(([label, value]) => {
        const detail = document.createElement("div");
        detail.className = "modal-detail";

        const heading = document.createElement("strong");
        heading.textContent = label;

        const content = document.createElement("p");
        content.textContent =
            value === null || value === undefined || value === ""
                ? "Not provided"
                : String(value);

        detail.append(heading, content);
        complaintDetails.appendChild(detail);
    });

    // Status update controls
    const statusSection = document.createElement("div");
    statusSection.className = "modal-status-section";

    const statusHeading = document.createElement("h3");
    statusHeading.textContent = "Update Complaint Status";

    const controls = document.createElement("div");
    controls.className = "modal-status-controls";

    const statusSelect = document.createElement("select");
    statusSelect.id = "newComplaintStatus";

    const statuses = [
        "Submitted",
        "Under Review",
        "In Progress",
        "Resolved"
    ];

    statuses.forEach(status => {
        const option = document.createElement("option");
        option.value = status;
        option.textContent = status;

        if (status === selectedComplaint.status) {
            option.selected = true;
        }

        statusSelect.appendChild(option);
    });

    const saveButton = document.createElement("button");
    saveButton.textContent = "Save Status";
    saveButton.className = "view-complaint-btn";

    const message = document.createElement("p");
    message.className = "modal-message";
    message.id = "statusMessage";

    saveButton.addEventListener("click", () => {
        updateComplaintStatus(
            selectedComplaint.id,
            statusSelect.value,
            message,
            saveButton
        );
    });

    controls.append(statusSelect, saveButton);
    statusSection.append(statusHeading, controls, message);

    complaintDetails.appendChild(statusSection);

    complaintModal.classList.add("show");
}

// Update complaint status in PostgreSQL
async function updateComplaintStatus(id, newStatus, message, button) {
    button.disabled = true;
    message.textContent = "Saving status...";

    try {
        const response = await fetch(`${API_URL}/${id}/status`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                status: newStatus
            })
        });

        if (!response.ok) {
            throw new Error("Status update failed.");
        }

        const updatedComplaint = await response.json();

        allComplaints = allComplaints.map(complaint =>
            complaint.id === id ? updatedComplaint : complaint
        );

        selectedComplaint = updatedComplaint;

        updateStatistics();
        applyFilters();

        message.textContent = "Status updated successfully!";
        message.style.color = "green";

    } catch (error) {
        console.error(error);

        message.textContent = "Unable to update status. Please try again.";
        message.style.color = "red";

    } finally {
        button.disabled = false;
    }
}

// Close modal
closeModal.addEventListener("click", () => {
    complaintModal.classList.remove("show");
});

complaintModal.addEventListener("click", event => {
    if (event.target === complaintModal) {
        complaintModal.classList.remove("show");
    }
});

// Search and filters
searchInput.addEventListener("input", applyFilters);
categoryFilter.addEventListener("change", applyFilters);
priorityFilter.addEventListener("change", applyFilters);
statusFilter.addEventListener("change", applyFilters);

// Refresh complaints
refreshButton.addEventListener("click", loadComplaints);

// Initial load
loadComplaints();