const products = [
  {
    id: 1,
    name: 'Double Breasted Wool Coat',
    price: 285,
    badge: 'Best Seller',
    description: 'A tailored wool coat built for modern styling and cold-weather elegance.',
    colors: ['black', 'camel', 'grey'],
    image: 'image.png'
  },
  {
    id: 2,
    name: 'Silk Pleated Midi Dress',
    price: 195,
    badge: '',
    description: 'An elegant, flowy dress designed for casual days and special evenings alike.',
    colors: ['black', 'green'],
    image: 'image copy 3.png'
  },
  {
    id: 3,
    name: 'High-Rise Tailored Trousers',
    price: 145,
    badge: '',
    description: 'Structured trousers with a comfortable high-rise fit that pairs with every wardrobe.',
    colors: ['black', 'navy'],
    image: 'image copy 2.png'
  },
  {
    id: 4,
    name: 'Oversized Cashmere Sweater',
    price: 210,
    badge: 'New',
    description: 'Soft cashmere knit with a relaxed silhouette for all-day comfort.',
    colors: ['cream', 'grey'],
    image: 'image copy 4.png'
  }
];

function formatCurrency(value) {
  return '$' + Number(value).toFixed(2);
}

function showMessage(element, text, type = 'success') {
  if (!element) return;
  element.textContent = text;
  element.className = `message ${type}`;
  element.style.display = 'block';
}

function clearMessage(element) {
  if (!element) return;
  element.textContent = '';
  element.style.display = 'none';
}

async function submitOrder(event) {
  event.preventDefault();
  const form = event.target;
  const button = document.getElementById('order-submit-button');
  const buttonText = button.querySelector('.button-text');

  const productId = Number(form.dataset.productId);
  const payload = {
    productId,
    name: form.name.value.trim(),
    email: form.email.value.trim(),
    phone: form.phone.value.trim(),
    address: form.address.value.trim(),
    quantity: Number(form.quantity.value),
    notes: form.notes.value.trim()
  };

  const messageElement = document.getElementById('order-message');
  clearMessage(messageElement);

  if (!payload.name || !payload.email || !payload.phone || !payload.address || !payload.quantity) {
    showMessage(messageElement, 'Please complete all required fields: name, email, phone, address, and quantity.', 'error');
    return;
  }

  button.disabled = true;
  button.classList.add('button-loading');
  buttonText.textContent = 'Placing Order...';

  try {
    const response = await fetch('/api/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to submit order.');
    }

    form.reset();
    openOrderPopup();
  } catch (error) {
    console.error(error);
    showMessage(messageElement, `Order failed: ${error.message}`, 'error');
  } finally {
    button.disabled = false;
    button.classList.remove('button-loading');
    buttonText.textContent = 'Submit Order';
  }
}

function openOrderPopup() {
  const popup = document.getElementById('order-popup');
  if (!popup) return;
  popup.classList.remove('hidden');
}

function closeOrderPopup() {
  const popup = document.getElementById('order-popup');
  if (!popup) return;
  popup.classList.add('hidden');
}

function renderProductPage(product) {
  if (!product) return;
  document.title = `${product.name} | Rang o Roop`;
  document.getElementById('product-image').src = product.image;
  document.getElementById('product-image').alt = product.name;
  document.getElementById('product-name').textContent = product.name;
  document.getElementById('product-badge').textContent = product.badge || '';
  document.getElementById('product-price').textContent = formatCurrency(product.price);
  document.getElementById('product-description').textContent = product.description;
  document.getElementById('product-form-title').textContent = `Order ${product.name}`;
  const colorContainer = document.getElementById('product-colors');
  colorContainer.innerHTML = product.colors.map(color => `<span class="circle ${color}"></span>`).join('');
  const form = document.getElementById('order-form');
  form.dataset.productId = product.id;
}

function initProductPage() {
  const params = new URLSearchParams(window.location.search);
  const id = Number(params.get('id')) || 1;
  const product = products.find((item) => item.id === id);
  if (!product) {
    document.body.innerHTML = '<p>Product not found. <a href="index.html">Go back to shop</a></p>';
    return;
  }
  renderProductPage(product);
  const orderForm = document.getElementById('order-form');
  orderForm.reset();
  orderForm.addEventListener('submit', submitOrder);

  const popupClose = document.getElementById('popup-close');
  const popupOk = document.getElementById('popup-ok');
  const popup = document.getElementById('order-popup');
  if (popupClose) popupClose.addEventListener('click', closeOrderPopup);
  if (popupOk) popupOk.addEventListener('click', closeOrderPopup);
  if (popup) popup.addEventListener('click', (event) => {
    if (event.target === popup) {
      closeOrderPopup();
    }
  });
}

