require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = path.join(__dirname, '/');
const ORDERS_FILE = path.join(__dirname, 'orders.json');

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'demo123';
const EMAIL_USER = process.env.EMAIL_USER || '';
const EMAIL_PASS = process.env.EMAIL_PASS || '';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || EMAIL_USER;
const ADMIN_NOTIFY_EMAIL = process.env.ADMIN_NOTIFY_EMAIL || ADMIN_EMAIL;

let adminToken = null;
app.use(express.json());
app.use(express.static(ROOT));

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

function loadOrders() {
  try {
    if (!fs.existsSync(ORDERS_FILE)) {
      fs.writeFileSync(ORDERS_FILE, '[]', 'utf8');
    }
    return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
  } catch (error) {
    console.error('Failed to read orders:', error);
    return [];
  }
}

function saveOrders(data) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function createTransporter() {
  if (!EMAIL_USER || !EMAIL_PASS) {
    throw new Error('EMAIL_USER and EMAIL_PASS must be configured in .env');
  }
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS
    }
  });
}

async function sendOrderEmails(order) {
  const transporter = createTransporter();
  const adminMessage = {
    from: EMAIL_USER,
    to: ADMIN_NOTIFY_EMAIL,
    subject: `New Order Received: ${order.productName}`,
    html: `
      <h2>New Order Received</h2>
      <p><strong>Order ID:</strong> ${order.id}</p>
      <p><strong>Product:</strong> ${order.productName}</p>
      <p><strong>Quantity:</strong> ${order.quantity}</p>
      <p><strong>Customer:</strong> ${order.customer.name}</p>
      <p><strong>Email:</strong> ${order.customer.email}</p>
      <p><strong>Phone:</strong> ${order.customer.phone || 'N/A'}</p>
      <p><strong>Address:</strong> ${order.customer.address}</p>
      <p><strong>Notes:</strong> ${order.notes || 'None'}</p>
    `
  };

  const customerMessage = {
    from: EMAIL_USER,
    to: order.customer.email,
    subject: `Order Confirmation - ${order.productName}`,
    html: `
      <h2>Thank you for your order, ${order.customer.name}!</h2>
      <p>We received your order for <strong>${order.productName}</strong>.</p>
      <p><strong>Order ID:</strong> ${order.id}</p>
      <p><strong>Quantity:</strong> ${order.quantity}</p>
      <p><strong>Shipping Address:</strong> ${order.customer.address}</p>
      <p>We will contact you when your order is ready to ship.</p>
      <p>— Rang o Roop Team</p>
    `
  };

  await transporter.sendMail(adminMessage);
  await transporter.sendMail(customerMessage);
}

async function sendStatusUpdateEmail(order) {
  const transporter = createTransporter();
  const message = {
    from: EMAIL_USER,
    to: order.customer.email,
    subject: `Order Update - ${order.productName} is now ${order.status}`,
    html: `
      <h2>Your order status has changed</h2>
      <p>Hello ${order.customer.name},</p>
      <p>Your order <strong>#${order.id}</strong> for <strong>${order.productName}</strong> is now <strong>${order.status}</strong>.</p>
      <p>If you have any questions, reply to this email and we will help you.</p>
      <p>Thank you for shopping with Rang o Roop.</p>
    `
  };

  await transporter.sendMail(message);
}

app.post('/api/order', async (req, res) => {
  const { productId, name, email, phone, address, quantity, notes } = req.body;
  if (!productId || !name || !email || !address || !quantity) {
    return res.status(400).json({ error: 'Required order fields are missing.' });
  }

  const product = products.find((item) => item.id === Number(productId)) || { name: 'Custom product' };
  const order = {
    id: Date.now(),
    productId: product.id,
    productName: product.name,
    quantity: Number(quantity),
    customer: { name, email, phone, address },
    notes,
    status: 'Pending',
    createdAt: new Date().toISOString()
  };

  const allOrders = loadOrders();
  allOrders.unshift(order);
  saveOrders(allOrders);

  try {
    await sendOrderEmails(order);
    return res.json({ success: true, order });
  } catch (error) {
    console.error('Email error:', error);
    return res.status(500).json({ error: 'Order saved but email could not be sent. Check backend configuration.' });
  }
});

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    adminToken = crypto.randomBytes(24).toString('hex');
    return res.json({ success: true, token: adminToken });
  }
  return res.status(401).json({ error: 'Invalid admin credentials.' });
});

app.get('/api/admin/orders', (req, res) => {
  const token = req.headers['x-admin-token'];
  if (!token || token !== adminToken) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }
  const orders = loadOrders();
  return res.json({ orders });
});

app.post('/api/admin/orders/:id/status', async (req, res) => {
  const token = req.headers['x-admin-token'];
  if (!token || token !== adminToken) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }
  const { id } = req.params;
  const { status } = req.body;
  const orders = loadOrders();
  const order = orders.find((item) => String(item.id) === String(id));
  if (!order) {
    return res.status(404).json({ error: 'Order not found.' });
  }
  order.status = status || order.status;
  saveOrders(orders);
  try {
    await sendStatusUpdateEmail(order);
    return res.json({ success: true, order });
  } catch (error) {
    console.error('Status email error:', error);
    return res.status(500).json({
      error: 'Order status updated but customer email could not be sent. Check backend email configuration.'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
