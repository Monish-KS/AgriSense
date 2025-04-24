// pages/_app.tsx
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProvider } from "convex/react";
import type { AppProps } from "next/app";

const convex = new ConvexReactClient("https://your-convex-instance.convex.cloud");

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ClerkProvider>
      <ConvexProvider client={convex}>
        <Component {...pageProps} />
      </ConvexProvider>
    </ClerkProvider>
  );
}

export default MyApp;
