import { db, auth } from './firebase.js?v=14';
import { 
    collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, where, writeBatch 
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Cached current user profile from Firestore
export let currentUserProfile = null;

export const dataApi = {
    // ---- AUTH / INIT ----
    async fetchUserProfile(uid) {
        try {
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (userDoc.exists()) {
                currentUserProfile = { id: uid, ...userDoc.data() };
                return currentUserProfile;
            }
            return null;
        } catch (e) {
            console.error("Error fetching user profile:", e);
            return null;
        }
    },
    
    getCurrentUser() {
        return currentUserProfile;
    },

    // ---- ALLOWLIST ----
    async getAllowlist() {
        const snapshot = await getDocs(collection(db, 'allowlist'));
        return snapshot.docs.map(doc => doc.id);
    },
    async isEmailAllowed(email) {
        if (email === 'j.pilipavicius@gmail.com') return true;
        const docRef = doc(db, 'allowlist', email);
        const snap = await getDoc(docRef);
        return snap.exists();
    },
    async addAllowedEmail(email) {
        await setDoc(doc(db, 'allowlist', email), { addedAt: new Date().toISOString() });
    },
    async removeAllowedEmail(email) {
        await deleteDoc(doc(db, 'allowlist', email));
    },

    // ---- USERS ----
    async getUsers() {
        const snapshot = await getDocs(collection(db, 'users'));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    async addUser(userData) {
        // Typically handled by Auth, but if admin adds a user profile manually:
        const userId = userData.id || `u_${Date.now()}`;
        await setDoc(doc(db, 'users', userId), userData);
        return { id: userId, ...userData };
    },
    async updateUser(id, updatedData) {
        await updateDoc(doc(db, 'users', id), updatedData);
        return { id, ...updatedData };
    },
    async deleteUser(id) {
        await deleteDoc(doc(db, 'users', id));
        // Delete their bookings
        const q = query(collection(db, 'bookings'), where("userId", "==", id));
        const snapshot = await getDocs(q);
        const batch = writeBatch(db);
        snapshot.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
    },

    // ---- INSTRUMENTS ----
    async getInstruments() {
        const snapshot = await getDocs(collection(db, 'instruments'));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async getInstrumentById(id) {
        const d = await getDoc(doc(db, 'instruments', id));
        return d.exists() ? { id: d.id, ...d.data() } : null;
    },
    async updateInstrument(id, updatedData) {
        // If channels changed, it's more complex, but we'll do a simple replace
        const inst = await this.getInstrumentById(id);
        if (!inst) return null;
        
        const merged = { ...inst, ...updatedData };
        
        // Handle channel resizing logic from before
        if (updatedData.channelCount !== undefined) {
            const oldChannelCount = inst.channels.length;
            const channelPrefix = updatedData.channelPrefix || 'ch-';
            const newChannels = [];
            for(let i=0; i<updatedData.channelCount; i++) {
                if (i < oldChannelCount) {
                    newChannels.push(inst.channels[i]);
                } else {
                    newChannels.push({
                        id: `${channelPrefix}${i + 1}_${Date.now()}`,
                        name: `${channelPrefix}${i + 1}`,
                        color: `var(--channel-${(i % 4) + 1})`
                    });
                }
            }
            merged.channels = newChannels;
            delete merged.channelCount;
            delete merged.channelPrefix;
            
            // Delete orphaned bookings
            if (updatedData.channelCount < oldChannelCount) {
                const removedChannels = inst.channels.slice(updatedData.channelCount);
                const removedIds = removedChannels.map(c => c.id);
                const q = query(collection(db, 'bookings'), where("instrumentId", "==", id));
                const snapshot = await getDocs(q);
                const batch = writeBatch(db);
                snapshot.forEach(d => {
                    if (removedIds.includes(d.data().channelId)) {
                        batch.delete(d.ref);
                    }
                });
                await batch.commit();
            }
        }
        
        await updateDoc(doc(db, 'instruments', id), merged);
        return merged;
    },
    async deleteInstrument(id) {
        await deleteDoc(doc(db, 'instruments', id));
        // Delete related bookings
        const q = query(collection(db, 'bookings'), where("instrumentId", "==", id));
        const snapshot = await getDocs(q);
        const batch = writeBatch(db);
        snapshot.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
    },

    // ---- BOOKINGS ----
    async getBookingById(id) {
        const d = await getDoc(doc(db, 'bookings', id));
        return d.exists() ? { id: d.id, ...d.data() } : null;
    },
    async getBookingsByInstrument(instrumentId) {
        const q = query(collection(db, 'bookings'), where("instrumentId", "==", instrumentId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    async getMyBookings() {
        if (!currentUserProfile) return [];
        const q = query(collection(db, 'bookings'), where("userId", "==", currentUserProfile.id));
        const snapshot = await getDocs(q);
        const b = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return b.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    },
    async addBooking(bookingData) {
        const bookingId = `b${Date.now()}_${bookingData.channelId}`;
        const newBooking = {
            ...bookingData,
            userId: currentUserProfile.id,
            userName: currentUserProfile.name
        };
        await setDoc(doc(db, 'bookings', bookingId), newBooking);
        return { id: bookingId, ...newBooking };
    },
    async updateBooking(bookingId, updatedData) {
        await updateDoc(doc(db, 'bookings', bookingId), updatedData);
        return { id: bookingId, ...updatedData };
    },
    async deleteBooking(bookingId) {
        await deleteDoc(doc(db, 'bookings', bookingId));
    },

    // ---- SEEDING ----
    async seedDatabase() {
        const usersSnap = await getDocs(collection(db, 'users'));
        if (usersSnap.empty) {
            console.log("Seeding database...");
            const initialUsers = [
                { id: 'u1', name: 'John Scientist', role: 'user', avatar: 'JS', email: 'john@lab.com', phone: '555-0101', otherInfo: 'Lead Researcher', allowedInstruments: ['inst1', 'inst2'] },
                { id: 'admin1', name: 'Admin User', role: 'admin', avatar: 'AU', email: 'admin@lab.com', phone: '555-0000', otherInfo: 'System Administrator', allowedInstruments: [] }
            ];
            for (const u of initialUsers) await setDoc(doc(db, 'users', u.id), u);

            const cyclerChannels = [];
            for(let i=1; i<=64; i++) cyclerChannels.push({ id: `cyc-ch${i}`, name: `Channel ${i}`, color: 'var(--channel-1)' });

            const initialInstruments = [
                { id: 'inst1', name: 'Battery Cycler (64-Ch)', description: 'Maccor 64-Channel Battery Test System', status: 'active', channels: cyclerChannels },
                { id: 'inst3', name: 'Confocal Microscope SP8', description: 'Leica TCS SP8', status: 'active', channels: [{ id: 'ch1', name: 'Lasers 405/488', color: 'var(--channel-3)' }, { id: 'ch2', name: 'Lasers 561/633', color: 'var(--channel-4)' }] }
            ];
            for (const inst of initialInstruments) await setDoc(doc(db, 'instruments', inst.id), inst);
            console.log("Seeding complete.");
        }
    }
};
