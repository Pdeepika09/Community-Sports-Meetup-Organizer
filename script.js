// ==========================================
// COMMUNITY SPORTS MEETUP ORGANIZER
// JavaScript
// ==========================================

// 1. VARIABLES AND CONSTANTS

const STORAGE_KEY = "communitySportsMeetupsV1";
const USER_KEY = "communitySportsUserV1";
const REMINDER_KEY = "communitySportsReminders";

const icons = {
    Cricket: "🏏",
    Football: "⚽",
    Badminton: "🏸",
    Basketball: "🏀"
};

// 2. SAMPLE MEETUP DATA

const sampleMeetups = [
    {
        id: 1,
        title: "Weekend Cricket Match",
        sport: "Cricket",
        venue: "University Ground",
        date: "2026-11-08",
        time: "16:00",
        limit: 10,
        organizer: "Demo Organizer",
        participants: ["Player 1", "Player 2"],
        waitlist: [],
        attendance: {},
        cancelled: false
    },
    {
        id: 2,
        title: "Football Practice",
        sport: "Football",
        venue: "Sports Complex",
        date: "2026-11-09",
        time: "17:00",
        limit: 12,
        organizer: "Demo Organizer",
        participants: ["Player 1"],
        waitlist: [],
        attendance: {},
        cancelled: false
    },
    {
        id: 3,
        title: "Badminton Meetup",
        sport: "Badminton",
        venue: "Indoor Stadium",
        date: "2026-11-10",
        time: "15:00",
        limit: 4,
        organizer: "Demo Organizer",
        participants: [],
        waitlist: [],
        attendance: {},
        cancelled: false
    }
];

// 3. GET DATA FROM LOCAL STORAGE

function getSavedMeetups() {
    try {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return Array.isArray(data) ? data : null;
    } catch {
        return null;
    }
}

let meetups = getSavedMeetups() || sampleMeetups;

let currentUser = localStorage.getItem(USER_KEY) || "Player 1";

// Make sure old meetup records have required arrays.

meetups.forEach(function (meetup) {
    meetup.participants = meetup.participants || [];
    meetup.waitlist = meetup.waitlist || [];
    meetup.attendance = meetup.attendance || {};
});

// 4. SAVE DATA

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(meetups));
}

// 5. COMMON FUNCTIONS

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[char];
    });
}

function getMeetup(id) {
    return meetups.find(function (meetup) {
        return meetup.id === Number(id);
    });
}

function isPast(meetup) {
    return new Date(meetup.date + "T" + meetup.time) < new Date();
}

function saveAndRender() {
    saveData();
    renderMeetups();
}

// 6. DISPLAY MEETUPS

function renderMeetups() {
    const list = document.getElementById("meetupList");
    const empty = document.getElementById("emptyMessage");

    if (!list) return;

    const search = document.getElementById("searchInput").value.toLowerCase();
    const filter = document.getElementById("sportFilter").value;

    const filtered = meetups.filter(function (m) {
        const matchesSearch =
            (m.title + m.venue + m.sport).toLowerCase().includes(search);

        return !m.cancelled &&
            matchesSearch &&
            (!filter || m.sport === filter);
    });

    list.innerHTML = "";

    filtered.forEach(function (m) {
        const full = m.participants.length >= Number(m.limit);
        const joined = m.participants.includes(currentUser);
        const waiting = m.waitlist.includes(currentUser);
        const organizer = m.organizer === currentUser;
        const past = isPast(m);

        let action = "";

        if (joined) {
            action = `<button data-action="leave" data-id="${m.id}">Leave</button>`;
        } else if (waiting) {
            action = `<button data-action="leave" data-id="${m.id}">Leave Waitlist</button>`;
        } else if (!past && !full) {
            action = `<button data-action="join" data-id="${m.id}">Join</button>`;
        } else if (!past && full) {
            action = `<button data-action="join" data-id="${m.id}">Join Waitlist</button>`;
        }

        let waitPosition = waiting
            ? `<p>Waitlist Position: ${m.waitlist.indexOf(currentUser) + 1}</p>`
            : "";

        let organizerButtons = "";

        if (organizer) {
            organizerButtons = `
                <button data-action="edit" data-id="${m.id}">Edit</button>
                <button data-action="cancel" data-id="${m.id}">Cancel</button>
            `;
        }

        list.innerHTML += `
            <div class="meetup-card">
                <h3>${icons[m.sport] || "🏅"} ${escapeHTML(m.title)}</h3>
                <p>Sport: ${escapeHTML(m.sport)}</p>
                <p>Venue: ${escapeHTML(m.venue)}</p>
                <p>Date: ${escapeHTML(m.date)}</p>
                <p>Time: ${escapeHTML(m.time)}</p>
                <p>Organizer: ${escapeHTML(m.organizer)}</p>
                <p>Players: ${m.participants.length}/${m.limit}</p>
                <p>${past ? "Completed" : full ? "Full" : "Available"}</p>
                ${waitPosition}
                ${action}
                <button data-action="remind" data-id="${m.id}">Set Reminder</button>
                ${organizerButtons}
                ${organizer ? attendanceHTML(m) : ""}
            </div>
        `;
    });

    if (empty) {
        empty.style.display = filtered.length ? "none" : "block";
    }

    renderDashboard();
    renderAttendanceReport();
    renderReminders();
}

