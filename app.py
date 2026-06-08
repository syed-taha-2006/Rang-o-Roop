from datetime import datetime
import json
import os
import secrets
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, abort, jsonify, request, send_from_directory


BASE_DIR = Path(__file__).resolve().parent
ORDERS_FILE = BASE_DIR / 'orders.json'

load_dotenv()

app = Flask(__name__)

PORT = int(os.getenv('PORT', '3000'))
ADMIN_USER = os.getenv('ADMIN_USER', os.getenv('ADMIN_USERNAME', 'admin'))
ADMIN_PASS = os.getenv('ADMIN_PASS', os.getenv('ADMIN_PASSWORD', 'demo123'))
EMAIL_USER = os.getenv('EMAIL_USER', '')
EMAIL_PASS = os.getenv('EMAIL_PASS', '')
ADMIN_EMAIL = os.getenv('ADMIN_EMAIL', EMAIL_USER)
ADMIN_NOTIFY_EMAIL = os.getenv('ADMIN_NOTIFY_EMAIL', ADMIN_EMAIL)

admin_token = None

products = [
    {
        'id': 1,
        'name': 'Double Breasted Wool Coat',
        'price': 285,
        'badge': 'Best Seller',
        'description': 'A tailored wool coat built for modern styling and cold-weather elegance.',
        'colors': ['black', 'camel', 'grey'],
        'image': 'image.png'
    },
    {
        'id': 2,
        'name': 'Silk Pleated Midi Dress',
        'price': 195,
        'badge': '',
        'description': 'An elegant, flowy dress designed for casual days and special evenings alike.',
        'colors': ['black', 'green'],
        'image': 'image copy 3.png'
    },
    {
        'id': 3,
        'name': 'High-Rise Tailored Trousers',
        'price': 145,
        'badge': '',
        'description': 'Structured trousers with a comfortable high-rise fit that pairs with every wardrobe.',
        'colors': ['black', 'navy'],
        'image': 'image copy 2.png'
    },
    {
        'id': 4,
        'name': 'Oversized Cashmere Sweater',
        'price': 210,
        'badge': 'New',
        'description': 'Soft cashmere knit with a relaxed silhouette for all-day comfort.',
        'colors': ['cream', 'grey'],
        'image': 'image copy 4.png'
    }
]


def load_orders():
    try:
        if not ORDERS_FILE.exists():
            ORDERS_FILE.write_text('[]', encoding='utf-8')
        return json.loads(ORDERS_FILE.read_text(encoding='utf-8'))
    except Exception as error:
        print('Failed to read orders:', error)
        return []


def save_orders(orders):
    ORDERS_FILE.write_text(json.dumps(orders, indent=2), encoding='utf-8')


def create_message(to_email, subject, html):
    message = MIMEMultipart('alternative')
    message['From'] = EMAIL_USER
    message['To'] = to_email
    message['Subject'] = subject
    message.attach(MIMEText(html, 'html'))
    return message


def send_email(to_email, subject, html):
    if not EMAIL_USER or not EMAIL_PASS:
        raise RuntimeError('EMAIL_USER and EMAIL_PASS must be configured in .env')

    message = create_message(to_email, subject, html)
    with smtplib.SMTP('smtp.gmail.com', 587, timeout=20) as smtp:
        smtp.ehlo()
        smtp.starttls()
        smtp.ehlo()
        smtp.login(EMAIL_USER, EMAIL_PASS)
        smtp.send_message(message)


def send_order_emails(order):
    admin_html = f'''
        <h2>New Order Received</h2>
        <p><strong>Order ID:</strong> {order['id']}</p>
        <p><strong>Product:</strong> {order['productName']}</p>
        <p><strong>Quantity:</strong> {order['quantity']}</p>
        <p><strong>Customer:</strong> {order['customer']['name']}</p>
        <p><strong>Email:</strong> {order['customer']['email']}</p>
        <p><strong>Phone:</strong> {order['customer']['phone'] or 'N/A'}</p>
        <p><strong>Address:</strong> {order['customer']['address']}</p>
        <p><strong>Notes:</strong> {order['notes'] or 'None'}</p>
    '''

    customer_html = f'''
        <h2>Thank you for your order, {order['customer']['name']}!</h2>
        <p>We received your order for <strong>{order['productName']}</strong>.</p>
        <p><strong>Order ID:</strong> {order['id']}</p>
        <p><strong>Quantity:</strong> {order['quantity']}</p>
        <p><strong>Shipping Address:</strong> {order['customer']['address']}</p>
        <p>We will contact you when your order is ready to ship.</p>
        <p>— Rang o Roop Team</p>
    '''

    send_email(ADMIN_NOTIFY_EMAIL, f"New Order Received: {order['productName']}", admin_html)
    send_email(order['customer']['email'], f"Order Confirmation - {order['productName']}", customer_html)


