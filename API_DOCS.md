# API Documentation

## User Endpoints `/users`

### 1. Get Message to Sign
**GET** `/session/get-message-to-sign/:walletAddress`

- **Description**: Retrieves a message for the user to sign. This message is generated using the provided wallet address and will be used for session authentication.
- **Parameters**:
  - `walletAddress` (string, required): The wallet address of the user.
- **Middleware**:
  - `validateRequest`: Validates the `walletAddress` parameter to ensure it meets the required format.
- **Response**:
  - **200 OK**: Returns the generated message for signing.
    ```json
    {"message":"0liaatB62qqVs4eJbEFKLHLt4VeneazmpBajJkHyC9nFTvj9PDnZkeePJpcVz"}
    ```
  - **400 Bad Request**: Wallet address is missing or invalid.
    ```json
    {
      "message": "Wallet address is required"
    }
    ```
  - **500 Internal Server Error**: Server encountered an unexpected error.
    ```json
    {
      "message": "Internal server error"
    }
    ```

---

### 2. Register User
**POST** `/register`

- **Description**: Registers a new user or logs in an existing user. This process involves verifying the provided signature and associating it with the user's wallet address.
- **Body**:
  - `signature` (string, required): The signature of the user for verification.
  - `walletAddress` (string, required): The wallet address of the user.
- **Headers**:
  - `Session-Token` (string, required): Token used to validate the session.
- **Middleware**:
  - `validateSessionToken`: Checks for the presence of a valid session token.
  - `validateRequest`: Ensures the request body contains valid `signature` and `walletAddress` fields.
  - `verifyUserSignature`: Verifies the provided signature matches the generated message.
- **Response**:
  - **201 Created**: User successfully registered or logged in.
    ```json
    {
      "success": true,
      "session": { "userId": "12345", "walletAddress": "0x..." },
      "user": { "id": "12345", "walletAddress": "0x...", "isAdmin": false }
    }
    ```
  - **400 Bad Request**: Invalid signature or missing required fields.
    ```json
    {
      "success": false,
      "message": "Invalid signature"
    }
    ```
  - **401 Unauthorized**: Session token is missing or invalid.
    ```json
    {
      "message": "No session token found"
    }
    ```
  - **500 Internal Server Error**: Server encountered an unexpected error.
    ```json
    {
      "message": "Internal server error"
    }
    ```

---

### 3. Register User (Development Mode)
**POST** `/register/dev`

- **Description**: Registers a new user in development mode. This endpoint bypasses session token and signature validation.
- **Body**:
  - Same as `/register`.
- **Middleware**:
  - None (this endpoint bypasses middleware checks in development mode).
- **Response**:
  - **201 Created**: User successfully registered.
  - **500 Internal Server Error**: Server encountered an unexpected error.

---

### 4. Get Session
**GET** `/session`

- **Description**: Retrieves the current session information for the authenticated user.
- **Headers**:
  - `Session-Token` (Bearer Token, required): User authentication token.
- **Middleware**:
  - None.
- **Response**:
  - **200 OK**: Returns the session information.
    ```json
    {"success":true,"session":{"userId":"66fa6bb1c58f93ea0cd0912c","walletAddress":"Z62aa9ssZH8zQaasVr53ApUBrtwt8odZ7hXVXguhq6udpUYQVbRnpVJ","isAdmin":false}}
    ```
  - **401 Unauthorized**: No active session found.
    ```json
    {
      "message": "No active session"
    }
    ```
  - **500 Internal Server Error**: Server encountered an unexpected error.
    ```json
    {
      "message": "Internal server error"
    }
    ```

---

### 5. Logout
**POST** `/logout`

- **Description**: Logs out the authenticated user by destroying the current session.
- **Headers**:
  - `Session-Token` (Bearer Token, required): User authentication token.
- **Middleware**:
  - `ensureAuthenticated`: Ensures the user is authenticated before proceeding.
- **Response**:
  - **200 OK**: User successfully logged out.
    ```json
    {
      "success": true,
      "message": "Logged out"
    }
    ```
  - **500 Internal Server Error**: Failed to destroy the session.
    ```json
    {
      "message": "Failed to logout"
    }
    ```

---

### 6. Get All Users
**GET** `/`

- **Description**: Retrieves a list of all registered users. This endpoint is restricted to admin users.
- **Headers**:
  - `Session-Token` (Bearer Token, required): Admin authentication token.
- **Middleware**:
  - `ensureAuthenticated`: Ensures the user is authenticated.
  - `ensureAdmin`: Ensures the user has admin privileges.
