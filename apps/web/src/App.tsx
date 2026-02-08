import { usePingQuery } from "@repo/api-client";
import "./App.css";

function App() {
  const { data, isLoading, error } = usePingQuery();

  return (
    <div style={{ padding: 32, fontFamily: "system-ui, sans-serif" }}>
      <h1>geoWorks Web</h1>
      <h2>Supabase Ping Test</h2>

      {isLoading && <p>Pinging Supabase...</p>}
      {error && <p style={{ color: "red" }}>Error: {error.message}</p>}
      {data && (
        <pre
          style={{
            textAlign: "left",
            background: "#f4f4f4",
            padding: 16,
            borderRadius: 8,
            overflow: "auto",
          }}
        >
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default App;