// 7. ATTENDANCE CHECKBOXES

function attendanceHTML(m) {
    if (!isPast(m)) return "";

    return m.participants.map(function (name) {
        const checked = m.attendance[name] === true ? "checked" : "";

        return `
            <label>
                <input type="checkbox"
                    data-action="attendance"
                    data-id="${m.id}"
                    data-name="${escapeHTML(name)}"
                    ${checked}>
                ${escapeHTML(name)}
            </label>
        `;
    }).join("");
}

// 8. DASHBOARD

function renderDashboard() {
    const active = meetups.filter(function (m) {
        return !m.cancelled;
    });

    const joined = active.filter(function (m) {
        return m.participants.includes(currentUser);
    });

    const upcoming = active.filter(function (m) {
        return !isPast(m);
    });

    document.getElementById("totalMeetups").textContent = active.length;
    document.getElementById("joinedGames").textContent = joined.length;
    document.getElementById("upcomingGames").textContent = upcoming.length;
    document.getElementById("displayName").textContent = currentUser;
}

// 9. JOIN MEETUP

function joinMeetup(m) {
    if (!m || m.cancelled || isPast(m)) return;

    if (m.participants.includes(currentUser) ||
        m.waitlist.includes(currentUser)) return;

    if (m.participants.length < Number(m.limit)) {
        m.participants.push(currentUser);
        alert("You joined the meetup!");
    } else {
        m.waitlist.push(currentUser);
        alert("Meetup is full. You joined the waitlist.");
    }

    saveAndRender();
}

// 10. LEAVE MEETUP

function leaveMeetup(m) {
    if (!m) return;

    const index = m.participants.indexOf(currentUser);

    if (index !== -1) {
        m.participants.splice(index, 1);

        if (m.waitlist.length > 0) {
            const nextPlayer = m.waitlist.shift();
            m.participants.push(nextPlayer);
            alert(nextPlayer + " moved from waitlist to participants.");
        }
    } else {
        const waitIndex = m.waitlist.indexOf(currentUser);

        if (waitIndex !== -1) {
            m.waitlist.splice(waitIndex, 1);
        }
    }

    saveAndRender();
}

// 11. REMINDERS

function setReminder(m) {
    if (!m) return;

    let reminders = JSON.parse(localStorage.getItem(REMINDER_KEY) || "[]");

    const exists = reminders.some(function (r) {
        return r.id === m.id;
    });

    if (exists) {
        alert("Reminder already exists!");
        return;
    }

    reminders.push({
        id: m.id,
        title: m.title,
        date: m.date,
        time: m.time
    });

    localStorage.setItem(REMINDER_KEY, JSON.stringify(reminders));
    renderReminders();

    alert("Reminder saved!");
}

function renderReminders() {
    const list = document.getElementById("reminderList");
    if (!list) return;

    const reminders = JSON.parse(localStorage.getItem(REMINDER_KEY) || "[]");

    const upcoming = reminders.filter(function (r) {
        return new Date(r.date + "T" + r.time) >= new Date();
    });

    list.innerHTML = upcoming.map(function (r) {
        return `<p>${escapeHTML(r.title)} - ${escapeHTML(r.date)} ${escapeHTML(r.time)}</p>`;
    }).join("");

    if (!upcoming.length) {
        list.innerHTML = "<p>No upcoming reminders.</p>";
    }
}

// 12. MEETUP BUTTON EVENTS

document.getElementById("meetupList").addEventListener("click", function (event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const m = getMeetup(button.dataset.id);
    const action = button.dataset.action;

    if (action === "join") joinMeetup(m);
    if (action === "leave") leaveMeetup(m);
    if (action === "remind") setReminder(m);

    if (action === "edit" && m && m.organizer === currentUser) {
        document.getElementById("title").value = m.title;
        document.getElementById("sport").value = m.sport;
        document.getElementById("venue").value = m.venue;
        document.getElementById("date").value = m.date;
        document.getElementById("time").value = m.time;
        document.getElementById("limit").value = m.limit;

        document.getElementById("meetupForm").dataset.editId = m.id;
        document.getElementById("organize").scrollIntoView();
    }

    if (action === "cancel" && m && m.organizer === currentUser) {
        if (confirm("Cancel this meetup?")) {
            m.cancelled = true;
            saveAndRender();
        }
    }
});

