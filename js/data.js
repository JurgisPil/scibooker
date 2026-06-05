// js/data.js

export let currentUser = { id: 'u1', name: 'John Scientist', role: 'user' };

export const initialUsers = [
    { id: 'u1', name: 'John Scientist', role: 'user', avatar: 'JS', email: 'john@lab.com', phone: '555-0101', otherInfo: 'Lead Researcher', allowedInstruments: ['inst1', 'inst2'] },
    { id: 'u2', name: 'Alice Smith', role: 'user', avatar: 'AS', email: 'alice@lab.com', phone: '555-0102', otherInfo: 'Postdoc', allowedInstruments: ['inst1'] },
    { id: 'u3', name: 'Bob Jones', role: 'user', avatar: 'BJ', email: 'bob@lab.com', phone: '555-0103', otherInfo: 'PhD Student', allowedInstruments: ['inst2', 'inst3'] },
    { id: 'admin1', name: 'Admin User', role: 'admin', avatar: 'AU', email: 'admin@lab.com', phone: '555-0000', otherInfo: 'System Administrator', allowedInstruments: [] } // Admins see everything automatically
];

let users = JSON.parse(localStorage.getItem('anti_users'));
if (!users) {
    users = initialUsers;
    localStorage.setItem('anti_users', JSON.stringify(users));
}

// Generate 64 channels for Cycler
const cyclerChannels = [];
for(let i=1; i<=64; i++) {
    cyclerChannels.push({ id: `cyc-ch${i}`, name: `Channel ${i}`, color: 'var(--channel-1)' });
}

// Generate 16 channels for Potentiostat
const potentioChannels = [];
for(let i=1; i<=16; i++) {
    potentioChannels.push({ id: `pot-ch${i}`, name: `Port ${i}`, color: 'var(--channel-2)' });
}

export const initialInstruments = [
    {
        id: 'inst1',
        name: 'Battery Cycler (64-Ch)',
        description: 'Maccor 64-Channel Battery Test System',
        status: 'active',
        channels: cyclerChannels
    },
    {
        id: 'inst2',
        name: 'Multichannel Potentiostat',
        description: 'BioLogic VMP3 16-Channel Potentiostat',
        status: 'active',
        channels: potentioChannels
    },
    {
        id: 'inst3',
        name: 'Confocal Microscope SP8',
        description: 'Leica TCS SP8',
        status: 'active',
        channels: [
            { id: 'ch1', name: 'Lasers 405/488', color: 'var(--channel-3)' },
            { id: 'ch2', name: 'Lasers 561/633', color: 'var(--channel-4)' }
        ]
    }
];

let instruments = JSON.parse(localStorage.getItem('anti_instruments'));
if (!instruments) {
    instruments = initialInstruments;
    localStorage.setItem('anti_instruments', JSON.stringify(instruments));
}

// Helper to generate dates relative to today
function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result.toISOString().split('T')[0];
}

const todayStr = new Date().toISOString().split('T')[0];

export let initialBookings = [
    {
        id: 'b1',
        instrumentId: 'inst1',
        channelId: 'cyc-ch1',
        userId: 'u1',
        userName: 'John Scientist',
        startDate: todayStr,
        endDate: addDays(todayStr, 14),
        purpose: 'Long-term cycling NCA cells'
    },
    {
        id: 'b2',
        instrumentId: 'inst1',
        channelId: 'cyc-ch2',
        userId: 'u2',
        userName: 'Alice Smith',
        startDate: addDays(todayStr, -5),
        endDate: addDays(todayStr, 5),
        purpose: 'Degradation study'
    },
    {
        id: 'b3',
        instrumentId: 'inst1',
        channelId: 'cyc-ch10',
        userId: 'u3',
        userName: 'Bob Jones',
        startDate: addDays(todayStr, 2),
        endDate: addDays(todayStr, 30),
        purpose: 'Solid state battery formation'
    },
    {
        id: 'b4',
        instrumentId: 'inst2',
        channelId: 'pot-ch1',
        userId: 'u1',
        userName: 'John Scientist',
        startDate: todayStr,
        endDate: addDays(todayStr, 2),
        purpose: 'EIS measurement'
    }
];

let bookings = JSON.parse(localStorage.getItem('anti_bookings'));
if (!bookings) {
    bookings = initialBookings;
    localStorage.setItem('anti_bookings', JSON.stringify(bookings));
}

