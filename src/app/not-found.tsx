import Link from "next/link";
import { ErrorPageFrame, errorActionClassName } from "@/components/ErrorPageFrame";

export default function NotFound() {
  return (
    <ErrorPageFrame
      eyebrow="404 — Not found"
      title={"This page isn't here"}
      description="The link may be wrong, or the page may have moved. Double-check the URL, or head back to the home page."
    >
      <Link href="/" className={errorActionClassName}>
        Back home
      </Link>
    </ErrorPageFrame>
  );
}
