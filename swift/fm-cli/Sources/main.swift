import Foundation
import FoundationModels

@main
struct FMCli {
    static func main() async {
        let args = CommandLine.arguments

        if args.contains("--check") {
            checkAvailability()
            return
        }

        guard isModelAvailable() else { return }

        let prompt = readPromptFromStdin()

        guard !prompt.isEmpty else {
            printError("no_input")
            exit(1)
        }

        let instructions = parseInstructions(from: args)

        await generate(prompt: prompt, instructions: instructions)
    }

    // MARK: - Availability

    private static func isModelAvailable() -> Bool {
        let model = SystemLanguageModel.default

        switch model.availability {
        case .available:
            return true
        case .unavailable(.deviceNotEligible):
            printError("device_not_eligible")
        case .unavailable(.appleIntelligenceNotEnabled):
            printError("apple_intelligence_not_enabled")
        case .unavailable(.modelNotReady):
            printError("model_not_ready")
        case .unavailable:
            printError("unavailable")
        }

        exit(1)
    }

    private static func checkAvailability() {
        let model = SystemLanguageModel.default

        switch model.availability {
        case .available:
            print("available")
        case .unavailable(.deviceNotEligible):
            printError("device_not_eligible")
            exit(1)
        case .unavailable(.appleIntelligenceNotEnabled):
            printError("apple_intelligence_not_enabled")
            exit(1)
        case .unavailable(.modelNotReady):
            printError("model_not_ready")
            exit(1)
        case .unavailable:
            printError("unavailable")
            exit(1)
        }
    }

    // MARK: - Generation

    private static func generate(prompt: String, instructions: String?) async {
        do {
            let session = LanguageModelSession(instructions: instructions)
            let response = try await session.respond(to: prompt)
            print(response.content)
        } catch {
            printError("generation_failed: \(error.localizedDescription)")
            exit(1)
        }
    }

    // MARK: - Helpers

    private static func readPromptFromStdin() -> String {
        var lines: [String] = []
        while let line = readLine(strippingNewline: false) {
            lines.append(line)
        }
        return lines.joined().trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private static func parseInstructions(from args: [String]) -> String? {
        guard let idx = args.firstIndex(of: "--instructions"),
              idx + 1 < args.count else {
            return nil
        }
        return args[idx + 1]
    }

    private static func printError(_ message: String) {
        FileHandle.standardError.write(Data("error:\(message)\n".utf8))
    }
}
