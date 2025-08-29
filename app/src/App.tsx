import { useState } from "react";
import Host from "./components/host";
import Client from "./components/client";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function App() {
  const [mode, setMode] = useState<undefined | string>(undefined);
  return (
    <div className="flex gap-2 p-4 bg-slate-50 h-screen items-center justify-center flex-wrap">
      {mode === undefined && (
        <>
          <Card label="Host" onClick={() => setMode("host")} />
          <Card label="Client" onClick={() => setMode("client")} />
        </>
      )}
      {mode && (
        <div className="px-4 h-full w-full flex gap-2 flex-col">
          <div className="flex">
            <div
              onClick={() => setMode(undefined)}
              className="cursor-pointer bg-neutral-50 px-2 py-0.5 rounded border border-amber-400"
            >
              Back
            </div>
          </div>{" "}
          {mode === "host" && <Host />}
          {mode === "client" && <Client />}
        </div>
      )}
    </div>
  );
}

const Card = ({ label, onClick }: { label: string; onClick: () => void }) => {
  return (
    <div
      className="border rounded-lg shadow p-4 bg-orange-600/10 flex flex-col border-slate-900/20 hover:bg-orange-600/30 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div className="min-w-20 text-center min-h-20 flex items-center justify-center">
        <h2>{label}</h2>
        <div></div>
      </div>
    </div>
  );
};
