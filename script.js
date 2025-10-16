const settingsBtn = document.getElementById('settingsBtn');
const modalBg = document.getElementById('modalBg');
const closeModalBtn = document.getElementById('closeModalBtn');
const apiUrlInput = document.getElementById('apiUrlInput');
const saveApiUrlBtn = document.getElementById('saveApiUrlBtn');
const orderModalBg = document.getElementById('orderModalBg');
const closeOrderModalBtn = document.getElementById('closeOrderModalBtn');

function getApiUrl() {
    return localStorage.getItem('baseApiUrl') || 'https://sohail.loca.lt';
}

function setApiUrl(url) {
    localStorage.setItem('baseApiUrl', url);
}

settingsBtn.onclick = () => {
    apiUrlInput.value = getApiUrl();
    modalBg.style.display = 'flex';
    modalBg.setAttribute('aria-hidden', 'false');
};

closeModalBtn.onclick = () => {
    modalBg.style.display = 'none';
    modalBg.setAttribute('aria-hidden', 'true');
};

saveApiUrlBtn.onclick = () => {
    const url = apiUrlInput.value.trim();
    if (url) {
        setApiUrl(url);
        modalBg.style.display = 'none';
        modalBg.setAttribute('aria-hidden', 'true');
        showNotification("✅ API URL updated!");
        fetchRecords();
    }
};

window.onclick = function (event) {
    if (event.target === modalBg) {
        modalBg.style.display = 'none';
        modalBg.setAttribute('aria-hidden', 'true');
    }
    if (event.target === orderModalBg) {
        orderModalBg.style.display = 'none';
        orderModalBg.setAttribute('aria-hidden', 'true');
    }
};

closeOrderModalBtn.onclick = () => {
    orderModalBg.style.display = 'none';
    orderModalBg.setAttribute('aria-hidden', 'true');
};

let previousData = null;
let originalTitle = document.title;
let titleTimeout;

