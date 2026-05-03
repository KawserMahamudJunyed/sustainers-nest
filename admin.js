/* ═══════════════════════════════════════════════════════
   ADMIN DASHBOARD — Logic
   ═══════════════════════════════════════════════════════ */

const ICONS = {
    eye: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>',
    edit: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>',
    trash: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
    image: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>'
};

// Auth guard
(async () => {
    if (typeof window.initSupabase === 'function') await window.initSupabase();
    const user = await getCurrentUser();
    if (!user) { window.location.href = '/signin'; return; }
    const admin = await isAdmin();
    if (!admin) { window.location.href = '/'; return; }
    loadOverview();
    initAdminSidebar();
})();

// Mobile sidebar toggle
function initAdminSidebar() {
    const toggle = document.getElementById('adminMenuToggle');
    const sidebar = document.getElementById('adminSidebar');
    const overlay = document.getElementById('adminSidebarOverlay');
    
    if (toggle && sidebar) {
        toggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            if (overlay) overlay.classList.toggle('open');
        });
        
        if (overlay) {
            overlay.addEventListener('click', () => {
                sidebar.classList.remove('open');
                overlay.classList.remove('open');
            });
        }
        
        // Close sidebar when clicking nav buttons on mobile
        sidebar.querySelectorAll('.admin-nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (window.innerWidth <= 900) {
                    sidebar.classList.remove('open');
                    if (overlay) overlay.classList.remove('open');
                }
            });
        });
    }
}

// Panel switching
function showPanel(name) {
    document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.admin-nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('panel-' + name)?.classList.add('active');
    event.target.closest('.admin-nav-btn')?.classList.add('active');
    const loaders = { overview: loadOverview, contacts: loadContacts, applications: loadApplications, events: loadEvents, programs: loadPrograms, announcements: loadAnnouncements, team: loadTeam, stats: loadStats, subscribers: loadSubscribers };
    loaders[name]?.();
}
function toggleForm(id) { const f = document.getElementById(id); f.style.display = f.style.display === 'none' ? '' : 'none'; }

// ── OVERVIEW ──
async function loadOverview() {
    const [c, a, s, e] = await Promise.all([
        supabase.from('contact_submissions').select('id', { count: 'exact', head: true }),
        supabase.from('join_applications').select('id', { count: 'exact', head: true }),
        supabase.from('newsletter_subscribers').select('id', { count: 'exact', head: true }),
        supabase.from('event_registrations').select('id', { count: 'exact', head: true })
    ]);
    document.getElementById('overviewStats').innerHTML = [
        { v: c.count||0, l: 'Contact Messages' }, { v: a.count||0, l: 'Applications' },
        { v: s.count||0, l: 'Subscribers' }, { v: e.count||0, l: 'Event Registrations' }
    ].map(s => `<div class="admin-stat-card"><div class="stat-val">${s.v}</div><div class="stat-lbl">${s.l}</div></div>`).join('');
}

// ── CONTACTS ──
async function loadContacts() {
    const { data } = await supabase.from('contact_submissions').select('*').order('created_at', { ascending: false });
    document.getElementById('contactsTable').innerHTML = (data||[]).map(c => `<tr>
        <td>${esc(c.name)}</td><td>${esc(c.email)}</td><td>${esc(c.subject)}</td>
        <td title="${esc(c.message)}">${esc((c.message||'').substring(0,50))}...</td>
        <td>${new Date(c.created_at).toLocaleDateString()}</td>
        <td><span class="status-badge ${c.is_read?'status-read':'status-unread'}">${c.is_read?'Read':'New'}</span></td>
        <td style="display:flex;gap:0.5rem;"><button class="admin-action-btn" onclick="toggleRead('${c.id}',${!c.is_read})" title="Toggle read">${ICONS.eye}</button> <button class="admin-action-btn danger" onclick="deleteRow('contact_submissions','${c.id}',loadContacts)" title="Delete">${ICONS.trash}</button></td>
    </tr>`).join('') || '<tr><td colspan="7" class="admin-empty">No messages yet</td></tr>';
}
async function toggleRead(id, val) {
    await supabase.from('contact_submissions').update({ is_read: val }).eq('id', id);
    loadContacts();
}

