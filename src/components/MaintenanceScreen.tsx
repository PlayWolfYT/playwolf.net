import { ConstructionIcon } from "lucide-react";

import { BrandBackdrop, SparkStar } from "@/components/BrandBackdrop";
import { Blaze } from "@/components/canvasui/Blaze";
import { FlameWrap } from "@/components/canvasui/FlameWrap";
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
    <main className="relative isolate min-h-dvh overflow-hidden bg-background">
      <Blaze
        className="pointer-events-none absolute inset-0 h-dvh w-full overflow-hidden"
        style={{ position: "absolute" }}
        height={0.86}
        distortion={0.72}
        distortionScale={0.65}
        speed={0.82}
        sparks={0.9}
        sparkDensity={1.65}
        sparkSize={1.1}
        layers={5}
        smoke={0.68}
        glow={1.65}
        sparkColor={[0.35, 0.86, 1]}
        smokeColor={[0.08, 0.3, 0.9]}
      >
        <div className="relative h-full overflow-hidden">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-lvh overflow-hidden"
            aria-hidden
          >
            <BrandBackdrop density="full" />
          </div>

          <div
            className="pointer-events-none absolute left-[8%] top-[14%] size-64 rounded-full border border-glow-500/20 animate-drift sm:size-96"
            aria-hidden
          />
          <SparkStar className="pointer-events-none absolute right-[12%] top-[18%] size-8 text-glow-400/65 animate-twinkle sm:size-12" />
          <SparkStar className="pointer-events-none absolute bottom-[16%] left-[14%] size-5 text-glow-300/45 animate-twinkle [animation-delay:1.2s]" />
        </div>
      </Blaze>

      <div className="relative z-10 flex min-h-dvh items-center justify-center px-4 py-32 sm:px-8 sm:py-40">
        <FlameWrap
          className="relative z-10 w-full max-w-2xl"
          color={[0.18, 0.7, 1]}
          intensity={0.78}
          height={120}
          spread={18}
          radius={30}
          speed={0.45}
          scale={0.68}
          turbulence={0.68}
          turbulenceScale={0.75}
          turbulenceReach={28}
          sparks={1.7}
          sparkSize={0.45}
          sparkDensity={1.25}
          sparkSpeed={1.15}
          rim={2.4}
          melt={3}
          distortion={8}
          smoke={1.2}
          ember={1.8}
          scorch={0.35}
        >
          <Card className="relative w-full overflow-hidden rounded-3xl border border-glow-500/25 bg-card/94 shadow-glow-lg [--card-spacing:--spacing(7)] sm:[--card-spacing:--spacing(10)]">
            <div
              className="pointer-events-none absolute inset-x-12 top-0 h-px bg-linear-to-r from-transparent via-glow-400/90 to-transparent shadow-[0_0_24px_rgb(var(--accent-500)/0.75)]"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -right-24 top-24 size-72 rounded-full bg-glow-500/12 blur-3xl"
              aria-hidden
            />
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <Wordmark />
                <Badge variant="secondary">
                  <span className="size-1.5 animate-pulse rounded-full bg-secondary-foreground" />
                  Site maintenance
                </Badge>
              </div>
              <CardTitle className="mt-10 text-5xl font-bold leading-[0.88] tracking-[-0.07em] sm:text-7xl">
                In maintenance
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              <p className="max-w-xl whitespace-pre-line text-base leading-relaxed text-muted-foreground">
                {message ?? "We’re making a few improvements behind the scenes."}
              </p>

              <div className="relative overflow-hidden rounded-2xl border border-glow-500/25 bg-glow-500/8 p-4 shadow-inner-glow">
                <div className="relative flex items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-glow-500/15 text-glow-300">
                    <ConstructionIcon aria-hidden />
                  </span>
                  <div>
                    <p className="font-display text-sm font-semibold">
                      Work is underway
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      The site will be available again once maintenance is complete.
                    </p>
                  </div>
                </div>
              </div>
              <MaintenanceBackButton />
            </CardContent>

            <CardFooter className="flex-col items-start">
              <p className="font-mono text-[0.58rem] uppercase tracking-[0.2em] text-muted-foreground">
                © <span suppressHydrationWarning>{new Date().getFullYear()}</span>{" "}
                playwolf.net
              </p>
            </CardFooter>
          </Card>
        </FlameWrap>
      </div>
    </main>
  );
}
