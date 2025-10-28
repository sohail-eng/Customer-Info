const settingsBtn = document.getElementById('settingsBtn');
const modalBg = document.getElementById('modalBg');
const closeModalBtn = document.getElementById('closeModalBtn');
const accountNumberInput = document.getElementById('accountNumberInput');
const saveApiUrlBtn = document.getElementById('saveApiUrlBtn');
const AuthenticateBtn = document.getElementById('AuthenticateBtn');
const orderModalBg = document.getElementById('orderModalBg');
const closeOrderModalBtn = document.getElementById('closeOrderModalBtn');
const searchInput = document.getElementById('searchInput');
const apiStatusIndicator = document.getElementById('api-status-indicator');

let searchTimeout;

function getApiUrl() {
    return localStorage.getItem('baseApiUrl') || 'https://sohail-dcd82306-4436-4b08-b98e-0f343df8eafc.loca.lt';
}

function getAccountNumber(){
    return localStorage.getItem('accountNumber') || '';
}

function getCurrentPage() {
    return parseInt(localStorage.getItem('currentPage') || '1', 10);
}

function setApiUrl(url) {
    localStorage.setItem('baseApiUrl', url);
}

function setAccountNumber(accountNumber) {
    localStorage.setItem('accountNumber', accountNumber);
}

function setCurrentPage(page) {
    localStorage.setItem('currentPage', page);
}

settingsBtn.onclick = () => {
    accountNumberInput.value = getAccountNumber();
    modalBg.style.display = 'flex';
    modalBg.setAttribute('aria-hidden', 'false');
};

closeModalBtn.onclick = () => {
    modalBg.style.display = 'none';
    modalBg.setAttribute('aria-hidden', 'true');
};

saveApiUrlBtn.onclick = () => {
    const accountNumber = accountNumberInput.value.trim();
    if (accountNumber) {
        setAccountNumber(accountNumber);
        modalBg.style.display = 'none';
        modalBg.setAttribute('aria-hidden', 'true');
        showNotification("✅ Account Number saved.");
    }
};

AuthenticateBtn.onclick = () => {
    window.location.replace(getApiUrl());
}

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

searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        fetchRecords(1);
    }, 1000);
});

let previousData = null;
let originalTitle = document.title;
let titleTimeout;
let currentPage = 1;

async function fetchRecords(page = 1) {
    const query = searchInput.value.trim();
    apiStatusIndicator.style.display = 'block';
    apiStatusIndicator.className = '';
    apiStatusIndicator.textContent = '';

    try {
        window.scrollTo(0, 0);
        currentPage = page;
        setCurrentPage(page);
        let API_URL = getApiUrl().replace(/\/+$/, '') + `/api/recent-records?page=${page}`;
        if (query) {
            API_URL += `&q=${encodeURIComponent(query)}`;
        }
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Network response was not ok: ' + response.status);
        const result = await response.json();
        const orders = result.orders || [];

        if (page === 1 && !query) {
            const newDataString = JSON.stringify(orders);
            const oldDataString = previousData === null ? null : JSON.stringify(previousData);

            if (previousData === null || newDataString !== oldDataString) {
                showNotification("🔔 New records found!");
                playNotificationSound();
                showTitleNotification("🔔 New records found!");
                previousData = orders;
            }
        }
        
        renderRecords(orders);
        renderPagination(result.num_pages, result.current_page);
        apiStatusIndicator.className = 'success';
        apiStatusIndicator.textContent = '✓';

    } catch (error) {
        console.error('Fetch error:', error);
        // document.getElementById('records').innerHTML = '<p style="text-align:center;color:var(--muted);">Failed to load records. Please check your connection and API URL.</p>';
        apiStatusIndicator.className = 'error';
        apiStatusIndicator.textContent = '✗';
    }
}

