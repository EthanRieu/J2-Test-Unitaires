import { describe, it, expect } from "vitest";
import {
  CompteService,
  Compte,
  Transaction,
  OperationRefusee,
  type Horloge,
  type TransactionJournalisee,
  type NotificationService,
} from "./heritage";

class HorlogeStub implements Horloge {
  constructor(private readonly date: Date) {}

  maintenant(): Date {
    return this.date;
  }
}

class NotificationServiceSpy implements NotificationService {
  readonly envois: { destinataire: string; message: string }[] = [];

  envoyer(destinataire: string, message: string): void {
    this.envois.push({ destinataire, message });
  }
}

class TransactionJournaliseeFake implements TransactionJournalisee {
  private readonly comptes = new Map<string, Compte>();
  private readonly transactions: Transaction[] = [];

  constructor(compteInitial: Compte) {
    this.comptes.set(compteInitial.iban, compteInitial);
  }

  charger(iban: string): Compte {
    const compte = this.comptes.get(iban);
    if (!compte) {
      throw new Error(`Compte inconnu : ${iban}`);
    }
    return compte;
  }

  sauver(compte: Compte): void {
    this.comptes.set(compte.iban, compte);
  }

  journaliser(transaction: Transaction): void {
    this.transactions.push(transaction);
  }

  listerTransactions(iban: string): Transaction[] {
    return this.transactions.filter((transaction) => transaction.iban === iban);
  }
}