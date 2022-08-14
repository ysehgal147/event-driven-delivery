const createError = require("http-errors");

const CONSUMER = {
  CREATE_DELIVERY: createDelivery,
  START_DELIVERY: startDelivery,
  PICKUP_PRODUCTS: pickupProducts,
  DELIVER_PRODUCTS: deliverProducts,
  INCREASE_BUDGET: increaseBudget,
};

exports.CONSUMER = CONSUMER;

function createDelivery(state, event) {
  const data = JSON.parse(event.data);
  const result = {
    deliveryId: event.deliveryId,
    budget: Number(data.budget),
    notes: data.notes,
    status: "ready",
  };
  console.log(`Creating Delivery : ${JSON.stringify(result)}`);
  return result;
}

exports.createDelivery = createDelivery;

function startDelivery(state, event) {
  if (state.status != "ready") {
    console.log("Status is set to active, hence delivery has started");
    throw new Error("Delivery has started");
  } else {
    state.status = "active";
    console.log(
      `Starting Delivery : Updating State to ${JSON.stringify(state)}`
    );
    return state;
  }
}

exports.startDelivery = startDelivery;

function pickupProducts(state, event) {
  const data = JSON.parse(event.data);
  const newBudget = state.budget - data.purchasePrice * data.quantity;
  if (newBudget < 0) {
    console.log("Not Enough Budget");
    throw new Error("Not enough budget");
  } else {
    state.budget = newBudget;
    state.purchasePrice = data.purchasePrice;
    state.quantity = data.quantity;
    state.status = "collected";
    console.log(`Pickup Products : Updating State to ${JSON.stringify(state)}`);
    return state;
  }
}

exports.pickupProducts = pickupProducts;

function deliverProducts(state, event) {
  const data = JSON.parse(event.data);
  const newBudget = state.budget + data.sellPrice * data.quantity;
  const newQuantity = state.quantity - data.quantity;
  if (newQuantity < 0) {
    console.log("Not Enough Quantity");
    throw new Error("Not enough quantity");
  } else {
    state.budget = newBudget;
    state.sellPrice = data.sellPrice;
    state.quantity = newQuantity;
    state.status = "completed";
    console.log(
      `Deliver Products : Updating State to ${JSON.stringify(state)}`
    );
    return state;
  }
}

exports.deliverProducts = deliverProducts;

function increaseBudget(state, event) {
  const data = JSON.parse(event.data);
  state.budget = Number(state.budget) + Number(data.budget);
  console.log(`Increase Budget : Updating State to ${JSON.stringify(state)}`);
  return state;
}

exports.increaseBudget = increaseBudget;
