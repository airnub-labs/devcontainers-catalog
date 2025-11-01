import sodium from "libsodium-wrappers";

/**
 * Encrypts a secret value for GitHub using libsodium sealed boxes.
 *
 * GitHub requires secrets to be encrypted with the repository/org/user
 * public key before they can be stored. This function performs the
 * encryption using the `crypto_box_seal` algorithm.
 *
 * **Algorithm:** Sealed box encryption (X25519 + XSalsa20Poly1305)
 *
 * @param publicKeyBase64 - Base64-encoded public key from GitHub API
 * @param secretValue - Plain-text secret value to encrypt
 * @returns Object with base64-encoded encrypted value
 *
 * @example
 * ```typescript
 * import { sealForGitHub } from "@airnub/sdk-codespaces-adapter";
 *
 * const keyRes = await octokit.request("GET /user/codespaces/secrets/public-key");
 * const { encrypted_value } = await sealForGitHub(keyRes.data.key, "my-secret-value");
 * await octokit.request("PUT /user/codespaces/secrets/{secret_name}", {
 *   secret_name: "MY_SECRET",
 *   encrypted_value,
 *   key_id: keyRes.data.key_id
 * });
 * ```
 *
 * @see https://docs.github.com/en/rest/actions/secrets
 * @public
 */
export async function sealForGitHub(publicKeyBase64: string, secretValue: string): Promise<{ encrypted_value: string }> {
  await sodium.ready;
  const publicKey = Buffer.from(publicKeyBase64, "base64");
  const messageBytes = Buffer.from(secretValue);
  const encryptedBytes = sodium.crypto_box_seal(messageBytes, publicKey);
  return { encrypted_value: Buffer.from(encryptedBytes).toString("base64") };
}
