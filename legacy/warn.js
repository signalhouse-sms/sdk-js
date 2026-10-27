// Guarded because ./voice-browser runs in browsers, where process is undefined.
if (typeof process !== "undefined" && typeof process.emitWarning === "function") {
	process.emitWarning("@signalhousellc/sdk has moved to @signalhouse-sms/sdk. Install @signalhouse-sms/sdk and update your imports; this package stops receiving releases on 2027-05-01.", {
		type: "DeprecationWarning",
		code: "SIGNALHOUSE_SDK_MOVED",
	});
}
