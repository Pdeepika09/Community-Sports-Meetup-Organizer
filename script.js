
const STORAGE_KEY = "communitySportsMeetupsV1";
const USER_KEY = "communitySportsUserV1";

const icons = {
  Cricket: "🏏",
  Football: "⚽",
  Badminton: "🏸",
  Basketball: "🏀"
};

function getSavedMeetups() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}

let meetups = getSavedMeetups() ?? [
  {
    id: 1,
    title: "Weekend Cricket",
    sport: "Cricket",
    venue: "Community Sports Ground",
    date: "2026-11-07",
    time: "07:00",
    limit: 4,
    organizer: "Demo Organizer",
    participants: ["Demo Player 1", "Demo Player 2"],
    waitlist: [],
    attendance: {},
    cancelled: false
  },
  {
    id: 2,
    title: "Evening Football",
    sport: "Football",
    venue: "City Football Turf",
    date: "2026-11-08",
    time: "17:30",
    limit: 3,
    organizer: "Demo Organizer",
    participants: ["Demo Player 3"],
    waitlist: [],
    attendance: {},
    cancelled: false
  },
  {
    id: 3,
    title: "Badminton Meetup",
    sport: "Badminton",
    venue: "Indoor Sports Hall",
    date: "2026-11-09",
    time: "18:00",
    limit: 6,
    organizer: "Demo Organizer",
    participants: [],
    waitlist: [],
    attendance: {},
    cancelled: false
  }
];

let currentUser = localStorage.getItem(USER_KEY) || "Player 1";

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(meetups));
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function getMeetup(id) {
  return meetups.find(m => m.id === Number(id));
}

function isPast(m) {
  return new Date(`${m.date}T${m.time}`) < new Date();
}

function renderMeetups() {
  const search = document.getElementById("searchInput")
    .value.trim().toLowerCase();

  const sport = document.getElementById("sportFilter").value;

  const visible = meetups.filter(m =>
    !m.cancelled &&
    (sport === "all" || m.sport === sport) &&
    `${m.title} ${m.sport} ${m.venue}`
      .toLowerCase().includes(search)
  );

  document.getElementById("emptyMessage").hidden =
    visible.length !== 0;

  document.getElementById("meetupList").innerHTML =
    visible.map(m => {
      const joined = m.participants.includes(currentUser);
      const waiting = m.waitlist.includes(currentUser);
      const full = m.participants.length >= m.limit;
      const past = isPast(m);

      let action = "";

      if (joined) {
        action = `<button class="btn" data-action="leave"
          data-id="${m.id}" ${past ? "disabled" : ""}>
          Leave</button>`;
      } else if (waiting) {
        action = `<button class="btn" data-action="leave"
          data-id="${m.id}" ${past ? "disabled" : ""}>
          Leave Waitlist</button>`;
      } else if (full) {
        action = `<button class="btn" data-action="join"
          data-id="${m.id}" ${past ? "disabled" : ""}>
          Join Waitlist</button>`;
      } else {
        action = `<button class="btn" data-action="join"
          data-id="${m.id}" ${past ? "disabled" : ""}>
          Join Game</button>`;
      }

      const attendance = m.participants.map(name => `
        <label>
          <input type="checkbox" data-action="attendance"
            data-id="${m.id}" data-name="${escapeHTML(name)}"
            ${m.attendance[name] === true ? "checked" : ""}
            ${!isPast(m) ? "disabled" : ""}>
          ${escapeHTML(name)}
        </label>
      `).join("");

      return `
        <article class="meetup-card">
          <div class="sport-icon">${icons[m.sport] || "🏅"}</div>
          <h3>${escapeHTML(m.title)}</h3>
          <p>Sport: ${escapeHTML(m.sport)}</p>
          <p>📍 ${escapeHTML(m.venue)}</p>
          <p>📅 ${escapeHTML(m.date)} · ${escapeHTML(m.time)}</p>
          <p>Organizer: ${escapeHTML(m.organizer)}</p>
          <p>
  Players: ${m.participants.length}/${m.limit}
</p>
<p>
  Available slots: ${Math.max(0, m.limit - m.participants.length)}
</p>
<p>
  Status: ${m.participants.length >= m.limit ? "FULL" : "OPEN"}
</p>
<p>
  Your waitlist position: ${
    m.waitlist.includes(currentUser)
      ? m.waitlist.indexOf(currentUser) + 1
      : "Not waitlisted"
  }
</p>
          <p>Waitlist: ${m.waitlist.length}</p>
          ${action}
          <button class="btn" data-action="remind"
            data-id="${m.id}">Set Reminder</button>
          <details>
            <summary>Organizer controls</summary>
            <p>Mark attendance after the game:</p>
            ${attendance || "<p>No participants yet.</p>"}
            <button class="btn" data-action="edit"
              data-id="${m.id}">Edit</button>
            <button class="btn" data-action="cancel"
              data-id="${m.id}">Cancel Meetup</button>
          </details>
        </article>
      `;
    }).join("");

  renderDashboard();
  renderAttendanceReports();
  renderReminders();
}

