import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ClerkProvider } from "@clerk/clerk-react";

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;

if (!publishableKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in environment variables.");
}

createRoot(document.getElementById("root")!).render(
  <ClerkProvider publishableKey={publishableKey} afterSignInUrl="/dashboard" afterSignUpUrl="/dashboard">
    <App />
  </ClerkProvider>
);
