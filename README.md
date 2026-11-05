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

An open agentic website is a public website that contains:
- a publicly accessible `.json` file that describes an agent network and its capabilities
- a `runtime.js` file that can run the agent network in the browser
- an interface that allows users to interact with the agent network
- an interface that allows users to configure the LLM and keys to use

### Key principles

- Agent networks are described in **JSON**, a human-readable **configuration** format. Not code.
- Agent networks are **executed in the browser**, without any specific server-side code.
- Users have control over which LLM providers and keys to use, so that the site host **does not pay for LLM calls**.
- Users have control over which sites they visit and which agents they interact with.
- Agent networks can reference other agent networks by URL, allowing them to call and interact with each other.
- Agent networks can call MCP and WebMCP tools

### Existing web infrastructure

Open agentic websites use ordinary web technologies (HTML, CSS, JavaScript, JSON), HTTPS hosting, CORS, WebMCP, MCP and standard web browsers. They are compatible with existing web infrastructure and can be deployed on any public hosting service.


## Examples

The operator of a pizza restaurant wants to agentify their website so that:
- customers can interactively ask questions about the menu. For instance:
  - "What are the vegetarian options?"
  - "I'm lactose intolerant, what can I eat?"
- customers can interactively place orders and choose delivery options. The website can
 delegate the delivery task to other delivery agentic websites.
- other agentic websites can send requests like:
  - "I'm organizing a hackathon and want to order 10 pizzas for delivery at 6pm. Can you help me?"
  - "What's the status for order #12345?"

The LLM provider, model and key used to answer these questions is chosen by the user, not the pizza restaurant. The pizza restaurant does not pay for LLM calls.

## Quickstart

### With Neuro SAN and a major LLM provider API key

Quickly prototype an agent network using the
[Neuro SAN BYOK](https://neuro-san.evolution.ml/multiAgentAccelerator?) service.


## Building

### Auto generated agentic websites

#### With Neuro SAN

website
ground
validate
nsdeploy

libraries
skills

#### From scratch

Manual edit -> hocon ref
Generate hocon

### Agentifying an existing website

### Infrastructure

Build tools and infrastructure for the agentic web: what will simplify the creation, deployment, and discovery of agentic websites? What will make them more useful?


## Starter tools

These optional tools can help you get started quickly with building agentic web applications.

### NANDA’s Index agent registry

[Nanda Index](https://nandaindex.org/) lets agents find and verify one another across the network. Use it to find other agents, register your own agents, and verify the authenticity of agents you interact with.

### Cognizant AI Lab’s Neuro SAN

[Neuro SAN Studio](https://github.com/cognizant-ai-lab/neuro-san-studio) is an open-source framework
for building and orchestrating multi-agent systems.
Try the [hosted version](https://neuro-san.evolution.ml/) with your own LLM keys. Use it to quickly prototype and test your agent networks.

### Mozilla’s Otari

[Otari](https://otari.ai) is an open-source LLM gateway. Use it to manage your LLM keys and connect to multiple LLM providers.


## Testing


## Documentation

### HOCON reference

### Spec

## Hackathon

See [hackathon.md](hackathon.md) for ongoing hackathons to build the first open agentic websites.

## FAQ
