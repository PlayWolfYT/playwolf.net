type IconProps = { className?: string };

export function XIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function BlueskyIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" fill="currentColor" className={className} aria-hidden>
      <path d="M20,19.7c-1.6-3.1-5.9-8.8-9.9-11.6C6.2,5.4,4.8,5.9,3.8,6.3C2.7,6.8,2.5,8.5,2.5,9.5s0.6,8.2,0.9,9.4 c1.2,4,5.4,5.3,9.3,4.9c0.2,0,0.4-0.1,0.6-0.1c-0.2,0-0.4,0.1-0.6,0.1C7,24.7,1.9,26.8,8.6,34.2c7.3,7.6,10-1.6,11.4-6.3 c1.4,4.7,3,13.5,11.3,6.3c6.2-6.3,1.7-9.5-4-10.3c-0.2,0-0.4,0-0.6-0.1c0.2,0,0.4,0.1,0.6,0.1c3.9,0.4,8.1-0.9,9.3-4.9 c0.4-1.2,0.9-8.4,0.9-9.4s-0.2-2.7-1.3-3.2c-1-0.4-2.4-0.9-6.3,1.8C25.9,10.9,21.6,16.7,20,19.7z"></path>
    </svg>
  );
}

export function InstagramIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function TelegramIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.061 3.345-.479.329-.913.489-1.302.481-.428-.009-1.252-.242-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

export function DiscordIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M20.317 4.369A19.79 19.79 0 0 0 15.432 3a13.9 13.9 0 0 0-.617 1.253 18.37 18.37 0 0 0-5.63 0A13.7 13.7 0 0 0 8.56 3a19.74 19.74 0 0 0-4.886 1.372C.554 9.045-.32 13.6.113 18.09a19.9 19.9 0 0 0 6.026 3.043c.485-.66.917-1.362 1.29-2.099a12.9 12.9 0 0 1-2.032-.977c.171-.124.338-.253.499-.386a14.2 14.2 0 0 0 12.208 0c.163.135.33.264.499.386-.648.382-1.33.71-2.037.978.372.736.804 1.438 1.29 2.098a19.9 19.9 0 0 0 6.03-3.042c.508-5.211-.869-9.725-3.569-13.722ZM8.02 15.331c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.428 2.157-2.428 1.21 0 2.176 1.095 2.156 2.428 0 1.334-.955 2.42-2.156 2.42Zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.428 2.157-2.428 1.21 0 2.176 1.095 2.156 2.428 0 1.334-.946 2.42-2.156 2.42Z" />
    </svg>
  );
}

export function EmailIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

/**
 * Brand icons sourced from `public/icons/<name>.svg`, recolored to the current
 * text color via a CSS mask so they match the inline icons and hover states.
 * Replace the SVG files to change the artwork.
 */
function MaskIcon({ src, className }: { src: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={`${className ?? ""} inline-block bg-current`}
      style={{
        maskImage: `url(${src})`,
        WebkitMaskImage: `url(${src})`,
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskPosition: "center",
        maskSize: "contain",
        WebkitMaskSize: "contain",
      }}
    />
  );
}

export function FurAffinityIcon({ className }: IconProps) {
  return <MaskIcon src="/icons/furaffinity.svg" className={className} />;
}

export function VGenIcon({ className }: IconProps) {
  return <MaskIcon src="/icons/vgen.svg" className={className} />;
}

export function LinktreeIcon({ className }: IconProps) {
  return <MaskIcon src="/icons/linktree.svg" className={className} />;
}

export function KofiIcon({ className }: IconProps) {
  return <MaskIcon src="/icons/kofi.svg" className={className} />;
}

export function PatreonIcon({ className }: IconProps) {
  return <MaskIcon src="/icons/patreon.svg" className={className} />;
}

export function BoostyIcon({ className }: IconProps) {
  return <MaskIcon src="/icons/boosty.svg" className={className} />;
}

export function TrelloIcon({ className }: IconProps) {
  return <MaskIcon src="/icons/trello.svg" className={className} />;
}

export function GlobeIcon({ className }: IconProps) {
  return <MaskIcon src="/icons/globe.svg" className={className} />;
}
