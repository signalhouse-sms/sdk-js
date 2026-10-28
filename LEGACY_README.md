> **This package has moved.** `@signalhousellc/sdk` is now [`@signalhouse-sms/sdk`](https://www.npmjs.com/package/@signalhouse-sms/sdk), developed at
> https://github.com/signalhouse-sms/sdk-js. This package is a thin shim that installs `@signalhouse-sms/sdk` at the
> same version and re-exports it. It receives every release until **2027-05-01**, then stops.
>
> **Migrate:** `npm install @signalhouse-sms/sdk`, then change every import from `@signalhousellc/sdk` to `@signalhouse-sms/sdk`. The API is identical.

# @signalhouse-sms/sdk

A lightweight Node.js SDK for the Signal House platform.

## Installation

```bash
npm install @signalhouse-sms/sdk
```

## Agent skills

The package bundles the Signal House agent skills, which teach a coding agent the order the
platform enforces, what carriers require, and what a send cannot do before a campaign is approved.

If your project already has a `.claude/` or `.agents/` directory, installing the SDK offers to copy
them in. Otherwise, install them yourself:

```bash
npx signalhouse-skills            # install into the current project
npx signalhouse-skills --force    # create the agent directory if the project has none yet
npx signalhouse-skills --path ..  # install somewhere else
```

The installer only ever writes inside the project, never your home directory, and never overwrites
a skill you have edited. Set `SIGNALHOUSE_SKILLS=0` to turn it off, or `SIGNALHOUSE_SKILLS=1` to
install during a postinstall into a project that has no agent directory yet. The automatic
postinstall is skipped in CI; running the command yourself is not.

Quick Start

```bash
import { SignalHouseSDK } from '@signalhouse-sms/sdk';

const sdk = new SignalHouseSDK({
  apiKey: 'your-api-key',
  baseUrl: 'api url'
});

const token = await sdk.auth.login({
    email: 'youremail',
    password: 'yourpassword'
});

console.log(token);
```

Features
Full support for Signal House API v2
Integrated Axios with standardized returns
Lightweight and tree-shakeable

Documentation
For full API reference and advanced usage, visit https://app2.signalhouse.io/docs

License
ISC © Signal House
