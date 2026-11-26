import crypto from "node:crypto";
export { appUrl } from "./utils";
export const randomTokenSafe = () => crypto.randomBytes(24).toString("base64url");
