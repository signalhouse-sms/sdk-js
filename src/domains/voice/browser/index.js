/**
 * Browser-only entry point for the SignalHouse voice SDK.
 *
 * Imported as a subpath:
 *
 *   import { Device } from "@signalhouse-sms/sdk/voice-browser";
 *
 * Loads JsSIP transitively. Node-only consumers should NOT import this
 * subpath; the REST surface (`sdk.voice.calls`, `sdk.voice.tokens`, etc.)
 * is exported from the package root and is JsSIP-free.
 *
 * Pairs with `sdk.voice.tokens.create()` from the REST surface — call that
 * server-side to mint a token, hand the response to `new Device(token)`
 * in the browser.
 */
export { Device } from "./Device.js";
export { Call } from "./Call.js";