// API Methods
export const dataApi = {
    getCurrentUser() {
        return users.find(u => u.id === currentUser.id);
    },
    switchUser(userId) {
        const u = users.find(user => user.id === userId);
        if (u) {
            currentUser = { id: u.id, name: u.name, role: u.role, avatar: u.avatar };
        }
    },
    getUsers() {
        return users;
    },
    addUser({ name, role, email = '', phone = '', otherInfo = '' }) {
        const avatar = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        const newUser = {
            id: `u${Date.now()}`,
            name,
            role,
            avatar,
            email,
            phone,
            otherInfo,
            allowedInstruments: []
        };
        users.push(newUser);
        localStorage.setItem('anti_users', JSON.stringify(users));
        return newUser;
    },
    updateUser(id, { name, role, email, phone, otherInfo }) {
        const user = users.find(u => u.id === id);
        if (user) {
            user.name = name;
            user.role = role;
            user.email = email;
            user.phone = phone;
            user.otherInfo = otherInfo;
            user.avatar = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            localStorage.setItem('anti_users', JSON.stringify(users));
            return user;
        }
        return null;
    },
    deleteUser(id) {
        users = users.filter(u => u.id !== id);
        localStorage.setItem('anti_users', JSON.stringify(users));
        
        // Also remove related bookings
        bookings = bookings.filter(b => b.userId !== id);
        localStorage.setItem('anti_bookings', JSON.stringify(bookings));
    },
    updateUserPermissions(userId, instrumentIds) {
        const user = users.find(u => u.id === userId);
        if (user) {
            user.allowedInstruments = instrumentIds;
            localStorage.setItem('anti_users', JSON.stringify(users));
        }
    },
    getInstruments() {
        const user = this.getCurrentUser();
        if (user.role === 'admin') return instruments;
        return instruments.filter(inst => user.allowedInstruments.includes(inst.id));
    },
    getAllInstruments() {
        return instruments;
    },
    addInstrument({ name, description, channelPrefix, channelCount }) {
        const channels = [];
        for (let i = 1; i <= channelCount; i++) {
            channels.push({ id: `${channelPrefix}${i}`, name: `${channelPrefix}${i}`, color: `var(--channel-${(i % 4) + 1})` });
        }
        const newInst = {
            id: `inst_${Date.now()}`,
            name,
            description,
            status: 'active',
            channels
        };
        instruments.push(newInst);
        localStorage.setItem('anti_instruments', JSON.stringify(instruments));
        return newInst;
    },
    updateInstrument(id, { name, description, channelPrefix, channelCount }) {
        const index = instruments.findIndex(i => i.id === id);
        if (index === -1) return null;
        
        const inst = instruments[index];
        inst.name = name;
        inst.description = description;

        const newChannels = [];
        const oldChannelCount = inst.channels.length;
        
        for (let i = 0; i < channelCount; i++) {
            if (i < oldChannelCount) {
                // Keep existing channel ID, update name
                const oldCh = inst.channels[i];
                oldCh.name = `${channelPrefix}${i + 1}`;
                newChannels.push(oldCh);
            } else {
                // Create new channel
                newChannels.push({
                    id: `${channelPrefix}${i + 1}_${Date.now()}`,
                    name: `${channelPrefix}${i + 1}`,
                    color: `var(--channel-${(i % 4) + 1})`
                });
            }
        }
        
        // If channel count was reduced, delete bookings for removed channels
        if (channelCount < oldChannelCount) {
            const removedChannels = inst.channels.slice(channelCount);
            const removedIds = removedChannels.map(c => c.id);
            bookings = bookings.filter(b => !(b.instrumentId === id && removedIds.includes(b.channelId)));
            localStorage.setItem('anti_bookings', JSON.stringify(bookings));
        }

        inst.channels = newChannels;
        localStorage.setItem('anti_instruments', JSON.stringify(instruments));
        return inst;
    },
    deleteInstrument(id) {
        instruments = instruments.filter(i => i.id !== id);
        localStorage.setItem('anti_instruments', JSON.stringify(instruments));
        // Also remove related bookings
        bookings = bookings.filter(b => b.instrumentId !== id);
        localStorage.setItem('anti_bookings', JSON.stringify(bookings));
        // Also remove from user permissions
        users.forEach(u => {
            u.allowedInstruments = u.allowedInstruments.filter(instId => instId !== id);
        });
        localStorage.setItem('anti_users', JSON.stringify(users));
    },
    getInstrumentById(id) {
        return instruments.find(i => i.id === id);
    },
    getBookingById(id) {
        return bookings.find(b => b.id === id);
    },
    getBookingsByInstrument(instrumentId) {
        return bookings.filter(b => b.instrumentId === instrumentId);
    },
    getMyBookings() {
        return bookings.filter(b => b.userId === currentUser.id).sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    },
    addBooking(bookingData) {
        const newBooking = {
            ...bookingData,
            id: `b${Date.now()}_${bookingData.channelId}`,
            userId: currentUser.id,
            userName: currentUser.name
        };
        bookings.push(newBooking);
        localStorage.setItem('anti_bookings', JSON.stringify(bookings));
        return newBooking;
    },
    deleteBooking(bookingId) {
        bookings = bookings.filter(b => b.id !== bookingId);
        localStorage.setItem('anti_bookings', JSON.stringify(bookings));
    },
    updateBooking(bookingId, updatedData) {
        const index = bookings.findIndex(b => b.id === bookingId);
        if (index !== -1) {
            bookings[index] = { ...bookings[index], ...updatedData };
            localStorage.setItem('anti_bookings', JSON.stringify(bookings));
            return bookings[index];
        }
        return null;
    }
};
