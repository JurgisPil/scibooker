export class MockDataApi {
    constructor() {
        this.users = [
            { id: "mock_admin_1", uid: "mock_admin_1", email: "admin@scibooker.demo", name: "Demo Admin", avatar: "DA", role: "admin", allowedInstruments: ["inst_1", "inst_2"] },
            { id: "mock_user_1", uid: "mock_user_1", email: "user@scibooker.demo", name: "Demo User", avatar: "DU", role: "user", allowedInstruments: ["inst_1", "inst_2"] }
        ];
        
        this.instruments = [
            { 
                id: "inst_1", 
                name: "Confocal Microscope SP8", 
                status: "active",
                color: "#4ade80", 
                channels: [
                    { id: "ch_1", name: "Laser 405nm" },
                    { id: "ch_2", name: "Laser 488nm" },
                    { id: "ch_3", name: "Laser 561nm" }
                ] 
            },
            { 
                id: "inst_2", 
                name: "Flow Cytometer Aria III", 
                status: "active",
                color: "#60a5fa", 
                channels: [
                    { id: "ch_1", name: "FSC/SSC" },
                    { id: "ch_2", name: "FITC/PE" }
                ] 
            }
        ];
        
        this.bookings = [
            {
                id: "book_1",
                instrumentId: "inst_1",
                channelId: "ch_1",
                userId: "mock_admin_1",
                userEmail: "admin@scibooker.demo",
                userName: "Demo Admin",
                purpose: "Cell Imaging",
                startDate: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
                endDate: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString()
            }
        ];

        this.allowlist = [
            { id: "allow_1", email: "admin@scibooker.demo" },
            { id: "allow_2", email: "user@scibooker.demo" }
        ];

        this.currentUser = this.users[0];
    }

    getCurrentUser() {
        return this.currentUser;
    }

    setCurrentUser(user) {
        this.currentUser = user;
    }

    async fetchUserProfile(uid) {
        return this.users.find(u => u.uid === uid) || null;
    }

    async getAllowlist() {
        return [...this.allowlist];
    }

    async isEmailAllowed(email) {
        if (this.allowlist.length === 0) return true;
        return this.allowlist.some(a => a.email.toLowerCase() === email.toLowerCase());
    }

    async addAllowedEmail(email) {
        const id = "allow_" + Date.now();
        this.allowlist.push({ id, email });
    }

    async removeAllowedEmail(email) {
        this.allowlist = this.allowlist.filter(a => a.email.toLowerCase() !== email.toLowerCase());
    }

    async getUsers() {
        return [...this.users];
    }

    async addUser(userData) {
        const newUser = { id: userData.uid, ...userData };
        this.users.push(newUser);
    }

    async updateUser(id, updatedData) {
        const idx = this.users.findIndex(u => u.id === id);
        if (idx !== -1) {
            this.users[idx] = { ...this.users[idx], ...updatedData };
        }
    }

    async deleteUser(id) {
        this.users = this.users.filter(u => u.id !== id);
    }

    async getInstruments() {
        return [...this.instruments];
    }

    async getInstrumentById(id) {
        return this.instruments.find(i => i.id === id) || null;
    }

    async addInstrument(instData) {
        const newInst = { id: "inst_" + Date.now(), ...instData };
        if (!newInst.channels) newInst.channels = [];
        this.instruments.push(newInst);
    }

    async updateInstrument(id, updatedData) {
        const idx = this.instruments.findIndex(i => i.id === id);
        if (idx !== -1) {
            this.instruments[idx] = { ...this.instruments[idx], ...updatedData };
        }
    }

    async deleteInstrument(id) {
        this.instruments = this.instruments.filter(i => i.id !== id);
        this.bookings = this.bookings.filter(b => b.instrumentId !== id);
    }

    async getBookingById(id) {
        return this.bookings.find(b => b.id === id) || null;
    }

    async getBookingsByInstrument(instrumentId) {
        return this.bookings.filter(b => b.instrumentId === instrumentId);
    }

    async getMyBookings() {
        if (!this.currentUser) return [];
        return this.bookings.filter(b => b.userId === this.currentUser.uid);
    }

    async addBooking(bookingData) {
        const newBooking = { id: "book_" + Date.now(), ...bookingData };
        this.bookings.push(newBooking);
    }

    async updateBooking(bookingId, updatedData) {
        const idx = this.bookings.findIndex(b => b.id === bookingId);
        if (idx !== -1) {
            this.bookings[idx] = { ...this.bookings[idx], ...updatedData };
        }
    }

    async deleteBooking(bookingId) {
        this.bookings = this.bookings.filter(b => b.id !== bookingId);
    }

    async seedDatabase() {
        console.log("Mock database seeded implicitly.");
    }
}
