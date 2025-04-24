// AgriSense/convex/messages.ts
import { query } from "./_generated/server";

export const getMessage = query(async () => {
  return "Hello from your local Convex!";
});