// ── APPLICATIONS ──
async function loadApplications() {
    const { data } = await supabase.from('join_applications').select('*').order('created_at', { ascending: false });
    document.getElementById('applicationsTable').innerHTML = (data||[]).map(a => `<tr>
        <td>${esc(a.name)}</td><td>${esc(a.email)}</td><td>${esc(a.phone||'-')}</td><td>${esc(a.role)}</td>
        <td><select onchange="updateAppStatus('${a.id}',this.value)" style="background:var(--bg-dark);color:var(--text-white);border:1px solid var(--border-subtle);border-radius:6px;padding:4px 8px;font-size:.8rem;">
            <option value="pending" ${a.status==='pending'?'selected':''}>Pending</option>
            <option value="accepted" ${a.status==='accepted'?'selected':''}>Accepted</option>
            <option value="rejected" ${a.status==='rejected'?'selected':''}>Rejected</option>
        </select></td>
        <td>${new Date(a.created_at).toLocaleDateString()}</td>
        <td><button class="admin-action-btn danger" onclick="deleteRow('join_applications','${a.id}',loadApplications)">${ICONS.trash}</button></td>
    </tr>`).join('') || '<tr><td colspan="7" class="admin-empty">No applications yet</td></tr>';
}
async function updateAppStatus(id, status) {
    await supabase.from('join_applications').update({ status }).eq('id', id);
    showToast('Status updated');
}

// ── EVENTS ──
async function loadEvents() {
    const { data } = await supabase.from('events').select('*').order('sort_order');
    document.getElementById('eventsTable').innerHTML = (data||[]).map(e => `<tr>
        <td style="width:60px;">${e.image_url ? `<img src="${e.image_url}" style="width:50px;height:35px;object-fit:cover;border-radius:4px;">` : '<span style="color:var(--text-muted);font-size:0.75rem;">No image</span>'}</td>
        <td>${esc(e.title)}</td><td>${esc(e.event_date)}</td><td>${e.icon_type}</td>
        <td><span class="status-badge ${e.is_upcoming?'status-accepted':'status-read'}">${e.is_upcoming?'Upcoming':'Past'}</span></td>
        <td style="display:flex;gap:0.5rem;"><button class="admin-action-btn" onclick="editEvent('${e.id}')">${ICONS.edit}</button> <button class="admin-action-btn danger" onclick="deleteRow('events','${e.id}',loadEvents)">${ICONS.trash}</button></td>
    </tr>`).join('') || '<tr><td colspan="6" class="admin-empty">No events</td></tr>';
    window._eventsData = data;
}
function editEvent(id) {
    const e = (window._eventsData||[]).find(x => x.id === id);
    if (!e) return;
    document.getElementById('evTitle').value = e.title;
    document.getElementById('evDate').value = e.event_date;
    document.getElementById('evDesc').value = e.description||'';
    document.getElementById('evIcon').value = e.icon_type;
    document.getElementById('evUpcoming').value = String(e.is_upcoming);
    document.getElementById('evId').value = e.id;
    document.getElementById('evImageUrl').value = e.image_url || '';
    
    // Show current image if exists
    const currentImg = document.getElementById('evCurrentImage');
    if (e.image_url) {
        currentImg.innerHTML = `<img src="${e.image_url}" alt="Current"><p>Current image</p>`;
        currentImg.style.display = 'block';
    } else {
        currentImg.style.display = 'none';
    }
    removeImagePreview('ev');
    
    document.getElementById('eventFormTitle').textContent = 'Edit Event';
    document.getElementById('eventForm').style.display = '';
}
async function saveEvent() {
    const id = document.getElementById('evId').value;
    const fileInput = document.getElementById('evImageFile');
    let imageUrl = document.getElementById('evImageUrl').value;
    
    // Upload image if new file selected
    if (fileInput.files.length > 0) {
        const uploadedUrl = await uploadImage(fileInput.files[0], 'events');
        if (uploadedUrl) imageUrl = uploadedUrl;
    }
    
    const obj = { 
        title: document.getElementById('evTitle').value, 
        event_date: document.getElementById('evDate').value, 
        description: document.getElementById('evDesc').value, 
        icon_type: document.getElementById('evIcon').value, 
        is_upcoming: document.getElementById('evUpcoming').value === 'true',
        image_url: imageUrl || null
    };
    
    if (id) await supabase.from('events').update(obj).eq('id', id);
    else await supabase.from('events').insert(obj);
    
    // Reset form
    document.getElementById('evId').value = '';
    document.getElementById('evImageUrl').value = '';
    document.getElementById('evImageFile').value = '';
    document.getElementById('evCurrentImage').style.display = 'none';
    removeImagePreview('ev');
    document.getElementById('eventForm').style.display = 'none';
    document.getElementById('eventFormTitle').textContent = 'New Event';
    showToast('Event saved!'); loadEvents();
}

