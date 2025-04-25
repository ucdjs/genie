import type { CLIArguments } from "../cli-utils";
import { GLOBAL_FLAGS, printHelp } from "../cli-utils";

export interface GenerateCLIArguments {
  flags: CLIArguments<{
    config: string;
    mode: string;
    commit: string | false;
    tag: string | false;
    sign: boolean;
    push: boolean;
    printCommits: boolean;
  }>;
}

export async function runGenerateCmd({ flags }: GenerateCLIArguments) {
  if (flags?.help || flags?.h) {
    printHelp({
      headline: "Generate Command",
      commandName: "genie generate",
      usage: "[...flags]",
      tables: {
        Flags: [
          ...GLOBAL_FLAGS,
          ["--help (-h)", "See all available flags."],
        ],
      },
    });
    return;
  }

  console.log("generate command");
}
