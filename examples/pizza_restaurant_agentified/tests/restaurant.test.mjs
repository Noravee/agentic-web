import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { ActionRegistry } from "../runtime/actions.js";
import { AgentNetwork, validateNetwork } from "../runtime/kernel.js";
import { buildToolTable, dispatchToolCall, runAgent } from "../runtime/runner.js";
import { TraceBus } from "../runtime/trace.js";

// Minimal DOM fixture for application integration checks, not a browser emulator.
class Element {
  constructor(tag) {
    this.tag = tag;
    this.children = [];
    this.attrs = {};
    this.handlers = {};
    this.value = "";
    this.disabled = false;
    this.required = false;
    this.validityMessage = "";
  }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children = nodes; }
  setAttribute(key, value) { this.attrs[key] = value; }
  getAttribute(key) { return this.attrs[key]; }
  addEventListener(name, fn) { this.handlers[name] = fn; }
  setCustomValidity(message) { this.validityMessage = message; }
  contains(node) { return this === node || this.children.some(child => child.contains(node)); }
  querySelectorAll(tag) {
    return this.children.flatMap(child => [
      ...(child.tag === tag ? [child] : []), ...child.querySelectorAll(tag),
    ]);
  }
  focus() { document.activeElement = this; }
}

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const nodes = Object.fromEntries([...html.matchAll(/id="([^"]+)"/g)]
  .map(match => [match[1], new Element(match[1])]));
globalThis.document = {
  activeElement: null,
  querySelector: selector => {
    assert(nodes[selector.slice(1)], `Missing element ${selector}`);
    return nodes[selector.slice(1)];
  },
  createElement: tag => new Element(tag),
};
const form = nodes["checkout-form"];
form.elements = { customerName: nodes["customer-name"], orderTime: nodes["order-time"] };
form.reportValidity = () => ![...Object.values(form.elements), nodes.address]
  .some(node => !node.disabled && (node.validityMessage || (node.required && !node.value)));
form.reset = () => {
  for (const node of [...Object.values(form.elements), nodes.address]) node.value = "";
  nodes.fulfillment.value = "pickup";
};
form.reset();
const { getRestaurantState, setCart } = await import("../script.js");
const { registerActions } = await import("../restaurant-actions.js");
const scope = { base: "http://localhost:8080", network: "pizza_restaurant_website_assistant" };
const registry = new ActionRegistry();
registerActions({ register: definition => registry.register(scope, definition) });
const catalog = registry.catalog(scope);
const component = (name, args) => ({
  kind: "action", action: catalog.find(entry => entry.name === name).ref, arguments: args,
});
const execute = (name, args, approve = true) => registry.execute(
  registry.prepare(component(name, args)), async () => approve, "test",
);
const checkout = overrides => ({
  customerName: "Alex", fulfillment: "pickup",
  expectedCartVersion: getRestaurantState().cartVersion, ...overrides,
});

test("copied network resolves all specialists locally", async () => {
  const config = JSON.parse(await readFile(new URL("../pizza_restaurant_website_assistant.network.json", import.meta.url)));
  const network = new AgentNetwork(config, scope.network);
  assert.deepEqual(validateNetwork(network).errors, []);
  assert.equal(network.findFrontMan(), "front_desk_coordinator");
  for (const ref of network.getAgentSpec("front_desk_coordinator").tools) {
    assert(network.getAgentSpec(ref), `Unresolved specialist ${ref}`);
  }
  assert(!JSON.stringify(config).includes("make up a realistic response"));
});

