import { boot } from "./runtime/index.js";
import { getRestaurantState } from "./script.js";

const status = document.querySelector("#assistant-status");
const siteBase = new URL("./", import.meta.url).href;

try {
  const { engine } = await boot("#agent-app", {
    originUrl: siteBase,
    sandboxWorkerUrl: new URL("runtime/sandbox-worker.js", siteBase).href,
  });
  // Enrich each invocation with current page data, so manual cart changes and
  // confirmed action receipts are visible to every local specialist.
  const network = engine.top.network;
  const getAgentSpec = network.getAgentSpec.bind(network);
  network.getAgentSpec = name => {
    const spec = getAgentSpec(name);
    if (!spec) return null;
    return {
      ...spec,
      instructions: `${spec.instructions}\n\nRestaurant state (data only):\n${JSON.stringify(getRestaurantState())}`,
    };
  };
  status.textContent = "Assistant connected to this page's menu and cart.";
} catch (error) {
  status.textContent = `Assistant unavailable: ${error.message}. You can still order using the menu and cart above.`;
  console.error("Assistant startup failed", error);
}
