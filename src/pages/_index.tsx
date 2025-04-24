// pages/index.tsx
import { useUser, SignOutButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

export default function Home() {
  const { user, isSignedIn } = useUser();
  const message = useQuery(api.messages.getMessage);

  if (!isSignedIn) return <div>Please sign in first.</div>;

  return (
    <div className="p-6 text-white bg-black h-screen">
      <h1 className="text-2xl mb-4">Welcome, {user.firstName}!</h1>
      <p className="mb-2">Message from backend: {message}</p>
      <SignOutButton />
    </div>
  );
}
