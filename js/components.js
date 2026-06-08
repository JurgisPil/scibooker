import { dataApi } from './data.js?v=36';

export async function renderAdminPanel() {
    const users = await dataApi.getUsers();
    const instruments = await dataApi.getInstruments();
    const user = await dataApi.getCurrentUser();
    const allowlist = await dataApi.getAllowlist();

    // Only admins can see this
    if (user.role !== 'admin') return '<div class="view-container"><h2>Access Denied</h2></div>';

    // Generate Users List
    let usersListHtml = users.map(u => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; border-bottom: 1px solid var(--glass-border);">
            <div>
                <strong>${u.name}</strong> <span class="badge status-${u.role === 'admin' ? 'active' : 'inactive'}" style="margin-left: 4px;">${u.role}</span>
                <div style="color: var(--text-muted); font-size: 0.85rem; margin-top: 4px;">
                    ${u.email ? `<i class="ri-mail-line"></i> ${u.email}` : ''}
                    ${u.phone ? `<span style="margin-left: 8px;"><i class="ri-phone-line"></i> ${u.phone}</span>` : ''}
                </div>
            </div>
            <div style="display: flex; gap: 4px;">
                <button class="icon-btn btn-edit-user" data-id="${u.id}" style="color: var(--primary-color); border: 1px solid var(--glass-border); padding: 4px;" title="Edit User"><i class="ri-pencil-line"></i></button>
                ${u.id !== user.id ? `<button class="icon-btn btn-delete-user" data-id="${u.id}" style="color: var(--danger, #ef4444); border: 1px solid var(--glass-border); padding: 4px;" title="Delete User"><i class="ri-delete-bin-line"></i></button>` : ''}
            </div>
        </div>
    `).join('');

    // Generate Instruments List
    let instrumentsListHtml = instruments.map(inst => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; border-bottom: 1px solid var(--glass-border);">
            <div>
                <strong>${inst.name}</strong> <span style="color: var(--text-muted); font-size: 0.85rem;">(${inst.channels.length} channels)</span>
            </div>
            <div>
                <button class="icon-btn btn-edit-instrument" data-id="${inst.id}" style="color: var(--primary-color); border: 1px solid var(--glass-border); padding: 4px; margin-right: 4px;" title="Edit Instrument"><i class="ri-pencil-line"></i></button>
                <button class="icon-btn btn-delete-instrument" data-id="${inst.id}" style="color: var(--danger, #ef4444); border: 1px solid var(--glass-border); padding: 4px;" title="Delete Instrument"><i class="ri-delete-bin-line"></i></button>
            </div>
        </div>
    `).join('');

    // Generate Permissions Table
    let tableHeaders = instruments.map(inst => `<th style="text-align: center; font-weight: 500; padding: 12px 8px;">${inst.name}</th>`).join('');
    let tableRows = users.map(u => {
        let cells = instruments.map(inst => {
            if (u.role === 'admin') {
                return `<td style="text-align: center; padding: 8px;"><i class="ri-check-line" style="color: var(--primary-color);"></i></td>`;
            }
            const isChecked = u.allowedInstruments.includes(inst.id) ? 'checked' : '';
            return `<td style="text-align: center; padding: 8px;">
                        <input type="checkbox" class="perm-checkbox" data-user="${u.id}" value="${inst.id}" ${isChecked}>
                    </td>`;
        }).join('');
        return `
            <tr style="border-bottom: 1px solid var(--glass-border);">
                <td style="padding: 12px 8px;"><strong>${u.name}</strong> <br><span style="font-size: 0.8rem; color: var(--text-muted);">${u.role}</span></td>
                ${cells}
            </tr>
        `;
    }).join('');

    let permissionsTableHtml = `
        <table style="width: 100%; border-collapse: collapse; text-align: left;">
            <thead>
                <tr style="border-bottom: 2px solid var(--glass-border); background: var(--bg-surface-elevated);">
                    <th style="padding: 12px 8px; font-weight: 500;">User</th>
                    ${tableHeaders}
                </tr>
            </thead>
            <tbody>
                ${tableRows}
            </tbody>
        </table>
    `;

    return `
        <div class="dashboard-header">
            <div>
                <h1>Admin Panel</h1>
                <p>Manage instruments and user permissions.</p>
            </div>
        </div>
        
        <div style="display: flex; flex-direction: column; gap: var(--spacing-xl); margin-top: var(--spacing-xl);">
            
            <!-- Instruments Section -->
            <div>
                <h3 style="margin-bottom: var(--spacing-md);">Manage Instruments</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-lg);">
                    <div class="card">
                        <h4 style="margin-bottom: var(--spacing-md);">Existing Instruments</h4>
                        <div style="max-height: 300px; overflow-y: auto;">
                            ${instrumentsListHtml || '<p style="color: var(--text-muted);">No instruments found.</p>'}
                        </div>
                    </div>
                    <div class="card">
                        <h4 style="margin-bottom: var(--spacing-md);">Add New Instrument</h4>
                        <form id="form-add-instrument" style="display: flex; flex-direction: column; gap: var(--spacing-md);">
                            <div class="form-group">
                                <label>Instrument Name</label>
                                <input type="text" id="new-inst-name" required placeholder="e.g. Test Cycler 2">
                            </div>
                            <div class="form-group">
                                <label>Description (Optional)</label>
                                <input type="text" id="new-inst-desc" placeholder="e.g. 8-Channel Cycler">
                            </div>
                            <div style="display: flex; gap: var(--spacing-md);">
                                <div class="form-group" style="flex: 1;">
                                    <label>Channel Prefix</label>
                                    <input type="text" id="new-inst-prefix" required placeholder="e.g. cyc-ch">
                                </div>
                                <div class="form-group" style="flex: 1;">
                                    <label>Number of Channels</label>
                                    <input type="number" id="new-inst-count" required min="1" max="128" value="8">
                                </div>
                            </div>
                            <button type="submit" class="btn-primary" style="margin-top: var(--spacing-sm);">Create Instrument</button>
                        </form>
                    </div>
                </div>
            </div>

            <!-- User Management -->
            <div>
                <h3 style="margin-bottom: var(--spacing-md);">User Management</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-lg);">
                    
                    <div class="card">
                        <h4 style="margin-bottom: var(--spacing-md);">Existing Users</h4>
                        <div style="max-height: 400px; overflow-y: auto;">
                            ${usersListHtml}
                        </div>
                    </div>


                </div>

                <div class="card" style="overflow-x: auto; margin-top: var(--spacing-lg);">
                    <h4 style="margin-bottom: var(--spacing-md);">Instrument Permissions</h4>
                    <form id="form-user-permissions">
                        ${permissionsTableHtml}
                        <button type="submit" class="btn-primary" style="margin-top: var(--spacing-lg);">Save Permissions</button>
                    </form>
                </div>
                    </div>
                </div>
                
                <div class="card" style="overflow-x: auto; margin-top: var(--spacing-lg);">
                    <h4 style="margin-bottom: var(--spacing-md);">Signup Allowlist (Google Auth)</h4>
                    <form id="form-add-allowlist" style="display: flex; gap: var(--spacing-sm); margin-bottom: var(--spacing-md);">
                        <input type="email" id="new-allowlist-email" class="form-control" placeholder="Enter Gmail address" required>
                        <button type="submit" class="btn-primary">Allow Email</button>
                    </form>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        ${allowlist.map(email => `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; border-radius: var(--radius-sm); background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border);">
                                <span>${email}</span>
                                <button type="button" class="btn-danger btn-remove-allowlist" data-email="${email}">Remove</button>
                            </div>
                        `).join('')}
                        ${allowlist.length === 0 ? '<div style="color: var(--text-muted); font-size: 0.9rem;">No emails in allowlist. Only the main admin can sign in.</div>' : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
}


export async function renderMyBookings() {
    const myBookings = await dataApi.getMyBookings();
    
    let html = `
        <div class="dashboard-header">
            <div>
                <h1>My Bookings</h1>
                <p>View and manage all your upcoming instrument reservations.</p>
            </div>
        </div>
        <div class="my-bookings-list" style="display: flex; flex-direction: column; gap: var(--spacing-xl);">
    `;

    if (myBookings.length === 0) {
        html += `<p style="color: var(--text-muted);">You have no upcoming bookings.</p>`;
    } else {
        // Group bookings by instrumentId
        const grouped = {};
        myBookings.forEach(booking => {
            if (!grouped[booking.instrumentId]) {
                grouped[booking.instrumentId] = [];
            }
            grouped[booking.instrumentId].push(booking);
        });

        for (const instId of Object.keys(grouped)) {
            const inst = await dataApi.getInstrumentById(instId);
            const instName = inst ? inst.name : 'Unknown Instrument';
            
            html += `
                <div>
                    <h3 style="margin-bottom: var(--spacing-md); border-bottom: 2px solid var(--glass-border); padding-bottom: 8px; color: var(--primary-color);">
                        <i class="ri-microscope-line"></i> ${instName}
                    </h3>
                    <div style="display: flex; flex-direction: column; gap: var(--spacing-md);">
            `;

            grouped[instId].forEach(booking => {
                const channel = inst ? inst.channels.find(c => c.id === booking.channelId) : null;
                const channelName = channel ? channel.name : 'Unknown Channel';
                const dateObjStart = new Date(booking.startDate);
                const dateObjEnd = new Date(booking.endDate);
                
                html += `
                    <div class="card my-booking-card" data-booking-id="${booking.id}" style="display: flex; justify-content: space-between; align-items: center; border-left: 4px solid var(--primary-color); cursor: pointer;" title="Click to edit booking">
                        <div>
                            <h4 style="margin-bottom: var(--spacing-xs);"><span class="channel-tag" style="border-color: var(--primary-color); color: var(--primary-color); margin-right: 8px;">${channelName}</span> ${booking.purpose}</h4>
                            <p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 4px;">
                                <i class="ri-calendar-line"></i> ${dateObjStart.toLocaleDateString()} to ${dateObjEnd.toLocaleDateString()}
                            </p>
                        </div>
                        <div>
                            <button class="icon-btn btn-delete-booking" data-id="${booking.id}" title="Delete Booking" style="color: var(--danger, #ef4444); border: 1px solid var(--glass-border); padding: 8px;"><i class="ri-delete-bin-line"></i></button>
                        </div>
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        }
    }

    html += `</div>`;
    return html;
}