function renderDashboard() {
  const active = meetups.filter(m => !m.cancelled);

  document.getElementById("totalMeetups").textContent =
    active.length;

  document.getElementById("joinedGames").textContent =
    active.filter(m => m.participants.includes(currentUser)).length;

  document.getElementById("upcomingGames").textContent =
    active.filter(m => !isPast(m)).length;
}


function renderReminders() {
  const reminders = JSON.parse(
    localStorage.getItem("communitySportsReminders") || "[]"
  );

  const reminderList = document.getElementById("reminderList");

  // Show upcoming games the current user has joined.
  const joinedGames = meetups.filter(m =>
    !m.cancelled &&
    m.participants.includes(currentUser) &&
    !isPast(m)
  );

  // Show meetups where the current user is waitlisted.
  const waitingGames = meetups.filter(m =>
    !m.cancelled &&
    m.waitlist.includes(currentUser) &&
    !isPast(m)
  );

  const myReminders = reminders.filter(r =>
    meetups.some(m =>
      m.id === r.id && !m.cancelled && !isPast(m)
    )
  );

  let html = "";

  html += `<div class="reminder-group">
    <h3>🔔 Upcoming Games</h3>`;

  if (joinedGames.length) {
    html += joinedGames.map(m => `
      <div class="reminder-item">
        <strong>${escapeHTML(m.title)}</strong>
        <p>📍 ${escapeHTML(m.venue)}</p>
        <p>📅 ${escapeHTML(m.date)} at ${escapeHTML(m.time)}</p>
      </div>
    `).join("");
  } else {
    html += "<p>You have not joined any upcoming games yet.</p>";
  }

  html += `</div><div class="reminder-group">
    <h3>⏳ My Waitlist</h3>`;

  if (waitingGames.length) {
    html += waitingGames.map(m => `
      <div class="reminder-item">
        <strong>${escapeHTML(m.title)}</strong>
        <p>Venue: ${escapeHTML(m.venue)}</p>
        <p>Your waitlist position:
          ${m.waitlist.indexOf(currentUser) + 1}
        </p>
      </div>
    `).join("");
  } else {
    html += "<p>You are not waiting for any games.</p>";
  }

  html += `</div><div class="reminder-group">
    <h3>🔔 Saved Reminders</h3>`;

  if (myReminders.length) {
    html += myReminders.map(r => `
      <div class="reminder-item">
        <strong>${escapeHTML(r.title)}</strong>
        <p>📅 ${escapeHTML(r.date)} at ${escapeHTML(r.time)}</p>
      </div>
    `).join("");
  } else {
    html += "<p>No saved reminders yet. Use Set Reminder on a meetup card.</p>";
  }

  html += "</div>";

  reminderList.innerHTML = html;
}


function joinMeetup(m) {
  if (m.cancelled || isPast(m)) {
    alert("This meetup is no longer accepting players.");
    return;
  }

  if (
    m.participants.includes(currentUser) ||
    m.waitlist.includes(currentUser)
  ) {
    alert("You have already joined this meetup or its waitlist.");
    return;
  }

  if (!Number.isInteger(m.limit) || m.limit < 1) {
    alert("This meetup has an invalid participant limit.");
    return;
  }

  if (m.participants.length < m.limit) {
    m.participants.push(currentUser);
    alert("Success! You joined the meetup.");
  } else {
    m.waitlist.push(currentUser);
    alert(
      `The meetup is full. Your waitlist position is ${m.waitlist.length}.`
    );
  }

  saveData();
  renderMeetups();
}



