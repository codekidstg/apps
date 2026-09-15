import AlerteMessages from "./AlerteMessages";
import { compterBoiteDirection } from "@/lib/contact/boite";

/** L'alerte qui va chercher elle-même ses compteurs : un tableau de bord n'a qu'à la poser. */
export default async function AlerteBoiteDirection({ href }: { href: string }) {
  const { aTraiter, enRetard } = await compterBoiteDirection();
  return <AlerteMessages aTraiter={aTraiter} enRetard={enRetard} href={href} />;
}
