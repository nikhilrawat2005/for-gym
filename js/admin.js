// Admin Panel Controller for Forge Fitness
const AUTHORIZED_EMAIL = "nikhil2005114@gmail.com";

// DOM Elements
const authContainer = document.getElementById("authContainer");
const dashboardContainer = document.getElementById("dashboardContainer");
const adminHeader = document.getElementById("adminHeader");
const currentUserEmail = document.getElementById("currentUserEmail");
const googleSignInBtn = document.getElementById("googleSignInBtn");
const signOutBtn = document.getElementById("signOutBtn");
const errorMessage = document.getElementById("errorMessage");

const emailLoginForm = document.getElementById("emailLoginForm");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");

// User Portal Elements
const userDashboardContainer = document.getElementById("userDashboardContainer");
const userPhoto = document.getElementById("userPhoto");
const userName = document.getElementById("userName");
const userEmail = document.getElementById("userEmail");

const leadsTableBody = document.getElementById("leadsTableBody");
const searchBar = document.getElementById("searchBar");
const filterBtns = document.querySelectorAll("#tab-leads-list .filter-btn");

const statTotal = document.getElementById("statTotal");
const statNew = document.getElementById("statNew");
const statContacted = document.getElementById("statContacted");
const statJoined = document.getElementById("statJoined");

// New stat card elements (Phase 2)
const statTotalMembers = document.getElementById("statTotalMembers");
const statActiveMembers = document.getElementById("statActiveMembers");
const statExpiringMembers = document.getElementById("statExpiringMembers");
const statTotalLeads = document.getElementById("statTotalLeads");

// New search/filter elements for members tables (Phase 2)
const activeSearchBar = document.getElementById("activeSearchBar");
const expiringSearchBar = document.getElementById("expiringSearchBar");

let leads = []; // Local cache of leads
let members = []; // Local cache of gym members
let currentFilter = "all";
let searchQuery = "";

// Per-table state for search / gender filter / sorting (Phase 2)
const tableState = {
  active: { search: "", filter: "all", sortKey: null, sortDir: "asc" },
  expiring: { search: "", filter: "all", sortKey: null, sortDir: "asc" },
  leads: { sortKey: null, sortDir: "asc" }
};

// Auth State Observer
auth.onAuthStateChanged((user) => {
  if (user) {
    currentUserEmail.textContent = user.email;
    if (user.email === AUTHORIZED_EMAIL) {
      // Admin Access
      showAdminDashboard();
      subscribeToLeads();
      subscribeToMembers();
      setupSidebarTabs();
    } else {
      // Normal User Access
      showUserDashboard(user);
    }
  } else {
    // Signed out
    showLogin();
  }
});

// Email & Password Sign-In Handler
emailLoginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  errorMessage.style.display = "none";

  const email = loginEmail.value.trim();
  const password = loginPassword.value;

  auth.signInWithEmailAndPassword(email, password)
    .catch((error) => {
      console.error("Sign-in error:", error);
      showError(error.message);
    });
});

// Google Sign-In Handler
googleSignInBtn.addEventListener("click", () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  errorMessage.style.display = "none";
  
  auth.signInWithPopup(provider)
    .catch((error) => {
      console.error("Sign-in error:", error);
      showError(error.message);
    });
});

// Sign-Out Handler
signOutBtn.addEventListener("click", () => {
  auth.signOut().then(() => {
    showLogin();
  });
});

function showError(msg) {
  errorMessage.textContent = msg;
  errorMessage.style.display = "block";
}

function showAdminDashboard() {
  authContainer.style.display = "none";
  userDashboardContainer.style.display = "none";
  dashboardContainer.style.display = "flex"; // flex for sidebar layout
  adminHeader.style.display = "block";
}

function showUserDashboard(user) {
  authContainer.style.display = "none";
  dashboardContainer.style.display = "none";
  userDashboardContainer.style.display = "flex";
  adminHeader.style.display = "none"; // Normal users get Back/SignOut buttons inside their card

  // Set user details
  userName.textContent = user.displayName || "Forge Gym Member";
  userEmail.textContent = user.email;
  if (user.photoURL) {
    userPhoto.src = user.photoURL;
  } else {
    userPhoto.src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80";
  }
}

function showLogin() {
  authContainer.style.display = "flex";
  dashboardContainer.style.display = "none";
  userDashboardContainer.style.display = "none";
  adminHeader.style.display = "none";
}

