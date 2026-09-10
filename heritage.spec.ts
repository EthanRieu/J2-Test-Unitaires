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

describe("debiter", () => {
  it("débit nominal", () => {
    // Arrange
    const compte = new Compte("FR1234567890", "nominal@gmail.com", 1000);
    const journal = new TransactionJournaliseeFake(compte);
    const horloge = new HorlogeStub(new Date("2026-03-14"));
    const notification = new NotificationServiceSpy();
    const service = new CompteService(horloge, journal, notification);

    // Act
    service.debiter(compte.iban, 500);

    // Assert
    expect(journal.charger(compte.iban).solde).toBe(500);
  });

  it("débit sous découvert autorisé", () => {
    // Arrange
    const compte = new Compte("FR1234567890", "nominal@gmail.com", 1000);
    const journal = new TransactionJournaliseeFake(compte);
    const horloge = new HorlogeStub(new Date("2026-03-14"));
    const notification = new NotificationServiceSpy();
    const service = new CompteService(horloge, journal, notification);

    // Act + Assert
    expect(() => service.debiter(compte.iban, 1600)).toThrow(OperationRefusee);

    // Assert pt2
    expect(journal.charger(compte.iban).solde).toBe(1000);
  });

  it("horodatage", () => {
    // Arrange
    const compte = new Compte("FR1234567890", "nominal@gmail.com", 1000);
    const journal = new TransactionJournaliseeFake(compte);
    const horloge = new HorlogeStub(new Date("2026-03-14"));
    const notification = new NotificationServiceSpy();
    const service = new CompteService(horloge, journal, notification);
    
    // Act
    service.debiter(compte.iban, 500);

    // Assert
    expect(journal.listerTransactions(compte.iban)[0].date).toBe(horloge.maintenant());
  });

  it("Notification Découvert", () => {
    // Arrange
    const compte = new Compte("FR1234567890", "nominal@gmail.com", 1000);
    const journal = new TransactionJournaliseeFake(compte);
    const horloge = new HorlogeStub(new Date("2026-03-14"));
    const notification = new NotificationServiceSpy();
    const service = new CompteService(horloge, journal, notification);

    // Act
    service.debiter(compte.iban, 1200);

    // Assert
    expect(notification.envois).toHaveLength(1);
    expect(notification.envois[0].destinataire).toBe(compte.email);
    expect(notification.envois[0].message).toBe(`Votre compte est à découvert depuis le ${horloge.maintenant().toISOString()}`);
  });

  it("solde_positif_ou_nul", () => {
    // Arrange
    const compte = new Compte("FR1234567890", "nominal@gmail.com", 1000);
    const journal = new TransactionJournaliseeFake(compte);
    const horloge = new HorlogeStub(new Date("2026-03-14"));
    const notification = new NotificationServiceSpy();
    const service = new CompteService(horloge, journal, notification);

    // Act
    service.debiter(compte.iban, 1000);

    // Assert
    expect(journal.listerTransactions(compte.iban)[0].montant).toBe(-1000);
    expect(notification.envois).toHaveLength(0);
  });
});

describe('crediter', () => {
  it("crédit nominal", () => {
    // Arrange
    const compte = new Compte("FR1234567890", "nominal@gmail.com", 1000);
    const journal = new TransactionJournaliseeFake(compte);
    const horloge = new HorlogeStub(new Date("2026-03-14"));
    const notification = new NotificationServiceSpy();
    const service = new CompteService(horloge, journal, notification);
    
    // Act
    service.crediter(compte.iban, 1000);

    // Assert
    expect(journal.listerTransactions(compte.iban)[0].montant).toBe(1000);
    expect(notification.envois).toHaveLength(0);
  });

  it("crédit_auDela_du_SoldeMax", () => {
    // Arrange
    const compte = new Compte("FR1234567890", "nominal@gmail.com", 9500);
    const journal = new TransactionJournaliseeFake(compte);
    const horloge = new HorlogeStub(new Date("2026-03-14"));
    const notification = new NotificationServiceSpy();
    const service = new CompteService(horloge, journal, notification);

    // Act + Assert
    expect(() => service.crediter(compte.iban, 1000)).toThrow(OperationRefusee);

    // Assert
    expect(journal.charger(compte.iban).solde).toBe(9500);
    expect(journal.listerTransactions(compte.iban)).toHaveLength(0);
    expect(notification.envois).toHaveLength(0);
  });
});

describe('releve', () => {
  it("Ordre chronologique", () => {
    // Arrange
    const compte = new Compte("FR1234567890", "nominal@gmail.com", 1000);
    const journal = new TransactionJournaliseeFake(compte);
    const horloge = new HorlogeStub(new Date("2026-03-14"));
    const notification = new NotificationServiceSpy();
    const service = new CompteService(horloge, journal, notification);

    const ancienne = new Transaction(compte.iban, -50, new Date("2026-01-01"));
    const recente = new Transaction(compte.iban, 200, new Date("2026-06-01"));
    const intermediaire = new Transaction(compte.iban, 100, new Date("2026-03-10"));

    journal.journaliser(recente);
    journal.journaliser(ancienne);
    journal.journaliser(intermediaire);

    // Act
    const releve = service.releve(compte.iban);

    // Assert
    expect(releve).toEqual([ancienne, intermediaire, recente]);
  });
});
  