# API Documentation

## User Endpoints `/users`

### 1. Get Message to Sign
**GET** `/session/get-message-to-sign/:walletAddress`

- **Description**: Retrieves a message to be signed by the user.
- **Parameters**:
  - `walletAddress` (string, required): The wallet address of the user.
- **Response**:
  - **200 OK**: Returns the message to sign.
  <!-- - **400 Bad Request**: Invalid wallet address format. -->
  - **500 Internal Server Error**: Server error.

---

### 2. Register User
**POST** `/register`

- **Description**: Registers a new user after signature verification.
- **Body**:
  - `signature` (string, required): Signature of the user.
  - `walletAddress` (string, required): Wallet address of the user.
- **Headers**:
  - `Session-Token` (string, required): Session token for validation.
- **Response**:
  - **201 Created**: User successfully registered.
  <!-- - **400 Bad Request**: Invalid signature or missing data. -->
  - **401 Unauthorized**: Session token is invalid or expired.
  - **500 Internal Server Error**: Server error.

---

<!-- ### 3. Register User (Development)
**POST** `/register/dev`

- **Description**: Registers a new user in development mode.
- **Body**:
  - Same as the `/register` endpoint.
- **Response**:
  - Same as the `/register` endpoint. -->

---

### 4. Get Session
**GET** `/session`

- **Description**: Retrieves the current session information.
- **Headers**:
  - `Session-Token` (Bearer Token, required): User authentication token.
- **Response**:
  - **200 OK**: Returns session information.
  - **401 Unauthorized**: User is not authenticated.
  - **500 Internal Server Error**: Server error.

---

### 5. Logout
**POST** `/logout`

- **Description**: Logs the user out.
- **Headers**:
  - `Session-Token` (Bearer Token, required): User authentication token.
- **Response**:
  - **200 OK**: User successfully logged out.
  - **401 Unauthorized**: User is not authenticated.
  - **500 Internal Server Error**: Server error.

---

### 6. Get All Users
**GET** `/`

- **Description**: Retrieves a list of all registered users.
- **Response**:
  - **200 OK**: Returns the list of users.
  - **404 Not Found**: Data not found.
  - **500 Internal Server Error**: Server error.

---

### 7. Update Email
**POST** `/put/email`

- **Description**: Updates the user's email address.
- **Headers**:
  - `Session-Token` (Bearer Token, required): User authentication token.
- **Body**:
  - `email` (string, required): New email address.
- **Response**:
  - **200 OK**: Email successfully updated.
  - **400 Bad Request**: Invalid email format or missing data.
  - **401 Unauthorized**: User is not authenticated.
  - **500 Internal Server Error**: Server error.

## Exam Endpoints `/exams`

### 1. Create Exam
**POST** `/create`

- **Description**: Creates a new exam.
- **Headers**:
  - `Session-Token` (Bearer Token, required): User authentication token.
- **Body**:
  - `title` (string, required): Title of the exam.
  - `description` (string, required): Description of the exam.
  - `questions` (Object array, required): Questions of the exam.
  - `startDate` (Date, required): Starting date and time of the exam.
  - `duration` (number, required): Duration of the exam in minutes.
  - `rootHash` (string, required): Root hash of the exam.
  - `secretKey` (string, required): Secret key of the exam.
- **Response**:
  - **201 Created**: Exam successfully created.
  <!-- - **400 Bad Request**: Missing or invalid data. -->
  - **401 Unauthorized**: User is not authenticated.
  - **500 Internal Server Error**: Server error.

---

### 2. Get My Exams
**GET** `/myExams`

- **Description**: Retrieves all exams created by the authenticated user.
- **Headers**:
  - `Session-Token` (Bearer Token, required): User authentication token.
- **Response**:
  - **200 OK**: Returns a list of exams.
  - **401 Unauthorized**: User is not authenticated.
  - **500 Internal Server Error**: Server error.

---

### 3. Get Exam by ID
**GET** `/:id`

- **Description**: Retrieves a specific exam by its ID.
- **Parameters**:
  - `id` (string, required): The ID of the exam.
- **Response**:
  - **200 OK**: Returns the exam details.
  - **404 Not Found**: Exam not found.
  - **500 Internal Server Error**: Server error.

---

### 4. Start Exam
**POST** `/startExam`

- **Description**: Starts an exam for the authenticated user.
- **Headers**:
  - `Session-Token` (Bearer Token, required): User authentication token.
- **Body**:
  - `examId` (string, required): ID of the exam to start.
- **Response**:
  - **200 OK**: Continue to exam.
  - **201 Created**: Exam successfully started.
  - **400 Bad Request**: Invalid exam or exam timing.
  - **401 Unauthorized**: User is not authenticated.
  - **500 Internal Server Error**: Server error.

---

### 5. Get Exam Questions
**GET** `/:id/questions`

- **Description**: Retrieves the list of questions for a specific exam.
- **Headers**:
  - `Session-Token` (Bearer Token, required): User authentication token.
- **Parameters**:
  - `id` (string, required): The ID of the exam.
- **Response**:
  - **200 OK**: Returns the list of questions.
  - **400 Bad Request**: Exam has not started yet or has already finished.
  - **404 Not Found**: Exam or participation not found.
  - **500 Internal Server Error**: Server error.

---

### 6. Finish Exam
**POST** `/finishExam`

- **Description**: Submits the user's answers and finishes the exam.
- **Headers**:
  - `Session-Token` (Bearer Token, required): User authentication token.
- **Body**:
  - `examId` (string, required): ID of the exam.
  - `answers` (Object array, required): List of answers submitted by the user.
  - Additional fields...
- **Response**:
  - **200 OK**: Exam finished and answers submitted successfully.
  - **400 Bad Request**: Invalid or missing data.
  - **401 Unauthorized**: User is not authenticated.
  - **404 Not Found**: Exam or participation not found.
  - **500 Internal Server Error**: Server error.

## Answer Endpoints `/answers`

### Get My Answers

**GET** `/myAnswers`

- **Description**: Retrieves authenticated user's answers of a specific exam.
- **Headers**:
  - `Session-Token` (Bearer Token, required): User authentication token.
- **Body**:
  - `examId` (string, required): ID of the exam.
- **Response**:
  - **200 OK**: Returns a list of answers.
  - **401 Unauthorized**: User is not authenticated.
  - **500 Internal Server Error**: Server error.

---