## Changes with the Commit
### General
- Role based users (admins/users) and admin workflow were created.
### App.js
- Admin initialization functionality was added. 
  - (Q1: Is Admin initialization at the beginning a good way to create a default admin for the app?)
  - (Q2: Is this a right approach for an async function in sync app.js?)
### Routes
- `ensureAdminAccess` middleware was added to related routes in **answer.route.js**, **user.route.js**, **question.route.js** and **score.route.js** files.
- `createAdmin` route was created in **user.route.js** file. It is accessible by only admins and used for creating a new admin.
### Controllers
- `createAdmin` function was created in **user.controler.js** file. It creates a new user who has admin role or promotes an existing user to admin regarding to user existence. Its functionality is seperated from user registration path. 
  - (Q: Should admin creation path be merged with normal user creation path?)
### Services
- In **user.service.js** file, a "role" input and parameter were added to `create` function due to a new admin creation.
- In `findAndLogin` function, most recent user with a specific wallet address is used for setting the session. "user[0]" was changed with "user[user.length - 1]". 
  - (Q: Why did we use the first one? Is the last one better to use?)
- `createOrPromote`, `prompteToAdmin` and `createAdmin` functions were created. According to existence of new admin wallet as a user, `createOrPromote` function calls `prompteToAdmin` or `createAdmin`.
### Models
- "role" variable was added as an enum which has two type (user and admin).
### Middlewares
- `ensureAdminAccess` function was created.
### Helpers
- **initializers.js** file was created. `initializeAdmin` function was created. It creates and saves a new admin if there is no admin at the beginning of the app. It takes some arbitrary env variables to create the admin of the app. This function is called by **app.js** file.
- "role" variable was added to `setSessionUser` function in **sesionHelper.js** file.
