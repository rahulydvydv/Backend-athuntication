# 🔐 Backend Authentication API

A simple backend authentication system built with Node.js, Express, and MongoDB.

---

## 🚀 Features

* User Signup & Login
* JWT Authentication
* Session Management
* Secure Password Handling
* REST API Structure

---

## 🛠️ Tech Stack

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT (JSON Web Token)

---

## 📂 Project Structure

```
src/
 ├── controllers/
 ├── models/
 ├── routes/
 ├── config/
 └── server.js
```

---

## ⚙️ Installation

```bash
git clone https://github.com/rahulydvydv/Backend-athuntication.git
cd Backend-athuntication
npm install
```

---

## 🔑 Environment Variables

Create a `.env` file in root:

```
PORT=5000
MONGO_URI=your_mongodb_url
JWT_SECRET=your_secret_key
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
```

---

## ▶️ Run Project

```bash
npm start
```

---

## 📌 API Endpoints

| Method | Endpoint       | Description   |
| ------ | -------------- | ------------- |
| POST   | /auth/register | Register user |
| POST   | /auth/login    | Login user    |

---

## 👨‍💻 Author

Rahul Yadav

---

## ⭐ Support

If you like this project, give it a ⭐ on GitHub!
