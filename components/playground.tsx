"use client";

import { useState } from "react";

import { CodeEditor } from "@/components/codeEditor";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
} from "@/components/ui/button-group";
import { Button } from "@/components/ui/button";

import { TerminalIcon, PlayIcon, SparkleIcon } from "lucide-react";

import { PlaygroundProps } from "@/types";

export function Playground({ initialCode, executor }: PlaygroundProps) {
  const [code, setCode] = useState(initialCode);

  const [output, setOutput] = useState([]);

  return (
    <div className="flex items-start gap-2">
      <ResizablePanelGroup
        direction="horizontal"
        className="min-h-50 max-w-3xl flex-1 rounded border bg-zinc-900 md:min-w-112.5"
      >
        <ResizablePanel defaultSize={65} className="">
          <CodeEditor onChange={setCode} code={code} />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={35} className="flex flex-col">
          <div className="flex-1 p-1">
            {output.length == 0 && (
              <p className="text-muted-foreground text-base italic">
                &gt; {/* '>' */}
                Matokeo yatatokea hapa
              </p>
            )}
          </div>
          <div className="bg-primary rounded-t/ flex w-full items-center gap-2 px-2 py-1">
            <TerminalIcon size={14} />
            <p className="text-xs">Terminali</p>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      <ButtonGroup orientation={"vertical"} className="dark:bg-zinc-900/">
        <Button size={"icon"}>
          <PlayIcon className="text-primary-foreground" />
        </Button>
        <Button disabled variant={"outline"} size={"icon"}>
          <SparkleIcon className="text-foreground" />
        </Button>
      </ButtonGroup>
    </div>
  );
}
