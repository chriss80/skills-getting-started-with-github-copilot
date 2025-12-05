document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Add a small HTML-escaping helper to safely render participant strings
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      
      // Clear loading message
      activitiesList.innerHTML = "";

      // reset select options
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${escapeHtml(name)}</h4>
          <p>${escapeHtml(details.description)}</p>
          <p><strong>Schedule:</strong> ${escapeHtml(details.schedule)}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        // Build participants section programmatically so we can attach delete buttons
        const participantsSection = document.createElement('div');
        participantsSection.className = 'participants-section';

        const strong = document.createElement('strong');
        strong.textContent = 'Participants:';
        participantsSection.appendChild(strong);

        if (details.participants && details.participants.length) {
          const ul = document.createElement('ul');
          ul.className = 'participants-list';

          details.participants.forEach((p) => {
            const li = document.createElement('li');
            const span = document.createElement('span');
            span.textContent = p;

            const btn = document.createElement('button');
            btn.className = 'delete-btn';
            btn.setAttribute('data-activity', name);
            btn.setAttribute('data-email', p);
            btn.title = 'Unregister participant';
            btn.textContent = '✖';

            li.appendChild(span);
            li.appendChild(btn);
            ul.appendChild(li);
          });

          participantsSection.appendChild(ul);
        } else {
          const p = document.createElement('p');
          p.className = 'no-participants';
          p.textContent = 'No participants yet.';
          participantsSection.appendChild(p);
        }

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

  // Delete (unregister) a participant
  async function deleteParticipant(activity, email) {
    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/participants?email=${encodeURIComponent(email)}`,
        {
          method: 'DELETE'
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = 'success';
        messageDiv.classList.remove('hidden');
        // refresh list
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || 'Failed to remove participant.';
        messageDiv.className = 'error';
        messageDiv.classList.remove('hidden');
      }

      setTimeout(() => messageDiv.classList.add('hidden'), 4000);
    } catch (err) {
      console.error('Error deleting participant:', err);
      messageDiv.textContent = 'Failed to remove participant.';
      messageDiv.className = 'error';
      messageDiv.classList.remove('hidden');
      setTimeout(() => messageDiv.classList.add('hidden'), 4000);
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
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // refresh to show new participant
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Event delegation for delete buttons
  activitiesList.addEventListener('click', (e) => {
    const btn = e.target.closest('.delete-btn');
    if (!btn) return;
    const activity = btn.getAttribute('data-activity');
    const email = btn.getAttribute('data-email');
    if (activity && email) {
      deleteParticipant(activity, email);
    }
  });

  // Initialize app
  fetchActivities();
});