// Sidebar Tab Toggling
function setupSidebarTabs() {
  const tabBtns = document.querySelectorAll(".sidebar-tab-btn");
  const tabContents = document.querySelectorAll(".admin-tab-content");

  tabBtns.forEach(btn => {
    // Clean listener cloning to avoid duplicate bindings
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.addEventListener("click", () => {
      const allBtns = document.querySelectorAll(".sidebar-tab-btn");
      allBtns.forEach(b => b.classList.remove("active"));
      tabContents.forEach(c => c.classList.remove("active"));

      newBtn.classList.add("active");
      const targetTab = newBtn.getAttribute("data-tab");
      document.getElementById(`tab-${targetTab}`).classList.add("active");
    });
  });
}

// Real-time Leads subscription
let unsubscribeLeads = null;
function subscribeToLeads() {
  if (unsubscribeLeads) unsubscribeLeads();

  unsubscribeLeads = db.collection("leads")
    .orderBy("createdAt", "desc")
    .onSnapshot((snapshot) => {
      leads = [];
      snapshot.forEach((doc) => {
        leads.push({
          id: doc.id,
          ...doc.data()
        });
      });
      renderLeads();
    }, (error) => {
      console.error("Firestore leads subscription error:", error);
    });
}

// Real-time Members subscription
let unsubscribeMembers = null;
function subscribeToMembers() {
  if (unsubscribeMembers) unsubscribeMembers();

  // Load members
  unsubscribeMembers = db.collection("members")
    .orderBy("createdAt", "desc")
    .onSnapshot((snapshot) => {
      members = [];
      snapshot.forEach((doc) => {
        members.push({
          id: doc.id,
          ...doc.data()
        });
      });
      renderMembers();
    }, (error) => {
      console.error("Firestore members subscription error:", error);
    });
}

// Compute daysLeft for a member (extracted so it can be reused for sorting/filtering)
function computeDaysLeft(member) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(member.startDate);
  const durationMonths = parseInt(member.duration);
  const expiry = new Date(start);
  expiry.setMonth(expiry.getMonth() + durationMonths);
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function memberRowHTML(member, daysLeft) {
  return `
    <tr>
      <td class="lead-name">${escapeHTML(member.name)}</td>
      <td>${member.age} / ${member.gender}</td>
      <td>
        <div class="lead-phone">${escapeHTML(member.phone)}</div>
        <div style="font-size: 11px; color: var(--muted);">${escapeHTML(member.address || 'No address')}</div>
      </td>
      <td>${member.startDate}</td>
      <td>${member.duration} Month${member.duration > 1 ? 's' : ''}</td>
      <td>
        <span style="font-weight: 700; color: ${daysLeft < 30 ? 'var(--error)' : 'var(--success)'}">
          ${daysLeft > 0 ? daysLeft + ' Days Left' : (daysLeft === 0 ? 'Expires Today' : 'Expired')}
        </span>
      </td>
      <td>₹${parseInt(member.fees).toLocaleString()}</td>
      <td>
        <button class="btn-delete" style="margin: 0;" onclick="deleteMember('${member.id}')">Remove</button>
      </td>
    </tr>
  `;
}

// Apply search text + gender filter to a list of members (with daysLeft attached)
function filterMembers(list, state) {
  let result = list;
  if (state.filter !== "all") {
    result = result.filter(m => m.gender === state.filter);
  }
  if (state.search) {
    const q = state.search.toLowerCase();
    result = result.filter(m =>
      (m.name && m.name.toLowerCase().includes(q)) ||
      (m.phone && m.phone.toLowerCase().includes(q))
    );
  }
  return result;
}

// Apply current sort key/direction for a member list
function sortMembers(list, state) {
  if (!state.sortKey) return list;
  const dir = state.sortDir === "asc" ? 1 : -1;
  const key = state.sortKey;
  return [...list].sort((a, b) => {
    let av, bv;
    if (key === "daysLeft") { av = a.daysLeft; bv = b.daysLeft; }
    else if (key === "age" || key === "fees") { av = parseFloat(a[key]); bv = parseFloat(b[key]); }
    else if (key === "duration") { av = parseInt(a[key]); bv = parseInt(b[key]); }
    else if (key === "startDate") { av = new Date(a[key]).getTime(); bv = new Date(b[key]).getTime(); }
    else { av = (a[key] || "").toString().toLowerCase(); bv = (b[key] || "").toString().toLowerCase(); }

    if (av < bv) return -1 * dir;
    if (av > bv) return 1 * dir;
    return 0;
  });
}

