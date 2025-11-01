import sodium from "libsodium-wrappers";

export async function sealForGitHub(publicKeyBase64: string, secretValue: string): Promise<{ encrypted_value: string }> {
  await sodium.ready;
  const publicKey = Buffer.from(publicKeyBase64, "base64");
  const messageBytes = Buffer.from(secretValue);
  const encryptedBytes = sodium.crypto_box_seal(messageBytes, publicKey);
  return { encrypted_value: Buffer.from(encryptedBytes).toString("base64") };
}