// ── PROGRAMS ──
async function loadPrograms() {
    const { data } = await supabase.from('programs').select('*').order('sort_order');
    document.getElementById('programsTable').innerHTML = (data||[]).map(p => `<tr>
        <td style="width:60px;">${p.image_url ? `<img src="${p.image_url}" style="width:50px;height:35px;object-fit:cover;border-radius:4px;">` : '<span style="color:var(--text-muted);font-size:0.75rem;">No image</span>'}</td>
        <td>${esc(p.title)}</td><td>${esc(p.tag)}</td>
        <td style="display:flex;gap:0.5rem;"><button class="admin-action-btn" onclick="editProgram('${p.id}')">${ICONS.edit}</button> <button class="admin-action-btn danger" onclick="deleteRow('programs','${p.id}',loadPrograms)">${ICONS.trash}</button></td>
    </tr>`).join('') || '<tr><td colspan="4" class="admin-empty">No programs</td></tr>';
    window._programsData = data;
}
function editProgram(id) {
    const p = (window._programsData||[]).find(x => x.id === id);
    if (!p) return;
    document.getElementById('pgTitle').value = p.title;
    document.getElementById('pgTag').value = p.tag;
    document.getElementById('pgDesc').value = p.description||'';
    document.getElementById('pgId').value = p.id;
    document.getElementById('pgImageUrl').value = p.image_url || '';
    
    // Show current image if exists
    const currentImg = document.getElementById('pgCurrentImage');
    if (p.image_url) {
        currentImg.innerHTML = `<img src="${p.image_url}" alt="Current"><p>Current image</p>`;
        currentImg.style.display = 'block';
    } else {
        currentImg.style.display = 'none';
    }
    removeImagePreview('pg');
    
    document.getElementById('programFormTitle').textContent = 'Edit Program';
    document.getElementById('programForm').style.display = '';
}
async function saveProgram() {
    const id = document.getElementById('pgId').value;
    const fileInput = document.getElementById('pgImageFile');
    let imageUrl = document.getElementById('pgImageUrl').value;
    
    // Upload image if new file selected
    if (fileInput.files.length > 0) {
        const uploadedUrl = await uploadImage(fileInput.files[0], 'programs');
        if (uploadedUrl) imageUrl = uploadedUrl;
    }
    
    const obj = { 
        title: document.getElementById('pgTitle').value, 
        tag: document.getElementById('pgTag').value, 
        description: document.getElementById('pgDesc').value,
        image_url: imageUrl || null
    };
    
    if (id) await supabase.from('programs').update(obj).eq('id', id);
    else await supabase.from('programs').insert(obj);
    
    // Reset form
    document.getElementById('pgId').value = '';
    document.getElementById('pgImageUrl').value = '';
    document.getElementById('pgImageFile').value = '';
    document.getElementById('pgCurrentImage').style.display = 'none';
    removeImagePreview('pg');
    document.getElementById('programForm').style.display = 'none';
    document.getElementById('programFormTitle').textContent = 'New Program';
    showToast('Program saved!'); loadPrograms();
}