function leaveMeetup(m) {
  if (m.cancelled || isPast(m)) {
    alert("You cannot leave this completed or cancelled meetup.");
    return;
  }

  const wasParticipant = m.participants.includes(currentUser);
  const wasWaitlisted = m.waitlist.includes(currentUser);

  if (!wasParticipant && !wasWaitlisted) {
    alert("You are not registered for this meetup.");
    return;
  }

  m.participants = m.participants.filter(
    name => name !== currentUser
  );

  m.waitlist = m.waitlist.filter(
    name => name !== currentUser
  );

  if (wasParticipant && m.waitlist.length > 0) {
    const nextPlayer = m.waitlist.shift();
    m.participants.push(nextPlayer);

    alert(
      `${currentUser} left the meetup. ` +
      `${nextPlayer} has been promoted from the waitlist.`
    );
  } else if (wasParticipant) {
    alert("You have left the meetup.");
  } else {
    alert("You have left the waitlist.");
  }

  saveData();
  renderMeetups();
}


function setReminder(m) {
  const reminders = JSON.parse(
    localStorage.getItem("communitySportsReminders") || "[]"
  );

  if (!reminders.some(r => r.id === m.id)) {
    reminders.push({
      id: m.id,
      title: m.title,
      date: m.date,
      time: m.time
    });

    localStorage.setItem(
      "communitySportsReminders",
      JSON.stringify(reminders)
    );
  }

  renderReminders();
  alert("Reminder saved in this browser.");
}

document.getElementById("meetupList").addEventListener("click", e => {
  const button = e.target.closest("button[data-action]");
  if (!button) return;

  const m = getMeetup(button.dataset.id);
  if (!m) return;

  switch (button.dataset.action) {
    case "join":
      joinMeetup(m);
      break;

    case "leave":
      leaveMeetup(m);
      break;

    case "remind":
      if (!m.cancelled && !isPast(m)) setReminder(m);
      break;

    case "edit": {
      if (m.organizer !== currentUser) {
        alert("Only the meetup organizer can edit this game.");
        return;
      }

      document.getElementById("title").value = m.title;
      document.getElementById("sport").value = m.sport;
      document.getElementById("venue").value = m.venue;
      document.getElementById("date").value = m.date;
      document.getElementById("time").value = m.time;
      document.getElementById("limit").value = m.limit;

      document.getElementById("meetupForm").dataset.editId = m.id;
      document.getElementById("organize").scrollIntoView();
      break;
    }

    case "cancel":
      if (m.organizer !== currentUser) {
        alert("Only the meetup organizer can cancel this game.");
        return;
      }

      if (confirm("Cancel this meetup?")) {
        m.cancelled = true;
        saveData();
        renderMeetups();
      }
      break;
  }
});

document.getElementById("meetupList").addEventListener(
  "change", e => {
    const input = e.target;

    if (input.dataset.action !== "attendance") return;

    const m = getMeetup(input.dataset.id);
    if (!m || m.organizer !== currentUser || !isPast(m)) {
      alert("Only the organizer can mark attendance after the game.");
      renderMeetups();
      return;
    }

    m.attendance[input.dataset.name] = input.checked;
    saveData();
    renderMeetups();
  }
);

document.getElementById("searchInput").addEventListener(
  "input", renderMeetups
);

document.getElementById("sportFilter").addEventListener(
  "change", renderMeetups
);

document.getElementById("openForm").addEventListener("click", () => {
  document.getElementById("organize").scrollIntoView({
    behavior: "smooth"
  });
});

document.getElementById("meetupForm").addEventListener(
  "submit", e => {
    e.preventDefault();

    const title = document.getElementById("title").value.trim();
    const sport = document.getElementById("sport").value;
    const venue = document.getElementById("venue").value.trim();
    const date = document.getElementById("date").value;
    const time = document.getElementById("time").value;
    const limit = Number(document.getElementById("limit").value);

    if (!title || !venue || !date || !time ||
        !Number.isInteger(limit) || limit < 1 || limit > 100) {
      alert("Please enter valid meetup details.");
      return;
    }

    if (new Date(`${date}T${time}`) <= new Date()) {
      alert("Please choose a future date and time.");
      return;
    }

    const editId = e.target.dataset.editId;
    const existing = editId ? getMeetup(editId) : null;

    if (existing && existing.organizer !== currentUser) {
      alert("Only the organizer can edit this meetup.");
      return;
    }

    
if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
  alert("Participant limit must be a whole number between 1 and 100.");
  return;
}

if (existing && limit < existing.participants.length) {
  alert(
    `At least ${existing.participants.length} players are registered. ` +
    "The limit cannot be lower than this number."
  );
  return;
}


    if (existing) {
      Object.assign(existing, { title, sport, venue, date, time, limit });
      delete e.target.dataset.editId;
    } else {
      meetups.push({
        id: Date.now(),
        title,
        sport,
        venue,
        date,
        time,
        limit,
        organizer: currentUser,
        participants: [],
        waitlist: [],
        attendance: {},
        cancelled: false
      });
    }

    saveData();
    e.target.reset();
    renderMeetups();
    alert(existing ? "Meetup updated!" : "Meetup published!");
    document.getElementById("meetups").scrollIntoView({
      behavior: "smooth"
    });
  }
);

