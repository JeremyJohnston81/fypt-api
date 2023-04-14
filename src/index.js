import {
  createCors,
  json,
  Router,
  withParams
} from "itty-router";
import HcadStore from "./stores/hcadStore";

const router = Router();
const hcad = new HcadStore();
const { preflight, corsify } = createCors({
  methods: ["GET", "POST"]
});

router
  .all("*", preflight, withParams)

  .get("/search/:address", ({ address }) =>
    hcad.getAccountID(decodeURI(address))
  )

  .get("/property/:account", ({ account }) =>
    hcad.getProperty(account)
  )

  .get("/comps/:account", ({ account }) =>
    hcad.getComps(account)
  )

  .get("/lastUpdated", () =>
    hcad.getLastUpdated()
  )

// attach the router "handle" to the event handler
addEventListener("fetch", (event) =>
  event.respondWith(
    router
      .handle(event.request)
      .then(json) // transform raw data into JSON
      .catch(error) // catch errors BEFORE corsify
      .then(corsify) // corsify all Responses
  )
);
