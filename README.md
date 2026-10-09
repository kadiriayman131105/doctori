# Doctori

Logiciel de cabinet médical, en français. Un médecin achète son bureau. Son secrétariat travaille sur le **même agenda**. Les patients n’ont pas de compte et ne prennent pas rendez-vous eux-mêmes.

C’est une démonstration : médecins fictifs, tout reste dans le `localStorage` de ce navigateur. Pas encore de Mongo. Un autre ordinateur ou un autre navigateur repart des données d’exemple.

## Lancer

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000). La page d’accueil est la connexion.

```bash
npm run build
npm start
```

## Comptes de démo

Mot de passe partout : `doctori`

| Qui | E-mail |
| --- | --- |
| Dr Amal Bennani | `amal@doctori.ma` |
| Secrétariat d’Amal | `secretaire@doctori.ma` |
| Dr Youssef El Idrissi | `youssef@doctori.ma` |
| Secrétariat de Youssef | `sec.youssef-el-idrissi@doctori.ma` |

Les autres médecins du jeu suivent le même schéma : `{identifiant}@doctori.ma` et `sec.{identifiant}@doctori.ma`. Exemple : `sara-tazi@doctori.ma`.

Dans la barre du haut, **Secrétariat** / **Médecin** change de vue **sans** se déconnecter. On reste sur le même médecin.

## Bureau

La barre (survol sur ordinateur, clic sur téléphone) ouvre les écrans.

**Médecin** — Cabinet : tableau de bord, rendez-vous, patients. Gestion : facturation, documents. Le nom ouvre le profil et la sortie.

**Secrétariat** — Accueil : salle d’attente, rappels. Planning : agenda, patients, liste d’attente. Gestion : facturation, caisse du jour, documents.

On cherche un patient par **nom ou téléphone**. Un numéro déjà connu ouvre la fiche existante au lieu d’en créer une deuxième.

## Confirmations

| Action | Interface |
| --- | --- |
| Supprimer, annuler un RDV, clôturer la caisse, jours fériés | Pop-up *Voulez-vous vraiment* |
| Encaisser | Pop-up (argent) |
| Chevauchement de créneau | Pop-up *Continuer quand même* |
| Note, constantes, Arrivé, petite fiche | Toast vert **Enregistré** (2 s, **Annuler** si c’est réversible) |

## Agenda et visite

Filtrer avec **Du** / **Au**. Un rendez-vous déplacé hors de l’intervalle recentre le calendrier.

Sur une visite : tension, poids, température, note, remise, paiement. **Contrôle dans 15 jours** pose le prochain créneau (même heure ; jour ouvré suivant si le cabinet est fermé).

**Jours fériés 2026** : menu en tête de Rendez-vous. On coche, puis **Appliquer la sélection**. Le secrétariat ne ferme que les jours de son médecin.

## Documents et caisse

Facture, ordonnance (un médicament par ligne), certificat, feuille de soins. **Enregistrer sur la fiche** les lie au rendez-vous. **Documents enregistrés** les retrouve sur la fiche patient.

La caisse du jour sépare espèces, carte et reste dû, puis clôture. La liste d’attente sert à rappeler quelqu’un dès qu’un créneau se libère.

Les rappels WhatsApp ouvrent **wa.me** avec le texte déjà écrit. Pas d’API payante.

## Sauvegardes (avant Mongo)

- **Sauvegarde du jour** : JSON ou PDF des visites d’aujourd’hui.
- **Sauvegarde du cabinet** : JSON de tout (patients, RDV, horaires, caisse, liste d’attente, profil). **Importer** remplace les données de ce navigateur (confirmation).

Vider le cache du navigateur efface le cabinet si aucune copie n’a été exportée.

## Pile

Next.js 15, React 19, TypeScript, Tailwind CSS, Bootstrap 5 (barre de navigation), FullCalendar, lucide-react.
