import type { Arguments } from "yargs-parser";
import type { GenerateCLIArguments } from "./cmd/generate";
import process from "node:process";
import {
  bgGreen,
  bgWhite,
  black,
  bold,
  dim,
  green,
} from "farver/fast";
import yargs from "yargs-parser";
import pkg from "../../package.json" with { type: "json" };

type CLICommand =
  | "help"
  | "version"
  | "generate";

const SUPPORTED_COMMANDS = new Set<CLICommand>([
  "generate",
]);

export type CLIArguments<T extends Record<string, unknown>> = Arguments & T;

/**
 * Resolves the CLI command based on the provided arguments.
 *
 * If the `version` flag is present, it returns the "version" command.
 * Otherwise, it checks if the third argument in the positional arguments (`flags._[2]`)
 * is a supported command. If it is, it returns that command.
 * If no supported command is found, it defaults to the "help" command.
 *
 * @param {Arguments} flags - The parsed arguments from the command line.
 * @returns {CLICommand} The resolved CLI command.
 */
export function resolveCommand(flags: Arguments): CLICommand {
  if (flags.version) return "version";

  const cmd = flags._[2] as string;

  if (SUPPORTED_COMMANDS.has(cmd as CLICommand)) {
    return cmd as CLICommand;
  }

  return "help";
}

export function printHelp({
  commandName,
  headline,
  usage,
  tables,
  description,
}: {
  commandName: string;
  headline?: string;
  usage?: string;
  tables?: Record<string, [command: string, help: string][]>;
  description?: string;
}) {
  const terminalWidth = process.stdout.columns || 80;
  const isTinyTerminal = terminalWidth < 60;

  // add two spaces before all content
  const indent = "  ";

  // helper functions
  const linebreak = () => "";

  // table rendering with improved spacing
  const table = (rows: [string, string][], { padding }: { padding: number }) => {
    let raw = "";

    for (const [command, help] of rows) {
      if (isTinyTerminal) {
        // stack vertically in small terminals
        raw += `${indent}${indent}${bold(command)}\n${indent}${indent}${indent}${dim(help)}\n`;
      } else {
        // keep horizontal in normal terminals with better alignment
        const paddedCommand = command.padEnd(padding);
        raw += `${indent}${indent}${bold(paddedCommand)}  ${dim(help)}\n`;
      }
    }
    return raw.slice(0, -1); // remove latest \n
  };

  const message = [];

  // header section with version
  if (headline) {
    message.push(
      `\n${indent}${bgGreen(black(` ${commandName} `))} ${green(`v${pkg.version ?? "0.0.0"}`)}`,
      `${indent}${dim(headline)}`,
    );
  }

  // usage section
  if (usage) {
    message.push(
      linebreak(),
      `${indent}${bold("USAGE")}`,
      `${indent}${indent}${green(commandName)} ${usage}`,
    );
  }

  // description when provided
  if (description) {
    message.push(
      linebreak(),
      `${indent}${bold("DESCRIPTION")}`,
      `${indent}${indent}${description}`,
    );
  }

  // tables with improved formatting
  if (tables) {
    // calculate optimal padding but cap it to avoid excessive space
    function calculateTablePadding(rows: [string, string][]) {
      const maxLength = rows.reduce((val, [first]) => Math.max(val, first.length), 0);
      return Math.min(maxLength, 30) + 2;
    }

    const tableEntries = Object.entries(tables);
    for (const [tableTitle, tableRows] of tableEntries) {
      const padding = calculateTablePadding(tableRows);
      message.push(
        linebreak(),
        `${indent}${bold(tableTitle.toUpperCase())}`,
        table(tableRows, { padding }),
      );
    }
  }

  // add footer
  message.push(
    linebreak(),
    `${indent}${dim(`Run with --help for more information on specific commands.`)}`,
  );

  console.log(`${message.join("\n")}\n`);
}

export const GLOBAL_FLAGS: [cmd: string, desc: string][] = [];

/**
 * Runs a command based on the provided CLI command and flags.
 *
 * @param {CLICommand} cmd - The CLI command to execute.
 * @param {Arguments} flags - The flags passed to the command.
 * @returns {Promise<void>} A promise that resolves when the command has finished executing.
 * @throws An error if the command is not found.
 */
export async function runCommand(cmd: CLICommand, flags: Arguments): Promise<void> {
  switch (cmd) {
    case "help":
      printHelp({
        commandName: "genie",
        headline: "A CLI tool to generate data models from UCD (Unicode Character Database) files.",
        usage: "[command] [...flags]",
        tables: {
          "Commands": [
            ["generate", "Bump the version of your project(s)."],
          ],
          "Global Flags": [
            ...GLOBAL_FLAGS,
            ["--version", "Show the version number and exit."],
            ["--help", "Show this help message."],
          ],
        },
      });
      break;
    case "version":

      console.log(`  ${bgGreen(black(` mojis `))} ${green(`v${pkg.version ?? "x.y.z"}`)}`);
      break;
    case "generate": {
      const { runGenerateCmd } = await import("./cmd/generate");
      await runGenerateCmd({
        flags: flags as GenerateCLIArguments["flags"],
      });
      break;
    }
    default:
      throw new Error(`Error running ${cmd} -- no command found.`);
  }
}

export function parseFlags(args: string[]) {
  return yargs(args, {
    alias: {
      commit: ["c"],
      tag: ["t"],
      push: ["p"],
    },
    string: [
      "commit",
      "mode",
      "tag",
      "config",
      "push",
    ],
    array: ["ignore"],
    boolean: ["print-commits"],
    default: {
      mode: "monolith",
      ignore: [],
      printCommits: true,
    },
  });
}

export async function runCLI(args: string[]): Promise<void> {
  try {
    const flags = parseFlags(args);

    const cmd = resolveCommand(flags);
    await runCommand(cmd, flags);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
