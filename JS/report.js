
document.addEventListener("DOMContentLoaded", () => {

    if (window.lucide) {
        lucide.createIcons();
    }

    // =================================
    // API URLS
    // =================================

    const API_URL = "http://localhost:8080/api/complaints";

    const POTHOLE_AI_URL =
        "http://127.0.0.1:8000/ai/detect-image";

    const STREETLIGHT_AI_URL =
        "http://127.0.0.1:8000/ai/detect-streetlight";
     const WATERLEAK_AI_URL =
    "http://127.0.0.1:8000/ai/detect-waterleak";
    const GARBAGE_AI_URL =
    "http://127.0.0.1:8000/ai/detect-garbage";

    const BLIP_URL =
        "http://127.0.0.1:8000/ai/caption-image";


    // =================================
    // FORM ELEMENTS
    // =================================

    const form = document.getElementById("reportForm");
    const description = document.getElementById("description");
    const charCount = document.getElementById("charCount");

    // Image elements
    const imageInput = document.getElementById("issueImage");
    const preview = document.getElementById("imagePreview");
    const previewImage = document.getElementById("previewImage");
    const imageName = document.getElementById("imageName");
    const removeImage = document.getElementById("removeImage");

    // AI elements
    const aiAnalysis = document.getElementById("aiAnalysis");
    const aiStatus = document.getElementById("aiStatus");
    const aiResults = document.getElementById("aiResults");
    const detectionList = document.getElementById("detectionList");
    const annotatedImage = document.getElementById("annotatedImage");

    // BLIP caption elements
    const blipCaptionSection =
        document.getElementById("blipCaptionSection");

    const blipCaption =
        document.getElementById("blipCaption");

    // Location elements
    const locationButton = document.getElementById("locationButton");
    const locationMessage = document.getElementById("locationMessage");

    // Notification elements
    const toast = document.getElementById("toast");
    const successOverlay = document.getElementById("successOverlay");
    const submitButton = document.getElementById("submitButton");

    let selectedImage = null;
    let imageScanId = 0;
    let lastAICaption = "";


    // =================================
    // TOAST NOTIFICATION
    // =================================

    function showToast(message) {

        toast.textContent = message;
        toast.classList.add("show");

        setTimeout(() => {
            toast.classList.remove("show");
        }, 3000);
    }


    // =================================
    // CHARACTER COUNTER
    // =================================

    function updateCharCount() {

        charCount.textContent =
            `${description.value.length} / 1000`;
    }

    description.addEventListener("input", updateCharCount);


    // =================================
    // CATEGORY CHANGE
    // =================================

    document.getElementById("category").addEventListener("change", () => {

        if (selectedImage) {
            analyseImage(selectedImage);
        }

    });


    // =================================
    // INSERT BLIP CAPTION
    // =================================

    function insertAICaption(caption) {

        if (!description) {
            console.error("Description textbox was not found.");
            return;
        }

        const cleanCaption = String(caption || "").trim();

        if (!cleanCaption) return;

        // Replace previous AI caption instead of duplicating it

        if (lastAICaption && description.value.includes(lastAICaption)) {

            description.value = description.value.replace(
                lastAICaption,
                cleanCaption
            );

        } else if (!description.value.trim()) {

            description.value = cleanCaption;

        } else {

            description.value =
                `${description.value.trim()}\n\nAI image description: ${cleanCaption}`;
        }

        lastAICaption = cleanCaption;

        description.dispatchEvent(
            new Event("input", { bubbles: true })
        );

        updateCharCount();
    }


    // =================================
    // RESET AI ANALYSIS
    // =================================

    function resetAIAnalysis() {

        imageScanId++;

        aiAnalysis.classList.add("hidden");
        aiResults.classList.add("hidden");

        detectionList.innerHTML = "";

        annotatedImage.src = "";
        annotatedImage.classList.add("hidden");

        blipCaption.textContent = "";
        blipCaptionSection.classList.add("hidden");

        lastAICaption = "";
    }


    // =================================
    // AI IMAGE ANALYSIS
    // =================================

    async function analyseImage(file) {

        const currentScanId = ++imageScanId;

        aiAnalysis.classList.remove("hidden");
        aiResults.classList.add("hidden");

        aiStatus.textContent =
            "SEEVIX AI is analysing your image...";

        detectionList.innerHTML = "";
        annotatedImage.src = "";
        annotatedImage.classList.add("hidden");

        blipCaption.textContent = "";
        blipCaptionSection.classList.add("hidden");


        // =================================
        // SELECT YOLO MODEL
        // =================================

        const category =
            document.getElementById("category").value.trim().toLowerCase();

        let detectionURL = null;

        if (category === "roads" || category === "road") {

            // Pothole detection model
            detectionURL = POTHOLE_AI_URL;

        } else if (category === "streetlight") {
            // Broken streetlight detection model
            detectionURL = STREETLIGHT_AI_URL;

        } else if (category === "water-leakage") {
    // Water Leakage detection model
    detectionURL = WATERLEAK_AI_URL;

} else if (
    category === "garbage" ||
    category === "garbage and sanitation"
) {
    // Garbage and Sanitation detection model
    detectionURL = GARBAGE_AI_URL;
}


        // =================================
        // PREPARE AI REQUESTS
        // =================================

        const requests = [];

        // YOLO detection

        if (detectionURL) {

            const yoloFormData = new FormData();

            yoloFormData.append("file", file);

            requests.push(

                fetch(detectionURL, {
                    method: "POST",
                    body: yoloFormData
                }).then(response => {

                    if (!response.ok) {
                        throw new Error("YOLO image detection failed.");
                    }

                    return response.json();
                })

            );

        } else {

            // No YOLO detector configured for this category

            requests.push(
                Promise.resolve({ skipped: true })
            );
        }


        // =================================
        // BLIP VQA ANALYSIS
        // =================================

        const blipFormData = new FormData();

        blipFormData.append("file", file);

        requests.push(

            fetch(BLIP_URL, {
                method: "POST",
                body: blipFormData
            }).then(response => {

                if (!response.ok) {
                    throw new Error("BLIP caption generation failed.");
                }

                return response.json();
            })

        );


        // =================================
        // WAIT FOR BOTH AI MODELS
        // =================================

        const results = await Promise.allSettled(requests);

        // Ignore results from an older image/category scan

        if (currentScanId !== imageScanId) return;

        const yoloResult = results[0];
        const blipResult = results[1];

        aiResults.classList.remove("hidden");


        // =================================
        // YOLO RESULTS
        // =================================

        if (yoloResult.status === "fulfilled") {

            const data = yoloResult.value;

            if (data.skipped) {

                aiStatus.textContent =
                    "Image uploaded. YOLO detection is not configured for this category.";

            } else {

                const detections = data.detections || [];

                if (data.success === false) {

                    aiStatus.textContent =
                        "YOLO could not analyse the image.";

                } else if (detections.length === 0) {

                    aiStatus.textContent =
                        "YOLO analysis completed. No objects detected.";

                } else {

                    aiStatus.textContent =
                        `${data.model || "YOLO"} detected ${detections.length} object(s) in the image.`;
                }


                // Display detected objects

                detections.forEach(item => {

                    const row = document.createElement("div");

                    row.className = "detection-item";

                    const label = document.createElement("span");

                    label.textContent =
                        item.object || item.label || "Unknown object";

                    const confidence = document.createElement("span");

                    confidence.className = "detection-confidence";

                    let score = Number(item.confidence || 0);

                    if (score <= 1) {
                        score *= 100;
                    }

                    confidence.textContent =
                        `${score.toFixed(1)}%`;

                    row.appendChild(label);
                    row.appendChild(confidence);

                    detectionList.appendChild(row);

                });


                // Display annotated image

                if (data.annotated_image) {

                    annotatedImage.src =
                        `data:image/jpeg;base64,${data.annotated_image}`;

                    annotatedImage.classList.remove("hidden");
                }

            }

        } else {

            console.error("YOLO error:", yoloResult.reason);

            aiStatus.textContent =
                "YOLO detection is currently unavailable.";
        }


        // =================================
        // BLIP VQA RESULTS
        // =================================

        if (blipResult.status === "fulfilled") {

            const blipData = blipResult.value;

            console.log("BLIP API RESPONSE:", blipData);

            if (blipData.caption) {

                // Display BLIP caption in AI Analysis section

                blipCaption.textContent = blipData.caption;

                blipCaptionSection.classList.remove("hidden");

                // Insert caption into complaint description

                insertAICaption(blipData.caption);

                console.log(
                    "BLIP caption inserted:",
                    blipData.caption
                );

            } else {

                blipCaption.textContent =
                    "No image description was generated.";

                blipCaptionSection.classList.remove("hidden");

                console.warn(
                    "BLIP response does not contain a caption."
                );
            }

        } else {

            console.error(
                "BLIP error:",
                blipResult.reason
            );

            blipCaption.textContent =
                "BLIP image description is currently unavailable.";

            blipCaptionSection.classList.remove("hidden");
        }

        lucide.createIcons();
    }


    // =================================
    // IMAGE UPLOAD AND PREVIEW
    // =================================

    imageInput.addEventListener("change", async () => {

        const file = imageInput.files[0];

        if (!file) return;

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!allowedTypes.includes(file.type)) {

            showToast("Please select a JPG, PNG or WEBP image.");

            imageInput.value = "";

            return;
        }

        if (file.size > 5 * 1024 * 1024) {

            showToast("Image size must be less than 5 MB.");

            imageInput.value = "";

            return;
        }

        selectedImage = file;

        const reader = new FileReader();

        reader.onload = (event) => {

            previewImage.src = event.target.result;

            imageName.textContent = file.name;

            preview.classList.remove("hidden");
        };

        reader.onerror = () => {
            showToast("Unable to preview this image.");
        };

        reader.readAsDataURL(file);

        // Automatically run YOLO and BLIP

        await analyseImage(file);
    });


    // =================================
    // REMOVE IMAGE
    // =================================

    removeImage.addEventListener("click", () => {

        selectedImage = null;

        imageInput.value = "";

        previewImage.src = "";

        preview.classList.add("hidden");

        resetAIAnalysis();
    });


    // =================================
    // GET CURRENT LOCATION
    // =================================

    locationButton.addEventListener("click", () => {

        if (!navigator.geolocation) {

            locationMessage.textContent =
                "Geolocation is not supported by your browser.";

            return;
        }

        locationButton.disabled = true;

        locationButton.textContent = "Getting location...";

        navigator.geolocation.getCurrentPosition(

            (position) => {

                const latitude = position.coords.latitude;

                const longitude = position.coords.longitude;

                document.getElementById("latitude").value =
                    latitude;

                document.getElementById("longitude").value =
                    longitude;

                locationMessage.textContent =
                    `Location captured: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

                locationButton.disabled = false;

                locationButton.innerHTML =
                    '<i data-lucide="check-circle"></i> Location Captured';

                lucide.createIcons();
            },


            (error) => {

                let message = "Unable to get your location.";

                if (error.code === error.PERMISSION_DENIED) {

                    message =
                        "Location permission denied. Please enter your address manually.";

                } else if (error.code === error.POSITION_UNAVAILABLE) {

                    message =
                        "Location information is unavailable.";

                } else if (error.code === error.TIMEOUT) {

                    message =
                        "Location request timed out. Please try again.";
                }

                locationMessage.textContent = message;

                locationButton.disabled = false;

                locationButton.innerHTML =
                    '<i data-lucide="crosshair"></i> Try Again';

                lucide.createIcons();
            },


            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }

        );
    });


    // =================================
    // SUBMIT COMPLAINT
    // =================================

    form.addEventListener("submit", async (event) => {

        event.preventDefault();

        const title =
            document.getElementById("issueTitle").value.trim();

        const category =
            document.getElementById("category").value;

        const issueDescription =
            description.value.trim();

        const address =
            document.getElementById("address").value.trim();

        const selectedPriority =
            document.querySelector('input[name="priority"]:checked');

        const priority = selectedPriority
            ? selectedPriority.value
            : "Medium";

        const latitudeValue =
            document.getElementById("latitude").value;

        const longitudeValue =
            document.getElementById("longitude").value;


        // Validate required fields

        if (!title || !category || !issueDescription || !address) {

            showToast("Please complete all required fields.");

            return;
        }


        // Complaint object

        const complaint = {

            title: title,

            category: category,

            description: issueDescription,

            address: address,

            priority: priority,

            latitude: latitudeValue
                ? Number(latitudeValue)
                : null,

            longitude: longitudeValue
                ? Number(longitudeValue)
                : null,

            imageName: selectedImage
                ? selectedImage.name
                : null,

            status: "Submitted"
        };


        // =================================
        // SEND COMPLAINT TO SPRING BOOT
        // =================================

        try {

            submitButton.disabled = true;

            submitButton.textContent = "Submitting...";

            const response = await fetch(API_URL, {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(complaint)
            });


            if (!response.ok) {

                throw new Error(
                    "Server rejected the complaint."
                );
            }

            const savedComplaint = await response.json();


            // Display ticket ID

            document.getElementById("ticketId").textContent =
                savedComplaint.id;

            successOverlay.classList.remove("hidden");

            lucide.createIcons();

            console.log(
                "Complaint saved successfully:",
                savedComplaint
            );


        } catch (error) {

            console.error(
                "Complaint submission failed:",
                error
            );

            showToast(
                "Could not submit complaint. Check whether the backend is running."
            );


        } finally {

            submitButton.disabled = false;

            submitButton.innerHTML =
                'Submit Complaint <i data-lucide="arrow-right"></i>';

            lucide.createIcons();
        }

    });

});
