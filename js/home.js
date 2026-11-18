
// ===================================
// PEERTUTOR - HOMEPAGE JAVASCRIPT
// ===================================

// Get HTML elements
const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const tutorCards = document.querySelectorAll(".tutor-card");
const searchMessage = document.getElementById("searchMessage");


// ===================================
// SEARCH TUTORS
// ===================================

function searchTutors() {

    const searchValue = searchInput.value.toLowerCase().trim();

    let visibleTutors = 0;

    tutorCards.forEach(function(card) {

        const tutorInformation =
            card.getAttribute("data-search").toLowerCase();

        if (tutorInformation.includes(searchValue)) {

            card.style.display = "block";
            visibleTutors++;

        } else {

            card.style.display = "none";

        }

    });


    // Display search results
    if (visibleTutors === 0) {

        searchMessage.textContent =
            "No tutors found. Please try another name or subject.";

    } else if (searchValue === "") {

        searchMessage.textContent =
            "Showing all available sample tutors.";

    } else {

        searchMessage.textContent =
            visibleTutors + " tutor(s) found.";

    }

}


// Search when clicking the Search button
searchForm.addEventListener("submit", function(event) {

    event.preventDefault();

    searchTutors();

});


// Search automatically while typing
searchInput.addEventListener("input", function() {

    searchTutors();

});


// ===================================
// INITIAL HOMEPAGE MESSAGE
// ===================================

searchMessage.textContent =
    "Showing all available sample tutors.";

console.log("PeerTutor Homepage Loaded Successfully!");