// Render members into Active vs Expiring (near end)
function renderMembers() {
  const activeBody = document.getElementById("activeMembersTableBody");
  const expiringBody = document.getElementById("expiringMembersTableBody");

  if (!activeBody || !expiringBody) return;

  // Attach computed daysLeft to every member once
  const withDaysLeft = members.map(m => ({ ...m, daysLeft: computeDaysLeft(m) }));

  let activeList = withDaysLeft.filter(m => m.daysLeft >= 30);
  let expiringList = withDaysLeft.filter(m => m.daysLeft < 30);

  // Search + gender filter
  activeList = filterMembers(activeList, tableState.active);
  expiringList = filterMembers(expiringList, tableState.expiring);

  // Sorting
  activeList = sortMembers(activeList, tableState.active);
  expiringList = sortMembers(expiringList, tableState.expiring);

  // Populate Active table
  if (activeList.length === 0) {
    activeBody.innerHTML = `<tr><td colspan="8" class="empty-state">No active members found.</td></tr>`;
  } else {
    activeBody.innerHTML = activeList.map(m => memberRowHTML(m, m.daysLeft)).join('');
  }

  // Populate Expiring table
  if (expiringList.length === 0) {
    expiringBody.innerHTML = `<tr><td colspan="8" class="empty-state">No expiring members found.</td></tr>`;
  } else {
    expiringBody.innerHTML = expiringList.map(m => memberRowHTML(m, m.daysLeft)).join('');
  }

  // Update stat cards
  updateStats(withDaysLeft);
}

// Update stat cards summary (Phase 2)
function updateStats(withDaysLeft) {
  if (statTotalMembers) statTotalMembers.textContent = members.length;
  if (statActiveMembers) statActiveMembers.textContent = withDaysLeft.filter(m => m.daysLeft >= 30).length;
  if (statExpiringMembers) statExpiringMembers.textContent = withDaysLeft.filter(m => m.daysLeft < 30).length;
  if (statTotalLeads) statTotalLeads.textContent = leads.length;
}

// Add Member Form submission
const addMemberForm = document.getElementById("addMemberForm");
const memberFormNote = document.getElementById("memberFormNote");

if (addMemberForm) {
  addMemberForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    memberFormNote.textContent = "";

    const name = document.getElementById("mName").value.trim();
    const phone = document.getElementById("mPhone").value.trim();
    const age = parseInt(document.getElementById("mAge").value);
    const gender = document.getElementById("mGender").value;
    const startDate = document.getElementById("mStartDate").value;
    const duration = document.getElementById("mDuration").value;
    const fees = parseFloat(document.getElementById("mFees").value);
    const address = document.getElementById("mAddress").value.trim();

    const memberData = {
      name,
      phone,
      age,
      gender,
      startDate,
      duration,
      fees,
      address,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
      const submitBtn = addMemberForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = "Registering...";

      await db.collection("members").add(memberData);

      memberFormNote.style.color = "var(--success)";
      memberFormNote.textContent = "Member registered successfully!";
      addMemberForm.reset();
      
      // Switch to active members list tab
      setTimeout(() => {
        const activeTabBtn = document.querySelector('[data-tab="active-members"]');
        if (activeTabBtn) activeTabBtn.click();
        memberFormNote.textContent = "";
      }, 1500);
    } catch (error) {
      console.error("Error registering member:", error);
      memberFormNote.style.color = "var(--error)";
      memberFormNote.textContent = "Failed to register member. Check Firestore rules.";
    } finally {
      const submitBtn = addMemberForm.querySelector('button[type="submit"]');
      submitBtn.disabled = false;
      submitBtn.textContent = "Register Member";
    }
  });
}

// Delete member from Firestore
window.deleteMember = async function(id) {
  if (confirm("Are you sure you want to remove this member?")) {
    try {
      await db.collection("members").doc(id).delete();
    } catch (error) {
      console.error("Error removing member:", error);
      alert("Failed to remove member. Check permissions.");
    }
  }
};