- **Response**:
  - **200 OK**: Returns a list of users.
    ```json
    [
      { "id": "12345", "walletAddress": "0x...", "isAdmin": false },
      { "id": "67890", "walletAddress": "0x...", "isAdmin": true }
    ]
    ```
  - **401 Unauthorized**: User is not authenticated.
    ```json
    {
      "message": "Unauthorized"
    }
    ```
  - **403 Forbidden**: User does not have admin privileges.
    ```json
    {
      "message": "Admin access required"
    }
    ```
  - **404 Not Found**: No users found.
    ```json
    {
      "message": "No users found"
    }
    ```
  - **500 Internal Server Error**: Server encountered an unexpected error.
    ```json
    {
      "message": "Internal server error"
    }
    ```

---

### 7. Update Email
**POST** `/put/email`

- **Description**: Updates the email address of the authenticated user.
- **Headers**:
  - `Session-Token` (Bearer Token, required): User authentication token.
- **Body**:
  - `email` (string, required): New email address of the user.
- **Middleware**:
  - `ensureAuthenticated`: Ensures the user is authenticated.
  - `validateRequest`: Validates the `email` field in the request body.
  - `validateRequestedEmail`: Ensures the provided email is in a valid format.
- **Response**:
  - **200 OK**: Email updated successfully.
    ```json
    {
      "message": "Email updated successfully"
    }
    ```
  - **400 Bad Request**: Invalid or missing email format.
    ```json
    {
      "message": "Invalid email format"
    }
    ```
  - **401 Unauthorized**: User is not authenticated.
    ```json
    {
      "message": "Unauthorized"
    }
    ```
  - **500 Internal Server Error**: Server encountered an unexpected error.
    ```json
    {
      "message": "Internal server error"
    }
    ```



## Exam Endpoints `/exams`

### 1. Create Exam
**POST** `/create`

- **Description**: Creates a new exam along with its metadata and questions. Rewarded exams require additional fields for rewards configuration.
- **Headers**:
  - `Session-Token` (Bearer Token, required): User authentication token.
- **Body**:
  - `title` (string, required): Title of the exam.
  - `description` (string, required): Description of the exam.
  - `startDate` (string, required): Starting date and time of the exam (ISO format).
  - `duration` (number, required): Duration of the exam in minutes.
  - `rootHash` (string, required): Root hash of the exam.
  - `secretKey` (string, required): Secret key for verifying exam participation.
  - `questionCount` (number, required): Number of questions in the exam.
  - Optional fields for rewarded exams:
    - `isRewarded` (boolean, optional): Indicates whether the exam offers rewards.
    - `rewardPerWinner` (number, optional): Reward amount per winner (required if `isRewarded` is true).
    - `passingScore` (number, optional): Minimum score required to win (required if `isRewarded` is true).
    - `deployJobId` (string, optional): Deployment job ID (required if `isRewarded` is true).
    - `contractAddress` (string, optional): Smart contract address (required if `isRewarded` is true).
- **Middleware**:
  - `ensureAuthenticated`: Ensures the user is logged in.
  - `validateRequest`: Validates the request body.
- **Response**:
  - **201 Created**: Exam successfully created.
    ```json
    {
      "creator":"66fa6bb1c58f93ea0cd0912c",
    "title":"Testing Exam",
    "description":"This is a description",
    "startDate":"2025-01-30T10:09:43.547Z",
    "duration":10,
    "rootHash":"0x0",
    "secretKey":"SIOSDajksa",
    "questionCount":3,
    "isRewarded":true,
    "rewardPerWinner":1,
    "passingScore":80,
    "contractAddress":"0x0",
    "deployJobId":"zkCWuZbPl0YFGXdtbf3Z2jgZOyYFpnzvZHQDJjP0rQTSfVqw",
    "isCompleted":false,
    "isDistributed":false,
    "isPrivate":false,
    "isWinnerlistRequested":true,
    "_id":"679b4fe7feb5dfd7e868e5f9",
    "createdAt":"2025-01-30T10:09:43.580Z",
    "updatedAt":"2025-01-30T10:09:43.580Z",
    "__v":0
    }
    ```
  - **400 Bad Request**: Missing or invalid data.
    ```json
    {
      "error":"ValidationException",
      "message":"Validation failed",
      "errors":
      [
        {
          "field":"title",
          "message":"Title must be at least 3 characters"
        },
        {
          "field":"duration",
          "message":"Expected number, received string"
        }
      ]
    }
    ```
  - **401 Unauthorized**: User is not authenticated.
    ```json
    {
      "message": "Unauthorized"
    }
    ```
  - **500 Internal Server Error**: Server encountered an unexpected error.
    ```json
    {
      "message": "Internal server error"
    }
    ```

---

### 2. Generate Exam Links
**POST** `/generateExamLinks`

- **Description**: Generates unique participation links for an exam and emails them to participants.
- **Headers**:
  - `Session-Token` (Bearer Token, required): User authentication token.
- **Body**:
  - `examId` (string, required): ID of the exam.
  - `emailList` (array of strings, required): List of participant emails.