test("real registry and page share cart, validation, review and checkout", async () => {
  assert.equal(nodes["menu-items"].children.length, 4);
  assert.equal(catalog.length, 4);
  assert(catalog.every(action => action.availability === "local-only"));
  assert.equal(nodes["place-order"].disabled, true);

  const items = [{ id: "margherita", quantity: 2 }];
  assert.equal(await execute("set_cart", { items }, false), null);
  assert.equal(getRestaurantState().total, 0, "Declined review must not mutate state");
  assert.throws(() => registry.prepare(component("set_cart", {
    items: [{ id: "unknown", quantity: 1 }],
  })));
  assert.throws(() => registry.prepare(component("set_cart", {
    items: [{ id: "margherita", quantity: -1 }],
  })));
  const [cartReceipt] = await execute("set_cart", { items });
  assert.equal(cartReceipt.status, "succeeded");
  assert.equal(cartReceipt.result.total, 2400);
  assert.equal(nodes["cart-total"].textContent, "$24.00");

  const before = getRestaurantState();
  assert.throws(() => setCart([{ id: "vegan", quantity: 1 }, { id: "vegan", quantity: 2 }]));
  assert.deepEqual(getRestaurantState(), before, "Invalid cart must be atomic");
  const staleCheckout = checkout();
  const increment = nodes["cart-items"].querySelectorAll("button")
    .find(button => button.getAttribute("aria-label") === "Increase Margherita quantity");
  increment.handlers.click();
  assert.equal(getRestaurantState().total, 3600, "Manual controls share the assistant cart");
  const [staleReceipt] = await execute("checkout_demo_order", staleCheckout);
  assert.notEqual(staleReceipt.status, "succeeded");
  assert.match(staleReceipt.error, /cart changed/);
  assert.equal(getRestaurantState().lastOrder, null);

  for (const overrides of [
    { customerName: "   " }, { fulfillment: "delivery", address: " " }, { orderTime: "25:00" },
  ]) {
    const [receipt] = await execute("checkout_demo_order", checkout(overrides));
    assert.notEqual(receipt.status, "succeeded");
    assert.equal(getRestaurantState().total, 3600);
  }
  const order = checkout({ fulfillment: "delivery", address: "123 Main Street", orderTime: "18:00" });
  assert.equal(await execute("checkout_demo_order", order, false), null);
  assert.equal(getRestaurantState().lastOrder, null);
  const [receipt] = await execute("checkout_demo_order", order);
  assert.equal(receipt.status, "succeeded");
  assert.equal(receipt.result.status, "received");
  assert.equal(receipt.result.total, 3600);
  assert.equal(receipt.result.items[0].quantity, 3);
  assert.equal(receipt.result.simulated, true);
  assert.match(nodes["order-summary"].textContent, /Delivery to 123 Main Street, 18:00/);
  assert.equal(nodes["order-total"].textContent, "Total: $36.00");
  assert.equal(nodes.confirmation.hidden, false);
  assert.equal(nodes["place-order"].disabled, true);
  assert.equal(getRestaurantState().total, 0);
  const [replay] = await execute("checkout_demo_order", order);
  assert.notEqual(replay.status, "succeeded", "Old checkout must not create a duplicate order");

  await execute("set_cart", { items: [{ id: "vegan", quantity: 1 }] });
  form.elements.customerName.value = "<img src=x onerror=alert(1)>";
  form.handlers.submit({ preventDefault() {} });
  assert.equal(getRestaurantState().lastOrder.total, 1300);
  assert.equal(getRestaurantState().lastOrder.fulfillment, "pickup");
  assert.equal(getRestaurantState().lastOrder.customerName, "<img src=x onerror=alert(1)>");
  assert.equal(nodes["order-summary"].children.length, 0, "Customer data must remain text");
  const [stateReceipt] = await execute("get_restaurant_state", {});
  assert.equal(stateReceipt.result.lastOrder.orderId, getRestaurantState().lastOrder.orderId);
});

test("model tool calls execute the cart code and return receipts before the answer", async () => {
  setCart([{ id: "vegan", quantity: 1 }]);
  const config = JSON.parse(await readFile(new URL("../pizza_restaurant_website_assistant.network.json", import.meta.url)));
  const manifest = JSON.parse(await readFile(new URL("../agent-manifest.json", import.meta.url)));
  const network = new AgentNetwork(config, scope.network);
  let modelCalls = 0;
  const ctx = {
    network, manifest, actions: registry, baseOrigin: scope.base,
    displayOrigin: "localhost:8080", trace: new TraceBus(),
    isTop: true, frontMan: "front_desk_coordinator", history: [],
    llm: { async chat({ tools, messages }) {
      modelCalls++;
      assert(tools.some(tool => tool.function.name === "website_add_to_cart"));
      assert(!tools.some(tool => tool.function.name === "website_checkout_demo_order"));
      if (modelCalls === 1) return {
        content: "", toolCalls: [{
          id: "add-pizza", type: "function",
          function: { name: "website_add_to_cart", arguments: JSON.stringify({ id: "margherita", quantity: 2 }) },
        }],
      };
      const receipt = JSON.parse(messages.find(message => message.role === "tool").content);
      assert.equal(receipt.status, "succeeded");
      assert.equal(receipt.result.total, 3700);
      assert.equal(nodes["cart-total"].textContent, "$37.00");
      return { content: "Added two Margherita pizzas. Your cart total is $37.00.", toolCalls: [] };
    } },
  };
  const result = await runAgent(ctx, "front_desk_coordinator", "Add two Margherita pizzas", null, []);
  assert.equal(modelCalls, 2);
  assert.match(result.text, /Added two/);
  assert.deepEqual(getRestaurantState().cart, [
    { id: "vegan", quantity: 1 }, { id: "margherita", quantity: 2 },
  ]);

  const { toolByName } = await buildToolTable(ctx, network.getAgentSpec("ordering_checkout_specialist"), [], null);
  const add = toolByName.get("website_add_to_cart");
  assert(add, "Specialists must have access to cart tools too");
  const before = getRestaurantState();
  await assert.rejects(dispatchToolCall(ctx, add, { id: "unknown", quantity: 1 }, null, []));
  assert.deepEqual(getRestaurantState(), before);
  // Even an accidental manifest opt-in cannot bypass checkout review.
  manifest.actions.agentTools.push("checkout_demo_order");
  const table = await buildToolTable(ctx, network.getAgentSpec("front_desk_coordinator"), [], null);
  assert(!table.toolByName.has("website_checkout_demo_order"));
  await assert.rejects(dispatchToolCall(ctx, {
    kind: "website", ref: catalog.find(action => action.name === "checkout_demo_order").ref,
  }, checkout(), null, []));
  assert.deepEqual(getRestaurantState(), before);
});
