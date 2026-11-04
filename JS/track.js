document.addEventListener("DOMContentLoaded", () => {
    lucide.createIcons();

    const API_URL = "http://localhost:8080/api/complaints";

    const form = document.getElementById("trackForm");
    const complaintInput = document.getElementById("complaintId");

    const resultSection = document.getElementById("resultSection");
    const emptyState = document.getElementById("emptyState");
    const errorMessage = document.getElementById("errorMessage");
    const errorText = document.getElementById("errorText");

    const statuses = [
        "Submitted",
        "Under Review",
        "In Progress",
        "Resolved"
    ];

    function formatDate(dateString) {
        if (!dateString) {
            return "Not available";
        }

        const date = new Date(dateString);

        if (Number.isNaN(date.getTime())) {
            return "Not available";
        }

        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    }

    function updateTimeline(status) {
        const currentIndex = statuses.indexOf(status);

        document.querySelectorAll(".timeline-item").forEach((item, index) => {
            item.classList.remove("completed", "active");

            const marker = item.querySelector(".timeline-marker");

            if (index <= currentIndex) {
                item.classList.add(
                    index === currentIndex ? "active" : "completed"
                );
            }

            if (index < currentIndex) {
                marker.innerHTML = '<i data-lucide="check"></i>';
            } else {
                marker.innerHTML = "";
            }
        });

        lucide.createIcons();
    }

    function showError(message) {
        resultSection.classList.add("hidden");
        emptyState.classList.add("hidden");

        errorMessage.classList.remove("hidden");
        errorText.textContent = message;

        lucide.createIcons();
    }

    function showComplaint(complaint) {
        const status = statuses.includes(complaint.status)
            ? complaint.status
            : "Submitted";

        document.getElementById("resultTitle").textContent =
            complaint.title || "Untitled Complaint";

        document.getElementById("resultId").textContent =
            "Complaint ID: " + complaint.id;

        document.getElementById("resultCategory").textContent =
            complaint.category || "Not specified";

        document.getElementById("resultPriority").textContent =
            complaint.priority || "Not specified";

        document.getElementById("resultDate").textContent =
            formatDate(complaint.submittedAt);

        document.getElementById("resultAddress").textContent =
            complaint.address || "Not specified";

        document.getElementById("resultDescription").textContent =
            complaint.description || "No description available.";

        const badge = document.getElementById("statusBadge");

        badge.textContent = status;
        badge.className = "status-badge";

        if (status === "Resolved") {
            badge.classList.add("resolved");
        } else if (status === "In Progress") {
            badge.classList.add("progress");
        } else {
            badge.classList.add("review");
        }

        updateTimeline(status);

        errorMessage.classList.add("hidden");
        emptyState.classList.add("hidden");
        resultSection.classList.remove("hidden");

        resultSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }

    async function trackComplaint(searchId) {
        try {
            resultSection.classList.add("hidden");
            emptyState.classList.add("hidden");
            errorMessage.classList.add("hidden");

            const response = await fetch(
                `${API_URL}/${searchId}`
            );

            if (response.status === 404) {
                showError(
                    "No complaint found with ID " + searchId +
                    ". Please check your complaint ID and try again."
                );
                return;
            }

            if (!response.ok) {
                throw new Error("Server error: " + response.status);
            }

            const complaint = await response.json();

            showComplaint(complaint);

        } catch (error) {
            console.error("Error tracking complaint:", error);

            showError(
                "Unable to connect to the SEEVIX server. " +
                "Please make sure the backend is running and try again."
            );
        }
    }

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        const searchId = complaintInput.value.trim();

        if (!searchId) {
            return;
        }

        // Backend complaint IDs are numeric.
        if (!/^[1-9]\d*$/.test(searchId)) {
            showError(
                "Please enter a valid numeric complaint ID."
            );
            return;
        }

        trackComplaint(searchId);
    });

    console.log("SEEVIX complaint tracking connected to backend.");
});