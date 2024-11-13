# Odin Book Web App - Backend

This repository contains the backend server for the Odin Book Web Application. It is built using Express.js and connects with a MongoDB database to handle various functionalities such as user management, post creation, notifications, and more.

## Client Repository
[Odin-Book-Client-Side](https://github.com/mpapila/Odin-Book-Client-Side)

## Technologies Used

- **Node.js**: JavaScript runtime environment
- **Express**: Backend framework for routing and handling HTTP requests.
- **TypeScript**: Type-safe language for robust code.
- **MongoDB**: Database for storing user data, posts, comments, and notifications
- **Mongoose**: ODM for MongoDB
- **Express Validator**: Middleware for handling validation


## Features

- User registration, authentication, and profile management
- Creation, editing, and deletion of posts and comments
- Like and unlike posts
- Notification system for user interactions
- Friend request handling and friendship management
- Daily birthday notifications for users

## API Endpoints

### Users

- GET /users/:id: Get user profile by ID
- PUT /users/edit-profile: Edit user profile
- POST /users/register: Register a new user
- POST /users/login: User login

### Posts

- POST /posts: Create a new post
- GET /posts/:id: Get a post by ID
- PUT /posts/like: Like or unlike a post
- GET /posts/friends: Get posts by friends

### Comments

- POST /comments: Add a comment to a post

### Notifications

- GET /notifications: Fetch user notifications

### Friendships

- POST /friends/request: Send a friend request
- PUT /friends/accept: Accept a friend request

## Deployment

API
The server is deployed on Glitch and is only for API calls: https://odin-book-server-side.glitch.me/

Example API call: https://odin-book-server-side.glitch.me/health-check
