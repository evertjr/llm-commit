import * as vscode from "vscode";

interface OpenAIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface ProviderConfig {
  apiUrl: string;
  apiKey: string;
  model: string;
}

function getProviderConfig(provider: string): ProviderConfig {
  const config = vscode.workspace.getConfiguration("llm-commit");
  const userModel = config.get<string>("model");

  let apiUrl: string;
  let apiKey: string;
  let defaultModel: string;

  switch (provider) {
    case "lm-studio":
      apiUrl = "http://127.0.0.1:1234/v1/chat/completions";
      apiKey = "";
      defaultModel = "qwen2.5-coder-7b-instruct";
      break;
    case "ollama":
      apiUrl = "http://127.0.0.1:11434/v1/chat/completions";
      apiKey = "";
      defaultModel = "qwen2.5-coder-7b-instruct";
      break;
    case "openai":
      apiUrl = "https://api.openai.com/v1/chat/completions";
      apiKey = config.get<string>("apiKey") || "";
      defaultModel = "gpt-4.1";
      break;
    case "custom":
    default:
      apiUrl =
        config.get<string>("apiUrl") ||
        "http://localhost:1234/v1/chat/completions";
      apiKey = config.get<string>("apiKey") || "";
      defaultModel = "qwen2.5-coder-7b-instruct";
      break;
  }

  return {
    apiUrl,
    apiKey,
    model: userModel || defaultModel,
  };
}

async function getGitAPI() {
  try {
    const extension = vscode.extensions.getExtension("vscode.git");
    if (!extension) {
      vscode.window.showErrorMessage("Git extension is not available.");
      return undefined;
    }
    if (!extension.isActive) {
      await extension.activate();
    }
    const gitAPI = extension.exports.getAPI(1);
    if (!gitAPI) {
      vscode.window.showErrorMessage("Unable to get Git API.");
      return undefined;
    }
    return gitAPI;
  } catch (error) {
    console.error("Error getting Git API:", error);
    vscode.window.showErrorMessage(
      `Error getting Git API: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    return undefined;
  }
}

async function getStagedDiff(gitAPI: any): Promise<string | null> {
  if (!gitAPI || gitAPI.repositories.length === 0) {
    vscode.window.showInformationMessage("No Git repository found.");
    return null;
  }

  const repo = gitAPI.repositories[0];

  if (!repo) {
    vscode.window.showInformationMessage("No Git repository found.");
    return null;
  }

  try {
    const diff = await repo.diff(true);

    if (!diff || diff.length === 0) {
      vscode.window.showInformationMessage("No staged changes found.");
      return null;
    }
    return diff;
  } catch (error) {
    console.error("Error getting git diff:", error);
    vscode.window.showErrorMessage(
      `Error getting git diff: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    return null;
  }
}

async function generateCommitMessage(diff: string): Promise<string | null> {
  const config = vscode.workspace.getConfiguration("llm-commit");
  const provider = config.get<string>("provider") || "lm-studio";
  const providerConfig = getProviderConfig(provider);
  const promptTemplate = config.get<string>("prompt");
  const maxDiffLength = config.get<number>("maxDiffLength", 4000);

  if (!providerConfig.apiUrl || !providerConfig.model || !promptTemplate) {
    vscode.window.showErrorMessage(
      "LLM Commit configuration is missing (API URL, Model, or Prompt). Please check settings."
    );
    return null;
  }

  const truncatedDiff =
    diff.length > maxDiffLength
      ? `${diff.substring(0, maxDiffLength)}\n... (diff truncated)`
      : diff;
  const finalPrompt = promptTemplate.replace("{diff}", truncatedDiff);

  try {
    const messages: OpenAIMessage[] = [
      {
        role: "user",
        content: finalPrompt,
      },
    ];

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (providerConfig.apiKey && providerConfig.apiKey.trim() !== "") {
      headers.Authorization = `Bearer ${providerConfig.apiKey}`;
    }

    const response = await fetch(providerConfig.apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: providerConfig.model,
        messages,
        max_tokens: 150,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }

      const status = response.status;
      let errorMessage = "Failed to generate commit message.";

      if (status === 401) {
        errorMessage = "Authentication failed. Please check your API key.";
      } else if (status === 404) {
        errorMessage = "API endpoint not found. Please check your API URL.";
      } else if (status === 429) {
        errorMessage = "Rate limit exceeded. Please try again later.";
      } else {
        errorMessage = `API Error (${status}): ${
          errorData?.error?.message || errorData?.message || response.statusText
        }`;
      }

      vscode.window.showErrorMessage(errorMessage);
      return null;
    }

    const data = (await response.json()) as OpenAIResponse;

    if (!data.choices || data.choices.length === 0) {
      vscode.window.showWarningMessage("API returned no choices.");
      return null;
    }

    let generatedMessage = data.choices[0].message.content.trim();

    if (
      (generatedMessage.startsWith('"') && generatedMessage.endsWith('"')) ||
      (generatedMessage.startsWith("'") && generatedMessage.endsWith("'"))
    ) {
      generatedMessage = generatedMessage.substring(
        1,
        generatedMessage.length - 1
      );
    }

    generatedMessage = generatedMessage.replace(/^commit message:/i, "").trim();
    generatedMessage = generatedMessage.replace(/^message:/i, "").trim();

    if (!generatedMessage) {
      vscode.window.showWarningMessage("API returned an empty message.");
      return null;
    }

    return generatedMessage;
  } catch (error: unknown) {
    console.error("Error calling OpenAI-compatible API:", error);
    let errorMessage = "Failed to generate commit message.";

    if (error instanceof TypeError && error.message.includes("fetch")) {
      errorMessage = `Could not connect to API at ${providerConfig.apiUrl}. Is the service running?`;
    } else if (error instanceof Error) {
      errorMessage = `Error: ${error.message}`;
    } else {
      errorMessage =
        "An unknown error occurred while generating the commit message.";
    }

    vscode.window.showErrorMessage(errorMessage);
    return null;
  }
}

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    "llm-commit.generate",
    async () => {
      const gitAPI = await getGitAPI();
      if (!gitAPI) {
        return;
      }

      if (gitAPI.repositories.length === 0) {
        vscode.window.showInformationMessage(
          "No Git repository found in the workspace."
        );
        return;
      }
      const repo = gitAPI.repositories[0];

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.SourceControl,
          title: "Generating commit message with LLM...",
          cancellable: false,
        },
        async (progress) => {
          progress.report({ increment: 10 });

          const diff = await getStagedDiff(gitAPI);
          if (!diff) {
            return;
          }
          progress.report({ increment: 30 });

          const generatedMessage = await generateCommitMessage(diff);
          progress.report({ increment: 50 });

          if (generatedMessage && repo.inputBox) {
            repo.inputBox.value = generatedMessage;
            vscode.window.showInformationMessage(
              "LLM commit message generated."
            );
            progress.report({ increment: 10 });
            return;
          }

          if (generatedMessage === null) {
            return;
          }

          vscode.window.showWarningMessage(
            "Could not find Git commit input box."
          );
        }
      );
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