// Render Leads Table with filtering & searching
function renderLeads() {
  let filteredLeads = leads;

  if (currentFilter !== "all") {
    filteredLeads = filteredLeads.filter(l => l.status === currentFilter);
  }

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filteredLeads = filteredLeads.filter(l => 
      (l.name && l.name.toLowerCase().includes(q)) ||
      (l.phone && l.phone.toLowerCase().includes(q)) ||
      (l.club && l.club.toLowerCase().includes(q))
    );
  }

  // Sorting (Phase 2)
  const sortState = tableState.leads;
  if (sortState.sortKey) {
    const dir = sortState.sortDir === "asc" ? 1 : -1;
    const key = sortState.sortKey;
    filteredLeads = [...filteredLeads].sort((a, b) => {
      let av, bv;
      if (key === "createdAt") {
        av = a.createdAt ? a.createdAt.seconds : 0;
        bv = b.createdAt ? b.createdAt.seconds : 0;
      } else {
        av = (a[key] || "").toString().toLowerCase();
        bv = (b[key] || "").toString().toLowerCase();
      }
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
  }

  if (statTotalLeads) statTotalLeads.textContent = leads.length;

  if (filteredLeads.length === 0) {
    leadsTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">No registrations found.</td>
      </tr>
    `;
    return;
  }

  leadsTableBody.innerHTML = filteredLeads.map(lead => {
    const date = lead.createdAt ? new Date(lead.createdAt.seconds * 1000).toLocaleDateString() : "Pending";
    const visitDate = lead.visitDate ? lead.visitDate : "Not Selected";
    return `
      <tr>
        <td>${date}</td>
        <td class="lead-name">${escapeHTML(lead.name)}</td>
        <td class="lead-phone">${escapeHTML(lead.phone)}</td>
        <td>${escapeHTML(lead.club)}</td>
        <td style="font-weight: 600; color: var(--ember-2);">${escapeHTML(visitDate)}</td>
        <td>
          <span class="status-badge status-${lead.status.toLowerCase()}">${lead.status}</span>
        </td>
        <td>
          <select class="action-select" onchange="updateLeadStatus('${lead.id}', this.value)">
            <option value="New" ${lead.status === 'New' ? 'selected' : ''}>New</option>
            <option value="Contacted" ${lead.status === 'Contacted' ? 'selected' : ''}>Contacted</option>
            <option value="Joined" ${lead.status === 'Joined' ? 'selected' : ''}>Joined</option>
          </select>
          <button class="btn-delete" onclick="deleteLead('${lead.id}')">Delete</button>
        </td>
      </tr>
    `;
  }).join('');
}

// Update lead status in Firestore
window.updateLeadStatus = async function(id, newStatus) {
  try {
    await db.collection("leads").doc(id).update({
      status: newStatus
    });
  } catch (error) {
    console.error("Error updating lead status:", error);
    alert("Failed to update status. Make sure rules permit this.");
  }
};

// Delete lead from Firestore
window.deleteLead = async function(id) {
  if (confirm("Are you sure you want to delete this registration?")) {
    try {
      await db.collection("leads").doc(id).delete();
    } catch (error) {
      console.error("Error deleting lead:", error);
      alert("Failed to delete lead. Check permissions.");
    }
  }
};

// Search filter
searchBar.addEventListener("input", (e) => {
  searchQuery = e.target.value;
  renderLeads();
});

// Category/Status filter
filterBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    filterBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.getAttribute("data-filter");
    renderLeads();
  });
});

// ===== PHASE 2: Search bars for Active / Expiring member tables =====
if (activeSearchBar) {
  activeSearchBar.addEventListener("input", (e) => {
    tableState.active.search = e.target.value;
    renderMembers();
  });
}

if (expiringSearchBar) {
  expiringSearchBar.addEventListener("input", (e) => {
    tableState.expiring.search = e.target.value;
    renderMembers();
  });
}

// ===== PHASE 2: Gender filter buttons for Active / Expiring member tables =====
document.querySelectorAll(".filter-btn[data-target='active'], .filter-btn[data-target='expiring']").forEach(btn => {
  btn.addEventListener("click", () => {
    const target = btn.getAttribute("data-target");
    const group = document.querySelectorAll(`.filter-btn[data-target='${target}']`);
    group.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    tableState[target].filter = btn.getAttribute("data-filter");
    renderMembers();
  });
});

// ===== PHASE 2: Sortable table headers (Active, Expiring, Leads) =====
document.querySelectorAll("th.sortable").forEach(th => {
  th.addEventListener("click", () => {
    const target = th.getAttribute("data-target");
    const key = th.getAttribute("data-sort");
    const state = tableState[target];
    if (!state) return;

    if (state.sortKey === key) {
      state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
    } else {
      state.sortKey = key;
      state.sortDir = "asc";
    }

    // Reset sort indicator classes for this table's headers only
    document.querySelectorAll(`th.sortable[data-target='${target}']`).forEach(h => {
      h.classList.remove("sort-asc", "sort-desc");
    });
    th.classList.add(state.sortDir === "asc" ? "sort-asc" : "sort-desc");

    if (target === "leads") {
      renderLeads();
    } else {
      renderMembers();
    }
  });
});

// Utility to escape HTML and prevent XSS injection
function escapeHTML(str) {
  if (!str) return "";
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}
