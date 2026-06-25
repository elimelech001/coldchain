import { MemoryRouter } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage.jsx";

export { FRIDGES } from "./data/seed.js";

export default function ColdChainDashboard() {
  return (
    <MemoryRouter initialEntries={["/"]}>
      <DashboardPage />
    </MemoryRouter>
  );
}
