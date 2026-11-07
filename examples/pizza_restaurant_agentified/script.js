// Prices are integer cents. This is the menu data to ground an agent in.
export const menu = [
  { id: "margherita", name: "Margherita", price: 1200,
    ingredients: "Tomato sauce, mozzarella, fresh basil, olive oil",
    dietary: "Vegetarian", allergens: "Wheat, milk" },
  { id: "pepperoni", name: "Pepperoni", price: 1400,
    ingredients: "Tomato sauce, mozzarella, pepperoni",
    dietary: "Contains meat", allergens: "Wheat, milk" },
  { id: "garden", name: "Garden Veggie", price: 1350,
    ingredients: "Tomato sauce, mozzarella, mushrooms, bell peppers, red onion",
    dietary: "Vegetarian", allergens: "Wheat, milk" },
  { id: "vegan", name: "Roasted Veg", price: 1300,
    ingredients: "Tomato sauce, zucchini, bell peppers, mushrooms, olives, olive oil (no cheese)",
    dietary: "Vegan · Made without dairy", allergens: "Wheat" },
];

// In-memory state intentionally keeps this example independent of a backend.
const cart = new Map();
let cartVersion = 0;
let lastOrder = null;
const money = (cents) => new Intl.NumberFormat("en-US", {
  style: "currency", currency: "USD",
}).format(cents / 100);
const form = document.querySelector("#checkout-form");
const fulfillment = document.querySelector("#fulfillment");
const address = document.querySelector("#address");

// Use textContent for data, including customer input in the confirmation.
function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function button(text, label, action) {
  const node = element("button", text);
  node.type = "button";
  node.setAttribute("aria-label", label);
  node.addEventListener("click", action);
  return node;
}

function renderMenu() {
  for (const item of menu) {
    const article = element("article", undefined, "menu-item");
    const heading = element("div", undefined, "item-heading");
    heading.append(element("h3", item.name), element("strong", money(item.price)));
    const actions = element("div", undefined, "item-actions");
    actions.append(element("span", item.dietary, "dietary"),
      button("Add to cart", `Add ${item.name} to cart`, () => changeQuantity(item.id, 1)));
    article.append(heading, element("p", item.ingredients),
      element("p", `Allergens: ${item.allergens}.`, "demo-note"), actions);
    document.querySelector("#menu-items").append(article);
  }
}

function cartTotal() {
  return menu.reduce((total, item) => total + item.price * (cart.get(item.id) || 0), 0);
}

function changeQuantity(id, change) {
  const item = menu.find((item) => item.id === id);
  if (!item) throw new Error("Unknown menu item");
  const quantity = Math.max(0, (cart.get(id) || 0) + change);
  cartVersion++;
  if (quantity) cart.set(id, quantity);
  else cart.delete(id);
  renderCart();
  document.querySelector("#cart-status").textContent =
    `${item.name}: ${quantity} in cart. Total ${money(cartTotal())}.`;
}

function renderCart() {
  const list = document.querySelector("#cart-items");
  // Restore keyboard focus when the quantity controls are rebuilt.
  const focusedLabel = list.contains(document.activeElement)
    ? document.activeElement.getAttribute("aria-label") : null;
  list.replaceChildren();
  for (const [id, quantity] of cart) {
    const item = menu.find((item) => item.id === id);
    const row = element("li");
    const line = element("div", undefined, "cart-line");
    line.append(element("strong", item.name), element("span", money(item.price * quantity)));
    const controls = element("div", undefined, "quantity-controls");
    const remove = button("Remove", `Remove ${item.name}`, () => changeQuantity(id, -quantity));
    remove.className = "remove";
    controls.append(button("−", `Decrease ${item.name} quantity`, () => changeQuantity(id, -1)),
      element("span", String(quantity)),
      button("+", `Increase ${item.name} quantity`, () => changeQuantity(id, 1)), remove);
    row.append(line, controls);
    list.append(row);
  }
  document.querySelector("#empty-cart").hidden = cart.size > 0;
  document.querySelector("#cart-total").textContent = money(cartTotal());
  document.querySelector("#place-order").disabled = cart.size === 0;
  if (focusedLabel) {
    const nextFocus = Array.from(list.querySelectorAll("button"))
      .find((node) => node.getAttribute("aria-label") === focusedLabel);
    (nextFocus || document.querySelector("#customer-name")).focus();
  }
}

