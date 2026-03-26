# llm-commit

## Features

Generate Git commit messages using local or cloud LLMs. Supports Apple Foundation Models, LM Studio, Ollama, OpenAI, and any OpenAI-compatible API.

## Requirements

- Visual Studio Code version 1.80.0 or higher
- One of the supported providers configured and running

### Installation

1. Install Visual Studio Code
2. Install the "LLM Commit" extension from the VS Code marketplace.
3. Configure your provider in the extension settings.

## Quick Setup

1. **Apple Foundation Models**: Set provider to "Apple" — no model download or configuration needed! Requires macOS 26+ with Apple Silicon and Apple Intelligence enabled.
2. **LM Studio** (default): Start LM Studio, load a model, and enable the local server — no configuration needed!
3. **Ollama**: Run `ollama serve` to start the server — no configuration needed!
4. **OpenAI**: Set provider to "OpenAI" and add your API key in settings
5. **Custom**: Set provider to "Custom" and configure URL, API key, and model manually

## Model choice

- **Apple Foundation Models**: Uses Apple's on-device ~3B model. Runs natively, completely private, and fast. Great for commit messages since they're short tasks.
- **LM Studio / Ollama**: Any instruction-following model works. I recommend qwen2.5-coder-7b-instruct — small, fast, and understands code well.
- **OpenAI**: Uses gpt-4.1 by default.

## Extension Settings

This extension contributes the following settings:

### Provider Presets

- `llm-commit.provider`: Select a provider preset for quick setup:
  - **Apple**: Apple Foundation Models — on-device, no setup required (macOS 26+, Apple Silicon)
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
3. Click the sparkle icon in the Source Control panel header
4. The extension will generate a commit message and populate it in the commit message input box

## Supported Providers

- **Apple Foundation Models** — on-device, private, zero config (macOS 26+)
- **LM Studio** — local inference with any downloaded model
- **Ollama** — local inference with OpenAI compatibility
- **OpenAI API** — cloud-based, requires API key
- **Custom** — any OpenAI-compatible API endpoint
