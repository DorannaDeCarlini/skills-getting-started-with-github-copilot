document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function showMessage(message, type) {
    messageDiv.textContent = message;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      if (!response.ok) {
        throw new Error(`Failed to load activities: ${response.status}`);
      }
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.replaceChildren(activitySelect.options[0]);

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
        `;
        const availability = document.createElement("p");
        const availabilityLabel = document.createElement("strong");
        availabilityLabel.textContent = "Availability:";
        availability.append(availabilityLabel, ` ${spotsLeft} spots left`);
        activityCard.appendChild(availability);

        const participantsSection = document.createElement("div");
        participantsSection.className = "participants-section";

        const participantsHeading = document.createElement("h5");
        participantsHeading.textContent = "Participants";
        const participantCount = document.createElement("span");
        participantCount.className = "participant-count";
        participantCount.textContent = details.participants.length;
        participantsHeading.appendChild(participantCount);
        participantsSection.appendChild(participantsHeading);

        const participantsList = document.createElement("ul");
        participantsList.className = "participants-list";

        function renderParticipants() {
          participantsList.replaceChildren();
          participantCount.textContent = details.participants.length;
          availability.lastChild.textContent =
            ` ${details.max_participants - details.participants.length} spots left`;

          if (details.participants.length > 0) {
            details.participants.forEach((participant) => {
              const listItem = document.createElement("li");
              listItem.className = "participant-item";

              const participantName = document.createElement("span");
              participantName.textContent = participant;
              listItem.appendChild(participantName);

              const removeButton = document.createElement("button");
              removeButton.className = "participant-remove-button";
              removeButton.type = "button";
              removeButton.setAttribute("aria-label", `Unregister ${participant} from ${name}`);
              removeButton.title = `Unregister ${participant}`;
              removeButton.innerHTML = `
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m5 4v6m4-6v6" />
                </svg>
              `;
              removeButton.addEventListener("click", async () => {
                removeButton.disabled = true;
                try {
                  const response = await fetch(
                    `/activities/${encodeURIComponent(name)}/participants?email=${encodeURIComponent(participant)}`,
                    { method: "DELETE" }
                  );
                  const result = await response.json();

                  if (!response.ok) {
                    showMessage(result.detail || "Unable to unregister participant.", "error");
                    removeButton.disabled = false;
                    return;
                  }

                  const participantIndex = details.participants.indexOf(participant);
                  if (participantIndex !== -1) {
                    details.participants.splice(participantIndex, 1);
                  }
                  renderParticipants();
                  showMessage(result.message, "success");
                } catch (error) {
                  showMessage("Failed to unregister participant. Please try again.", "error");
                  console.error("Error unregistering participant:", error);
                  removeButton.disabled = false;
                }
              });
              listItem.appendChild(removeButton);
              participantsList.appendChild(listItem);
            });
          } else {
            const emptyMessage = document.createElement("li");
            emptyMessage.className = "no-participants";
            emptyMessage.textContent = "No participants yet";
            participantsList.appendChild(emptyMessage);
          }
        }
        renderParticipants();
        participantsSection.appendChild(participantsList);
        activityCard.appendChild(participantsSection);
        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        await fetchActivities();
        showMessage(result.message, "success");
        signupForm.reset();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
