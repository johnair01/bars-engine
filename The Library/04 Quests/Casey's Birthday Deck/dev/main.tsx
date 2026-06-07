import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import OracleDeck from "../routes/oracle.tsx";
import ValkyriePartyAltar from "../routes/valkyrie-party-altar.tsx";
import ValkyrieParty from "../routes/valkyrie-party.tsx";

const path = window.location.pathname.replace(/\/+$/, "");
const App = path === "/valkyrie-party/altar" || path === "/party/valkyrie/altar"
  ? ValkyriePartyAltar
  : path === "/valkyrie-party" || path === "/party/valkyrie"
    ? ValkyrieParty
    : OracleDeck;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
