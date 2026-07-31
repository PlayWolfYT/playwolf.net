import { notFound } from "next/navigation";
import { getCharacter } from "@/lib/references";

type LayoutProps = {
  children: React.ReactNode;
  /** Lightbox slot — empty unless an artwork URL was intercepted. */
  modal: React.ReactNode;
  params: Promise<{ character: string }>;
};

/** Guard: 404 for unknown character slugs. The character name itself lives
 *  in the sticky profile bar rendered by the pages. */
export default async function CharacterLayout({
  children,
  modal,
  params,
}: LayoutProps) {
  const { character: characterSlug } = await params;
  if (!(await getCharacter(characterSlug))) notFound();

  return (
    <>
      {children}
      {modal}
    </>
  );
}
