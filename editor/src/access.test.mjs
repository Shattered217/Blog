import assert from "node:assert/strict";
import test from "node:test";
import { exportJWK, generateKeyPair, SignJWT } from "jose";
import { hasAccessIdentity } from "./access.ts";

test("Access validates signature, issuer, audience and expiry against JWKS", async (t) => {
	const { publicKey, privateKey } = await generateKeyPair("RS256");
	const jwk = {
		...(await exportJWK(publicKey)),
		kid: "test-key",
		alg: "RS256",
		use: "sig",
	};
	t.mock.method(globalThis, "fetch", async (url) => {
		assert.equal(
			String(url),
			"https://test-team.cloudflareaccess.com/cdn-cgi/access/certs",
		);
		return Response.json({ keys: [jwk] });
	});
	const env = {
		ACCESS_TEAM_DOMAIN: "test-team.cloudflareaccess.com",
		ACCESS_AUD: "editor-app",
	};
	const sign = (overrides = {}, key = privateKey) =>
		new SignJWT({
			iss: "https://test-team.cloudflareaccess.com",
			aud: "editor-app",
			sub: "user",
			iat: Math.floor(Date.now() / 1000),
			exp: Math.floor(Date.now() / 1000) + 300,
			...overrides,
		})
			.setProtectedHeader({ alg: "RS256", kid: "test-key" })
			.sign(key);
	const verify = async (token) =>
		hasAccessIdentity(
			new Request("https://editor.example/", {
				headers: { "Cf-Access-Jwt-Assertion": token },
			}),
			env,
		);
	assert.equal(await verify(await sign()), true);
	assert.equal(await verify(await sign({ aud: "other-app" })), false);
	assert.equal(
		await verify(await sign({ iss: "https://other.cloudflareaccess.com" })),
		false,
	);
	assert.equal(await verify(await sign({ exp: 1 })), false);
	assert.equal(await verify(await sign({ exp: undefined })), false);
	const other = await generateKeyPair("RS256");
	assert.equal(await verify(await sign({}, other.privateKey)), false);
	assert.equal(await verify("fake-token"), false);
});

test("Access development bypass requires both explicit flag and loopback", async () => {
	assert.equal(
		await hasAccessIdentity(new Request("http://localhost/"), {
			REQUIRE_ACCESS: "false",
		}),
		true,
	);
	assert.equal(
		await hasAccessIdentity(new Request("http://localhost/"), {}),
		false,
	);
	assert.equal(
		await hasAccessIdentity(new Request("https://editor.example/"), {
			REQUIRE_ACCESS: "false",
		}),
		false,
	);
	assert.equal(
		await hasAccessIdentity(
			new Request("https://editor.example/", {
				headers: { "Cf-Access-Jwt-Assertion": "present" },
			}),
			{},
		),
		false,
	);
});