// ── ANNOUNCEMENTS ──
async function loadAnnouncements() {
    const { data } = await supabase.from('announcements').select('*').order('sort_order');
    document.getElementById('announcementsTable').innerHTML = (data||[]).map(a => `<tr>
        <td>${esc(a.title)}</td><td>${esc(a.date_label)}</td>
        <td style="display:flex;gap:0.5rem;"><button class="admin-action-btn" onclick="editAnn('${a.id}')">${ICONS.edit}</button> <button class="admin-action-btn danger" onclick="deleteRow('announcements','${a.id}',loadAnnouncements)">${ICONS.trash}</button></td>
    </tr>`).join('') || '<tr><td colspan="3" class="admin-empty">No announcements</td></tr>';
    window._annData = data;
}
function editAnn(id) {
    const a = (window._annData||[]).find(x => x.id === id);
    if (!a) return;
    document.getElementById('annTitle').value = a.title;
    document.getElementById('annDate').value = a.date_label;
    document.getElementById('annDesc').value = a.description||'';
    document.getElementById('annId').value = a.id;
    document.getElementById('annForm').style.display = '';
}
async function saveAnnouncement() {
    const id = document.getElementById('annId').value;
    const obj = { title: document.getElementById('annTitle').value, date_label: document.getElementById('annDate').value, description: document.getElementById('annDesc').value };
    if (id) await supabase.from('announcements').update(obj).eq('id', id);
    else await supabase.from('announcements').insert(obj);
    document.getElementById('annId').value = '';
    document.getElementById('annForm').style.display = 'none';
    showToast('Announcement saved!'); loadAnnouncements();
}

// ── TEAM ──
async function loadTeam() {
    const { data } = await supabase.from('team_members').select('*').order('sort_order');
    document.getElementById('teamTable').innerHTML = (data||[]).map(t => `<tr>
        <td>${esc(t.initials)}</td><td>${esc(t.name)}</td><td>${esc(t.role)}</td>
        <td style="display:flex;gap:0.5rem;"><button class="admin-action-btn" onclick="editTeam('${t.id}')">${ICONS.edit}</button> <button class="admin-action-btn danger" onclick="deleteRow('team_members','${t.id}',loadTeam)">${ICONS.trash}</button></td>
    </tr>`).join('') || '<tr><td colspan="4" class="admin-empty">No team members</td></tr>';
    window._teamData = data;
}
function editTeam(id) {
    const t = (window._teamData||[]).find(x => x.id === id);
    if (!t) return;
    document.getElementById('tmName').value = t.name;
    document.getElementById('tmInitials').value = t.initials;
    document.getElementById('tmRole').value = t.role||'';
    document.getElementById('tmDept').value = t.department||'';
    document.getElementById('tmId').value = t.id;
    document.getElementById('teamForm').style.display = '';
}
async function saveTeamMember() {
    const id = document.getElementById('tmId').value;
    const obj = { name: document.getElementById('tmName').value, initials: document.getElementById('tmInitials').value, role: document.getElementById('tmRole').value, department: document.getElementById('tmDept').value };
    if (id) await supabase.from('team_members').update(obj).eq('id', id);
    else await supabase.from('team_members').insert(obj);
    document.getElementById('tmId').value = '';
    document.getElementById('teamForm').style.display = 'none';
    showToast('Team member saved!'); loadTeam();
}

