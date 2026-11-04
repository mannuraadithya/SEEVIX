
document.addEventListener("DOMContentLoaded", () => {
    lucide.createIcons();

    const API_URL = "http://localhost:8080/api/complaints";

    // Initialise Leaflet map
    const map = L.map("map").setView([20.5937, 78.9629], 5);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);

    const markerLayer = L.layerGroup().addTo(map);

    let complaints = [];

    const categoryFilter = document.getElementById("categoryFilter");
    const statusFilter = document.getElementById("statusFilter");
    const issueList = document.getElementById("issueList");
    const refreshButton = document.getElementById("refreshButton");

    // Fetch complaints from Spring Boot backend
    async function loadComplaints() {
        refreshButton.disabled = true;

        try {
            refreshButton.innerHTML = "Loading...";

            const response = await fetch(API_URL);

            if (!response.ok) {
                throw new Error("Server error: " + response.status);
            }

            const data = await response.json();

            complaints = Array.isArray(data) ? data : [];

            renderMap();

            console.log("Complaints loaded from PostgreSQL:", complaints);

        } catch (error) {
            console.error("Unable to load complaints:", error);

            complaints = [];
            renderMap();

            issueList.innerHTML = "";

            const errorItem = document.createElement("div");
            errorItem.className = "no-issues";
            errorItem.textContent =
                "Unable to connect to the SEEVIX server. Please check your backend.";

            issueList.appendChild(errorItem);

        } finally {
            refreshButton.disabled = false;
            refreshButton.innerHTML =
                '<i data-lucide="refresh-cw"></i> Refresh Map';

            lucide.createIcons();
        }
    }

    // Get marker colour based on category
    function getCategoryColor(category) {
        const value = (category || "").toLowerCase();

        if (value.includes("road") || value.includes("pothole")) {
            return "#e34b4b";
        }

        if (value.includes("garbage") || value.includes("sanitation")) {
            return "#d89a20";
        }

        if (value.includes("water")) {
            return "#2785d7";
        }

        return "#8756c8";
    }

    // Check whether a complaint has valid GPS coordinates
    function hasCoordinates(complaint) {
        if (
            complaint.latitude === null ||
            complaint.longitude === null ||
            complaint.latitude === "" ||
            complaint.longitude === ""
        ) {
            return false;
        }

        const latitude = Number(complaint.latitude);
        const longitude = Number(complaint.longitude);

        return (
            Number.isFinite(latitude) &&
            Number.isFinite(longitude) &&
            latitude >= -90 &&
            latitude <= 90 &&
            longitude >= -180 &&
            longitude <= 180
        );
    }

    // Create safe marker popup content
    function createPopup(complaint) {
        const content = document.createElement("div");

        const title = document.createElement("strong");
        title.textContent = complaint.title || "Untitled complaint";

        const category = document.createElement("p");
        category.textContent = complaint.category || "Uncategorised";

        const address = document.createElement("p");
        address.textContent = complaint.address || "No address provided";

        const status = document.createElement("p");
        status.textContent = "Status: " + (complaint.status || "Submitted");

        const link = document.createElement("a");
        link.href = "track.html";
        link.textContent = "Track this complaint";

        content.append(title, category, address, status, link);

        return content;
    }

    // Update statistics using all complaints
    function updateStatistics(filteredComplaints) {
        const total = complaints.length;

        const resolved = complaints.filter(
            item => item.status === "Resolved"
        ).length;

        const pending = total - resolved;

        const mapped = complaints.filter(hasCoordinates).length;

        document.getElementById("totalCount").textContent = total;
        document.getElementById("pendingCount").textContent = pending;
        document.getElementById("resolvedCount").textContent = resolved;
        document.getElementById("mappedCount").textContent = mapped;

        document.getElementById("issueListCount").textContent =
            filteredComplaints.length + " complaints";
    }

    // Apply category and status filters
    function getFilteredComplaints() {
        const selectedCategory = categoryFilter.value;
        const selectedStatus = statusFilter.value;

        return complaints.filter(complaint => {
            const categoryMatch =
                selectedCategory === "all" ||
                complaint.category === selectedCategory;

            const statusMatch =
                selectedStatus === "all" ||
                complaint.status === selectedStatus;

            return categoryMatch && statusMatch;
        });
    }

    // Display complaint list
    function renderIssueList(filteredComplaints) {
        issueList.innerHTML = "";

        if (filteredComplaints.length === 0) {
            const empty = document.createElement("div");
            empty.className = "no-issues";
            empty.textContent = "No complaints match these filters.";
            issueList.appendChild(empty);
            return;
        }

        filteredComplaints.forEach(complaint => {
            const item = document.createElement("div");
            item.className = "issue-item";

            const title = document.createElement("h4");
            title.textContent = complaint.title || "Untitled complaint";

            const category = document.createElement("p");
            category.textContent = complaint.category || "Uncategorised";

            const address = document.createElement("p");
            address.textContent = complaint.address || "Location unavailable";

            const meta = document.createElement("div");
            meta.className = "issue-meta";

            const id = document.createElement("span");
            id.textContent = "ID: " + complaint.id;

            const status = document.createElement("span");
            status.className = "issue-status";
            status.textContent = complaint.status || "Submitted";

            meta.append(id, status);
            item.append(title, category, address, meta);

            item.addEventListener("click", () => {
                if (hasCoordinates(complaint)) {
                    const latitude = Number(complaint.latitude);
                    const longitude = Number(complaint.longitude);

                    map.setView([latitude, longitude], 16);

                    markerLayer.eachLayer(marker => {
                        if (
                            String(marker.options.complaintId) ===
                            String(complaint.id)
                        ) {
                            marker.openPopup();
                        }
                    });

                } else {
                    alert(
                        "This complaint does not have GPS coordinates.\n" +
                        "Address: " +
                        (complaint.address || "Not provided")
                    );
                }
            });

            issueList.appendChild(item);
        });
    }

    // Display map markers
    function renderMarkers(filteredComplaints) {
        markerLayer.clearLayers();

        const visibleComplaints =
            filteredComplaints.filter(hasCoordinates);

        const coordinates = [];

        visibleComplaints.forEach(complaint => {
            const latitude = Number(complaint.latitude);
            const longitude = Number(complaint.longitude);

            const color = getCategoryColor(complaint.category);

            const markerIcon = L.divIcon({
                className: "seevix-map-marker",
                html: `
                    <div style="
                        width: 17px;
                        height: 17px;
                        background: ${color};
                        border: 3px solid white;
                        border-radius: 50%;
                        box-shadow: 0 2px 7px rgba(0,0,0,0.35);
                    "></div>
                `,
                iconSize: [17, 17],
                iconAnchor: [8, 8]
            });

            const marker = L.marker(
                [latitude, longitude],
                {
                    icon: markerIcon,
                    complaintId: complaint.id
                }
            );

            marker.bindPopup(createPopup(complaint));
            marker.addTo(markerLayer);

            coordinates.push([latitude, longitude]);
        });

        if (coordinates.length > 0) {
            map.fitBounds(coordinates, {
                padding: [40, 40],
                maxZoom: 15
            });
        } else {
            map.setView([20.5937, 78.9629], 5);
        }
    }

    // Render the complete page
    function renderMap() {
        const filteredComplaints = getFilteredComplaints();

        updateStatistics(filteredComplaints);
        renderIssueList(filteredComplaints);
        renderMarkers(filteredComplaints);
    }

    // Apply filters
    document.getElementById("applyFilters").addEventListener("click", () => {
        renderMap();
    });

    // Refresh complaints from backend
    refreshButton.addEventListener("click", () => {
        loadComplaints();
    });

    // Initial load
    loadComplaints();

    // Fix Leaflet map sizing
    setTimeout(() => {
        map.invalidateSize();
    }, 200);

    console.log("SEEVIX Issues Map connected to backend.");
});