export async function renderDashboard(searchQuery = '') {
    let instruments = await dataApi.getInstruments();
    const currentUser = dataApi.getCurrentUser();
    
    // Filter out instruments the user has no permissions for
    if (currentUser && currentUser.role !== 'admin') {
        const allowedIds = currentUser.permissions || [];
        instruments = instruments.filter(inst => allowedIds.includes(inst.id));
    }
    
    if (searchQuery) {
        instruments = instruments.filter(inst => {
            const nameMatch = inst.name.toLowerCase().includes(searchQuery);
            const descMatch = (inst.description || '').toLowerCase().includes(searchQuery);
            const channelMatch = inst.channels.some(ch => ch.name.toLowerCase().includes(searchQuery));
            return nameMatch || descMatch || channelMatch;
        });
    }
    
    let html = `
        <div class="dashboard-header">
            <div>
                <h1>Dashboard</h1>
                <p>Select an instrument to view its availability and book channels.</p>
            </div>
        </div>
        <div class="instruments-grid">
    `;

    if (instruments.length === 0) {
        html += `<div style="grid-column: 1 / -1; padding: 2rem; text-align: center; color: var(--text-muted);">
            <i class="ri-search-line" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
            <p>No instruments found matching "${searchQuery}"</p>
        </div>`;
    }

    instruments.forEach(inst => {
        let channelsHtml = inst.channels.map(ch => 
            `<span class="channel-tag" style="border-color: ${ch.color}; color: ${ch.color}">${ch.name}</span>`
        ).join('');

        const statusClass = `status-${inst.status}`;
        const statusText = inst.status.charAt(0).toUpperCase() + inst.status.slice(1);

        html += `
            <div class="card instrument-card" data-id="${inst.id}">
                <div class="card-header">
                    <h3>${inst.name}</h3>
                    <span class="badge ${statusClass}">${statusText}</span>
                </div>
                <p style="color: var(--text-secondary); font-size: 0.9rem;">${inst.description}</p>
                <div class="channels-list" style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: var(--spacing-sm);">
                    ${channelsHtml}
                </div>
            </div>
        `;
    });

    html += `</div>`;
    return html;
}

