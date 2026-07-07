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

const leadsTableBody = document.getElementById("leadsTableBody");
const searchBar = document.getElementById("searchBar");
const filterBtns = document.querySelectorAll(".filter-btn");

const statTotal = document.getElementById("statTotal");
const statNew = document.getElementById("statNew");
const statContacted = document.getElementById("statContacted");
const statJoined = document.getElementById("statJoined");

let leads = []; // Local cache of leads
let currentFilter = "all";
let searchQuery = "";

// Auth State Observer
auth.onAuthStateChanged((user) => {
  if (user) {
    if (user.email === AUTHORIZED_EMAIL) {
      // Access Granted
      currentUserEmail.textContent = user.email;
      showDashboard();
      subscribeToLeads();
    } else {
      // Access Denied for other emails
      showError(`Access Denied: ${user.email} is not authorized.`);
      auth.signOut();
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

function showDashboard() {
  authContainer.style.display = "none";
  dashboardContainer.style.display = "block";
  adminHeader.style.display = "block";
}

function showLogin() {
  authContainer.style.display = "flex";
  dashboardContainer.style.display = "none";
  adminHeader.style.display = "none";
}

// Real-time Database Subscription
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
      updateStats();
      renderLeads();
    }, (error) => {
      console.error("Firestore subscription error:", error);
    });
}

// Update Dashboard Statistics Cards
function updateStats() {
  const total = leads.length;
  const newLeads = leads.filter(l => l.status === "New").length;
  const contacted = leads.filter(l => l.status === "Contacted").length;
  const joined = leads.filter(l => l.status === "Joined").length;

  statTotal.textContent = total;
  statNew.textContent = newLeads;
  statContacted.textContent = contacted;
  statJoined.textContent = joined;
}

// Render Leads Table with filtering & searching
function renderLeads() {
  let filteredLeads = leads;

  // Filter status
  if (currentFilter !== "all") {
    filteredLeads = filteredLeads.filter(l => l.status === currentFilter);
  }

  // Filter search query
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filteredLeads = filteredLeads.filter(l => 
      (l.name && l.name.toLowerCase().includes(q)) ||
      (l.phone && l.phone.toLowerCase().includes(q)) ||
      (l.club && l.club.toLowerCase().includes(q))
    );
  }

  if (filteredLeads.length === 0) {
    leadsTableBody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">No registrations found.</td>
      </tr>
    `;
    return;
  }

  leadsTableBody.innerHTML = filteredLeads.map(lead => {
    const date = lead.createdAt ? new Date(lead.createdAt.seconds * 1000).toLocaleDateString() : "Pending";
    return `
      <tr>
        <td>${date}</td>
        <td class="lead-name">${escapeHTML(lead.name)}</td>
        <td class="lead-phone">${escapeHTML(lead.phone)}</td>
        <td>${escapeHTML(lead.club)}</td>
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