function renderPagination(numPages, currentPage) {
    const paginationContainer = document.getElementById('pagination-container');
    if (!paginationContainer) return;

    if (numPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    let paginationHTML = '<div class="pagination">';

    // Previous Button
    if (currentPage > 1) {
        paginationHTML += `<button onclick="fetchRecords(${currentPage - 1})">&laquo; Prev</button>`;
    } else {
        paginationHTML += `<button disabled>&laquo; Prev</button>`;
    }

    // Page numbers
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(numPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    if (startPage > 1) {
        paginationHTML += `<button onclick="fetchRecords(1)">1</button>`;
        if (startPage > 2) {
            paginationHTML += `<span>...</span>`;
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        if (i === currentPage) {
            paginationHTML += `<button class="active" disabled>${i}</button>`;
        } else {
            paginationHTML += `<button onclick="fetchRecords(${i})">${i}</button>`;
        }
    }

    if (endPage < numPages) {
        if (endPage < numPages - 1) {
            paginationHTML += `<span>...</span>`;
        }
        paginationHTML += `<button onclick="fetchRecords(${numPages})">${numPages}</button>`;
    }


    // Next Button
    if (currentPage < numPages) {
        paginationHTML += `<button onclick="fetchRecords(${currentPage + 1})">Next &raquo;</button>`;
    } else {
        paginationHTML += `<button disabled>Next &raquo;</button>`;
    }

    paginationHTML += '</div>';
    paginationContainer.innerHTML = paginationHTML;
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

    function formatProductsList(items) {
        return items
            .map(item => `- 🍕 ${item.product_name} (${item.category_name})\n   Quantity: ${item.quantity} | Price: Rs. ${item.price}`)
            .join('\n');
    }

    function generateWhatsAppMessage(order) {
        const customerName = (order.customer && order.customer.name) || 'Valued Customer';
        const productsText = formatProductsList(order.items);
        const currentDate = new Date().toLocaleDateString('en-PK', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const accountNumber = getAccountNumber();

        const message = `🌟 *Assalam o Alaikum ${customerName},*

Aap ka order *Broadway Pizza* ke saath successfully place ho chuka hai — thank you for trusting us! 🙏

🍕 *Order Summary:*
Order ID: *#${order.order_id}*
Total Amount: *Rs. ${order.order_amount}*

📦 *Selected Items:*
${productsText}

📍 *Delivery Address:* ${order.delivery_address}
⏰ *Estimated Delivery:* 30–45 minutes

🎉 *LIMITED TIME OFFER – 50% OFF!*
Agar aap *online payment* karte hain, toh sirf *aadhi price* mein enjoy karein apna order — sirf *aaj* ke liye!

💳 *After Discount:* Rs. ${order.order_amount / 2}

🏦 *Payment Details:*
Bank Name: UBL
Account Number: ${accountNumber}

📤 *Payment krne ke baad hume slip bhej dein taake hum confirm kr saken.*

Broadway Pizza ko choose krne ka shukriya! Aap ka order tayar ho raha hai. 🍕  
*Mazedar pizza aap ke raste mein hai!* 😋`;

        return encodeURIComponent(message);
    }

    const telHref = sanitizeTel(phoneRaw);
    const waDigits = sanitizeWa(phoneRaw);
    const phoneDisplay = phoneRaw || 'N/A';
    const encoded = encodeURIComponent(order.delivery_address || '');
    const mapLink = `https://www.google.com/maps/search/?api=1&query=${encoded}`;

    // const whatsappMessage = generateWhatsAppMessage(order);
    const whatsappMessage = `🌟 *Assalam o Alaikum ${customerName},*  

Umeed hai aap bilkul theek hain 😊  
Aaj ${order.city} ki hawa bhi thodi khush lag rahi hai —  
shayad is liye ke ${order.customer.delivery_address} mein aap jaise positive log rehte hain 💫  

Bas yehi dua hai ke aap ka har din muskurahat aur sukoon se bhara rahe.  
Khush rahiye, ${order.customer.name}! 🌸`;

    const waLink = waDigits
        ? `<a href="https://wa.me/${waDigits}?text=${whatsappMessage}" target="_blank" rel="noopener noreferrer" class="modal-link">🟢 WhatsApp</a>`
        : '';

    const phoneLink = telHref
        ? `<a href="tel:${telHref}" class="modal-link">📞 ${phoneDisplay}</a>`
        : `📞 ${phoneDisplay}`;

    const addressLink = order.delivery_address
        ? `<a href="${mapLink}" target="_blank" rel="noopener noreferrer" class="modal-link">📍 ${order.delivery_address}</a>`
        : `📍 No address`;

    const primaryAddress = (order.city && order.user_area) ? `${order.city}, ${order.user_area}` : '';
    let primaryAddressLink = '';
    if (primaryAddress) {
        const encodedPrimary = encodeURIComponent(primaryAddress);
        const mapLinkPrimary = `https://www.google.com/maps/search/?api=1&query=${encodedPrimary}`;
        primaryAddressLink = `<a href="${mapLinkPrimary}" target="_blank" rel="noopener noreferrer" class="modal-link">📍 ${primaryAddress}</a>`;
    }

    const itemsHTML = order.items
        .map(item => `<div style="margin: 8px 0; padding: 8px; background: #f5f5f5; border-radius: 4px;">
            <strong>${item.product_name}</strong> <span style="color: #666; font-size: 0.9em;">(${item.category_name})</span><br>
            Quantity: ${item.quantity} | Price: Rs. ${item.price}
        </div>`)
        .join('');

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
            ${primaryAddressLink ? `
            <div class="detail-row">
                <span class="detail-label">Primary Address:</span>
                <span class="detail-value">${primaryAddressLink}</span>
            </div>` : ''}
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 12px 0;">
            <div class="detail-row">
                <span class="detail-label">Items Ordered:</span>
            </div>
            <div style="margin: 12px 0;">
                ${itemsHTML}
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
                <span class="detail-value">${(order.customer && order.customer.email) ? order.customer.email : '<i>No email provided</i>'}</span>
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

        const primaryAddress = (order.city && order.user_area) ? `${order.city}, ${order.user_area}` : '';
        let primary_address_element = '';
        if (primaryAddress) {
            const encodedPrimary = encodeURIComponent(primaryAddress);
            const primaryLink = `https://www.google.com/maps/search/?api=1&query=${encodedPrimary}`;
            primary_address_element = `
                <div class="order-address">
                    Primary Address: <a href="${primaryLink}" target="_blank" rel="noopener noreferrer" aria-label="View address on Google Maps" style="color:inherit;text-decoration:underline;">${primaryAddress}</a>
                </div>`;
        }

        return `
<div class="order-card" role="button" tabindex="0" aria-label="Order ${order.order_id}, click for details" style="cursor: pointer;">
<div class="order-info">
<div class="order-id">Order #${order.order_id}</div>
<div class="order-amount">💸 Amount: <b>Rs. ${order.order_amount}</b></div>
<div class="order-address">${location_element}</div>
${primary_address_element}
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

const urlParams = new URLSearchParams(window.location.search);
const baseUrl = urlParams.get('base_url');
if (baseUrl) {
    setApiUrl(baseUrl);
    const cleanUrl = window.location.origin + window.location.pathname;
    window.location.replace(cleanUrl);
}

fetchRecords(getCurrentPage());