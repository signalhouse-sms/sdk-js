import { SipTrunks } from "./voice/SipTrunks.js";
import { SipProfiles } from "./voice/SipProfiles.js";
import { ProgrammableVoiceProfiles } from "./voice/ProgrammableVoiceProfiles.js";
import { NumberRoutes } from "./voice/NumberRoutes.js";
import { Calls } from "./voice/Calls.js";
import { CallLogs } from "./voice/CallLogs.js";
import { GlobalVoiceSettings } from "./voice/GlobalVoiceSettings.js";
import { Tokens } from "./voice/Tokens.js";
import { Analytics } from "./voice/Analytics.js";
import { OutboundVoice } from "./voice/OutboundVoice.js";

/**
 * Voice domain — wraps the Voice service (mounted under /voice on the
 * platform host). Groups all voice-service sub-resources under a single
 * namespace, accessed via `sdk.voice.*`.
 *
 * Sub-resources:
 * - `sdk.voice.sipTrunks`                 — SIP trunk (peer-to-peer connections to PBX/carrier).
 * - `sdk.voice.sipProfiles`               — SIP profile / endpoint (single registerable UA).
 * - `sdk.voice.programmableVoiceProfiles` — Programmable Voice Profile (route a set of numbers through Signal House).
 * - `sdk.voice.numberRoutes`              — Per-number inbound route (overrides the profile and subgroup settings).
 * - `sdk.voice.calls`                     — Twilio-compat programmatic call control (create/hangup/etc.).
 * - `sdk.voice.callLogs`                  — Account-scoped call history: list/get + presigned recording.
 * - `sdk.voice.globalVoiceSettings`       — Account-wide voice defaults (accepted regions, max spend, E911).
 * - `sdk.voice.tokens`                    — Mint ephemeral SIP credentials for the browser voice SDK.
 * - `sdk.voice.analytics`                 — Aggregated call analytics (summary tiles + byDate/byNumber/byCarrier breakdowns).
 */
export class Voice {
	constructor(client, enableAdmin) {
		this.client = client;
		this.enableAdmin = enableAdmin;
		this.sipTrunks = new SipTrunks(client, enableAdmin);
		this.sipProfiles = new SipProfiles(client, enableAdmin);
		this.programmableVoiceProfiles = new ProgrammableVoiceProfiles(client, enableAdmin);
		this.numberRoutes = new NumberRoutes(client, enableAdmin);
		this.calls = new Calls(client, enableAdmin);
		this.callLogs = new CallLogs(client, enableAdmin);
		this.globalVoiceSettings = new GlobalVoiceSettings(client, enableAdmin);
		this.tokens = new Tokens(client, enableAdmin);
		this.analytics = new Analytics(client, enableAdmin);
		this.outboundVoice = new OutboundVoice(client, enableAdmin);
	}
}
