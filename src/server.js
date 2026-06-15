import dotenv from "dotenv";
import { createApp } from "./app.js";
import { connectDatabase } from "./config/db.js";

dotenv.config();

const port = process.env.PORT || 3000;

await connectDatabase(process.env.MONGODB_URI);

createApp().listen(port, () => {
  console.log(`Three-way match engine listening on port ${port}`);
});
