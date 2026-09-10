## TP4
### Temps 1 

1. Repérer les trois dépendances instanciées en dur dans le service.
  - new BaseDeDonnees() -> instancié 4 fois qui renvoie une erreur si pas disponible, impossible de simuler un compte existant en test
  - new SmtpSender() -> instancié dans debiter() quand le compte passe à découvert. Cela essaye d'envoyer un vrai email via un vrai serveur SMTP qui throwe comme pour new BaseDeDonnees(). Cela plantera également lors d'un test.
  - new Date() -> instancié dans Transaction et dans le message d'email. Temps système pas contrôlable -> impossible de vérifier une date précise dans une assertion. Donc 2 essais sur un même test auront des résultats différents.
------------------------------------------------
2. Extraire une interface pour : horloge, notifications, journal de transactions.
