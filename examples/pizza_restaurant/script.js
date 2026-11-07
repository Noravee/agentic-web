// Prices are integer cents. This is the menu data to ground an agent in.
const menu = [
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

function placeOrder(event) {
  event.preventDefault();
  if (!cart.size) return;
  const name = form.elements.customerName;
  name.setCustomValidity(name.value.trim() ? "" : "Please enter your name.");
  address.setCustomValidity(fulfillment.value === "delivery" && !address.value.trim()
    ? "Please enter a delivery address." : "");
  if (!form.reportValidity()) return;

  const orderId = `DEMO-${Date.now()}`;
  const when = form.elements.orderTime.value || "as soon as possible";
  const destination = fulfillment.value === "delivery"
    ? `Delivery to ${address.value.trim()}` : "Pickup at Little Oven Pizza";
  document.querySelector("#order-summary").textContent =
    `${name.value.trim()}, your order ${orderId} is received. ${destination}, ${when}.`;
  const items = Array.from(cart, ([id, quantity]) => {
    const item = menu.find((item) => item.id === id);
    return element("li", `${quantity} × ${item.name} — ${money(item.price * quantity)}`);
  });
  document.querySelector("#order-items").replaceChildren(...items);
  document.querySelector("#order-total").textContent = `Total: ${money(cartTotal())}`;
  cart.clear();
  renderCart();
  form.reset();
  updateFulfillment();
  const confirmation = document.querySelector("#confirmation");
  confirmation.hidden = false;
  confirmation.focus();
}

form.addEventListener("input", (event) => event.target.setCustomValidity(""));
fulfillment.addEventListener("change", updateFulfillment);
form.addEventListener("submit", placeOrder);
renderMenu();
renderCart();
updateFulfillment();