- **Middleware**:
  - `ensureAuthenticated`: Ensures the user is logged in.
  - `validateRequest`: Validates the request body against `examSchemas.generateLinks`.
- **Response**:
  - **201 Created**: Links successfully generated and sent to participants.
    ```json
    {"success":true,"result":[{"email":"swordlionthelionheart@gmail.com","link":"https://choz.io/app/exams/get-started/679b5278feb5dfd7e868e710/4ee0f073-31a9-42f3-9033-b146785469e0"},{"email":"ystuncerbot@gmail.com","link":"https://choz.io/app/exams/get-started/679b5278feb5dfd7e868e710/9cee46cc-435d-4b7b-adee-d54d990e88b8"}]}
    ```
  - **400 Bad Request**: Invalid exam ID or email list.
    ```json
    {"error":"ValidationException","message":"Validation failed","errors":[{"field":"examId","message":"Invalid ObjectId format"}]}
    ```
  - **403 Forbidden**: User is not the creator of the exam.
    ```json
    {
      "message": "Only creator can access"
    }
    ```
  - **500 Internal Server Error**: Server encountered an unexpected error.
    ```json
    {
      "message": "Internal server error"
    }
    ```

---

### 3. Get My Exams
**GET** `/myExams`

- **Description**: Retrieves all exams created or joined by the authenticated user, optionally filtered by role or status.
- **Headers**:
  - `Session-Token` (Bearer Token, required): User authentication token.
- **Query Parameters**:
  - `role` (string, optional): `creator` or `joined` (default: `creator`).
  - `filter` (string, optional): `all`, `upcoming`, `active`, or `ended` (default: `all`).
  - `sortBy` (string, optional): Field to sort by (e.g., `createdAt`, default: `createdAt`).
  - `sortOrder` (string, optional): `asc` or `desc` (default: `desc`).
- **Middleware**:
  - `ensureAuthenticated`: Ensures the user is logged in.
- **Response**:
  - **200 OK**: Returns the list of exams.
    ```json
    [
      {
        "id": "examId",
        "title": "Exam 1",
        "status": "upcoming",
        "creator": "userId",
        "startDate": "2023-12-01T10:00:00Z"
        ...
      },
      {
        "id": "examId2",
        "title": "Exam 2",
        "status": "active",
        "creator": "userId",
        "startDate": "2023-11-30T12:00:00Z"
        ...
      }
    ]
    ```
  - **401 Unauthorized**: User is not authenticated.
    ```json
    {
      "message": "Unauthorized"
    }
    ```
  - **500 Internal Server Error**: Server encountered an unexpected error.
    ```json
    {
      "message": "Internal server error"
    }
    ```

---
### 4. Get Exam by ID
**GET** `/:id`

- **Description**: Retrieves details of a specific exam by its ID, including participation information for the authenticated user.
- **Headers**:
  - `Session-Token` (Bearer Token, required): User authentication token.
- **Parameters**:
  - `id` (string, required): ID of the exam.
- **Middleware**:
  - `ensureAuthenticated`: Ensures the user is logged in.
  - `validateRequest`: Validates the request parameters against `examSchemas.params`.
- **Response**:
  - **200 OK**: Returns exam details and participation information.
    ```json
    {"exam":{"_id":"679b5278feb5dfd7e868e710","creator":"66fa6bb1c58f93ea0cd0912c","title":"Testing Exam","description":"This is a description","startDate":"2025-01-30T10:20:40.881Z","duration":10,"rootHash":"0x0","secretKey":"SIOSDajksa","questionCount":3,"isRewarded":true,"rewardPerWinner":1,"passingScore":80,"contractAddress":"0x0","deployJobId":"zkCWuZbPl0YFGXdtbf3Z2jgZOyYFpnzvZHQDJjP0rQTSfVqw","isCompleted":true,"isDistributed":false,"isPrivate":false,"isWinnerlistRequested":true,"createdAt":"2025-01-30T10:20:40.899Z","updatedAt":"2025-01-30T10:30:56.147Z","__v":0},"participatedUser":{"_id":"679b5385feb5dfd7e868e796","user":"66fa6bb1c58f93ea0cd0912c","exam":"679b5278feb5dfd7e868e710","nickname":"bertrand-du-guesclin","isFinished":true,"isWinner":false,"isRewardSent":false,"isMailSent":true,"jobAdded":true,"createdAt":"2025-01-30T10:25:09.870Z","updatedAt":"2025-01-30T10:31:03.482Z","__v":0,"finishTime":"2025-01-30T10:29:01.651Z"}}
    ```
  - **401 Unauthorized**: User is not authenticated.
    ```json
    {
      "message": "Unauthorized"
    }
    ```
  - **404 Not Found**: Exam not found.
    ```json
    {
      "message": "Exam not found"
    }
    ```
  - **500 Internal Server Error**: Server encountered an unexpected error.
    ```json
    {
      "message": "Internal server error"
    }
    ```

