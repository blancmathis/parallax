# Kit de relecture

Ce kit sert à recruter et à guider les relecteurs d'un débat. Un débat quitte
l'état « brouillon non relu » quand au moins un partisan déclaré de chaque
position a signé (décision D18 de [02-product.md](../02-product.md)).

## Le débat pilote

**Smartphones à l'école** (`app/src/data/fr/smartphones-schools.json`).
Trois positions, donc six relecteurs : deux par position.

| Position | Relecteurs visés |
| --- | --- |
| Oui — les interdire de la sonnerie du matin à celle du soir | 2 |
| Non — enseigner plutôt un usage maîtrisé | 2 |
| Restreindre en cours, autoriser entre les cours | 2 |

Critère de réussite : six accords écrits. Critère d'arrêt : moins de trois
accords en trois semaines ; on change alors de sujet pilote.

Profils à approcher : enseignants, chefs d'établissement, parents d'élèves
engagés, chercheurs en éducation ou en numérique, associations qui ont pris
position publiquement. Le relecteur doit **défendre** la position qu'il relit.

## Ce que le relecteur signe

Le relecteur lit la page de sa position et signe trois attestations :

1. **Le steelman de ma position** est : fidèle / incomplet / infidèle.
   S'il est incomplet ou infidèle, il dit ce qui manque ou ce qui est faux.
2. **Les extraits** des assertions qui gênent mon camp sont exacts : oui / non,
   avec la liste des extraits contestés.
3. **Le socle commun** (ce que toutes les positions admettent) est acceptable :
   oui / non, avec ses réserves.

Il ne valide ni la vérité des faits, ni les autres positions. Il peut refuser
de signer : le refus et son motif sont publiés, comme une signature.

## Ce qui est publié

Chaque signature est publique et datée :

- nom, ou fonction si le relecteur préfère (« professeure de lettres en
  collège ») ;
- position déclarée ;
- liens d'intérêt (employeur, mandat, association, financement) ;
- verdict sur les trois attestations ;
- date et version du débat relue (identifiant du commit).

Une position sans signature affiche « relecture incomplète ».

## Fiche de signature

```text
Débat : Smartphones à l'école
Version relue (commit) :
Position défendue :
Nom ou fonction (au choix) :
Liens d'intérêt :
1. Steelman de ma position : fidèle / incomplet / infidèle
   Remarques :
2. Extraits des assertions qui gênent mon camp : exacts / contestés
   Extraits contestés :
3. Socle commun : acceptable / non acceptable
   Réserves :
J'accepte que cette fiche soit publiée : oui / non
Date :
```

## Message d'invitation

> Bonjour,
>
> Je prépare Parallax, un dossier public sur des débats qui divisent. Chaque
> page présente les positions sous leur meilleur jour, avec des assertions
> reliées à l'extrait exact de leur source. Le principe : aucune position
> n'est publiée sans qu'un de ses partisans ait vérifié qu'elle est fidèle.
>
> Le premier débat porte sur les smartphones à l'école. Vous avez défendu
> publiquement la position « … ». Accepteriez-vous de relire la page de cette
> position ? Cela prend environ une heure. Vous signez trois points : la
> présentation de votre position est fidèle, les extraits qui gênent votre
> camp sont exacts, le socle commun est acceptable. Votre nom ou votre
> fonction, au choix, apparaît avec votre position et vos liens d'intérêt.
>
> La page en brouillon : <lien>. La méthode : <lien>.
>
> Merci,
> Mathis Blanc, éditeur de Parallax

## Calendrier

| Semaine | Étape |
| --- | --- |
| 1 | Liste de 15 noms par position, envoi des invitations |
| 2 | Relances ; premières lectures |
| 3 | Signatures ; révisions demandées par les relecteurs |
| 4 | Seconde lecture si révision ; publication de la version relue |

L'indemnité (50 € par relecture) dépend du budget ; elle est annoncée dans
l'invitation dès qu'elle est décidée.
