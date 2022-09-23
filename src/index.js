import { Router } from 'itty-router'
import { json, error, missing, withParams, withContent } from 'itty-router-extras'
import HcadStore from './stores/hcadStore'

const router = Router()
const hcad = new HcadStore()

const headers = {
'Access-Control-Allow-Origin': "*",
'Content-Type': 'application/json',
};

router.options('*', async() => {
	const optionHeader = {
	  'Access-Control-Allow-Origin': "*",
	  'Access-Control-Allow-Methods': 'OPTIONS, GET, POST',
	  'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept'
	}
	return new Response(null, {status: 204, headers: optionHeader})
  })

router.get('/search/:address', withParams, async({address}) => {
	const body = json(await hcad.getAccountID(decodeURI(address))).body
	return new Response(body, { headers })
})

router.get('/property/:account', withParams, async({account}) => {
	const body = json(await hcad.getProperty(account)).body
	return new Response(body, { headers })
})

router.get('/comps/:account', withParams, async({account}) => {
	const body = json(await hcad.getComps(account)).body
	return new Response(body, { headers })
})

// attach the router "handle" to the event handler
addEventListener('fetch', event =>
  event.respondWith(router.handle(event.request))
)
