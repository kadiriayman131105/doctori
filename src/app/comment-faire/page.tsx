import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Comment faire — Doctori',
  description: 'Les étapes pour chercher un médecin, réserver, et utiliser l’espace médecin ou secrétariat.',
};

export default function CommentFaire() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-sm font-bold text-fb">Doctori · Casablanca</p>
      <h1 className="mt-2 text-3xl font-bold">Comment faire</h1>
      <p className="mt-3 text-fb-muted">
        Démonstration locale. Les patients n’ont pas de compte. Seuls le médecin et la secrétaire se connectent.
        Les données restent dans ce navigateur.
      </p>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-bold">1. Trouver un médecin</h2>
        <p>Sur l’accueil, cherchez par nom, spécialité (généraliste, dentiste, ortho…) ou quartier. Filtrez cabinet, vidéo, domicile, aujourd’hui, CNSS, CNOPS ou mutuelle. La carte affiche le tarif, la photo et le prochain créneau.</p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-bold">2. Prendre un rendez-vous</h2>
        <p>Ouvrez « Voir les créneaux ». L’agenda de la semaine montre les horaires libres. Cliquez un créneau, indiquez le nom, le mobile et le motif, puis confirmez. Un message WhatsApp reprend la date, l’adresse et le tarif.</p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-bold">3. Entrer dans le cabinet</h2>
        <p>Le bouton « Espace médecin » n’apparaît que hors de l’espace. Une fois dedans, il est remplacé par « Mon profil » pour le médecin connecté.</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Dr Amal Bennani — amal@doctori.ma — mot de passe doctori</li>
          <li>Dr Youssef El Idrissi — youssef@doctori.ma — mot de passe doctori</li>
          <li>Secrétariat — secretaire@doctori.ma — mot de passe doctori</li>
        </ul>
        <p>« Basculer vers secrétaire » ou « Basculer vers médecin » change la vue sans se déconnecter. Utile si le médecin reçoit l’appel lui-même.</p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-bold">4. Ce que voit le médecin</h2>
        <p>Tableau de bord : encaissé, reste à encaisser, patients, graphiques, liste du jour.</p>
        <p>Rendez-vous : agenda interactif. Glissez un créneau pour changer l’heure. Cliquez un horaire vide ou « Nouveau rendez-vous » pour poser une consultation (patient, date, heure, prix). Ouvrez un rendez-vous pour le statut, la remise, le paiement et l’historique.</p>
        <p>Patients : liste, fiche (âge, sexe, téléphone, couverture, maladies, allergies, notes), anciennes visites, « Programmer un contrôle », et « Ajouter un patient ».</p>
        <p>Facturation : tarif, remise, montant payé, payé ou impayé.</p>
        <p>Mon profil : photo, nom, spécialité, diplôme, années d’expérience, description, quartier, adresse, langues, pièces à apporter, prise en charge, modes de visite et prix. Ces informations s’affichent sur la carte d’accueil et sur la fiche publique.</p>
        <p>Horaires : jours ouverts, pause, et un clic pour bloquer un jour férié ou une absence. L’agenda public ne propose que ces plages.</p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-bold">5. Ce que voit la secrétaire</h2>
        <p>Agenda de tout le cabinet : créer, déplacer, changer la date, l’heure, le médecin, le prix, ou supprimer un rendez-vous. Pas de dossier médical ni de facturation.</p>
        <p>Patients : créer, modifier le téléphone, l’âge, la couverture et le médecin assigné, ou supprimer. Un clic sur le nom ouvre l’historique.</p>
        <p>Appel : en haut, cherchez le numéro. Le prochain rendez-vous s’affiche, et « Rappel WhatsApp » renvoie le message au patient.</p>
        <p>Si le créneau est déjà pris, une question demande de continuer. « Bloquer ce jour » ferme l’agenda public de ce médecin pour la date choisie.</p>
      </section>

      <p className="mt-10">
        <Link href="/" className="font-bold text-fb">
          Retour à l’accueil
        </Link>
      </p>
    </main>
  );
}
