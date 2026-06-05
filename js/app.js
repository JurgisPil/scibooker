// js/app.js
import { dataApi } from './data.js?v=13';
import { auth, googleProvider } from './firebase.js?v=13';
import { signInWithPopup, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js';
import { renderDashboard, renderCalendarView, renderMyBookings, renderAdminPanel } from './components.js?v=13';

window.addEventListener('error', function(e) {
    document.body.innerHTML += '<div style="position:fixed;top:0;left:0;width:100%;background:red;color:white;z-index:99999;padding:20px;font-size:20px;">ERROR: ' + e.message + ' at ' + e.filename + ':' + e.lineno + '</div>';
});
window.addEventListener('unhandledrejection', function(e) {
    document.body.innerHTML += '<div style="position:fixed;top:0;left:0;width:100%;background:red;color:white;z-index:99999;padding:20px;font-size:20px;">PROMISE ERROR: ' + (e.reason && e.reason.message ? e.reason.message : e.reason) + '</div>';
});

// Application State
const state = {
    currentView: 'dashboard', // 'dashboard', 'calendar', 'my-bookings', 'settings'
    selectedInstrumentId: null,
    currentDate: getTodayStr(),
    timelineScale: 30, // 1, 7, or 30 days
    searchQuery: '',
};

// DOM Elements
const viewContainer = document.getElementById('view-container');
const navItems = document.querySelectorAll('.nav-item');
const btnNewBooking = document.getElementById('btn-new-booking');
const globalSearchInput = document.getElementById('global-search-input');

// Modal Elements
const modal = document.getElementById('booking-modal');
const closeBtns = document.querySelectorAll('.close-modal');
const bookingForm = document.getElementById('booking-form');
const instrumentSelect = document.getElementById('instrument-select');
const channelCheckboxGroup = document.getElementById('channel-checkbox-group');
const btnModalDelete = document.getElementById('btn-modal-delete');
const btnModalSubmit = document.getElementById('btn-modal-submit');
const modalTitle = document.getElementById('modal-title');
const editingBookingIdInput = document.getElementById('editing-booking-id');
const currentUserName = document.getElementById('current-user-name');
const currentUserRole = document.getElementById('current-user-role');
const btnLogout = document.getElementById('btn-logout');
const authOverlay = document.getElementById('auth-overlay');
const btnGoogleSignin = document.getElementById('btn-google-signin');
const authError = document.getElementById('auth-error');
const currentUserAvatar = document.getElementById('current-user-avatar');
const navAdmin = document.getElementById('nav-admin');

// Edit Instrument Modal Elements
const editInstModal = document.getElementById('edit-instrument-modal');
const closeEditBtns = document.querySelectorAll('.close-edit-modal');
const formEditInstrument = document.getElementById('form-edit-instrument');

const editUserModal = document.getElementById('edit-user-modal');
const closeEditUserModalBtns = document.querySelectorAll('.close-edit-user-modal');
const formEditUser = document.getElementById('form-edit-user');

// Drag State
let dragState = null;
let wasDragged = false;

// Initialization

async function updateUserUI() {
    const user = await dataApi.getCurrentUser();
    if (user) {
        const avatarEl = document.getElementById('current-user-avatar');
        const safeName = user.name || 'User';
        if (avatarEl) avatarEl.textContent = user.avatar || safeName.substring(0, 2).toUpperCase();
        
        const nameEl = document.getElementById('current-user-name');
        if (nameEl) nameEl.textContent = safeName;
        
        const roleEl = document.getElementById('current-user-role');
        if (roleEl) roleEl.textContent = user.role || 'user';
        
        const navAdmin = document.querySelector('[data-view="admin-panel"]');
        if (navAdmin) {
            if (user.role === 'admin') {
                navAdmin.style.display = 'flex';
            } else {
                navAdmin.style.display = 'none';
                if (state.currentView === 'admin-panel') {
                    state.currentView = 'dashboard';
                }
            }
        }
    }
}

async function init() {
    state.currentDate = new Date().toISOString().split('T')[0];
    await populateInstrumentSelect();
    await updateUserUI();
    await render();
}

onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Verify Allowlist FIRST
        const isAllowed = await dataApi.isEmailAllowed(user.email);
        if (!isAllowed) {
            const errEl = document.getElementById('auth-error');
            if(errEl) {
                errEl.textContent = `Access Denied: Email ${user.email} is not authorized by the admin.`;
                errEl.style.display = 'block';
            }
            await signOut(auth);
            return;
        }

        if(authOverlay) authOverlay.style.display = 'none';
        await dataApi.seedDatabase(); // Ensure initial data exists
        let profile = await dataApi.fetchUserProfile(user.uid);
        if (!profile) {
            // Create default profile if signed up
            await dataApi.addUser({
                id: user.uid,
                name: user.displayName || user.email.split('@')[0],
                role: user.email === 'j.pilipavicius@gmail.com' ? 'admin' : 'user',
                avatar: user.photoURL ? null : user.email.substring(0, 2).toUpperCase(),
                photoURL: user.photoURL || null,
                email: user.email,
                phone: '',
                otherInfo: '',
                allowedInstruments: []
            });
            profile = await dataApi.fetchUserProfile(user.uid);
        } else if (profile.email === 'j.pilipavicius@gmail.com' && profile.role !== 'admin') {
            // Auto-promote existing account
            await dataApi.updateUser(user.uid, { role: 'admin' });
            profile = await dataApi.fetchUserProfile(user.uid);
        }
        init();
    } else {
        if(authOverlay) authOverlay.style.display = 'flex';
    }
});

