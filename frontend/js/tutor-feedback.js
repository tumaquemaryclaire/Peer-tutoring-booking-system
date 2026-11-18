
// ===================================
// PEERTUTOR - TUTOR FEEDBACK
// Display Student Ratings and Comments
// ===================================

(function () {

    const currentUser = JSON.parse(
        sessionStorage.getItem("pt_current_user") || "null"
    );

    if (!currentUser || currentUser.role !== "tutor") {
        return;
    }

    function getSavedData(key) {
        try {
            const data = JSON.parse(
                localStorage.getItem(key) || "[]"
            );

            return Array.isArray(data) ? data : [];

        } catch (error) {
            console.error("Error reading " + key, error);
            return [];
        }
    }

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, function (character) {
            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            }[character];
        });
    }

    function displayTutorFeedback() {

        const feedbackList =
            document.getElementById("tutorFeedbackList");

        const emptyMessage =
            document.getElementById("noTutorFeedback");

        const averageRating =
            document.getElementById("tutorAverageRating");

        const feedbackCount =
            document.getElementById("tutorFeedbackCount");

        if (!feedbackList) return;

        const allFeedback = getSavedData("pt_feedback");

        const tutorEmail = String(currentUser.email || "")
            .trim()
            .toLowerCase();

        const tutorName = String(
            currentUser.fullName || currentUser.name || ""
        ).trim().toLowerCase();

        const tutorId = String(currentUser.id || "");

        // Get feedback belonging to this tutor
        const tutorFeedback = allFeedback.filter(function (feedback) {

            const feedbackEmail = String(
                feedback.tutorEmail || ""
            ).trim().toLowerCase();

            const feedbackName = String(
                feedback.tutorName || ""
            ).trim().toLowerCase();

            const feedbackTutorId = String(
                feedback.tutorId || ""
            );

            if (feedbackEmail && tutorEmail) {
                return feedbackEmail === tutorEmail;
            }

            if (feedbackTutorId && tutorId) {
                return feedbackTutorId === tutorId;
            }

            // Fallback for older feedback records
            return feedbackName === tutorName && tutorName !== "";

        });

        // Calculate average rating
        const totalRating = tutorFeedback.reduce(
            (total, feedback) => total + (
                Math.min(5, Math.max(0, Number(feedback.rating) || 0))
            ),
            0
        );

        const average = tutorFeedback.length
            ? (totalRating / tutorFeedback.length).toFixed(1)
            : "0.0";

        averageRating.textContent = average;
        feedbackCount.textContent = tutorFeedback.length;

        if (tutorFeedback.length === 0) {
            feedbackList.innerHTML = `
                <p style="text-align:center; color:#777;">
                    No student feedback yet.
                </p>
            `;
            return;
        }

        // Newest feedback first
        tutorFeedback.sort(function (a, b) {
            return new Date(b.createdAt || 0) -
                new Date(a.createdAt || 0);
        });

        feedbackList.innerHTML = tutorFeedback.map(function (feedback) {

            const rating = Math.min(
                5,
                Math.max(0, Math.floor(Number(feedback.rating) || 0))
            );

            const stars = "★".repeat(rating) +
                "☆".repeat(5 - rating);

            const date = feedback.createdAt
                ? new Date(feedback.createdAt).toLocaleDateString(
                    "en-US",
                    {
                        month: "long",
                        day: "numeric",
                        year: "numeric"
                    }
                )
                : "Date unavailable";

            return `
                <article style="
                    padding: 18px;
                    margin-bottom: 15px;
                    border: 1px solid #e5e7eb;
                    border-radius: 10px;
                ">

                    <div style="
                        display:flex;
                        justify-content:space-between;
                        gap:10px;
                        flex-wrap:wrap;
                    ">
                        <div>
                            <h3 style="margin:0 0 5px;">
                                ${escapeHTML(feedback.studentName || "Student")}
                            </h3>

                            <p style="margin:0; color:#777;">
                                ${escapeHTML(feedback.subject || "No subject")}
                            </p>
                        </div>

                        <span style="color:#777;">
                            ${escapeHTML(date)}
                        </span>
                    </div>

                    <div style="
                        margin:12px 0;
                        color:#f5a623;
                        font-size:20px;
                    ">
                        ${stars}
                        <span style="
                            color:#555;
                            font-size:14px;
                        ">
                            ${rating}.0 / 5.0
                        </span>
                    </div>

                    <p style="
                        margin:0;
                        color:#555;
                        line-height:1.6;
                    ">
                        ${escapeHTML(feedback.comment)}
                    </p>

                </article>
            `;

        }).join("");

    }

    // Initial display
    displayTutorFeedback();

    // Update when a student submits feedback in another tab
    window.addEventListener("storage", function (event) {
        if (event.key === "pt_feedback") {
            displayTutorFeedback();
        }
    });

})();