async function fetchRecords() {
    try {
        const API_URL = getApiUrl().replace(/\/+$/, '') + '/api/recent-records';
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Network response was not ok: ' + response.status);
        const result = await response.json();
        const orders = result.orders || [];

        const newDataString = JSON.stringify(orders);
        const oldDataString = previousData === null ? null : JSON.stringify(previousData);

        if (previousData === null || newDataString !== oldDataString) {
            showNotification("🔔 New records found!");
            playNotificationSound();
            showTitleNotification("🔔 New records found!");
            previousData = orders;
            renderRecords(orders);
        }
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

function openOrderModal(order) {
    const phoneRaw = (order.customer && order.customer.phone) || '';
    
    function sanitizeTel(raw) {
        if (!raw) return '';
        return raw.trim().replace(/[^+\d]/g, '');
    }
    function sanitizeWa(raw) {
        if (!raw) return '';
        let digits = raw.trim().replace(/\D/g, '');
        if (digits.startsWith('0')) {
            digits = '92' + digits.slice(1);
        }
        return digits;
    }
    
    const telHref = sanitizeTel(phoneRaw);
    const waDigits = sanitizeWa(phoneRaw);
    const phoneDisplay = phoneRaw || 'N/A';
    const encoded = encodeURIComponent(order.delivery_address || '');
    const mapLink = `https://www.google.com/maps/search/?api=1&query=${encoded}`;

    const phoneLink = telHref
        ? `<a href="tel:${telHref}" class="modal-link">📞 ${phoneDisplay}</a>`
        : `📞 ${phoneDisplay}`;

    const waLink = waDigits
        ? `<a href="https://wa.me/${waDigits}" target="_blank" rel="noopener noreferrer" class="modal-link">🟢 WhatsApp</a>`
        : '';

    const addressLink = order.delivery_address
        ? `<a href="${mapLink}" target="_blank" rel="noopener noreferrer" class="modal-link">📍 ${order.delivery_address}</a>`
        : `📍 No address`;

    const modalContent = document.getElementById('orderModalContent');
    modalContent.innerHTML = `
        <div class="order-details">
            <div class="detail-row">
                <span class="detail-label">Order ID:</span>
                <span class="detail-value">#${order.order_id}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Amount:</span>
                <span class="detail-value" style="color: #25D366; font-weight: bold;">Rs. ${order.order_amount}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Address:</span>
                <span class="detail-value">${addressLink}</span>
            </div>
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 12px 0;">
            <div class="detail-row">
                <span class="detail-label">Customer Name:</span>
                <span class="detail-value">👤 ${(order.customer && order.customer.name) || 'Unknown'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Phone:</span>
                <span class="detail-value">${phoneLink}</span>
            </div>
            ${waLink ? `<div class="detail-row"><span class="detail-label">WhatsApp:</span><span class="detail-value">${waLink}</span></div>` : ''}
            <div class="detail-row">
                <span class="detail-label">Email:</span>
                <span class="detail-value">${(order.customer && order.customer.email) ? order.customer.email : '<i>No email</i>'}</span>
            </div>
        </div>
    `;

    orderModalBg.style.display = 'flex';
    orderModalBg.setAttribute('aria-hidden', 'false');
}

function renderRecords(orders) {
    const container = document.getElementById('records');
    if (!orders.length) {
        container.innerHTML = '<p style="text-align:center;color:var(--muted);">No records found.</p>';
        return;
    }

    function sanitizeTel(raw) {
        if (!raw) return '';
        return raw.trim().replace(/[^+\d]/g, '');
    }
    function sanitizeWa(raw) {
        if (!raw) return '';
        let digits = raw.trim().replace(/\D/g, '');
        if (digits.startsWith('0')) {
            digits = '92' + digits.slice(1);
        }
        return digits;
    }

    container.innerHTML = orders.map(order => {
        const phoneRaw = (order.customer && order.customer.phone) || '';
        const telHref = sanitizeTel(phoneRaw);
        const waDigits = sanitizeWa(phoneRaw);
        const phoneDisplay = phoneRaw || 'N/A';

        const phoneLink = telHref
            ? `<a href="tel:${telHref}" aria-label="Call ${phoneDisplay}" style="color:inherit;text-decoration:underline;">📞 ${phoneDisplay}</a>`
            : `📞 ${phoneDisplay}`;

        const waLink = waDigits
            ? ` <a href="https://wa.me/${waDigits}" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp ${phoneDisplay}" style="color:inherit;margin-left:8px;text-decoration:none;">🟢</a>`
            : '';

        const encoded = encodeURIComponent(order.delivery_address || '');
        const link = `https://www.google.com/maps/search/?api=1&query=${encoded}`;

        const location_element = order.delivery_address
            ? `<a href="${link}" target="_blank" rel="noopener noreferrer" aria-label="View address on Google Maps" style="color:inherit;text-decoration:underline;">📍 ${order.delivery_address}</a>`
            : `📍 No address`;

        return `
<div class="order-card" role="button" tabindex="0" aria-label="Order ${order.order_id}, click for details" style="cursor: pointer;">
<div class="order-info">
<div class="order-id">Order #${order.order_id}</div>
<div class="order-amount">💸 Amount: <b>Rs. ${order.order_amount}</b></div>
<div class="order-address">${location_element}</div>
</div>
<div class="customer-info">
<div class="customer-name">👤 ${(order.customer && order.customer.name) || 'Unknown'}</div>
<div class="customer-phone">${phoneLink}${waLink}</div>
<div class="customer-email">✉️ ${(order.customer && order.customer.email) ? order.customer.email : '<i>No email</i>'}</div>
</div>
</div>
`;
    }).join('');

    // Add click listeners to order cards
    document.querySelectorAll('.order-card').forEach((card, index) => {
        card.onclick = (e) => {
            e.stopPropagation();
            openOrderModal(orders[index]);
        };
        card.onkeydown = (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openOrderModal(orders[index]);
            }
        };
    });
}

function showNotification(message) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.style.display = 'block';
    setTimeout(() => {
        notification.style.display = 'none';
    }, 5000);
}

function playNotificationSound() {
    const sound = document.getElementById('notifSound');
    if (!sound) return;
    sound.currentTime = 0;
    sound.play().catch(() => {/* autoplay may be blocked by browser */ });
}

function showTitleNotification(message) {
    document.title = message + " | " + originalTitle;
    clearTimeout(titleTimeout);
    titleTimeout = setTimeout(() => {
        document.title = originalTitle;
    }, 5000);
}

fetchRecords();
setInterval(fetchRecords, 20000);