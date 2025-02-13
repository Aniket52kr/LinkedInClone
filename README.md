# 📌 LinkedIn Clone

## 🔹 Overview
This project is a **LinkedIn Clone** built using the **MERN stack** (MongoDB, Express, React, Node.js) with **React Query** for efficient data fetching and state management. It provides a platform for users to create profiles, share posts, engage with others through likes/comments, connect with other users, and receive notifications—mimicking the core functionalities of LinkedIn. The application also integrates **Cloudinary for image uploads**, **JWT for authentication**, and **email services for notifications**.

---

## 🚀 Features
- ✅ **User Authentication**: Secure signup/login using JWT authentication.
- ✅ **Profile Management**: Users can create and edit their profiles.
- ✅ **Create & View Posts**: Users can share posts containing text and media.
- ✅ **Like & Comment on Posts**: Engage with posts by liking and commenting.
- ✅ **Network Page**: View and connect with other users.
- ✅ **Notifications**: Get notified when someone interacts with your posts.
- ✅ **Email Integration**: Send notifications and alerts via email.
- ✅ **Image Uploads**: Uses Cloudinary for secure and optimized media storage.
- ✅ **Responsive Design**: Optimized for both mobile and desktop.
- ✅ **Protected Routes**: Certain pages are accessible only to authenticated users.

---

## 🛠️ Tech Stack

### **Frontend**
- **React.js**: UI library for building interactive components.
- **React Router**: Client-side navigation.
- **React Query**: Efficient API data fetching and caching.
- **Tailwind CSS**: Modern, responsive styling framework.
- **React Hot Toast**: Provides user-friendly notifications.

### **Backend**
- **Node.js & Express.js**: Handles API requests.
- **MongoDB & Mongoose**: NoSQL database for storing users and posts.
- **JWT (JSON Web Token)**: Manages authentication securely.
- **Multer & Cloudinary**: Handles file uploads (profile pictures, post media).
- **Email Services (Mailtrap, SendGrid, etc.)**: Manages email notifications.
- **Express Session**: For session-based authentication (if needed).

---

## ⚙️ Installation & Setup
### **Prerequisites**
Ensure you have the following installed:
- **Node.js** (Latest LTS version)
- **MongoDB** (Local or cloud-based using MongoDB Atlas)
- **Cloudinary Account** (For media storage)
- **Email Service Provider** (SendGrid, Mailgun, or Mailtrap for testing)

### **Steps to Run Locally**
#### 1️⃣ Clone the repository:
```sh
git clone https://github.com/Aniket52kr/LinkedInClone.git
cd LinkedInClone
```

#### 2️⃣ Install dependencies for both frontend & backend:
```sh
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

#### 3️⃣ Set up environment variables:
Create a `.env` file in the **backend** folder and add the following:
```sh
MONGODB_URI= 
JWT_KEY=  
CLOUDINARY_CLOUD_NAME= 
CLOUDINARY_API_KEY= 
CLOUDINARY_API_SECRET=  
EMAIL_SERVICE_API_KEY=
EMAIL_FROM_ADDRESS=  
EMAIL_FROM_NAME=  
EXPRESS_SESSION_SECRET=
PORT= 
CLIENT_URL=  
MAILTRAP_TOKEN= 
MAILTRAP_SENDER_EMAIL=
MAILTRAP_SENDER_NAME=  
NODE_ENV=
```

#### 4️⃣ Start the development servers:
```sh
# Start backend server
cd backend
nodemon index.js

# Start frontend server
cd frontend
npm run dev
```

## 🎯 Usage
1. **Sign up/Login** to create an account.
2. **Create/Edit Profile** to personalize your account.
3. **Post Content** including text and images.
4. **Engage with Posts** by liking and commenting.
5. **Connect with Other Users** via the network page.
6. **Receive Notifications** for interactions on your posts.
7. **Email Alerts** for user engagement.

---

## 📸 Screenshots
![Screenshot (249)](https://github.com/user-attachments/assets/2ddc012f-cfd4-43fa-95be-d11409b2abf4)
![Screenshot (250)](https://github.com/user-attachments/assets/7407925b-a20f-457e-b512-6c82314fcb31)
![Screenshot (251)](https://github.com/user-attachments/assets/b3bf1003-84f0-4c68-bee2-3cbf53b205a5)
![Screenshot (254)](https://github.com/user-attachments/assets/d5996699-243d-4f92-baee-2b7fe63626a6)
![Screenshot (252)](https://github.com/user-attachments/assets/d65e23d3-01e8-46d3-b664-b5f6c375eb2b)
![Screenshot (253)](https://github.com/user-attachments/assets/340abc32-1e2d-4f65-a120-aa4ad1aa5dba)
![Screenshot (256)](https://github.com/user-attachments/assets/c26acd73-85a5-4b00-ac35-c935c47d73c4)
![Screenshot (257)](https://github.com/user-attachments/assets/fae80e14-2e81-451c-bf81-5ef95576bce3)


---

## 🛠 Future Enhancements
- 🔹 **Messaging System** for direct user communication.
- 🔹 **Job Posting & Applications** for a complete LinkedIn experience.
- 🔹 **Advanced Search & Filtering** for networking.
- 🔹 **Real-time Notifications** using WebSockets.

---

## 🤝 Contributing
Contributions are welcome! Feel free to fork the repository and submit a pull request.

---

## 📩 Contact
For any queries or collaborations, contact **Aniket Bawankar** via email at **aniketbawankar2021@gmail.com** or visit Linkedin Profile(www.linkedin.com/in/aniketbawankar).
