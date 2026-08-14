import { BrandBackdrop, SparkStar } from "@/components/BrandBackdrop";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Shared primary control style for error / not-found actions */
export const errorActionClassName = cn(
  buttonVariants({ variant: "default", size: "lg" }),
  "min-w-34 rounded-xl",
);

type ErrorPageFrameProps = {
  /** Small label above the title (e.g. code or category) */
  eyebrow: string;
  title: string;
  description: string;
  /** Actions row: links, buttons */
  children?: React.ReactNode;
};

export function ErrorPageFrame({
  eyebrow,
  title,
  description,
  children,
}: ErrorPageFrameProps) {
  return (
    <main className="relative isolate flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-background px-6 py-16">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-lvh overflow-hidden"
        aria-hidden
      >
        <BrandBackdrop density="soft" />
      </div>

      <div className="relative z-10 w-full max-w-xl">
        <div className="mb-8 flex items-center justify-center gap-3 text-primary">
          <SparkStar className="size-4 animate-twinkle" />
          <span className="h-px w-12 bg-current opacity-40" />
          <SparkStar className="size-4 animate-twinkle [animation-delay:600ms]" />
        </div>

        <Card className="text-center [--card-spacing:--spacing(7)] sm:[--card-spacing:--spacing(9)]">
          <CardHeader className="items-center">
            <Badge variant="outline">{eyebrow}</Badge>
            <CardTitle className="mt-4 text-4xl font-bold leading-[0.95] tracking-[-0.06em] sm:text-5xl">
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          </CardContent>
          {children ? (
            <CardFooter className="justify-center gap-3">{children}</CardFooter>
          ) : null}
        </Card>
      </div>
    </main>
  );
}