---

### 5. Get Exam Details
**GET** `/:id/details`

- **Description**: Retrieves detailed information about a specific exam. Includes metadata, participants, winner list, and leaderboard if applicable.
- **Headers**:
  - `Session-Token` (Bearer Token, required): User authentication token.
- **Parameters**:
  - `id` (string, required): The ID of the exam.
- **Middleware**:
  - `ensureAuthenticated`: Ensures the user is logged in.
  - `validateRequest`: Validates the request parameters.
- **Response**:
  - **200 OK**: Returns detailed exam information.
    ```json
    {"_id":"679b5278feb5dfd7e868e710","creator":"66fa6bb1c58f93ea0cd0912c","title":"Testing Exam","description":"This is a description","startDate":"2025-01-30T10:20:40.881Z","duration":10,"rootHash":"0x0","secretKey":"SIOSDajksa","questionCount":3,"isRewarded":true,"rewardPerWinner":1,"passingScore":80,"contractAddress":"0x0","deployJobId":"zkCWuZbPl0YFGXdtbf3Z2jgZOyYFpnzvZHQDJjP0rQTSfVqw","isCompleted":true,"isDistributed":false,"isPrivate":false,"isWinnerlistRequested":true,"createdAt":"2025-01-30T10:20:40.899Z","updatedAt":"2025-01-30T10:30:56.147Z","__v":0,"winnerlist":[],"participants":[{"finishTime":"2025-01-30T10:29:01.651Z","userId":"66fa6bb1c58f93ea0cd0912c","nickname":"Z62aa9ssZH8zQaasVr53ApUBrtwt8odZ7hXVXguhq6udpUYQVbRnpVJ","walletAddress":"Z62aa9ssZH8zQaasVr53ApUBrtwt8odZ7hXVXguhq6udpUYQVbRnpVJ","score":0}],"leaderboard":[{"nickname":"Z62aa9ssZH8zQaasVr53ApUBrtwt8odZ7hXVXguhq6udpUYQVbRnpVJ","score":0,"finishTime":"2025-01-30T10:29:01.651Z"}]}
    ```
  - **403 Forbidden**: User is not the creator of the exam.
    ```json
    {
      "message": "Only creator can access"
    }
    ```
  - **404 Not Found**: Exam not found.
    ```json
    {
      "message": "Exam not found"
    }
    ```
  - **500 Internal Server Error**: Server encountered an unexpected error.
    ```json
    {
      "message": "Internal server error"
    }
    ```

---


### 6. Start Exam
**POST** `/startExam`

- **Description**: Starts an exam for the authenticated user. Private exams require a valid passcode for participation.
- **Headers**:
  - `Session-Token` (Bearer Token, required): User authentication token.
- **Body**:
  - `examId` (string, required): ID of the exam.
  - `passcode` (string, optional): Passcode for private exams.
  - `nickname` (string, optional): Nickname for the exam.
- **Middleware**:
  - `ensureAuthenticated`: Ensures the user is logged in.
  - `validateRequest`: Validates the request body.
- **Response**:
  - **200 OK**: Exam started successfully.
    ```json
    {"message":"Exam participation created successfully"}
    ```
  - **400 Bad Request**: Invalid passcode or exam timing.
    ```json
    {
      "message": "Invalid passcode"
    }
    ```
    ```json
    {
      "message": "Exam timing is invalid"
      ...
    }
    ```
  - **404 Not Found**: Exam not found.
    ```json
    {
      "message": "Exam not found"
    }
    ```
  - **500 Internal Server Error**: Server encountered an unexpected error.
    ```json
    {
      "message": "Internal server error"
    }
    ```

---

### 7. Finish Exam
**POST** `/finishExam`

- **Description**: Submits the user's answers and marks the exam as completed. Calculates the user's score and updates their participation status.
- **Headers**:
  - `Session-Token` (Bearer Token, required): User authentication token.
- **Body**:
  - `examId` (string, required): ID of the exam.
  - `answers` (array, required): User's answers to the exam questions.
    ```json
    [
      {
        "questionId": "questionId1",
        "answer": 1
      },
      {
        "questionId": "questionId2",
        "answer": 2
      }
    ]
    ```
- **Middleware**:
  - `ensureAuthenticated`: Ensures the user is logged in.
  - `validateRequest`: Validates the request body.
- **Response**:
  - **200 OK**: Exam finished successfully.
    ```json
    {"message":"Exam completed successfully"}
    ```
  - **400 Bad Request**: Missing or invalid answers.
    ```json
    {
      "message": "Invalid answers"
    }
    ```
  - **404 Not Found**: Exam or participation not found.
    ```json
    {
      "message": "Exam or participation not found"
    }
    ```
  - **500 Internal Server Error**: Server encountered an unexpected error.
    ```json
    {
      "message": "Error finishing exam and submitting answers"
    }
    ```