function setAdminToken(token) {
  localStorage.setItem('adminToken', token);
}

function getAdminToken() {
  return localStorage.getItem('adminToken') || '';
}

function clearAdminToken() {
  localStorage.removeItem('adminToken');
}

async function adminLogin(event) {
  event.preventDefault();
  const username = document.getElementById('admin-username').value.trim();
  const password = document.getElementById('admin-password').value.trim();
  const messageElement = document.getElementById('admin-message');
  clearMessage(messageElement);

  try {
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed.');
    }

    setAdminToken(data.token);
    showAdminDashboard();
  } catch (error) {
    showMessage(messageElement, `Login failed: ${error.message}`, 'error');
  }
}

async function fetchAdminOrders() {
  const token = getAdminToken();
  const response = await fetch('/api/admin/orders', {
    headers: { 'x-admin-token': token }
  });
  if (!response.ok) {
    throw new Error('Unable to load orders. Please log in again.');
  }
  const data = await response.json();
  return data.orders || [];
}

function buildOrderTable(orders) {
  const tableBody = document.getElementById('order-table-body');
  tableBody.innerHTML = '';
  orders.forEach((order) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${order.id}</td>
      <td>${order.productName}</td>
      <td>${order.customer.name}</td>
      <td>${order.customer.email}</td>
      <td>${order.quantity}</td>
      <td><span class="status-pill ${order.status.toLowerCase()}">${order.status}</span></td>
      <td>${new Date(order.createdAt).toLocaleString()}</td>
      <td>
        <select data-order-id="${order.id}" class="status-select">
          <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
          <option value="Processing" ${order.status === 'Processing' ? 'selected' : ''}>Processing</option>
          <option value="Shipped" ${order.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
          <option value="Completed" ${order.status === 'Completed' ? 'selected' : ''}>Completed</option>
        </select>
      </td>
    `;
    tableBody.appendChild(row);
  });
  document.querySelectorAll('.status-select').forEach((select) => {
    select.addEventListener('change', async (event) => {
      const orderId = event.target.dataset.orderId;
      const newStatus = event.target.value;
      try {
        await updateOrderStatus(orderId, newStatus);
        await refreshAdminOrders();
      } catch (error) {
        console.error(error);
      }
    });
  });
}

function updateAdminSummary(orders) {
  const total = orders.length;
  const pending = orders.filter((order) => order.status === 'Pending').length;
  const shipped = orders.filter((order) => order.status === 'Shipped').length;
  const customers = new Set(orders.map((order) => order.customer.email)).size;
  document.getElementById('summary-total').textContent = total;
  document.getElementById('summary-pending').textContent = pending;
  document.getElementById('summary-shipped').textContent = shipped;
  document.getElementById('summary-customers').textContent = customers;
}

async function updateOrderStatus(orderId, status) {
  const token = getAdminToken();
  const response = await fetch(`/api/admin/orders/${orderId}/status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-token': token
    },
    body: JSON.stringify({ status })
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Could not update order status.');
  }
}

async function refreshAdminOrders() {
  const orders = await fetchAdminOrders();
  buildOrderTable(orders);
  document.getElementById('order-count').textContent = orders.length;
  updateAdminSummary(orders);
}

function showAdminDashboard() {
  document.getElementById('admin-login-section').classList.add('hidden');
  document.getElementById('admin-dashboard').classList.remove('hidden');
  refreshAdminOrders();
}

function initAdminPage() {
  const token = getAdminToken();
  document.getElementById('admin-login-form').addEventListener('submit', adminLogin);
  document.getElementById('admin-logout').addEventListener('click', (event) => {
    event.preventDefault();
    clearAdminToken();
    document.getElementById('admin-dashboard').classList.add('hidden');
    document.getElementById('admin-login-section').classList.remove('hidden');
  });
  if (token) {
    showAdminDashboard();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;
  if (page === 'product') {
    initProductPage();
  }
  if (page === 'admin') {
    initAdminPage();
  }
});
