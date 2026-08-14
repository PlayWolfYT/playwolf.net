"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function RefError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Card className="mx-auto max-w-xl text-center [--card-spacing:--spacing(7)]">
      <CardHeader>
        <p className="font-mono text-[0.6rem] uppercase tracking-[0.22em] text-primary">
          Something went wrong
        </p>
        <CardTitle className="mt-3 text-3xl font-bold tracking-[-0.055em]">
          Could not load this reference
        </CardTitle>
        <CardDescription className="mx-auto mt-2 max-w-md leading-relaxed">
          The gallery is temporarily unreachable. Trying again usually does it.
        </CardDescription>
      </CardHeader>
      {process.env.NODE_ENV === "development" && error.message ? (
        <CardContent>
          <p className="wrap-break-word font-mono text-[11px] leading-relaxed text-destructive">
            {error.message}
          </p>
        </CardContent>
      ) : null}
      <CardFooter className="justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className={cn(
            buttonVariants({ variant: "default", size: "lg" }),
            "rounded-xl",
          )}
        >
          Try again
        </button>
        <Link
          href="/ref"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "rounded-xl",
          )}
        >
          All characters
        </Link>
      </CardFooter>
    </Card>
  );
}
