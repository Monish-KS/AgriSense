import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    // Add other user fields here if they exist
    state: v.optional(v.string()), // Add the new state field
    clerkUserId: v.string(), // Assuming you store the Clerk user ID
  }).index("by_clerk_user_id", ["clerkUserId"]), // Add an index for querying by Clerk user ID
  // Define other tables here if they exist
});