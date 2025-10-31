import sodium from "tweetsodium";

export function sealSecret(publicKey: string, value: string): string {
  const messageBytes = Buffer.from(value, "utf8");
  const keyBytes = Buffer.from(publicKey, "base64");
  const encryptedBytes = sodium.seal(messageBytes, keyBytes);
  return Buffer.from(encryptedBytes).toString("base64");
}