## Draft Endpoints `/drafts`

## 1. Create Draft
**POST** `/`

- **Description**: Creates a new draft for the authenticated user.
- **Headers**:
  - `Session-Token` (Bearer Token, required): User authentication token.
- **Body**:
  - `title` (string, required): Title of the draft.
  - `description` (string, optional): Description of the draft.
  - `startDate` (string, optional): Starting date of the draft (ISO format).
  - `duration` (number, optional): Duration of the draft in minutes.
  - `questionCount` (number, optional): Number of questions in the draft.
  - `isRewarded` (boolean, optional): Indicates if the draft includes rewards.
  - `rewardPerWinner` (number, optional): Reward amount per winner (required if `isRewarded` is true).
  - `passingScore` (number, optional): Minimum score required to win (required if `isRewarded` is true).
  - `questions` (array, optional): List of questions with options and correct answers.
- **Middleware**:
  - `ensureAuthenticated`: Ensures the user is logged in.
  - `validateRequest`: Validates the request body.
- **Response**:
  - **201 Created**: Draft successfully created.
    ```json
    {
      "id": "draftId",
      "title": "Example Draft",
      "creator": "userId",
      "isRewarded": true,
      "questionCount": 10
      ...
    }
    ```
  - **400 Bad Request**: Missing or invalid data.
    ```json
    {
      "message": "Validation error",
      "errors": ["Title must be at least 3 characters"]
    }
    ```
  - **401 Unauthorized**: User is not authenticated.
    ```json
    {
      "message": "Unauthorized"
    }
    ```
  - **500 Internal Server Error**: Server encountered an unexpected error.
    ```json
    {
      "message": "Internal server error"
    }
    ```

---

### 2. Get All Drafts
**GET** `/`

- **Description**: Retrieves all drafts created by the authenticated user, with optional pagination and sorting.
- **Headers**:
  - `Session-Token` (Bearer Token, required): User authentication token.
<!-- - **Query Parameters**:
  - `page` (number, optional): Page number for pagination (default: 1).
  - `limit` (number, optional): Number of drafts per page (default: 10).
  - `sort` (string, optional): Sorting order, either `asc` or `desc` (default: `desc`). -->
- **Middleware**:
  - `ensureAuthenticated`: Ensures the user is logged in.
  - `validateRequest`: Validates the query parameters against `draftSchemas.query`.
- **Response**:
  - **200 OK**: Returns a list of drafts.
    ```json
    [
      {
        "id": "draftId1",
        "title": "Draft 1",
        "creator": "userId",
        "updatedAt": "2023-12-01T10:00:00Z"
        ...
      },
      {
        "id": "draftId2",
        "title": "Draft 2",
        "creator": "userId",
        "updatedAt": "2023-12-01T12:00:00Z"
        ...
      }
    ]
    ```
  - **401 Unauthorized**: User is not authenticated.
    ```json
    {
      "message": "Unauthorized"
    }
    ```
  - **500 Internal Server Error**: Server encountered an unexpected error.
    ```json
    {
      "message": "Internal server error"
    }
    ```

---

### 3. Get Draft by ID
**GET** `/:id`

- **Description**: Retrieves a specific draft by its ID.
- **Headers**:
  - `Session-Token` (Bearer Token, required): User authentication token.
- **Parameters**:
  - `id` (string, required): ID of the draft.
- **Middleware**:
  - `ensureAuthenticated`: Ensures the user is logged in.
  - `validateRequest`: Validates the request parameters.
- **Response**:
  - **200 OK**: Returns the draft details.
    ```json
    {
      "id": "draftId",
      "title": "Example Draft",
      "creator": "userId",
      "isRewarded": false,
      "questions": []
    }
    ```
  - **401 Unauthorized**: User is not authenticated.
    ```json
    {
      "message": "Unauthorized"
    }
    ```
  - **403 Forbidden**: User does not have access to the requested draft.
    ```json
    {
      "message": "Forbidden"
    }
    ```
  - **404 Not Found**: Draft not found.
    ```json
    {
      "message": "Draft not found"
    }
    ```
  - **500 Internal Server Error**: Server encountered an unexpected error.
    ```json
    {
      "message": "Internal server error"
    }
    ```

---

### 4. Update Draft
**PUT** `/:id`

- **Description**: Updates an existing draft by its ID.
- **Headers**:
  - `Session-Token` (Bearer Token, required): User authentication token.
- **Parameters**:
  - `id` (string, required): ID of the draft.
- **Body**:
  - Partial update of draft fields (e.g., `title`, `description`, `questions`).
