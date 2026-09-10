// ---------------------------------------------------------------------------
// TP4 : Code hérité. VOLONTAIREMENT non testable.
//
// Ne cherchez pas l'erreur : il n'y en a pas. Le problème n'est pas que ce code
// soit faux, c'est qu'il est IMPOSSIBLE à tester unitairement en l'état.
// Votre premier travail est de comprendre pourquoi, avant de toucher à quoi que
// ce soit. Lisez tp/tp4-compte-bancaire.md.
// ---------------------------------------------------------------------------

import java.util.*;

public class CompteService {

    private static final int DECOUVERT_AUTORISE = -500;
    private static final int PLAFOND_DEPOT      = 10_000;

    public void debiter(String iban, int montant) {
        Compte compte = new BaseDeDonnees().charger(iban);
        int nouveauSolde = compte.solde() - montant;

        if (nouveauSolde < DECOUVERT_AUTORISE) {
            throw new OperationRefusee("Découvert autorisé dépassé");
        }

        compte.fixerSolde(nouveauSolde);
        new BaseDeDonnees().sauver(compte);
        new BaseDeDonnees().journaliser(new Transaction(iban, -montant, new Date()));

        if (nouveauSolde < 0) {
            new SmtpSender().envoyer(
                compte.email(),
                "Votre compte est à découvert depuis le " + new Date());
        }
    }

    public void crediter(String iban, int montant) {
        Compte compte = new BaseDeDonnees().charger(iban);
        int nouveauSolde = compte.solde() + montant;

        if (nouveauSolde > PLAFOND_DEPOT) {
            throw new OperationRefusee("Plafond de dépôt dépassé");
        }

        compte.fixerSolde(nouveauSolde);
        new BaseDeDonnees().sauver(compte);
        new BaseDeDonnees().journaliser(new Transaction(iban, montant, new Date()));
    }

    public List<Transaction> releve(String iban) {
        List<Transaction> transactions = new BaseDeDonnees().transactionsDe(iban);
        transactions.sort(Comparator.comparing(Transaction::date));
        return transactions;
    }
}

// --- Infrastructure fournie : vous n'avez pas à la réécrire -----------------

class Compte {
    private final String iban;
    private final String email;
    private int solde;

    Compte(String iban, String email, int solde) {
        this.iban = iban; this.email = email; this.solde = solde;
    }
    String iban()  { return iban; }
    String email() { return email; }
    int solde()    { return solde; }
    void fixerSolde(int s) { this.solde = s; }
}

record Transaction(String iban, int montant, Date date) { }

class OperationRefusee extends RuntimeException {
    OperationRefusee(String message) { super(message); }
}

/** Se connecte à une vraie base PostgreSQL. Indisponible depuis un test. */
class BaseDeDonnees {
    Compte charger(String iban)                  { throw new UnsupportedOperationException("PostgreSQL"); }
    void   sauver(Compte compte)                 { throw new UnsupportedOperationException("PostgreSQL"); }
    void   journaliser(Transaction transaction)  { throw new UnsupportedOperationException("PostgreSQL"); }
    List<Transaction> transactionsDe(String iban){ throw new UnsupportedOperationException("PostgreSQL"); }
}

/** Envoie un VRAI mail. Chaque exécution de test enverrait un message réel. */
class SmtpSender {
    void envoyer(String destinataire, String message) {
        throw new UnsupportedOperationException("smtp.banque.fr:587");
    }
}
