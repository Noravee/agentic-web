# The Open Agentic Web

Create, own and connect agents on today's web.

## Why

Today, personal AI agents are largely confined to the platforms that build and operate them.
Without open standards, the emerging agent economy risks reproducing the closed ecosystems of
today's internet, where access, visibility and interoperability are controlled by a handful of
companies.

The Open Agentic Web aims to change that. Its vision is a web where people and organizations
can choose their agents, businesses can make their services discoverable to any agent,
and agents can work across platforms regardless of who built them.

## What

An open agentic web site is a public website that contains:
- a publicly accessible `.hocon` file that describes an agent network and its capabilities
- a `runtime.js` file that can run the agent network in the browser
- an interface that allows users to interact with the agent network
- an interface that allows users to configure the LLM and keys to use

### Key principles

- Agent networks are described in **HOCON**, a human-readable configuration format.
- Agent networks are **executed in the browser**, without any specific server-side code.
- Users have control over which LLM providers and keys to use, so that the site host **does not pay for LLM calls**.
- Users have control over which sites they visit and which agents they interact with.
- Agent networks can reference other agent networks by URL, allowing them to call and interact with each other.

### Existing web infrastructure

Open agentic web sites use ordinary web technologies (HTML, CSS, JavaScript, JSON), HTTPS hosting, CORS, MCP and standard web browsers. They are compatible with existing web infrastructure and can be deployed on any public hosting service.

## Quickstart



## Building

### Auto generated agentic web sites

### Agentifying an existing web site

### Infrastructure

Build tools and infrastructure for the agentic web: what will simplify the creation, deployment, and discovery of agentic web sites? What will make them more useful?

## Starter tools

These optional tools can help you get started quickly with building agentic web applications.

### NANDA’s Index agent registry

[Nanda Index](https://nandaindex.org/) lets agents find and verify one another across the network. Use it to find other agents, register your own agents, and verify the authenticity of agents you interact with.

### Cognizant AI Lab’s Neuro SAN

[Neuro SAN](https://github.com/cognizant-ai-lab/neuro-san-studio) is an open-source framework
for building and orchestrating multi-agent systems.
Try the [hosted version](https://neuro-san.evolution.ml/) with your own LLM keys. Use it to quickly prototype and test your agent networks.

### Mozilla’s Otari

[Otari](https://otari.ai) is an open-source LLM gateway. Use it to manage your LLM keys and connect to multiple LLM providers.

## Examples

## Testing

## Documentation

### Spec

## FAQ
