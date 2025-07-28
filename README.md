# llm-commit

## Features

The "LLM Commit" extension generates Git commit messages using OpenAI-compatible APIs. It helps you create concise, imperative commit messages based on the staged changes in your repository.

## Requirements

- Visual Studio Code version 1.80.0 or higher
- An OpenAI-compatible API endpoint (such as OpenAI, LM Studio, Ollama with OpenAI compatibility, or other compatible services)

### Installation

1. Install Visual Studio Code
2. Install the "LLM Commit" extension from the VS Code marketplace.
3. Configure your provider in the extension settings (LM Studio is the default).

## Quick Setup

1. **LM Studio** (default): Start LM Studio, load a model, and enable the local server - no configuration needed!
2. **Ollama**: Run `ollama serve` to start the server - no configuration needed!
3. **OpenAI**: Set provider to "OpenAI" and add your API key in settings
4. **Custom**: Set provider to "Custom" and configure URL, API key, and model manually

## Model choice

- Any instruction following model can acomplish this task, I personally recommend qwen2.5-coder-7b-instruct at the moment since it's a small, fast model that understand code well.

## Extension Settings

This extension contributes the following settings:

### Provider Presets

- `llm-commit.provider`: Select a provider preset for quick setup:
  - **LM Studio** (default): `http://127.0.0.1:1234/v1/chat/completions`
  - **Ollama**: `http://127.0.0.1:11434/v1/chat/completions`
  - **OpenAI**: `https://api.openai.com/v1/chat/completions`
  - **Custom**: Use manual configuration below

### Manual Configuration (when provider is set to "custom")

- `llm-commit.apiUrl`: URL of the OpenAI-compatible API endpoint.
- `llm-commit.apiKey`: API key for the OpenAI-compatible API (required for OpenAI, optional for local services).
- `llm-commit.model`: Model to use for generation.

### General Settings

- `llm-commit.prompt`: Prompt template for the LLM. Use '{diff}' as placeholder for the git diff.
- `llm-commit.maxDiffLength`: Maximum length of the git diff (in characters) to send to the LLM. Prevents overly long requests.

## Usage

1. Stage your changes in Git (using `git add` or the VS Code Source Control panel)
2. Open the Source Control panel in VS Code
3. Click the sparkle icon (✨) in the Source Control panel header
4. The extension will generate a commit message and populate it in the commit message input box

## Supported APIs

This extension works with any OpenAI-compatible API, including:

- OpenAI API
- LM Studio
- Ollama (with OpenAI compatibility enabled)
- LocalAI
- Anthropic Claude (via compatible proxies)
- Any other service that implements the OpenAI chat completions API format
