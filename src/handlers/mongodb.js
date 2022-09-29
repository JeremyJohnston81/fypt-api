const REGION = 'data' // or pin to a region with e.g. 'us-east-1'
const URL_PREFIX = `https://${REGION}.mongodb-api.com/app`
const URL_SUFFIX = 'endpoint/data/v1/action'

export async function dataApi(collection, action, query = {}, ejson = false) {
	const apiKey = MONGODB_API_KEY
	const apiId = MONGODB_API_ID
	const url = `${URL_PREFIX}/${apiId}/${URL_SUFFIX}/${action}`

    let requestBody = {
        dataSource: MONGODB_DATA_SOURCE,
        database: MONGODB_DATABASE,
        collection
    }

	//Merge the actual query with the base MongoDB variables
    Object.assign(requestBody, query)

	let response = await fetch(url, {
        method: "POST",
		headers: {
			'Content-Type': ejson ? 'application/ejson' : 'application/json',
			'Accept': 'application/json',
			'Access-Control-Request-Headers': '*',
			'api-key': apiKey,
		},
		body: JSON.stringify(requestBody)
	})

	if (response.status == 200) {
		return response.json()
	}
	else {
		let error = {
			status: response.status,
			text: response.statusText,
			description: "Unknown Error"
		}

		switch (response.status) {
			case 400:
				error.description = "Invalid Paramaters"
				break;
		}

		let errorResponse = {
			document : {
				error
			},
			documents : {
				error
			}
		}

		return errorResponse
	}
}