import { getRestaurantState, setCart, submitOrder, menu } from "./script.js";

// The generated runtime loads this module via agent-manifest.json.
// Arguments are validated for both model-callable cart tools and reviewed checkout.
export function registerActions(actions) {
  actions.register({
    name: "add_to_cart",
    description: "Add a quantity of a menu item to the visible shared cart immediately, keeping all existing items. Returns the updated cart and total. Does not place an order.",
    effect: "write",
    inputSchema: {
      type: "object", additionalProperties: false, required: ["id", "quantity"],
      properties: {
        id: { type: "string", enum: menu.map(item => item.id) },
        quantity: { type: "integer", minimum: 1, maximum: 100 },
      },
    },
    execute: ({ id, quantity }) => {
      const items = getRestaurantState().cart;
      const existing = items.find(item => item.id === id);
      if (existing) existing.quantity += quantity;
      else items.push({ id, quantity });
      return setCart(items);
    },
  });
  actions.register({
    name: "get_restaurant_state",
    description: "Read the actual menu, shared cart, total, cartVersion and latest simulated order on this page.",
    effect: "read",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    execute: () => getRestaurantState(),
  });
  actions.register({
    name: "set_cart",
    description: "Replace the shared restaurant cart with the full desired list. Include existing items to keep them. Empty items clears the cart. This does not place an order.",
    effect: "write",
    inputSchema: {
      type: "object", additionalProperties: false, required: ["items"],
      properties: {
        items: {
          type: "array", maxItems: menu.length,
          items: {
            type: "object", additionalProperties: false, required: ["id", "quantity"],
            properties: {
              id: { type: "string", enum: menu.map(item => item.id) },
              quantity: { type: "integer", minimum: 1, maximum: 100 },
            },
          },
        },
      },
    },
    execute: ({ items }) => setCart(items),
  });
  actions.register({
    name: "checkout_demo_order",
    description: "Place a simulated order for the reviewed current cart. No payment or real fulfillment. Use current cartVersion as expectedCartVersion; a changed cart is rejected. Delivery requires an address. Returns an actual local demo receipt and clears the cart.",
    effect: "irreversible",
    inputSchema: {
      type: "object", additionalProperties: false,
      required: ["customerName", "fulfillment", "expectedCartVersion"],
      properties: {
        customerName: { type: "string", minLength: 1, maxLength: 80 },
        fulfillment: { type: "string", enum: ["pickup", "delivery"] },
        address: { type: "string", maxLength: 300 },
        orderTime: { type: "string", maxLength: 5, description: "HH:MM today, or empty for ASAP" },
        expectedCartVersion: { type: "integer", minimum: 0 },
      },
    },
    execute: args => submitOrder(args),
  });
}
