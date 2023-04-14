import {
  createCors,
  json,
  Router,
  withParams
} from "itty-router";
import { version } from "../package.json";
import HcadStore from "./stores/hcadStore";

const router = Router();
const hcad = new HcadStore();
const { preflight, corsify } = createCors({
  methods: ["GET", "POST"]
});

router
  // register global middleware
  .all("*", preflight, withParams)

  // GET /version - exposes the API version
  .get("/version", () => ({ version }))

  // GET /search/:address - finds the account ID for a given address
  .get("/search/:address", ({ address }) =>
    hcad.getAccountID(decodeURI(address))
  )

  // GET /property/:account - finds the property for a given account
  .get("/property/:account", ({ account }) =>
    hcad.getProperty(account)
  )

  // GET /comps/:account - finds the comps for a given account
  .get("/comps/:account", ({ account }) =>
    hcad.getComps(account)
  )

  // GET /lastUpdated - returns the date the HCAD store was last updated
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