// 13. ATTENDANCE EVENTS

document.getElementById("meetupList").addEventListener("change", function (event) {
    if (event.target.dataset.action !== "attendance") return;

    const m = getMeetup(event.target.dataset.id);

    if (!m || m.organizer !== currentUser || !isPast(m)) return;

    const name = event.target.dataset.name;
    m.attendance[name] = event.target.checked;

    saveAndRender();
});

// 14. SEARCH AND FILTER

document.getElementById("searchInput").addEventListener("input", renderMeetups);
document.getElementById("sportFilter").addEventListener("change", renderMeetups);

// 15. OPEN ORGANIZE FORM

document.getElementById("openForm").addEventListener("click", function () {
    document.getElementById("organize").scrollIntoView({
        behavior: "smooth"
    });
});

// 16. CREATE AND EDIT MEETUP

document.getElementById("meetupForm").addEventListener("submit", function (event) {
    event.preventDefault();

    const title = document.getElementById("title").value.trim();
    const sport = document.getElementById("sport").value;
    const venue = document.getElementById("venue").value.trim();
    const date = document.getElementById("date").value;
    const time = document.getElementById("time").value;
    const limit = Number(document.getElementById("limit").value);

    if (!title || !sport || !venue || !date || !time) {
        alert("Please fill all fields.");
        return;
    }

    if (new Date(date + "T" + time) <= new Date()) {
        alert("Choose a future date and time.");
        return;
    }

    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
        alert("Participant limit must be between 1 and 100.");
        return;
    }

    const editId = this.dataset.editId;
    const existing = editId ? getMeetup(editId) : null;

    if (existing) {
        if (existing.organizer !== currentUser) return;

        if (limit < existing.participants.length) {
            alert("Limit cannot be lower than current participants.");
            return;
        }

        existing.title = title;
        existing.sport = sport;
        existing.venue = venue;
        existing.date = date;
        existing.time = time;
        existing.limit = limit;

        delete this.dataset.editId;
        alert("Meetup updated!");
    } else {
        meetups.push({
            id: Date.now(),
            title: title,
            sport: sport,
            venue: venue,
            date: date,
            time: time,
            limit: limit,
            organizer: currentUser,
            participants: [],
            waitlist: [],
            attendance: {},
            cancelled: false
        });

        alert("Meetup created!");
    }

    saveAndRender();
    this.reset();
});

// 17. PROFILE NAME

document.getElementById("saveName").addEventListener("click", function () {
    const name = document.getElementById("displayName").value.trim();
    const message = document.getElementById("profileMessage");

    if (!name) {
        message.textContent = "Enter your name.";
        return;
    }

    const oldName = currentUser;
    currentUser = name;

    meetups.forEach(function (m) {
        m.participants = m.participants.map(function (p) {
            return p === oldName ? name : p;
        });

        m.waitlist = m.waitlist.map(function (p) {
            return p === oldName ? name : p;
        });
    });

    localStorage.setItem(USER_KEY, currentUser);
    saveData();

    message.textContent = "Name updated successfully!";
    renderMeetups();
});

// 18. ATTENDANCE REPORT

function renderAttendanceReport() {
    const presentBox = document.getElementById("reportPresent");
    const absentBox = document.getElementById("reportAbsent");
    const rateBox = document.getElementById("reportRate");
    const reportList = document.getElementById("attendanceReportList");

    if (!reportList) return;

    let present = 0;
    let absent = 0;
    let html = "";

    const completed = meetups.filter(function (m) {
        return !m.cancelled && isPast(m);
    });

    completed.forEach(function (m) {
        let gamePresent = 0;
        let gameAbsent = 0;
        let unmarked = 0;

        m.participants.forEach(function (name) {
            if (m.attendance[name] === true) {
                present++;
                gamePresent++;
            } else if (m.attendance[name] === false) {
                absent++;
                gameAbsent++;
            } else {
                unmarked++;
            }
        });

        const total = gamePresent + gameAbsent;
        const percentage = total ? Math.round(gamePresent / total * 100) : 0;

        html += `
            <div class="report-card">
                <h3>${escapeHTML(m.title)}</h3>
                <p>Present: ${gamePresent}</p>
                <p>Absent: ${gameAbsent}</p>
                <p>Not Marked: ${unmarked}</p>
                <p>Attendance: ${percentage}%</p>
                <progress value="${percentage}" max="100"></progress>
            </div>
        `;
    });

    const total = present + absent;
    const rate = total ? Math.round(present / total * 100) : 0;

    presentBox.textContent = present;
    absentBox.textContent = absent;
    rateBox.textContent = rate + "%";

    reportList.innerHTML = html || "<p>No completed meetups yet.</p>";
}

// 19. INITIAL DISPLAY

renderMeetups();