- **Middleware**:
  - `ensureAuthenticated`: Ensures the user is logged in.
  - `validateRequest`: Validates the request parameters and body.
- **Response**:
  - **200 OK**: Draft updated successfully.
    ```json
    {
      "id": "draftId",
      "title": "Updated Draft",
      "creator": "userId"
      ...
    }
    ```
  - **400 Bad Request**: Invalid update data.
    ```json
    {
      "message": "Validation error",
      "errors": ["Title must be at least 3 characters"]
    }
    ```
  - **401 Unauthorized**: User is not authenticated.
    ```json
    {
      "message": "Unauthorized"
    }
    ```
  - **403 Forbidden**: User does not have permission to update the draft.
    ```json
    {
      "message": "Forbidden"
    }
    ```
  - **404 Not Found**: Draft not found.
    ```json
    {
      "message": "Draft not found"
    }
    ```
  - **500 Internal Server Error**: Server encountered an unexpected error.
    ```json
    {
      "message": "Internal server error"
    }
    ```

---

### 5. Delete Draft
**DELETE** `/:id`

- **Description**: Deletes a specific draft by its ID.
- **Headers**:
  - `Session-Token` (Bearer Token, required): User authentication token.
- **Parameters**:
  - `id` (string, required): ID of the draft.
- **Middleware**:
  - `ensureAuthenticated`: Ensures the user is logged in.
  - `validateRequest`: Validates the request parameters.
- **Response**:
  - **200 OK**: Draft deleted successfully.
    ```json
    {
      "message": "Draft deleted successfully"
    }
    ```
  - **401 Unauthorized**: User is not authenticated.
    ```json
    {
      "message": "Unauthorized"
    }
    ```
  - **403 Forbidden**: User does not have permission to delete the draft.
    ```json
    {
      "message": "Forbidden"
    }
    ```
  - **404 Not Found**: Draft not found.
    ```json
    {
      "message": "Draft not found"
    }
    ```
  - **500 Internal Server Error**: Server encountered an unexpected error.
    ```json
    {
      "message": "Internal server error"
    }
    ```

## Question Endpoints `/questions`

### 1. Get Question by ID
**GET** `/question/:questionId`

- **Description**: Retrieves details of a specific question by its ID. This endpoint is restricted to admin users.
- **Headers**:
  - `Session-Token` (Bearer Token, required): Admin authentication token.
- **Parameters**:
  - `questionId` (string, required): The ID of the question to retrieve.
- **Middleware**:
  - `ensureAuthenticated`: Ensures the user is logged in.
  - `ensureAdmin`: Ensures the user has admin privileges.
  - `validateRequest`: Validates the `questionId` parameter.
- **Response**:
  - **200 OK**: Question successfully retrieved.
    ```json
    {
      "id": "questionId",
      "text": "What is the capital of France?",
      "options": [
        { "number": 1, "text": "Paris" },
        { "number": 2, "text": "Berlin" },
        { "number": 3, "text": "Madrid" }
      ],
      "exam": "examId"
    }
    ```
  - **401 Unauthorized**: User is not authenticated.
    ```json
    {
      "message": "Unauthorized"
    }
    ```
  - **403 Forbidden**: User is not an admin.
    ```json
    {
      "message": "Admin access required"
    }
    ```
  - **404 Not Found**: Question not found.
    ```json
    {
      "message": "Question not found"
    }
    ```
  - **500 Internal Server Error**: Server encountered an unexpected error.
    ```json
    {
      "message": "Internal server error"
    }
    ```

---

### 2. Get Questions by Exam
**GET** `/:examId`

- **Description**: Retrieves all questions for a specific exam, ensuring the user has proper participation and the exam is active or upcoming.
- **Headers**:
  - `Session-Token` (Bearer Token, required): User authentication token.
- **Parameters**:
  - `examId` (string, required): The ID of the exam for which questions are retrieved.
- **Middleware**:
  - `ensureAuthenticated`: Ensures the user is logged in.
  - `validateRequest`: Validates the `examId` parameter.