function updateFulfillment() {
  const delivery = fulfillment.value === "delivery";
  document.querySelector("#delivery-fields").hidden = !delivery;
  address.disabled = !delivery;
  address.required = delivery;
}

export function getRestaurantState() {
  return {
    menu: menu.map(item => ({ ...item })),
    currency: "USD", pizzaSize: "12 inches", sharedKitchen: true,
    deliveryFee: 0, tax: 0, simulated: true,
    cart: Array.from(cart, ([id, quantity]) => ({ id, quantity })),
    total: cartTotal(), cartVersion,
    lastOrder: lastOrder ? structuredClone(lastOrder) : null,
  };
}

// Validate the entire proposed cart before changing shared page state.
export function setCart(items) {
  if (!Array.isArray(items) || items.length > menu.length) throw new Error("Invalid cart.");
  const ids = new Set();
  for (const { id, quantity } of items) {
    if (!menu.some(item => item.id === id) || ids.has(id)
      || !Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
      throw new Error("Use unique menu IDs and quantities from 1 to 100.");
    }
    ids.add(id);
  }
  cart.clear();
  for (const { id, quantity } of items) cart.set(id, quantity);
  cartVersion++;
  renderCart();
  document.querySelector("#cart-status").textContent = `Cart updated. Total ${money(cartTotal())}.`;
  return getRestaurantState();
}

// Both the native form and reviewed assistant actions use this checkout.
export function submitOrder({ customerName, fulfillment: method, address: destinationAddress = "",
  orderTime = "", expectedCartVersion }) {
  if (!cart.size) throw new Error("Your cart is empty.");
  if (expectedCartVersion !== cartVersion) throw new Error("Your cart changed. Review it again before ordering.");
  if (typeof customerName !== "string" || !customerName.trim() || customerName.length > 80) {
    throw new Error("Please enter your name (up to 80 characters).");
  }
  if (!["pickup", "delivery"].includes(method)) throw new Error("Choose pickup or delivery.");
  if (typeof destinationAddress !== "string" || destinationAddress.length > 300
    || (method === "delivery" && !destinationAddress.trim())) throw new Error("Please enter a delivery address.");
  if (typeof orderTime !== "string" || (orderTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(orderTime))) {
    throw new Error("Use HH:MM for today's requested time, or leave it blank for ASAP.");
  }
  lastOrder = {
    orderId: `DEMO-${crypto.randomUUID()}`, status: "received", simulated: true,
    customerName: customerName.trim(), fulfillment: method,
    address: method === "delivery" ? destinationAddress.trim() : "",
    orderTime, items: Array.from(cart, ([id, quantity]) => {
      const item = menu.find(item => item.id === id);
      return { id, name: item.name, quantity, unitPrice: item.price };
    }), total: cartTotal(), currency: "USD",
  };
  const when = orderTime || "as soon as possible";
  const destination = method === "delivery"
    ? `Delivery to ${lastOrder.address}` : "Pickup at Little Oven Pizza";
  document.querySelector("#order-summary").textContent =
    `${lastOrder.customerName}, your order ${lastOrder.orderId} is received. ${destination}, ${when}.`;
  const items = Array.from(cart, ([id, quantity]) => {
    const item = menu.find((item) => item.id === id);
    return element("li", `${quantity} × ${item.name} — ${money(item.price * quantity)}`);
  });
  document.querySelector("#order-items").replaceChildren(...items);
  document.querySelector("#order-total").textContent = `Total: ${money(cartTotal())}`;
  cart.clear();
  cartVersion++;
  renderCart();
  form.reset();
  updateFulfillment();
  const confirmation = document.querySelector("#confirmation");
  confirmation.hidden = false;
  confirmation.focus();
  return structuredClone(lastOrder);
}

function placeOrder(event) {
  event.preventDefault();
  if (!form.reportValidity()) return;
  try {
    submitOrder({
      customerName: form.elements.customerName.value,
      fulfillment: fulfillment.value,
      address: address.value,
      orderTime: form.elements.orderTime.value,
      expectedCartVersion: cartVersion,
    });
    document.querySelector("#checkout-error").textContent = "";
  } catch (error) {
    document.querySelector("#checkout-error").textContent = error.message;
  }
}

form.addEventListener("input", (event) => event.target.setCustomValidity(""));
fulfillment.addEventListener("change", updateFulfillment);
form.addEventListener("submit", placeOrder);
renderMenu();
renderCart();
updateFulfillment();
