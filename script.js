const DATA_KEY = "playmateMeetups";
const USER_KEY = "playmateUser";
const REM_KEY = "playmateReminders";

const icons = {
  Cricket: "🏏",
  Football: "⚽",
  Badminton: "🏸",
  Basketball: "🏀"
};

const demo = [
  {
    id: 1,
    title: "Weekend Cricket Match",
    sport: "Cricket",
    venue: "University Ground",
    date: "2026-12-10",
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
    date: "2026-12-12",
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
    date: "2026-12-14",
    time: "15:00",
    limit: 4,
    organizer: "Demo Organizer",
    participants: [],
    waitlist: [],
    attendance: {},
    cancelled: false
  }
];

const $ = id => document.getElementById(id);

function read(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

let games = read(DATA_KEY, demo);
let user = localStorage.getItem(USER_KEY) || "Player 1";

games.forEach(g => {
  g.participants = g.participants || [];
  g.waitlist = g.waitlist || [];
  g.attendance = g.attendance || {};
});

const save = () =>
  localStorage.setItem(DATA_KEY, JSON.stringify(games));

const isPast = g =>
  new Date(g.date + "T" + g.time) < new Date();

const safe = s => String(s).replace(/[&<>"']/g, c => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
}[c]));

function renderCards() {
  const q = $("search").value.toLowerCase();
  const sport = $("sportFilter").value;

  const list = games.filter(g =>
    !g.cancelled &&
    (!sport || g.sport === sport) &&
    (g.title + g.sport + g.venue).toLowerCase().includes(q)
  );

  $("meetupCards").innerHTML = list.map(g => {
    const joined = g.participants.includes(user);
    const waiting = g.waitlist.includes(user);
    const owner = g.organizer === user;
    const full = g.participants.length >= g.limit;
    const done = isPast(g);

    const action = joined || waiting
      ? `<button data-action="leave" data-id="${g.id}">
          ${joined ? "Leave" : "Leave waitlist"}
        </button>`
      : !done
        ? `<button data-action="join" data-id="${g.id}">
            ${full ? "Join waitlist" : "Join meetup"}
          </button>`
        : "";

    const wait = waiting
      ? `<p>Waitlist position: ${g.waitlist.indexOf(user) + 1}</p>`
      : "";

    const controls = owner ? `
      <button class="light" data-action="edit" data-id="${g.id}">Edit</button>
      <button class="danger" data-action="cancel" data-id="${g.id}">Cancel</button>
    ` : "";

    const attendance = owner && done
      ? g.participants.map(n => `
          <label>
            <input type="checkbox" data-action="attendance"
              data-id="${g.id}" data-name="${safe(n)}"
              ${g.attendance[n] === true ? "checked" : ""}>
            ${safe(n)} present
          </label>
        `).join("<br>")
      : "";

    return `
      <article class="card">
        <div class="sport-icon">${icons[g.sport] || "🏅"}</div>
        <span class="tag">${safe(g.sport)}</span>
        <h3>${safe(g.title)}</h3>
        <p>📍 ${safe(g.venue)}</p>
        <p>📅 ${safe(g.date)} · ${safe(g.time)}</p>
        <p>Organizer: ${safe(g.organizer)}</p>
        <p>Players: ${g.participants.length}/${g.limit}
          ${done ? "· Completed" : full ? "· Full" : "· Available"}
        </p>
        ${wait}
        <div class="card-actions">
          ${action}
          <button class="light" data-action="remind" data-id="${g.id}">
            Reminder
          </button>
          ${controls}
        </div>
        ${attendance}
      </article>
    `;
  }).join("") || '<p class="muted">No meetups found.</p>';
}

function render() {
  renderCards();

  const active = games.filter(g => !g.cancelled);

  $("total").textContent = active.length;
  $("joined").textContent =
    active.filter(g => g.participants.includes(user)).length;
  $("upcoming").textContent =
    active.filter(g => !isPast(g)).length;

  $("profileName").value = user;

  renderReports();
  renderReminders();
}

function renderReports() {
  let present = 0;
  let absent = 0;

  $("reportList").innerHTML = games
    .filter(g => !g.cancelled && isPast(g))
    .map(g => {
      let p = 0, a = 0, u = 0;

      g.participants.forEach(n => {
        if (g.attendance[n] === true) {
          p++;
          present++;
        } else if (g.attendance[n] === false) {
          a++;
          absent++;
        } else {
          u++;
        }
      });

      const rate = p + a ? Math.round(p / (p + a) * 100) : 0;

      return `
        <div class="list-item">
          <b>${safe(g.title)}</b>
          <p>Present: ${p} · Absent: ${a} · Not marked: ${u}</p>
          <div class="progress">
            <span style="width:${rate}%"></span>
          </div>
          <small>${rate}% attendance</small>
        </div>
      `;
    }).join("") || '<p class="muted">No completed meetups yet.</p>';

  $("present").textContent = present;
  $("absent").textContent = absent;
  $("rate").textContent =
    (present + absent
      ? Math.round(present / (present + absent) * 100)
      : 0) + "%";
}

