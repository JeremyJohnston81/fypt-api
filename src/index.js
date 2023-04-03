import { Router } from "itty-router";
import { json, withParams } from "itty-router-extras";
import HcadStore from "./stores/hcadStore";

const router = Router();
const hcad = new HcadStore();

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
};

router.options("*", async () => {
  const optionHeader = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "OPTIONS, GET, POST",
    "Access-Control-Allow-Headers":
      "Origin, X-Requested-With, Content-Type, Accept",
  };
  return new Response(null, { status: 204, headers: optionHeader });
});

router.get("/search/:address", withParams, async ({ address }) =>
  json(await hcad.getAccountID(decodeURI(address)), { headers })
);

router.get("/property/:account", withParams, async ({ account }) =>
  json(await hcad.getProperty(account), { headers })
);

router.get("/comps/:account", withParams, async ({ account }) =>
  json(await hcad.getComps(account), { headers })
);

router.get("/lastUpdated", async ({}) =>
  json(await hcad.getLastUpdated(), { headers })
);

// attach the router "handle" to the event handler
addEventListener("fetch", (event) =>
  event.respondWith(router.handle(event.request))
);
