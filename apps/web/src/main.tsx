import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { initApi, createQueryClient } from "@repo/api-client";
import "./index.css";
import App from "./App.tsx";

// ---------------------------------------------------------------------------
// Initialise shared packages with Vite env vars
// ---------------------------------------------------------------------------
initApi({
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
});

const queryClient = createQueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);
