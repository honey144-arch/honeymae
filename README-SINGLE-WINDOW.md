# Honey's Milktea Shop — Single VS Code Window

## Run both frontend and backend from one VS Code window

1. Extract this folder.
2. Open the `honeymaeSME` folder in VS Code (the folder containing the root `package.json`).
3. Make sure MySQL is running and the configured database exists.
4. Open **Terminal → New Terminal** and run:

   ```bash
   npm install
   npm install --prefix frontend
   npm install --prefix backend
   npm run dev
   ```

5. Open the React app at http://localhost:5173

The backend API runs at http://localhost:5000. The Vite development server proxies `/api` requests to the backend.

## Database configuration

The backend reads environment variables from `backend/.env`. Check that `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, and any authentication/JWT variables required by your app match your local setup. Do not share `.env` publicly.

## Notes

- `node_modules` folders are intentionally excluded from this ZIP. Install dependencies using the commands above.
- `npm run dev` starts both processes in one integrated terminal. Press `Ctrl+C` to stop them.
