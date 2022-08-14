require("dotenv").config();
const express = require("express");
const redis = require("redis-om");
const cors = require("cors");
const app = express();
const options = {
  origin: process.env.FRONTEND,
};
app.use(cors(options));
const port = process.env.PORT;
const client = new redis.Client();
const consumers = require("./consumers");
client.open(process.env.URL);
app.use(express.json());

console.log(`Connection to DB : ${client.isOpen()}`);

class Delivery extends redis.Entity {}
class Event extends redis.Entity {}

const deliverySchema = new redis.Schema(
  Delivery,
  {
    budget: { type: "number" },
    notes: { type: "string" },
  },
  {
    dataStructure: "HASH",
  }
);

const eventSchema = new redis.Schema(
  Event,
  {
    deliveryId: { type: "string" },
    type: { type: "string" },
    data: { type: "string" },
  },
  {
    dataStructure: "HASH",
  }
);

const deliveryRepository = client.fetchRepository(deliverySchema);
const eventRepository = client.fetchRepository(eventSchema);
const delivery = deliveryRepository.createEntity();
const event = eventRepository.createEntity();

app.get("/delivery/:id", (req, res) => {
  deliveryRepository
    .fetch(req.params.id)
    .then((delivery) => {
      res.send(delivery);
    })
    .catch((err) => {
      res.status(500);
    });
});

app.get("/delivery/:id/status", (req, res) => {
  client
    .get(`delivery:${String(req.params.id)}`)
    .then((state) => {
      if (state == null) {
        res.status(400);
        res.send("Data not found");
      } else {
        res.send(state);
      }
    })
    .catch((err) => {
      res.status(500);
    });
});

app.post("/delivery/create", (req, res) => {
  console.log(
    `Invoked /delivery/create with request: ${JSON.stringify(req.body)}`
  );
  deliveryRepository
    .createAndSave({
      budget: Number(req.body.data.budget),
      notes: String(req.body.data.notes),
    })
    .then((delivery) => {
      eventRepository
        .createAndSave({
          deliveryId: delivery.entityId,
          type: String(req.body.type),
          data: JSON.stringify(req.body.data),
        })
        .then((event) => {
          const state = consumers.CONSUMER[event.type]({}, event);
          console.log(
            `Event Type: ${event.type}, Delivery ID: ${event.deliveryId}, Event ID: ${event.entityId}`
          );
          client.set(`delivery:${event.deliveryId}`, JSON.stringify(state));
          res.send(state);
        })
        .catch((err) => {
          res.status(500);
        });
    });
});

app.post("/event", async (req, res) => {
  eventRepository
    .createAndSave({
      deliveryId: req.body.deliveryId,
      type: req.body.type,
      data: JSON.stringify(req.body.data),
    })
    .then((event) => {
      client.get(`delivery:${String(event.deliveryId)}`).then((state) => {
        if (state == null) {
          res.status(404);
          res.send("Data not found");
        } else {
          try {
            const newState = consumers.CONSUMER[event.type](
              JSON.parse(state),
              event
            );
            console.log(
              `Event Type: ${event.type}, Delivery ID: ${event.deliveryId}, Event ID: ${event.entityId}`
            );
            client.set(
              `delivery:${event.deliveryId}`,
              JSON.stringify(newState)
            );
            res.send(newState);
          } catch (e) {
            console.log(e);
            res.status(404);
            res.send(e);
          }
        }
      });
    });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
