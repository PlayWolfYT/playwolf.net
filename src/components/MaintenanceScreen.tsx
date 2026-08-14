import { BrandBackdrop } from "@/components/BrandBackdrop";
import { MaintenanceBackButton } from "@/components/MaintenanceBackButton";
import { Wordmark } from "@/components/site/Wordmark";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function MaintenanceScreen({ message }: { message?: string }) {
  return (
    <main className="relative isolate flex min-h-dvh items-center justify-center overflow-hidden bg-background px-4 py-12 sm:px-8">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-lvh overflow-hidden"
        aria-hidden
      >
        <BrandBackdrop density="full" />
      </div>

      <Card className="relative z-10 w-full max-w-2xl [--card-spacing:--spacing(7)] sm:[--card-spacing:--spacing(10)]">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Wordmark />
            <Badge variant="secondary">
              <span className="size-1.5 animate-pulse rounded-full bg-secondary-foreground" />
              Maintenance
            </Badge>
          </div>
          <CardTitle className="mt-10 text-5xl font-bold leading-[0.88] tracking-[-0.07em] sm:text-7xl">
            The archive is between editions.
          </CardTitle>
        </CardHeader>

        <CardContent>
          <p className="max-w-xl whitespace-pre-line text-base leading-relaxed text-muted-foreground">
            {message ??
              "A little maintenance is happening behind the scenes. The site will be back after the next studio pass."}
          </p>
        </CardContent>

        <CardFooter className="flex-col items-start">
          <p className="font-mono text-[0.58rem] uppercase tracking-[0.2em] text-muted-foreground">
            © <span suppressHydrationWarning>{new Date().getFullYear()}</span>{" "}
            playwolf.net
          </p>
        </CardFooter>
      </Card>

      <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2">
        <MaintenanceBackButton />
      </div>
    </main>
  );
}