// Helpers
function getTodayStr() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

// Event Listeners
function setupEventListeners() {
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    
    if (btnGoogleSignin) {
        btnGoogleSignin.addEventListener('click', async (e) => {
            try {
                if (authError) authError.style.display = 'none';
                const originalText = btnGoogleSignin.innerHTML;
                btnGoogleSignin.textContent = 'Loading...';
                await signInWithPopup(auth, googleProvider);
            } catch (err) {
                if (authError) {
                    authError.textContent = err.message;
                    authError.style.display = 'block';
                }
                btnGoogleSignin.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/></svg> Sign in with Google`;
            }
        });
    }
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            signOut(auth);
            window.location.reload();
        });
    }
    // Global Search
    if (globalSearchInput) {
        globalSearchInput.addEventListener('input', async (e) => {
            state.searchQuery = e.target.value.toLowerCase().trim();
            if (state.currentView !== 'dashboard') {
                state.currentView = 'dashboard';
                navItems.forEach(nav => nav.classList.remove('active'));
                document.querySelector('[data-view="dashboard"]').classList.add('active');
            }
            await render();
        });
    }

    // Navigation
    navItems.forEach(item => {
        item.addEventListener('click', async (e) => {
            e.preventDefault();
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            state.currentView = item.dataset.view;
            if(state.currentView === 'dashboard') {
                state.selectedInstrumentId = null;
            }
            await render();
        });
    });

    // User Switcher
    

    // View Container Submit Delegation (for dynamic forms like Admin Panel)
    viewContainer.addEventListener('submit', async (e) => {
        if (e.target.id === 'form-add-instrument') {
            e.preventDefault();
            const name = document.getElementById('new-inst-name').value.trim();
            const desc = document.getElementById('new-inst-desc').value.trim();
            const prefix = document.getElementById('new-inst-prefix').value.trim();
            const count = parseInt(document.getElementById('new-inst-count').value);
            
            dataApi.addInstrument({ name, description: desc, channelPrefix: prefix, channelCount: count });
            alert('Instrument created successfully!');
            populateInstrumentSelect();
            await render();
        } else if (e.target.id === 'form-add-allowlist') {
            e.preventDefault();
            const email = document.getElementById('new-allowlist-email').value.trim();
            if (email) {
                await dataApi.addAllowedEmail(email);
                alert('Email added to allowlist!');
                await render();
            }
        } else if (e.target.id === 'form-add-user') {
            e.preventDefault();
            const name = document.getElementById('new-user-name').value.trim();
            const role = document.getElementById('new-user-role').value;
            const email = document.getElementById('new-user-email').value.trim();
            const phone = document.getElementById('new-user-phone').value.trim();
            const otherInfo = document.getElementById('new-user-other').value.trim();
            
            if (name) {
                dataApi.addUser({ name, role, email, phone, otherInfo });
                alert('User created successfully!');
                populateUserSwitcher();
                await render();
            }
        } else if (e.target.id === 'form-user-permissions') {
            e.preventDefault();
            const users = dataApi.getUsers();
            users.forEach(u => {
                const checkedBoxes = e.target.querySelectorAll(`.perm-checkbox[data-user="${u.id}"]:checked`);
                const instIds = Array.from(checkedBoxes).map(cb => cb.value);
                dataApi.updateUserPermissions(u.id, instIds);
            });
            alert('Permissions saved successfully!');
            populateInstrumentSelect();
            await render();
        }
    });

    // View Container Click Delegation (for dynamically rendered content)
    viewContainer.addEventListener('click', async (e) => {
        // Remove Allowlist Email
        const btnRemoveAllowlist = e.target.closest('.btn-remove-allowlist');
        if (btnRemoveAllowlist) {
            e.preventDefault();
            const email = btnRemoveAllowlist.dataset.email;
            if(confirm(`Remove ${email} from allowlist?`)) {
                await dataApi.removeAllowedEmail(email);
                await render();
            }
            return;
        }
        
        // Edit User (Admin Panel)
        const btnEditUser = e.target.closest('.btn-edit-user');
        if (btnEditUser) {
            e.preventDefault();
            const userId = btnEditUser.dataset.id;
            const users = await dataApi.getUsers();
            const user = users.find(u => u.id === userId);
            if (user) {
                document.getElementById('edit-user-id').value = user.id;
                document.getElementById('edit-user-name').value = user.name;
                document.getElementById('edit-user-role').value = user.role;
                document.getElementById('edit-user-email').value = user.email || '';
                document.getElementById('edit-user-phone').value = user.phone || '';
                document.getElementById('edit-user-other').value = user.otherInfo || '';
                
                editUserModal.classList.remove('hidden');
            }
        }
        
        // Delete User (Admin Panel)
        const btnDeleteUser = e.target.closest('.btn-delete-user');
        if (btnDeleteUser) {
            e.preventDefault();
            if(confirm('Are you sure you want to delete this user? All their upcoming bookings will be removed.')) {
                dataApi.deleteUser(btnDeleteUser.dataset.id);
                populateUserSwitcher();
                await render();
            }
        }

        // Edit Instrument (Admin Panel)
        const btnEditInst = e.target.closest('.btn-edit-instrument');
        if (btnEditInst) {
            e.preventDefault();
            const instId = btnEditInst.dataset.id;
            const inst = dataApi.getInstrumentById(instId);
            if (inst) {
                document.getElementById('edit-inst-id').value = inst.id;
                document.getElementById('edit-inst-name').value = inst.name;
                document.getElementById('edit-inst-desc').value = inst.description || '';
                
                // Try to infer channel prefix and count
                const count = inst.channels.length;
                let prefix = 'ch-';
                if (count > 0 && inst.channels[0].name) {
                    const match = inst.channels[0].name.match(/^(.*?)\s*\d+$/);
                    if (match) prefix = match[1].trim();
                }
                
                document.getElementById('edit-inst-prefix').value = prefix;
                document.getElementById('edit-inst-count').value = count;
                
                editInstModal.classList.remove('hidden');
            }
            return;
        }

        // Delete Instrument (Admin Panel)
        const btnDeleteInst = e.target.closest('.btn-delete-instrument');
        if (btnDeleteInst) {
            e.preventDefault();
            const instId = btnDeleteInst.dataset.id;
            if (confirm('Are you sure you want to delete this instrument? All associated bookings will be lost.')) {
                dataApi.deleteInstrument(instId);
                populateInstrumentSelect();
                await render();
            }
            return;
        }

        // Delete Booking directly from list
        const deleteBtn = e.target.closest('.btn-delete-booking');
        if (deleteBtn) {
            e.preventDefault();
            e.stopPropagation();
            const bookingId = deleteBtn.dataset.id;
            if (confirm('Are you sure you want to cancel this booking?')) {
                await dataApi.deleteBooking(bookingId);
                await render();
            }
            return;
        }

        // Edit Booking from My Bookings Card
        const myBookingCard = e.target.closest('.my-booking-card');
        if (myBookingCard) {
            openModal(myBookingCard.dataset.bookingId);
            return;
        }

        // Edit Booking from Gantt Chart
        const ganttBooking = e.target.closest('.gantt-booking');
        if (ganttBooking) {
            if (wasDragged) return; // Ignore click if dragging occurred
            const currentUser = dataApi.getCurrentUser();
            if (ganttBooking.classList.contains('my-booking') || currentUser.role === 'admin') {
                openModal(ganttBooking.dataset.bookingId);
            } else {
                alert('You cannot edit a booking made by someone else.');
            }
            return;
        }

        // Click on empty Gantt row to add booking
        const ganttRowBg = e.target.closest('.gantt-row-bg');
        if (ganttRowBg && !e.target.closest('.gantt-booking')) {
            e.preventDefault();
            const container = ganttRowBg.closest('.gantt-container');
            const viewStart = new Date(container.dataset.startDate);
            const cellWidth = parseFloat(container.dataset.cellWidth);
            
            // Calculate clicked time
            const rect = ganttRowBg.getBoundingClientRect();
            const offsetX = e.clientX - rect.left;
            const daysOffset = offsetX / cellWidth;
            
            // Calculate start date
            const clickDate = new Date(viewStart);
            clickDate.setTime(clickDate.getTime() + (daysOffset * 24 * 60 * 60 * 1000));
            
            // Round to nearest 30 mins
            const msIn30Mins = 30 * 60 * 1000;
            const roundedTime = Math.round(clickDate.getTime() / msIn30Mins) * msIn30Mins;
            const finalStart = new Date(roundedTime);
            const finalEnd = new Date(finalStart.getTime() + (24 * 60 * 60 * 1000));
            
            const channelId = ganttRowBg.dataset.channelId;
            openModal(null, channelId, finalStart, finalEnd);
            return;
        }

        // Toggle Scale
        const scaleBtn = e.target.closest('.toggle-scale');
        if (scaleBtn) {
            state.timelineScale = parseInt(scaleBtn.dataset.scale);
            await render();
            return;
        }

        // Click on Instrument Card
        const card = e.target.closest('.instrument-card');
        if (card) {
            state.selectedInstrumentId = card.dataset.id;
            state.currentView = 'calendar';
            navItems.forEach(nav => nav.classList.remove('active')); // clear active nav
            await render();
            return;
        }

        // Back button
        const backBtn = e.target.closest('#btn-back');
        if (backBtn) {
            state.currentView = 'dashboard';
            state.selectedInstrumentId = null;
            document.querySelector('[data-view="dashboard"]').classList.add('active');
            await render();
            return;
        }

        // Date Navigation
        const prevPeriod = e.target.closest('#btn-prev-period');
        if (prevPeriod) {
            changeDate(-state.timelineScale);
            return;
        }

        const nextPeriod = e.target.closest('#btn-next-period');
        if (nextPeriod) {
            changeDate(state.timelineScale);
            return;
        }
    });

    // Modal
    btnNewBooking.addEventListener('click', () => openModal(null));
    closeBtns.forEach(btn => btn.addEventListener('click', closeModal));

    btnModalDelete.addEventListener('click', async () => {
        const id = editingBookingIdInput.value;
        if (id && confirm('Are you sure you want to delete this reservation?')) {
            dataApi.deleteBooking(id);
            closeModal();
            await render();
        }
    });

    instrumentSelect.addEventListener('change', async (e) => {
        populateChannelSelect(e.target.value);
    });

    bookingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleBookingSubmit();
    });

    // Edit Instrument Modal Logic
    closeEditBtns.forEach(btn => btn.addEventListener('click', () => {
        editInstModal.classList.add('hidden');
    }));

    formEditInstrument.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-inst-id').value;
        const name = document.getElementById('edit-inst-name').value.trim();
        const desc = document.getElementById('edit-inst-desc').value.trim();
        const prefix = document.getElementById('edit-inst-prefix').value.trim();
        const count = parseInt(document.getElementById('edit-inst-count').value);

        const updatedInst = dataApi.updateInstrument(id, { name, description: desc, channelPrefix: prefix, channelCount: count });
        if (updatedInst) {
            editInstModal.classList.add('hidden');
            populateInstrumentSelect();
            await render();
            alert('Instrument updated successfully!');
        }
    });

    // Edit User Modal Logic
    closeEditUserModalBtns.forEach(btn => btn.addEventListener('click', () => {
        editUserModal.classList.add('hidden');
    }));

    formEditUser.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-user-id').value;
        const name = document.getElementById('edit-user-name').value.trim();
        const role = document.getElementById('edit-user-role').value;
        const email = document.getElementById('edit-user-email').value.trim();
        const phone = document.getElementById('edit-user-phone').value.trim();
        const otherInfo = document.getElementById('edit-user-other').value.trim();

        if (name) {
            const updatedUser = dataApi.updateUser(id, { name, role, email, phone, otherInfo });
            if (updatedUser) {
                editUserModal.classList.add('hidden');
                populateUserSwitcher();
                
                // Update current user UI if they edited themselves
                const currentUser = await dataApi.getCurrentUser();
                if (currentUser && currentUser.id === id) {
                    await updateUserUI();
                }
                
                await render();
                alert('User updated successfully!');
            }
        }
    });
}

async function changeDate(days) {
    const d = new Date(state.currentDate);
    d.setDate(d.getDate() + days);
    
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    
    state.currentDate = `${yyyy}-${mm}-${dd}`;
    await render();
}

// Render loop
async function render() {
    if (state.currentView === 'dashboard') {
        viewContainer.innerHTML = await renderDashboard(state.searchQuery);
    } else if (state.currentView === 'calendar') {
        viewContainer.innerHTML = await renderCalendarView(state.selectedInstrumentId, state.currentDate, state.timelineScale);
    } else if (state.currentView === 'my-bookings') {
        viewContainer.innerHTML = await renderMyBookings();
    } else if (state.currentView === 'admin-panel') {
        viewContainer.innerHTML = await renderAdminPanel();
    } else {
        viewContainer.innerHTML = `<div class="dashboard-header"><h2>Work in Progress...</h2></div>`;
    }
}

// Modal Logic
function openModal(bookingId = null, prefillChannelId = null, prefillStartDate = null, prefillEndDate = null) {
    // Reset form
    bookingForm.reset();
    
    // Check if event object was passed instead of bookingId
    if (bookingId && typeof bookingId === 'object') {
        bookingId = null;
    }
    
    editingBookingIdInput.value = bookingId || '';
    
    if (bookingId) {
        // Edit Mode
        const booking = dataApi.getBookingById(bookingId);
        if (!booking) return;

        modalTitle.textContent = 'Edit Booking';
        btnModalSubmit.textContent = 'Save Changes';
        btnModalDelete.style.display = 'block';

        const sDate = new Date(booking.startDate);
        const eDate = new Date(booking.endDate);

        document.getElementById('booking-start-date').value = sDate.toISOString().split('T')[0];
        document.getElementById('booking-start-time').value = sDate.toTimeString().substring(0,5);
        document.getElementById('booking-end-date').value = eDate.toISOString().split('T')[0];
        document.getElementById('booking-end-time').value = eDate.toTimeString().substring(0,5);
        document.getElementById('booking-purpose').value = booking.purpose;

        const inst = dataApi.getInstrumentById(booking.instrumentId);
        document.getElementById('instrument-display').textContent = inst ? inst.name : 'Unknown Instrument';
        document.getElementById('instrument-display').style.display = 'block';
        instrumentSelect.style.display = 'none';

        instrumentSelect.value = booking.instrumentId;
        populateChannelSelect(booking.instrumentId);
        
        // Select the channel
        const checkbox = channelCheckboxGroup.querySelector(`input[value="${booking.channelId}"]`);
        if (checkbox) checkbox.checked = true;

    } else {
        // Create Mode
        modalTitle.textContent = 'New Booking';
        btnModalSubmit.textContent = 'Confirm Booking';
        btnModalDelete.style.display = 'none';

        document.getElementById('instrument-display').style.display = 'none';
        instrumentSelect.style.display = 'block';

        if (prefillStartDate && prefillEndDate) {
            document.getElementById('booking-start-date').value = prefillStartDate.toISOString().split('T')[0];
            document.getElementById('booking-start-time').value = prefillStartDate.toTimeString().substring(0,5);
            document.getElementById('booking-end-date').value = prefillEndDate.toISOString().split('T')[0];
            document.getElementById('booking-end-time').value = prefillEndDate.toTimeString().substring(0,5);
        } else {
            document.getElementById('booking-start-date').value = state.currentDate;
            document.getElementById('booking-start-time').value = '09:00';
            
            // Default end date is 7 days from now
            const endDate = new Date(state.currentDate);
            endDate.setDate(endDate.getDate() + 7);
            document.getElementById('booking-end-date').value = endDate.toISOString().split('T')[0];
            document.getElementById('booking-end-time').value = '17:00';
        }
        
        if (state.selectedInstrumentId) {
            instrumentSelect.value = state.selectedInstrumentId;
            populateChannelSelect(state.selectedInstrumentId);
            if (prefillChannelId) {
                const checkbox = channelCheckboxGroup.querySelector(`input[value="${prefillChannelId}"]`);
                if (checkbox) checkbox.checked = true;
            }
        } else {
            instrumentSelect.value = '';
            channelCheckboxGroup.innerHTML = '<div style="color: var(--text-muted); font-size: 0.85rem; grid-column: 1 / -1;">Select an instrument first</div>';
        }
    }
    
    modal.classList.remove('hidden');
}

function closeModal() {
    modal.classList.add('hidden');
}

async function populateInstrumentSelect() {
    const instruments = await dataApi.getInstruments();
    let html = '<option value="" disabled selected>Select Instrument</option>';
    instruments.forEach(inst => {
        html += `<option value="${inst.id}">${inst.name}</option>`;
    });
    instrumentSelect.innerHTML = html;
}

function populateChannelSelect(instrumentId) {
    if (!instrumentId) return;
    const inst = dataApi.getInstrumentById(instrumentId);
    let html = '';
    inst.channels.forEach(ch => {
        html += `<label style="display: flex; align-items: center; gap: 4px; font-size: 0.85rem; cursor: pointer;">
                    <input type="checkbox" value="${ch.id}" class="channel-checkbox"> ${ch.name}
                 </label>`;
    });
    channelCheckboxGroup.innerHTML = html;
}

async function handleBookingSubmit() {
    const instrumentId = instrumentSelect.value;
    
    // Gather all checked channels
    const checkedBoxes = channelCheckboxGroup.querySelectorAll('.channel-checkbox:checked');
    const selectedChannelIds = Array.from(checkedBoxes).map(cb => cb.value);

    const sDate = document.getElementById('booking-start-date').value;
    const sTime = document.getElementById('booking-start-time').value;
    const eDate = document.getElementById('booking-end-date').value;
    const eTime = document.getElementById('booking-end-time').value;
    const purpose = document.getElementById('booking-purpose').value;

    if (!instrumentId || selectedChannelIds.length === 0 || !sDate || !sTime || !eDate || !eTime) {
        alert('Please fill all required fields and select at least one channel');
        return;
    }
    
    const startDate = `${sDate}T${sTime}:00`;
    const endDate = `${eDate}T${eTime}:00`;

    if (new Date(startDate) > new Date(endDate)) {
        alert('End date/time must be after or equal to start date/time');
        return;
    }

    const editingId = editingBookingIdInput.value;

    // Check for overlaps
    const newStart = new Date(startDate);
    const newEnd = new Date(endDate);
    const allBookings = dataApi.getBookingsByInstrument(instrumentId);
    
    const conflictingChannels = [];
    selectedChannelIds.forEach(channelId => {
        const channelBookings = allBookings.filter(b => b.channelId === channelId && b.id !== editingId);
        const hasOverlap = channelBookings.some(b => {
            const bStart = new Date(b.startDate);
            const bEnd = new Date(b.endDate);
            return (newStart < bEnd && newEnd > bStart);
        });
        
        if (hasOverlap) {
            const chNameNode = channelCheckboxGroup.querySelector(`input[value="${channelId}"]`).nextSibling;
            conflictingChannels.push(chNameNode.textContent.trim());
        }
    });

    if (conflictingChannels.length > 0) {
        alert(`Cannot complete reservation. There is a time conflict on the following channels:\n- ${conflictingChannels.join('\n- ')}`);
        return;
    }

    if (editingId) {
        dataApi.deleteBooking(editingId);
    }

    // Create a booking for each selected channel
    selectedChannelIds.forEach(channelId => {
        dataApi.addBooking({
            instrumentId,
            channelId,
            startDate,
            endDate,
            purpose
        });
    });

    closeModal();
    // Re-render
    await render();
}

function updateCurrentTimeLine() {
    if (state.currentView !== 'calendar') return;
    
    // Check if current date is today
    if (state.currentDate !== getTodayStr()) {
        const line = document.getElementById('current-time-line');
        if (line) line.style.display = 'none';
        return;
    }

    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    
    const line = document.getElementById('current-time-line');
    if (line) {
        line.style.top = `${minutes}px`;
        line.style.display = 'block';
    }
}

// Drag & Drop Implementation
function handleMouseDown(e) {
    if (e.button !== 0) return; // Only left click
    wasDragged = false;
    
    const leftHandle = e.target.closest('.resize-handle-left');
    const rightHandle = e.target.closest('.resize-handle-right');
    const bookingEl = e.target.closest('.gantt-booking');
    
    if (bookingEl && (leftHandle || rightHandle || bookingEl.classList.contains('my-booking') || dataApi.getCurrentUser().role === 'admin')) {
        const bookingId = bookingEl.dataset.bookingId;
        const booking = dataApi.getBookingById(bookingId);
        const container = bookingEl.closest('.gantt-container');
        if (!booking || !container) return;

        // Ensure resizing/moving doesn't trigger drag-and-drop ghosting
        e.preventDefault(); 
        
        dragState = {
            type: leftHandle ? 'resize-left' : (rightHandle ? 'resize-right' : 'move'),
            bookingId: bookingId,
            element: bookingEl,
            initialX: e.clientX,
            initialStart: new Date(booking.startDate),
            initialEnd: new Date(booking.endDate),
            cellWidth: parseFloat(container.dataset.cellWidth),
            initialLeftPx: parseFloat(bookingEl.style.left),
            initialWidthPx: parseFloat(bookingEl.style.width)
        };
        
        document.body.style.cursor = leftHandle || rightHandle ? 'ew-resize' : 'grabbing';
    }
}

function handleMouseMove(e) {
    if (!dragState) return;
    
    const deltaX = e.clientX - dragState.initialX;
    if (Math.abs(deltaX) > 3) {
        wasDragged = true;
    }
    
    if (dragState.type === 'move') {
        const newLeft = Math.max(0, dragState.initialLeftPx + deltaX);
        dragState.element.style.left = `${newLeft}px`;
    } else if (dragState.type === 'resize-left') {
        const newLeft = Math.min(dragState.initialLeftPx + dragState.initialWidthPx - 10, Math.max(0, dragState.initialLeftPx + deltaX));
        const newWidth = dragState.initialWidthPx - (newLeft - dragState.initialLeftPx);
        dragState.element.style.left = `${newLeft}px`;
        dragState.element.style.width = `${newWidth}px`;
    } else if (dragState.type === 'resize-right') {
        const newWidth = Math.max(10, dragState.initialWidthPx + deltaX);
        dragState.element.style.width = `${newWidth}px`;
    }
}

async function handleMouseUp(e) {
    if (!dragState) return;
    
    const deltaX = e.clientX - dragState.initialX;
    const deltaDays = deltaX / dragState.cellWidth;
    const deltaMs = deltaDays * 24 * 60 * 60 * 1000;
    
    let newStart = new Date(dragState.initialStart.getTime());
    let newEnd = new Date(dragState.initialEnd.getTime());
    
    if (dragState.type === 'move') {
        newStart.setTime(newStart.getTime() + deltaMs);
        newEnd.setTime(newEnd.getTime() + deltaMs);
    } else if (dragState.type === 'resize-left') {
        newStart.setTime(newStart.getTime() + deltaMs);
        if (newStart >= newEnd) {
            newStart = new Date(newEnd.getTime() - (60 * 60 * 1000)); // Minimum 1 hour
        }
    } else if (dragState.type === 'resize-right') {
        newEnd.setTime(newEnd.getTime() + deltaMs);
        if (newEnd <= newStart) {
            newEnd = new Date(newStart.getTime() + (60 * 60 * 1000)); // Minimum 1 hour
        }
    }
    
    // Round to nearest 30 mins
    const msIn30Mins = 30 * 60 * 1000;
    newStart = new Date(Math.round(newStart.getTime() / msIn30Mins) * msIn30Mins);
    newEnd = new Date(Math.round(newEnd.getTime() / msIn30Mins) * msIn30Mins);
    
    // Only update if it actually moved meaningfully
    if (wasDragged) {
        await dataApi.updateBooking(dragState.bookingId, {
            startDate: newStart.toISOString(),
            endDate: newEnd.toISOString()
        });
        await render(); // Re-render to snap to grid correctly
    } else {
        // If not dragged, reset visual styles
        dragState.element.style.left = `${dragState.initialLeftPx}px`;
        dragState.element.style.width = `${dragState.initialWidthPx}px`;
    }
    
    dragState = null;
    document.body.style.cursor = 'default';
    
    // Prevent immediate click event after dropping
    setTimeout(() => { wasDragged = false; }, 0);
}

// Start App handled by Auth Listener
setupEventListeners();
