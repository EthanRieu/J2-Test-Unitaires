// ---------------------------------------------------------------------------
// TP4 : Code hérité. VOLONTAIREMENT non testable.
//
// Ne cherchez pas l'erreur : il n'y en a pas. Le problème n'est pas que ce code
// soit faux, c'est qu'il est IMPOSSIBLE à tester unitairement en l'état.
// Votre premier travail est de comprendre pourquoi, avant de toucher à quoi que
// ce soit. Lisez tp/tp4-compte-bancaire.md.
// ---------------------------------------------------------------------------

const DECOUVERT_AUTORISE = -500;
const PLAFOND_DEPOT = 10_000;

export interface Horloge {
  maintenant(): Date;
}

export interface TransactionJournalisee {
  charger(iban: string): Compte;
  sauver(compte: Compte): void;
  journaliser(transaction: Transaction): void;
  listerTransactions(iban: string): Transaction[];
}

export interface NotificationService {
  envoyer(destinataire: string, message: string): void;
}

export class CompteService {
  constructor(private readonly horloge: Horloge,
    private readonly transactionJournalisee: TransactionJournalisee,
    private readonly notificationService: NotificationService) { }

  debiter(iban: string, montant: number): void {
    const compte = this.transactionJournalisee.charger(iban);
    const nouveauSolde = compte.solde - montant;

    if (nouveauSolde < DECOUVERT_AUTORISE) {
      throw new OperationRefusee("Découvert autorisé dépassé");
    }

    compte.solde = nouveauSolde;
    this.transactionJournalisee.sauver(compte);
    this.transactionJournalisee.journaliser(new Transaction(iban, -montant, this.horloge.maintenant()));

    if (nouveauSolde < 0) {
      this.notificationService.envoyer(
        compte.email,
        `Votre compte est à découvert depuis le ${this.horloge.maintenant().toISOString()}`,
      );
    }
  }

  crediter(iban: string, montant: number): void {
    const compte = this.transactionJournalisee.charger(iban);
    const nouveauSolde = compte.solde + montant;

    if (nouveauSolde > PLAFOND_DEPOT) {
      throw new OperationRefusee("Plafond de dépôt dépassé");
    }

    compte.solde = nouveauSolde;
    this.transactionJournalisee.sauver(compte);
    this.transactionJournalisee.journaliser(new Transaction(iban, montant, this.horloge.maintenant()));
  }

  releve(iban: string): Transaction[] {
    const transactions = this.transactionJournalisee.listerTransactions(iban);
    return transactions.sort((a, b) => a.date.getTime() - b.date.getTime());
  }
}

// --- Infrastructure fournie : vous n'avez pas à la réécrire -----------------

export class Compte {
  constructor(
    public readonly iban: string,
    public readonly email: string,
    public solde: number,
  ) {}
}

export class Transaction {
  constructor(
    public readonly iban: string,
    public readonly montant: number,
    public readonly date: Date,
  ) {}
}

export class OperationRefusee extends Error {}