export async function renderCalendarView(instrumentId, dateStr, daysToRender = 30) {
    const instrument = await dataApi.getInstrumentById(instrumentId);
    if (!instrument) return `<p>Instrument not found.</p>`;

    const bookings = await dataApi.getBookingsByInstrument(instrumentId);
    // Append T00:00:00 to force parsing as Local Time instead of UTC
    const localDateStr = dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`;
    const startDate = new Date(localDateStr);
    
    let cellWidthPxPerDay = 40;
    let gridBgSize = 40;
    
    if (daysToRender === 7) {
        cellWidthPxPerDay = 100;
        gridBgSize = 100;
    }
    if (daysToRender === 1) {
        cellWidthPxPerDay = 1440; // 24 hours * 60px
        gridBgSize = 60;
    }

    // Generate header days or hours
    let daysHeaderHtml = '';
    
    if (daysToRender === 1) {
        // Render 24 hours
        for(let i=0; i<24; i++) {
            const timeStr = `${String(i).padStart(2, '0')}:00`;
            daysHeaderHtml += `<div class="gantt-day-cell" style="width: 60px;">${timeStr}</div>`;
        }
    } else {
        // Render days
        for(let i=0; i<daysToRender; i++) {
            const d = new Date(startDate);
            d.setDate(d.getDate() + i);
            const dayOfMonth = d.getDate();
            const monthStr = d.toLocaleDateString('en-US', { month: 'short' });
            const dayOfWeek = d.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const isToday = d.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
            
            let classes = 'gantt-day-cell';
            if (isWeekend) classes += ' weekend';
            if (isToday) classes += ' today';

            daysHeaderHtml += `<div class="${classes}" style="width: ${cellWidthPxPerDay}px;">${monthStr}<br><strong>${dayOfMonth}</strong></div>`;
        }
    }

    // Generate rows per channel
    let rowsHtml = '';
    instrument.channels.forEach(ch => {
        let channelBookingsHtml = '';
        const channelBookings = bookings.filter(b => b.channelId === ch.id);

        channelBookings.forEach(booking => {
            const bStart = new Date(booking.startDate);
            const bEnd = new Date(booking.endDate);
            const viewStart = new Date(localDateStr);
            const viewEnd = new Date(localDateStr);
            viewEnd.setDate(viewEnd.getDate() + daysToRender);

            // Check if booking is in view
            if (bEnd < viewStart || bStart > viewEnd) return; // Completely outside

            // Calculate overlap
            const renderStart = bStart < viewStart ? viewStart : bStart;
            const renderEnd = bEnd > viewEnd ? viewEnd : bEnd;

            const exactStartDiffDays = (renderStart - viewStart) / (1000 * 60 * 60 * 24);
            let exactDurationDays = (renderEnd - renderStart) / (1000 * 60 * 60 * 24);
            if (exactDurationDays <= 0) exactDurationDays = 1/24; // min 1 hour

            const leftPx = exactStartDiffDays * cellWidthPxPerDay;
            const widthPx = exactDurationDays * cellWidthPxPerDay;

            const isMine = booking.userId === dataApi.getCurrentUser()?.id;
            const myClass = isMine ? 'my-booking' : '';
            const bg = isMine ? 'var(--primary-color)' : 'var(--bg-surface-elevated)';
            const color = isMine ? 'white' : 'var(--text-primary)';

            // Make the username distinct based on the background color
            const nameColor = isMine ? '#ffcb6b' : 'var(--primary-color)';
            const displayTitleHtml = `<span style="color: ${nameColor}; font-weight: bold; margin-right: 4px;">[${booking.userName}]</span>${booking.purpose}`;
            
            channelBookingsHtml += `
                <div class="gantt-booking ${myClass}" 
                     data-booking-id="${booking.id}"
                     data-start="${booking.startDate}"
                     data-end="${booking.endDate}"
                     style="left: ${leftPx}px; width: ${widthPx}px; background-color: ${bg}; color: ${color}; overflow: hidden; cursor: ${isMine ? 'grab' : 'default'};"
                     title="User: ${booking.userName}&#10;Purpose: ${booking.purpose}&#10;Date: ${booking.startDate} to ${booking.endDate}"
                >
                    ${isMine ? `<div class="resize-handle-left" style="position: absolute; left: 0; top: 0; bottom: 0; width: 8px; cursor: ew-resize; z-index: 10;"></div>` : ''}
                    <span class="booking-title" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; pointer-events: none;">${displayTitleHtml}</span>
                    ${isMine ? `<div class="resize-handle-right" style="position: absolute; right: 0; top: 0; bottom: 0; width: 8px; cursor: ew-resize; z-index: 10;"></div>` : ''}
                </div>
            `;
        });

        rowsHtml += `
            <div class="gantt-row" data-channel-id="${ch.id}">
                <div class="gantt-channel-label" style="border-left: 4px solid ${ch.color}">${ch.name}</div>
                <div class="gantt-timeline-row gantt-row-bg" data-channel-id="${ch.id}" style="background-size: ${gridBgSize}px 100%; position: relative; flex: 1;">
                    ${channelBookingsHtml}
                </div>
            </div>
        `;
    });

    let html = `
        <div class="gantt-view">
            <div class="gantt-header-controls" style="justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: var(--spacing-md);">
                    <button class="icon-btn" id="btn-back"><i class="ri-arrow-left-line"></i></button>
                    <h2>${instrument.name}</h2>
                    <div class="date-navigation">
                        <button class="icon-btn" id="btn-prev-period"><i class="ri-arrow-left-s-line"></i></button>
                        <span class="current-date-display">${startDate.toDateString()}</span>
                        <button class="icon-btn" id="btn-next-period"><i class="ri-arrow-right-s-line"></i></button>
                    </div>
                </div>
                <div class="view-toggles" style="display: flex; background: var(--bg-surface-elevated); padding: 4px; border-radius: var(--radius-md); border: 1px solid var(--glass-border);">
                    <button class="btn-secondary toggle-scale ${daysToRender === 1 ? 'active' : ''}" data-scale="1" style="${daysToRender === 1 ? 'background: var(--primary-color); color: white; border-color: var(--primary-color);' : 'border: none;'}">1 Day</button>
                    <button class="btn-secondary toggle-scale ${daysToRender === 7 ? 'active' : ''}" data-scale="7" style="${daysToRender === 7 ? 'background: var(--primary-color); color: white; border-color: var(--primary-color);' : 'border: none;'}">7 Days</button>
                    <button class="btn-secondary toggle-scale ${daysToRender === 30 ? 'active' : ''}" data-scale="30" style="${daysToRender === 30 ? 'background: var(--primary-color); color: white; border-color: var(--primary-color);' : 'border: none;'}">30 Days</button>
                </div>
            </div>
            
            <div class="gantt-container" data-start-date="${localDateStr}" data-days="${daysToRender}" data-cell-width="${cellWidthPxPerDay}">
                <div class="gantt-timeline-wrapper">
                    <div class="gantt-grid">
                        <div class="gantt-header-row">
                            <div class="gantt-corner-cell">Channels</div>
                            <div class="gantt-days-header">
                                ${daysHeaderHtml}
                            </div>
                        </div>
                        <div class="gantt-body">
                            ${rowsHtml}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    return html;
}
