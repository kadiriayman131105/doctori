# Doctori

Annuaire et prise de rendez-vous pour des cabinets de Casablanca. Interface en français. Les médecins et les patients sont fictifs : c’est une démo qui tourne dans le navigateur, sans serveur métier.

Les patients n’ont pas de compte. Seuls le médecin et la secrétaire se connectent. Rendez-vous, fiches, horaires et modifications de profil restent dans le `localStorage` de ce navigateur. Un autre ordinateur, ou un autre navigateur, repart des données de démonstration.

## Lancer

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Comptes de démo

Mot de passe pour les trois : `doctori`

| Rôle | E-mail |
| --- | --- |
| Dr Amal Bennani, généraliste, Maarif | `amal@doctori.ma` |
| Dr Youssef El Idrissi, cardiologue, Racine | `youssef@doctori.ma` |
| Secrétariat | `secretaire@doctori.ma` |

Le bouton **Espace médecin** n’apparaît que hors de l’espace. Une fois connecté, le médecin voit **Mon profil**. **Basculer vers secrétaire** / **Basculer vers médecin** change la vue sans déconnexion.

## Parcours

**Public.** Recherche par nom, spécialité ou quartier. Filtres cabinet, vidéo, domicile, aujourd’hui, CNSS, CNOPS, mutuelle. La fiche montre le tarif, le diplôme et un agenda de créneaux libres. La confirmation ouvre WhatsApp.

**Médecin.** Tableau de bord, agenda, patients, facturation. Historique d’un patient et programmation d’un contrôle. Le profil (photo, diplôme, tarif, adresse, langues) se reflète sur la carte d’accueil et la fiche publique. Les horaires, la pause et les jours bloqués limitent les créneaux publics.

**Secrétariat.** Agenda de tout le cabinet, création et déplacement de rendez-vous, patients, prix, médecin assigné. Recherche par numéro de téléphone, prochain rendez-vous, rappel WhatsApp en un bouton. Une absence se bloque en un clic.

Un créneau déjà pris demande confirmation avant d’être doublé. Modifier ou supprimer demande aussi confirmation.

Le détail des gestes est aussi dans l’application, page **Comment faire**.

## Pile

Next.js 15, React 19, TypeScript, Tailwind CSS, FullCalendar, lucide-react.

```bash
npm run build
npm start
```