- **Response**:
  - **200 OK**: Questions successfully retrieved.
    ```json
    [{"_id":"679b5278feb5dfd7e868e718","exam":"679b5278feb5dfd7e868e710","text":"Ottwqqoman","options":[{"number":1,"text":"Bayasaaad I","_id":"679b5278feb5dfd7e868e719"},{"number":2,"text":"Mehdsdsmed I","_id":"679b5278feb5dfd7e868e71a"},{"number":3,"text":"Murad II","_id":"679b5278feb5dfd7e868e71b"},{"number":4,"text":"Mehmed II","_id":"679b5278feb5dfd7e868e71c"},{"number":5,"text":"Mehmed III","_id":"679b5278feb5dfd7e868e71d"}],"createdAt":"2025-01-30T10:20:40.909Z","updatedAt":"2025-01-30T10:20:40.909Z","__v":0,"number":1},{"_id":"679b5278feb5dfd7e868e71e","exam":"679b5278feb5dfd7e868e710","text":"Bqqnt![image (4).png](https://coral-dead-toad-141.mypinata.cloud/ipfs/QmPzRYRU5vTPdAqF9NpvNd9RjEs2Bzgqa7Y6mMSKfDkLzq)iwe","options":[{"number":1,"text":"Nsaaikep![image (5).png](https://coral-dead-toad-141.mypinata.cloud/ipfs/QmZpjyb3AWVHDqPoRFG6rG2eGtHyCrFzTjwpTxTHpZojKP)horos sII","_id":"679b5278feb5dfd7e868e71f"},{"number":2,"text":"Alexiod![image (6).png](https://coral-dead-toad-141.mypinata.cloud/ipfs/QmXTnxapRXY2W23y9Qy7mhAwFuN1zrSvEZTbtDZT9y3vby)saas Is","_id":"679b5278feb5dfd7e868e720"},{"number":3,"text":"John IIs","_id":"679b5278feb5dfd7e868e721"},{"number":4,"text":"Manuel Is","_id":"679b5278feb5dfd7e868e722"},{"number":5,"text":"Manuel IIss","_id":"679b5278feb5dfd7e868e723"}],"createdAt":"2025-01-30T10:20:40.909Z","updatedAt":"2025-01-30T10:20:40.909Z","__v":0,"number":2},{"_id":"679b5278feb5dfd7e868e712","exam":"679b5278feb5dfd7e868e710","text":"Bqqnt![image (1).png](https://coral-dead-toad-141.mypinata.cloud/ipfs/QmW1EmgxzNe9PcsAZcqYUKaXdpMuosApNY1rYgiMWahWb4)iwe","options":[{"number":1,"text":"Nsaaikep![image (2).png](https://coral-dead-toad-141.mypinata.cloud/ipfs/QmXjY5A8m6gQ1NvFYR7y2HLdxYcpqABKfkhcPz45QrXyNp)horos sII","_id":"679b5278feb5dfd7e868e713"},{"number":2,"text":"Alexiod![image (3).png](https://coral-dead-toad-141.mypinata.cloud/ipfs/QmZT7xbLM8nF5sFnR5HfT1PTLJULrVUVzgQ9skxJKMkRbs)saas Is","_id":"679b5278feb5dfd7e868e714"},{"number":3,"text":"John IIs","_id":"679b5278feb5dfd7e868e715"},{"number":4,"text":"Manuel Is","_id":"679b5278feb5dfd7e868e716"},{"number":5,"text":"Manuel IIss","_id":"679b5278feb5dfd7e868e717"}],"createdAt":"2025-01-30T10:20:40.908Z","updatedAt":"2025-01-30T10:20:40.908Z","__v":0,"number":3}]
    ```
  - **400 Bad Request**: Exam is not active or timing is invalid.
    ```json
    {
      "message": "Exam timing is invalid"
      ...
    }
    ```
  - **401 Unauthorized**: User is not authenticated.
    ```json
    {
      "message": "Unauthorized"
    }
    ```
  - **404 Not Found**: Exam not found.
    ```json
    {
      "message": "Exam not found"
    }
    ```
  - **500 Internal Server Error**: Server encountered an unexpected error.
    ```json
    {
      "message": "Internal server error"
    }
    ```



## Answer Endpoints `/answers`

### 1. Get My Answers
**GET** `/myAnswers`

- **Description**: Retrieves the authenticated user's answers for a specific exam.
- **Headers**:
  - `Session-Token` (Bearer Token, required): User authentication token.
- **Body**:
  - `examId` (string, required): The ID of the exam.
- **Middleware**:
  - `ensureAuthenticated`: Ensures the user is logged in.
  - `validateRequest`: Validates the request body.
- **Response**:
  - **200 OK**: Answers successfully retrieved.
    ```json
    {
      "id": "answerId",
      "user": "userId",
      "exam": "examId",
      "answers": [
        {
          "questionId": "questionId1",
          "answer": 1
        },
        {
          "questionId": "questionId2",
          "answer": 2
        }
      ]
    }
    ```
  - **401 Unauthorized**: User is not authenticated.
    ```json
    {
      "message": "Unauthorized"
    }
    ```
  - **404 Not Found**: Answers not found for the specified exam.
    ```json
    {
      "message": "Answers not found"
    }
    ```
  - **500 Internal Server Error**: Server encountered an unexpected error.
    ```json
    {
      "message": "Internal server error"
    }
    ```

---

### 2. Get Answer by ID
**GET** `/answer/:answerId`

