import React from "react";

export type OutputReceiver = (content: string, isError: boolean) => void;
export interface LanguageExecutor {
  language: string;
  run: (code: string) => Promise<string>;
  submit: (code: string) => Promise<{ status: number }>;
  getSolution: () => string;
  // Callback before execution starts (for resetting components, etc.)
  onBeforeRun?: () => void;
}

export interface PlaygroundProps {
  initialCode: string;
//   executor: LanguageExecutor;
}

export type logEntry = {content:string, isError:boolean}
