import { notFound } from "next/navigation";
import { getCharacter, getCharacterParams } from "@/lib/references";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ character: string }>;
};

export function generateStaticParams() {
  return getCharacterParams();
}

/** Guard: 404 for unknown character slugs. The character name itself lives
 *  in the sticky profile bar rendered by the pages. */
export default async function CharacterLayout({
  children,
  params,
}: LayoutProps) {
  const { character: characterSlug } = await params;
  if (!getCharacter(characterSlug)) notFound();

  return children;
}
