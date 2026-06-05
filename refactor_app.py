import re

with open('js/app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Imports
content = content.replace(
    "import { dataApi, currentUser } from './data.js';",
    "import { dataApi } from './data.js';\nimport { auth } from './firebase.js';\nimport { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js';"
)

# 2. Add Auth Elements
content = content.replace(
    "const userSwitcher = document.getElementById('user-switcher');",
    "const currentUserName = document.getElementById('current-user-name');\nconst currentUserRole = document.getElementById('current-user-role');\nconst btnLogout = document.getElementById('btn-logout');\nconst authOverlay = document.getElementById('auth-overlay');\nconst authForm = document.getElementById('auth-form');\nconst authEmail = document.getElementById('auth-email');\nconst authPassword = document.getElementById('auth-password');\nconst btnLogin = document.getElementById('btn-login');\nconst btnSignup = document.getElementById('btn-signup');\nconst authError = document.getElementById('auth-error');"
)

# 3. Update Init to Async and hook up Auth
init_replacement = '''
async function init() {
    state.currentDate = new Date().toISOString().split('T')[0];
    await populateInstrumentSelect();
    updateUserUI();
    setupEventListeners();
    await render();
}

onAuthStateChanged(auth, async (user) => {
    if (user) {
        if(authOverlay) authOverlay.style.display = 'none';
        await dataApi.seedDatabase(); // Ensure initial data exists
        const profile = await dataApi.fetchUserProfile(user.uid);
        if (!profile) {
            // Create default profile if signed up
            await dataApi.addUser({
                id: user.uid,
                name: user.email.split('@')[0],
                role: 'user',
                avatar: user.email.substring(0, 2).toUpperCase(),
                email: user.email,
                phone: '',
                otherInfo: '',
                allowedInstruments: []
            });
            await dataApi.fetchUserProfile(user.uid);
        }
        init();
    } else {
        if(authOverlay) authOverlay.style.display = 'flex';
    }
});

function updateUserUI() {
    const currentUser = dataApi.getCurrentUser();
    if (!currentUser) return;
    currentUserName.textContent = currentUser.name;
    currentUserRole.textContent = currentUser.role;
    currentUserAvatar.textContent = currentUser.avatar;
    if (currentUser.role === 'admin') {
        navAdmin.style.display = 'flex';
    } else {
        navAdmin.style.display = 'none';
        if (state.currentView === 'admin-panel') {
            state.currentView = 'dashboard';
        }
    }
}
'''

content = re.sub(r'function init\(\) \{.*?\}', init_replacement, content, flags=re.DOTALL)
content = re.sub(r'function populateUserSwitcher\(\) \{.*?\}', '', content, flags=re.DOTALL)
content = re.sub(r'function updateUserUI\(\) \{.*?\}', '', content, flags=re.DOTALL)

# 4. Auth Event Listeners
auth_listeners = '''
    if (authForm) {
        authForm.addEventListener('submit', (e) => e.preventDefault());
    }
    if (btnLogin) {
        btnLogin.addEventListener('click', async () => {
            try {
                authError.style.display = 'none';
                await signInWithEmailAndPassword(auth, authEmail.value, authPassword.value);
            } catch (err) {
                authError.textContent = err.message;
                authError.style.display = 'block';
            }
        });
    }
    if (btnSignup) {
        btnSignup.addEventListener('click', async () => {
            try {
                authError.style.display = 'none';
                await createUserWithEmailAndPassword(auth, authEmail.value, authPassword.value);
            } catch (err) {
                authError.textContent = err.message;
                authError.style.display = 'block';
            }
        });
    }
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            signOut(auth);
            window.location.reload();
        });
    }
'''

content = content.replace("// Global Search", auth_listeners + "\\n    // Global Search")

# 5. Make Render async
content = content.replace("function render() {", "async function render() {")
content = content.replace("viewContainer.innerHTML = renderDashboard", "viewContainer.innerHTML = await renderDashboard")
content = content.replace("viewContainer.innerHTML = renderCalendarView", "viewContainer.innerHTML = await renderCalendarView")
content = content.replace("viewContainer.innerHTML = renderMyBookings", "viewContainer.innerHTML = await renderMyBookings")
content = content.replace("viewContainer.innerHTML = renderAdminPanel", "viewContainer.innerHTML = await renderAdminPanel")

# 6. Make populateInstrumentSelect async
content = content.replace("function populateInstrumentSelect() {", "async function populateInstrumentSelect() {")
content = content.replace("const instruments = dataApi.getInstruments();", "const instruments = await dataApi.getInstruments();")

# 7. Convert modal actions to async
content = content.replace("btnModalSubmit.addEventListener('click', () => {", "btnModalSubmit.addEventListener('click', async () => {")
content = content.replace("dataApi.addBooking(bookingData);", "await dataApi.addBooking(bookingData);")
content = content.replace("dataApi.updateBooking(bookingId, bookingData);", "await dataApi.updateBooking(bookingId, bookingData);")
content = content.replace("render();", "await render();")

content = content.replace("btnModalDelete.addEventListener('click', () => {", "btnModalDelete.addEventListener('click', async () => {")
content = content.replace("dataApi.deleteBooking(bookingId);", "await dataApi.deleteBooking(bookingId);")

# 8. User Switcher listener removal
content = re.sub(r'userSwitcher\.addEventListener.*?\}\);', '', content, flags=re.DOTALL)

# 9. Admin panel edit/delete users
content = content.replace("dataApi.deleteUser(userId);", "await dataApi.deleteUser(userId);")
content = content.replace("dataApi.updateUser(userId, {", "await dataApi.updateUser(userId, {")
content = content.replace("const user = dataApi.getUsers().find", "const users = await dataApi.getUsers();\\n                const user = users.find")

# 10. Drag and drop
content = content.replace("dataApi.updateBooking(dragState.bookingId,", "await dataApi.updateBooking(dragState.bookingId,")

# 11. End of file: remove init() call since it's now handled by onAuthStateChanged
content = content.replace("// Start App\ninit();", "// Start App handled by Auth Listener")

# 12. Fix handleMouseUp to be async
content = content.replace("function handleMouseUp(e) {", "async function handleMouseUp(e) {")

with open('js/app.js', 'w', encoding='utf-8') as f:
    f.write(content)