function renderReminders() {
  const items = read(REM_KEY, []).filter(r =>
    new Date(r.date + "T" + r.time) >= new Date()
  );

  $("reminderList").innerHTML = items.map(r => `
    <div class="list-item">
      <b>${safe(r.title)}</b><br>
      ${safe(r.date)} · ${safe(r.time)}
    </div>
  `).join("") || '<p class="muted">No upcoming reminders.</p>';
}

function join(g) {
  if (!g || g.cancelled || isPast(g) ||
      g.participants.includes(user) ||
      g.waitlist.includes(user)) return;

  if (g.participants.length < g.limit) {
    g.participants.push(user);
    alert("You joined the meetup!");
  } else {
    g.waitlist.push(user);
    alert("Meetup full. You joined the waitlist.");
  }

  save();
  render();
}

function leave(g) {
  if (!g) return;

  let i = g.participants.indexOf(user);

  if (i >= 0) {
    g.participants.splice(i, 1);

    if (g.waitlist.length) {
      g.participants.push(g.waitlist.shift());
    }
  } else {
    i = g.waitlist.indexOf(user);
    if (i >= 0) g.waitlist.splice(i, 1);
  }

  save();
  render();
}

function setReminder(g) {
  if (!g || g.cancelled || isPast(g)) {
    alert("This meetup is not upcoming.");
    return;
  }

  const items = read(REM_KEY, []);

  if (items.some(r => r.id === g.id)) {
    alert("Reminder already saved.");
    return;
  }

  items.push({
    id: g.id,
    title: g.title,
    date: g.date,
    time: g.time
  });

  localStorage.setItem(REM_KEY, JSON.stringify(items));
  renderReminders();
  alert("Reminder saved!");
}

$("meetupCards").addEventListener("click", e => {
  const b = e.target.closest("[data-action]");
  if (!b) return;

  const g = games.find(x => x.id === Number(b.dataset.id));
  if (!g) return;

  const a = b.dataset.action;

  if (a === "join") join(g);
  if (a === "leave") leave(g);
  if (a === "remind") setReminder(g);

  if (a === "cancel" && g.organizer === user &&
      confirm("Cancel this meetup?")) {
    g.cancelled = true;
    save();
    render();
  }

  if (a === "edit" && g.organizer === user) {
    $("title").value = g.title;
    $("sport").value = g.sport;
    $("venue").value = g.venue;
    $("date").value = g.date;
    $("time").value = g.time;
    $("limit").value = g.limit;

    $("meetupForm").dataset.editId = g.id;
    $("submitMeetup").textContent = "Update meetup";
    location.hash = "#organize";
  }
});

$("meetupCards").addEventListener("change", e => {
  if (e.target.dataset.action !== "attendance") return;

  const g = games.find(x => x.id === Number(e.target.dataset.id));

  if (g && g.organizer === user && isPast(g)) {
    g.attendance[e.target.dataset.name] = e.target.checked;
    save();
    render();
  }
});

$("search").addEventListener("input", renderCards);
$("sportFilter").addEventListener("change", renderCards);

$("meetupForm").addEventListener("submit", e => {
  e.preventDefault();

  const f = e.target;

  const data = {
    title: $("title").value.trim(),
    sport: $("sport").value,
    venue: $("venue").value.trim(),
    date: $("date").value,
    time: $("time").value,
    limit: Number($("limit").value)
  };

  if (!data.title || !data.sport || !data.venue ||
      !data.date || !data.time ||
      new Date(data.date + "T" + data.time) <= new Date() ||
      !Number.isInteger(data.limit) ||
      data.limit < 1 || data.limit > 100) {
    $("formMessage").textContent =
      "Enter valid details and choose a future date.";
    return;
  }

  const id = Number(f.dataset.editId);
  const g = games.find(x => x.id === id);

  if (g) {
    if (g.organizer !== user || data.limit < g.participants.length) {
      $("formMessage").textContent =
        "You cannot edit this meetup or reduce its limit below registered players.";
      return;
    }

    Object.assign(g, data);
  } else {
    games.push({
      ...data,
      id: Date.now(),
      organizer: user,
      participants: [],
      waitlist: [],
      attendance: {},
      cancelled: false
    });
  }

  delete f.dataset.editId;
  $("submitMeetup").textContent = "Create meetup";
  f.reset();

  $("formMessage").textContent =
    g ? "Meetup updated!" : "Meetup created!";

  save();
  render();
});

$("clearForm").addEventListener("click", () => {
  $("meetupForm").reset();
  delete $("meetupForm").dataset.editId;
  $("submitMeetup").textContent = "Create meetup";
  $("formMessage").textContent = "";
});

$("profileForm").addEventListener("submit", e => {
  e.preventDefault();

  const old = user;
  const name = $("profileName").value.trim();
  if (!name) return;

  user = name;

  games.forEach(g => {
    g.participants = g.participants.map(n => n === old ? name : n);
    g.waitlist = g.waitlist.map(n => n === old ? name : n);

    if (g.attendance[old] !== undefined) {
      g.attendance[name] = g.attendance[old];
      delete g.attendance[old];
    }
  });

  localStorage.setItem(USER_KEY, user);
  save();
  render();

  $("profileMessage").textContent = "Profile updated!";
});

render();