def send_status_update_email(order):
    html = f'''
        <h2>Your order status has changed</h2>
        <p>Hello {order['customer']['name']},</p>
        <p>Your order <strong>#{order['id']}</strong> for <strong>{order['productName']}</strong> is now <strong>{order['status']}</strong>.</p>
        <p>If you have any questions, reply to this email and we will help you.</p>
        <p>Thank you for shopping with Rang o Roop.</p>
    '''

    send_email(order['customer']['email'], f"Order Update - {order['productName']} is now {order['status']}", html)


@app.route('/')
def home():
    return send_from_directory(BASE_DIR, 'index.html')


@app.route('/index.html')
def index_page():
    return send_from_directory(BASE_DIR, 'index.html')


@app.route('/product.html')
def product_page():
    return send_from_directory(BASE_DIR, 'product.html')


@app.route('/admin.html')
def admin_page():
    return send_from_directory(BASE_DIR, 'admin.html')


@app.route('/api/order', methods=['POST'])
def create_order():
    payload = request.get_json(silent=True) or {}
    product_id = payload.get('productId')
    name = payload.get('name')
    email = payload.get('email')
    phone = payload.get('phone')
    address = payload.get('address')
    quantity = payload.get('quantity')
    notes = payload.get('notes')

    if not product_id or not name or not email or not address or not quantity:
        return jsonify(error='Required order fields are missing.'), 400

    try:
        product_id_int = int(product_id)
        quantity_int = int(quantity)
    except (TypeError, ValueError):
        return jsonify(error='Invalid product or quantity.'), 400

    product = next((item for item in products if item['id'] == product_id_int), {'id': product_id_int, 'name': 'Custom product'})

    order = {
        'id': int(datetime.utcnow().timestamp() * 1000),
        'productId': product['id'],
        'productName': product['name'],
        'quantity': quantity_int,
        'customer': {
            'name': name,
            'email': email,
            'phone': phone,
            'address': address
        },
        'notes': notes,
        'status': 'Pending',
        'createdAt': datetime.utcnow().isoformat() + 'Z'
    }

    all_orders = load_orders()
    all_orders.insert(0, order)
    save_orders(all_orders)

    try:
        send_order_emails(order)
        return jsonify(success=True, order=order)
    except Exception as error:
        print('Email error:', error)
        return jsonify(error='Order saved but email could not be sent. Check backend configuration.'), 500


@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    global admin_token
    payload = request.get_json(silent=True) or {}
    username = payload.get('username')
    password = payload.get('password')

    if username == ADMIN_USER and password == ADMIN_PASS:
        admin_token = secrets.token_hex(24)
        return jsonify(success=True, token=admin_token)

    return jsonify(error='Invalid admin credentials.'), 401


@app.route('/api/admin/orders', methods=['GET'])
def admin_orders():
    token = request.headers.get('x-admin-token')
    if not token or token != admin_token:
        return jsonify(error='Unauthorized.'), 401

    return jsonify(orders=load_orders())


@app.route('/api/admin/orders/<order_id>/status', methods=['POST'])
def update_order_status(order_id):
    token = request.headers.get('x-admin-token')
    if not token or token != admin_token:
        return jsonify(error='Unauthorized.'), 401

    payload = request.get_json(silent=True) or {}
    status = payload.get('status')
    orders = load_orders()
    order = next((item for item in orders if str(item.get('id')) == str(order_id)), None)

    if not order:
        return jsonify(error='Order not found.'), 404

    order['status'] = status or order['status']
    save_orders(orders)

    try:
        send_status_update_email(order)
        return jsonify(success=True, order=order)
    except Exception as error:
        print('Status email error:', error)
        return jsonify(error='Order status updated but customer email could not be sent. Check backend email configuration.'), 500


@app.route('/<path:filename>')
def serve_asset(filename):
    asset_path = BASE_DIR / filename
    allowed_extensions = {'.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.jfif', '.ico', '.svg', '.url'}
    if asset_path.is_file() and asset_path.suffix.lower() in allowed_extensions:
        return send_from_directory(BASE_DIR, filename)
    abort(404)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=PORT, debug=True)