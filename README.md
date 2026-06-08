# Rang o Roop

`Rang o Roop` is a demo ecommerce store built with a simple frontend and backend for university presentation. It includes product pages, an order form, email notifications, and an admin dashboard that acts like a basic CRM.

## Store Overview

- **Home Page:** Displays product cards and links to individual product pages.
- **Product Page:** Shows product details and includes an order form.
- **Order Form:** Requires the customer to enter:
  - Name
  - Email address
  - Phone number
  - Address
  - Quantity
- **Admin Page:** Provides a login, order dashboard, and CRM-style summary view.

## How This Store Works

### 1. Customer visits the store

A customer opens `index.html` and sees the featured products. Each product card links to a dedicated `product.html?id=X` page.

### 2. Product page and order form

On the product page, the customer chooses a product and fills the order form. The form is configured so the following inputs are mandatory:

- `email` (required)
- `phone` (required)
- `address` (required)
- `quantity` (required)

This means an order cannot be submitted until all mandatory fields are completed.

### 3. Order submission flow

When the customer clicks `Submit Order`:

- The frontend JavaScript (`script.js`) prepares the order data.
- It sends the data to the backend API route `/api/order`.
- The submit button shows a loader and becomes disabled while the order is sent.
- If the order is accepted, the customer sees a popup confirmation.

### 4. Order storage

Orders are stored in the file:

- `orders.json`

The backend app reads this file, adds the new order, and writes it back. Each order includes:

- `id`
- `productId`
- `productName`
- `quantity`
- `customer` details (`name`, `email`, `phone`, `address`)
- `notes`
- `status`
- `createdAt`

### 5. Email notifications

The backend uses Gmail and `nodemailer` to send emails by reading environment values from `.env`.

- Customer receives an order confirmation email
- Admin receives a new order notification email

Set these values in `.env`:

- `EMAIL_USER`
- `EMAIL_PASS`
- `ADMIN_EMAIL`
- `ADMIN_NOTIFY_EMAIL`

### 6. Admin dashboard and CRM view

The admin page is `admin.html`, which includes:

- Login form for admin access
- Order summary cards
- Table of all orders
- Status update selector for each order

When admin changes an order status:

- The backend updates `orders.json`
- The customer receives a status update email
- The admin page refreshes order counts and customer summaries

## Key Files

- `index.html` — main homepage and product cards
- `product.html` — detailed product order page
- `admin.html` — admin/CRM dashboard
- `script.js` — frontend logic for order submission and admin dashboard
- `style.css` — all styling for pages, buttons, popup, and dashboard
- `app.py` — Flask backend, order endpoints, and email handling
- `requirements.txt` — Python dependencies for local run and deployment
- `orders.json` — stored order history

## Why It Works

This store is built as a simple full-stack demo that demonstrates:

- client-side form validation
- back-end data storage without a database
- email sending from server-side code
- admin dashboard and login flow
- basic CRM-style presentation of customer and order data

The backend now runs on Flask, while the existing HTML, CSS, JavaScript, and image files stay in the project root and are served directly by Flask. That keeps the migration simple and preserves the current frontend without rewriting the pages.

## Flask Structure

- `app.py` — Flask backend, API routes, and email handling
- `requirements.txt` — Python packages needed for the project
- `index.html`, `product.html`, `admin.html` — frontend pages served by Flask
- `style.css`, `script.js`, images — static assets served directly by Flask

## Packages Used

- `Flask` — serves pages and exposes the API routes
- `python-dotenv` — loads environment values from `.env`
- `gunicorn` — production-ready WSGI server for hosting
- `smtplib` and `email.mime` — built-in Python modules for Gmail SMTP email sending

## How to run locally

To run this project locally, make sure Python 3 is installed on your machine.

You can verify installation with:

```bash
python --version
pip --version
```

Then follow these steps after cloning the repo:

```bash
git clone <repo-url>
cd Rang-o-Roop
pip install -r requirements.txt
```

Create the `.env` file manually in the project root.

Open a text editor and save a file named `.env` with values like this:

```text
EMAIL_USER=abc@gmail.com
EMAIL_PASS=abc123abc123
ADMIN_USER=admin
ADMIN_PASS=admin
ADMIN_EMAIL=abc@gmail.com
ADMIN_NOTIFY_EMAIL=abc@gmail.com
PORT=3000
```

> Do not push `.env` to Git. Keep it private.

Update `.env` with your real Gmail and admin values before starting the app.

After `.env` is ready:

```bash
python app.py
```

Open the site in a browser at:

```text
http://localhost:3000
```

This project needs the Flask backend to work fully. That means:

- the order form submits to `/api/order`
- the backend saves `orders.json`
- email notifications use Gmail SMTP
- admin actions use Flask server routes

For deployment, use a Python-friendly host such as Render, Railway, or a VPS. Netlify is still not enough for the full app because the backend must run on Python.

```text
http://localhost:3000
```

This project needs the Node.js backend to work fully. That means:

- the order form submits to `/api/order`
- the backend saves `orders.json`
- email notifications use `nodemailer`
- admin actions use server routes

So, no, ye project seedha Netlify par deploy karke poori tarah kaam nahi karega, kyunki Netlify static hosting hai. Agar aap sirf frontend pages host karna chahein, to static files chal sakte hain, lekin order submission aur emails tab kaam nahi karenge.

For the full working demo, run it locally or deploy to a Node-capable hosting service (for example, Render, Heroku, or a VPS).

## Presentation Notes

Use this README to explain each step:

1. show the homepage and product cards
2. open a product page and fill the required fields
3. explain the order submission flow and loader behavior
4. describe how orders are saved in `orders.json`
5. show the admin dashboard and order status update
6. highlight email notifications on new orders and status changes

## Explanation

This store demonstrates a complete mini ecommerce workflow using only static files and a lightweight backend. It clearly separates:

- the **frontend** (`index.html`, `product.html`, `admin.html`, `style.css`, `script.js`), which handles navigation, input validation, and user interaction
- the **backend** (`server.js`), which receives orders, updates order status, stores data, and sends emails
- the **data layer** (`orders.json`), which acts as a simple order database without requiring a real database server

This is a practical demo of:

- form validation and user feedback
- REST API endpoints handling order creation and admin actions
- server-side file-based persistence
- email notification integration using Gmail credentials
- a basic admin dashboard for managing order lifecycle


This setup is great for demonstrating a full ecommerce workflow with a lightweight backend.
