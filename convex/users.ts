import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Mutation to update the user's state
export const updateState = mutation({
  args: {
    state: v.string(),
  },
  handler: async (ctx, args) => {
    // Assuming you have a way to identify the current user, e.g., via auth
    // This is a placeholder. You'll need to replace this with actual user identification logic.
    const userId = await ctx.auth.getUserIdentity();
    if (!userId || !userId.clerk) { // Add check for userId.clerk
      throw new Error("Not authenticated");
    }

    // Find the user document (assuming users table exists and has an index on clerk user ID)
    // You might need to adjust this based on how your users are stored and indexed.
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkUserId"), (userId.clerk as any).id as string)) // Example filter, adjust as needed, cast to string
      .first();

    let userDoc = user;
    if (!userDoc) {
      // User not found, create a new user document
      userDoc = await ctx.db.insert("users", {
        clerkUserId: userId.clerk.id as string,
        state: args.state, // Set initial state from args
      });
    } else {
      // User found, update the existing user's state
      await ctx.db.patch(userDoc._id, { state: args.state });
    }

    // Update the user's state
  },
});

// Query to get the user's state
export const getState = query({
  handler: async (ctx) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId || !userId.clerk) { // Add check for userId.clerk
      return null; // Or throw an error, depending on desired behavior
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkUserId"), (userId.clerk as any).id as string)) // Example filter, adjust as needed, cast to string
      .first();

    return user?.state || null; // Return the state or null if not set
  },
});