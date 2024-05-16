import { parseArgs } from "https://deno.land/std@0.224.0/cli/mod.ts"
import { decodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts"
import { format as datetimeFormat } from "https://deno.land/std@0.224.0/datetime/format.ts"
import { join as pathJoin } from "https://deno.land/std@0.224.0/path/mod.ts"

const args = parseArgs(Deno.args)

const port = args.port || 8000
const tls = (() => {
	if (!args.cert && !args.key) return {}
	
	const cert = args.cert ? Deno.readTextFileSync(args.cert) : null
	const key = args.key ? Deno.readTextFileSync(args.key) : null

	if (cert && key) {
		return { cert, key }
	} else {
		return {}
	}
})() as {} | { key: string, cert: string }

const html = await Deno.readTextFile("./page.html")

const makeResponse = (data: { status?: number, html?: string, json?: any }) => {
	const [ctype, body] = typeof data.html === "string"
		? ["text/html", data.html]
		: ["application/json", JSON.stringify(data.json ?? null)]
	return new Response(body, { status: data.status ?? 200, headers: { "content-type": ctype } })
}

const safe = <T>(promise: Promise<T>) => {
	return promise.then(value => ({ value }), error => ({ error }))
}

const format = (values: any) => {
	if (!(values && typeof values === "object")) {
		return []
	}
	const entries = Object.entries(values)
	for (const entry of entries) {
		if (typeof entry[1] !== "string") {
			entry[1] = new TextEncoder().encode("INVALID FORMAT")
		} else {
			entry[1] = decodeBase64(entry[1])
		}
	}
	return entries as [string, Uint8Array][]
}

const save = async (dirname: string, entries: [string, Uint8Array][]) => {
	await Deno.mkdir(dirname)
	const index_content = entries.map(([name], index) => {
		return `${String(index).padStart(4, "0")}: ${name}`
	}).join("\n")
	await Deno.writeTextFile(pathJoin(dirname, "index.txt"), index_content)
	for (const [index, [name, u8]] of entries.entries()) {
		await Deno.writeFile(pathJoin(dirname, String(index).padStart(4, "0")), u8)
	}
}

const handler = async (request: Request): Promise<Response> => {
	console.log({ time: new Date(), method: request.method, path: request.url })

	if (request.method === "GET") {
		return makeResponse({ html })
	} else {
		const body_result = await safe(request.json())
		if ("error" in body_result) {
			console.error("Error:", body_result.error)
			return makeResponse({ status: 400, json: { message: "json error", error: body_result.error } })
		}
		const entries = format(body_result.value)
		if (entries.length === 0) {
			console.error("Error: empty data")
			return makeResponse({ status: 400, json: { message: "empty" } })
		}
		const dirname = datetimeFormat(new Date(), "yyyy-MM-dd_HH-mm-ss-SSS")
		const save_result = safe(save(dirname, entries))
		if ("error" in save_result) {
			console.error("Error:", save_result.error)
			return makeResponse({ status: 500, json: { message: "save error", error: save_result.error } })
		}
		return makeResponse({ json: { message: "ok", dir: dirname } })
	}
}

Deno.serve({ port, ...tls }, handler)
