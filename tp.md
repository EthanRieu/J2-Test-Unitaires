## TP4
### Temps 1 

1. Repérer les trois dépendances instanciées en dur dans le service.
  - new BaseDeDonnees() -> instancié 4 fois qui renvoie une erreur si pas disponible, impossible de simuler un compte existant en test
  - new SmtpSender() -> instancié dans debiter() quand le compte passe à découvert. Cela essaye d'envoyer un vrai email via un vrai serveur SMTP qui throwe comme pour new BaseDeDonnees(). Cela plantera également lors d'un test.
  - new Date() -> instancié dans Transaction et dans le message d'email. Temps système pas contrôlable -> impossible de vérifier une date précise dans une assertion. Donc 2 essais sur un même test auront des résultats différents.
------------------------------------------------
2. Extraire une interface pour : horloge, notifications, journal de transactions.
3. Interfaces injectées par le constructeur de CompteService (Horloge, TransactionJournalisee, NotificationService), plus aucun `new` d'infrastructure dans le service.
4. Comportement inchangé (refactoring pur).
5. Commit : "Extraction des seams, comportement inchangé".

### Temps 2

6. Doubles écrits à la main dans heritage.spec.ts :
  - HorlogeStub (stub) -> retourne une date figée passée au constructeur
  - TransactionJournaliseeFake (fake) -> Map<iban, Compte> pour charger/sauver + tableau Transaction[] pour journaliser/listerTransactions
  - NotificationServiceSpy (spy) -> enregistre les envois dans un tableau { destinataire, message }
7. 8 cas de test écrits et passants (npm test -> 8/8) :
  - débit nominal, débit sous découvert (exception + solde inchangé), horodatage (stub), notification découvert (spy, exactement une), solde positif ou nul (spy, aucune), crédit nominal, crédit au-delà du plafond (exception + solde inchangé), relevé trié dans le désordre.
```ethan@MacBook-Pro compte-bancaire % npm test

> compte-bancaire@1.0.0 test
> vitest run


 RUN  v5.0.0 /Users/ethan/Downloads/cours-tests-unitaires/tp/compte-bancaire

 ✓ heritage.spec.ts (8 tests) 5ms
   ✓ debiter (5)
     ✓ débit nominal 1ms
     ✓ débit sous découvert autorisé 0ms
     ✓ horodatage 0ms
     ✓ Notification Découvert 1ms
     ✓ solde_positif_ou_nul 0ms
   ✓ crediter (2)
     ✓ crédit nominal 0ms
     ✓ crédit_auDela_du_SoldeMax 0ms
   ✓ releve (1)
     ✓ Ordre chronologique 0ms

 Test Files  1 passed (1)
      Tests  8 passed (8)
   Start at  14:14:32
   Duration  105ms (transform 60%, import 20%, tests 13%, worker 6%)
```