- **Description**: Retrieves a specific answer by its ID. This endpoint is restricted to admin users.
- **Headers**:
  - `Session-Token` (Bearer Token, required): Admin authentication token.
- **Parameters**:
  - `answerId` (string, required): The ID of the answer to retrieve.
- **Middleware**:
  - `ensureAuthenticated`: Ensures the user is logged in.
  - `ensureAdmin`: Ensures the user has admin privileges.
  - `validateRequest`: Validates the `answerId` parameter.
- **Response**:
  - **200 OK**: Answer successfully retrieved.
    ```json
    {
      "id": "answerId",
      "user": {
        "id": "userId",
        "username": "exampleUser",
        "walletAddress": "0x..."
      },
      "exam": {
        "id": "examId",
        "title": "Example Exam"
      },
      "answers": [
        {
          "questionId": "questionId1",
          "answer": 1
        },
        {
          "questionId": "questionId2",
          "answer": 3
        }
      ]
    }
    ```
  - **401 Unauthorized**: User is not authenticated.
    ```json
    {
      "message": "Unauthorized"
    }
    ```
  - **403 Forbidden**: User is not an admin.
    ```json
    {
      "message": "Admin access required"
    }
    ```
  - **404 Not Found**: Answer not found for the specified ID.
    ```json
    {
      "message": "Answer not found"
    }
    ```
  - **500 Internal Server Error**: Server encountered an unexpected error.
    ```json
    {
      "message": "Internal server error"
    }
    ```


## Score Endpoints `/scores`

### 1. Get All Scores
**GET** `/allScores`

- **Description**: Retrieves a list of all scores across all exams. This endpoint is restricted to admin users.
- **Headers**:
  - `Session-Token` (Bearer Token, required): Admin authentication token.
- **Middleware**:
  - `ensureAuthenticated`: Ensures the user is logged in.
  - `ensureAdmin`: Ensures the user has admin privileges.
- **Response**:
  - **200 OK**: Scores successfully retrieved.
    ```json
    [
      {
        "id": "scoreId",
        "user": {
          "id": "userId",
          "username": "exampleUser",
          "walletAddress": "0x..."
        },
        "exam": {
          "id": "examId",
          "title": "Example Exam"
        },
        "score": 85,
        "totalQuestions": 10,
        "correctAnswers": 8
      },
      {
        "id": "scoreId2",
        "user": {
          "id": "userId2",
          "username": "userTwo",
          "walletAddress": "0x..."
        },
        "exam": {
          "id": "examId2",
          "title": "Another Exam"
        },
        "score": 90,
        "totalQuestions": 10,
        "correctAnswers": 9
      }
    ]
    ```
  - **401 Unauthorized**: User is not authenticated.
    ```json
    {
      "message": "Unauthorized"
    }
    ```
  - **403 Forbidden**: User does not have admin privileges.
    ```json
    {
      "message": "Admin access required"
    }
    ```
  - **404 Not Found**: No scores found.
    ```json
    {
      "message": "Scores not found"
    }
    ```
  - **500 Internal Server Error**: Server encountered an unexpected error.
    ```json
    {
      "message": "Internal server error"
    }
    ```

---

### 2. Get Scores by Exam ID
**GET** `/:examId`

- **Description**: Retrieves scores for a specific exam based on the exam ID.
- **Headers**:
  - `Session-Token` (Bearer Token, required): User authentication token.
- **Parameters**:
  - `examId` (string, required): The ID of the exam.
- **Middleware**:
  - `ensureAuthenticated`: Ensures the user is logged in.
  - `validateRequest`: Validates the `examId` parameter.
- **Response**:
  - **200 OK**: Scores successfully retrieved for the exam.
    ```json
    [{"_id":"679b546dfeb5dfd7e868e7fa","user":{"_id":"66fa6bb1c58f93ea0cd0912c","username":"Z62aa9ssZH8zQaasVr53ApUBrtwt8odZ7hXVXguhq6udpUYQVbRnpVJ","walletAddress":"Z62aa9ssZH8zQaasVr53ApUBrtwt8odZ7hXVXguhq6udpUYQVbRnpVJ"},"exam":{"_id":"679b5278feb5dfd7e868e710","title":"Testing Exam"},"score":0,"totalQuestions":3,"correctAnswers":0,"isWinner":false,"createdAt":"2025-01-30T10:29:01.640Z","updatedAt":"2025-01-30T10:29:01.640Z","__v":0}]
    ```
  - **401 Unauthorized**: User is not authenticated.
    ```json
    {
      "message": "Unauthorized"
    }
    ```
  - **404 Not Found**: No scores found for the specified exam.
    ```json
    {
      "message": "Scores not found"
    }
    ```
  - **500 Internal Server Error**: Server encountered an unexpected error.
    ```json
    {
      "message": "Internal server error"
    }
    ```


