-- Une deuxième couleur pour le robot.
--
-- `color` peignait tout : corps, jambes, réacteur, antenne, bouche. Les
-- pupilles, elles, étaient codées en dur en bleu — le robot « Ghost » blanc
-- avait les yeux bleus, le robot « Danger » rouge aussi.
--
-- `accent` peint désormais ce qui s'allume : yeux, réacteur, antenne, bouche,
-- témoins. Dix couleurs de corps × dix d'accent font cent combinaisons là où
-- il n'y en avait que dix.
--
-- La valeur par défaut est « Cryo », le cyan du nuancier : proche du bleu qui
-- était codé en dur, et surtout présent dans la palette, pour qu'un enfant qui
-- change d'accent puisse revenir au réglage d'origine.

ALTER TABLE student_avatar
  ADD COLUMN IF NOT EXISTS accent text NOT NULL DEFAULT '#06b6d4';