// ── STATS ──
async function loadStats() {
    const { data } = await supabase.from('site_stats').select('*').order('page').order('sort_order');
    document.getElementById('statsTable').innerHTML = (data||[]).map(s => `<tr>
        <td>${esc(s.label)}</td>
        <td><input type="number" value="${s.value}" onchange="updateStat('${s.id}',this.value)" style="width:80px;background:var(--bg-dark);color:var(--text-white);border:1px solid var(--border-subtle);border-radius:6px;padding:4px 8px;font-size:.85rem;"></td>
        <td>${s.page}</td><td>${s.stat_group}</td>
        <td><button class="admin-action-btn danger" onclick="deleteRow('site_stats','${s.id}',loadStats)">${ICONS.trash}</button></td>
    </tr>`).join('');
}
async function updateStat(id, val) {
    await supabase.from('site_stats').update({ value: parseInt(val) }).eq('id', id);
    showToast('Stat updated');
}

// ── SUBSCRIBERS ──
async function loadSubscribers() {
    const { data } = await supabase.from('newsletter_subscribers').select('*').order('subscribed_at', { ascending: false });
    document.getElementById('subCount').textContent = `${(data||[]).length} subscribers`;
    document.getElementById('subscribersTable').innerHTML = (data||[]).map(s => `<tr>
        <td>${esc(s.email)}</td><td>${new Date(s.subscribed_at).toLocaleDateString()}</td>
        <td><button class="admin-action-btn danger" onclick="deleteRow('newsletter_subscribers','${s.id}',loadSubscribers)">${ICONS.trash}</button></td>
    </tr>`).join('') || '<tr><td colspan="3" class="admin-empty">No subscribers yet</td></tr>';
    window._subsData = data;
}
function exportSubscribers() {
    const data = window._subsData || [];
    const csv = 'Email,Subscribed Date\n' + data.map(s => `${s.email},${s.subscribed_at}`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'subscribers.csv'; a.click();
}

// ── HELPERS ──
async function deleteRow(table, id, reload) {
    if (!confirm('Are you sure?')) return;
    await supabase.from(table).delete().eq('id', id);
    showToast('Deleted'); reload();
}
function esc(s) { if (!s) return ''; const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
async function handleLogout(e) { e.preventDefault(); await signOut(); window.location.href = '/'; }

// ── IMAGE UPLOAD HELPERS ──
function previewImage(input, previewId) {
    const container = document.getElementById(previewId + 'Container');
    const preview = document.getElementById(previewId);
    
    if (input.files && input.files[0]) {
        const file = input.files[0];
        
        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            showToast('Image must be less than 5MB', 'error');
            input.value = '';
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.src = e.target.result;
            container.classList.add('has-image');
        };
        reader.readAsDataURL(file);
    }
}

function removeImagePreview(prefix) {
    const container = document.getElementById(prefix + 'ImagePreviewContainer');
    const preview = document.getElementById(prefix + 'ImagePreview');
    const input = document.getElementById(prefix + 'ImageFile');
    
    if (container) container.classList.remove('has-image');
    if (preview) preview.src = '';
    if (input) input.value = '';
}

async function uploadImage(file, folder) {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { data, error } = await supabase.storage
            .from('images')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });
        
        if (error) {
            console.error('Upload error:', error);
            showToast('Failed to upload image', 'error');
            return null;
        }
        
        // Get public URL
        const { data: urlData } = supabase.storage
            .from('images')
            .getPublicUrl(fileName);
        
        return urlData.publicUrl;
    } catch (err) {
        console.error('Upload exception:', err);
        showToast('Failed to upload image', 'error');
        return null;
    }
}

// Drag and drop handlers
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.image-upload-area').forEach(area => {
        ['dragenter', 'dragover'].forEach(evt => {
            area.addEventListener(evt, (e) => {
                e.preventDefault();
                area.classList.add('dragover');
            });
        });
        
        ['dragleave', 'drop'].forEach(evt => {
            area.addEventListener(evt, (e) => {
                e.preventDefault();
                area.classList.remove('dragover');
            });
        });
    });
});