// Set a demo identity for the local frontend.
if (!localStorage.getItem(USER_KEY)) {
  localStorage.setItem(USER_KEY, currentUser);
}

const displayNameInput = document.getElementById("displayName");
const saveNameButton = document.getElementById("saveName");
const profileMessage = document.getElementById("profileMessage");

// Display the saved name when the website opens.
displayNameInput.value = currentUser;

saveNameButton.addEventListener("click", () => {
  const newName = displayNameInput.value.trim();

  if (!newName) {
    profileMessage.textContent = "Please enter your name.";
    return;
  }

  // Update the current browser user.
  currentUser = newName;
  localStorage.setItem(USER_KEY, currentUser);

  profileMessage.textContent = `Welcome, ${currentUser}!`;

  renderMeetups();
});

function renderAttendanceReport() {
  const completed = meetups.filter(
    m => !m.cancelled && isPast(m)
  );

  let totalPresent = 0;
  let totalAbsent = 0;
  let totalMarked = 0;

  completed.forEach(m => {
    m.participants.forEach(name => {
      const status = m.attendance[name];

      if (status === true) {
        totalPresent++;
        totalMarked++;
      } else if (status === false) {
        totalAbsent++;
        totalMarked++;
      }
    });
  });

  document.getElementById("reportPresent").textContent =
    totalPresent;

  document.getElementById("reportAbsent").textContent =
    totalAbsent;

  const rate = totalMarked
    ? Math.round((totalPresent / totalMarked) * 100)
    : 0;

  document.getElementById("reportRate").textContent =
    rate + "%";

  const reportList =
    document.getElementById("attendanceReportList");

  if (completed.length === 0) {
    reportList.innerHTML =
      "<p>No completed meetups available for reporting yet.</p>";
    return;
  }

  reportList.innerHTML = completed.map(m => {
    const present = m.participants.filter(
      name => m.attendance[name] === true
    ).length;

    const absent = m.participants.filter(
      name => m.attendance[name] === false
    ).length;

    const unmarked = m.participants.length - present - absent;

    const marked = present + absent;

    const percentage = marked
      ? Math.round((present / marked) * 100)
      : 0;

    return `
      <article class="report-card">
        <h3>${escapeHTML(m.title)}</h3>
        <p>Sport: ${escapeHTML(m.sport)}</p>
        <p>Date: ${escapeHTML(m.date)}</p>
        <p>Participants: ${m.participants.length}</p>
        <p>Present: ${present}</p>
        <p>Absent: ${absent}</p>
        <p>Not marked: ${unmarked}</p>
        <p class="report-rate">Attendance: ${percentage}%</p>
        <progress value="${percentage}" max="100"></progress>
      </article>
    `;
  }).join("");
}

renderMeetups();
renderAttendanceReport();

function displayReminders() {
    const reminderList = document.getElementById("reminderList");

    if (!reminderList) return;

    const meetups = JSON.parse(
        localStorage.getItem("meetups") || "[]"
    );

    const joinedMeetups = JSON.parse(
        localStorage.getItem("joinedMeetups") || "[]"
    );

    reminderList.innerHTML = "";

    if (joinedMeetups.length === 0) {
        reminderList.innerHTML = `
            <div class="reminder-card">
                <h3>No reminders yet</h3>
                <p>Join a sports meetup to see your upcoming reminders here.</p>
            </div>
        `;
        return;
    }

    joinedMeetups.forEach(item => {
        const meetup = typeof item === "object"
            ? item
            : meetups.find(m => String(m.id) === String(item));

        if (!meetup) return;

        const card = document.createElement("div");
        card.className = "reminder-card";

        const title = document.createElement("h3");
        title.textContent = "🔔 " + (meetup.name || meetup.title || "Sports Meetup");

        const details = document.createElement("p");
        details.textContent =
            "📍 " + (meetup.location || meetup.venue || "Venue not specified") +
            " | 📅 " + (meetup.date || "Date not specified") +
            " | 🕒 " + (meetup.time || "Time not specified");

        card.append(title, details);
        reminderList.appendChild(card);
    });

    if (!reminderList.children.length) {
        reminderList.textContent = "No upcoming reminders found.";
    }
}

displayReminders();
