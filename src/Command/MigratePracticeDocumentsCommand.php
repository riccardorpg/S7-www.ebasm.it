<?php

namespace App\Command;

use App\Entity\Master\Company;
use App\Entity\Slave\PracticeDocument;
use App\Service\CompanyService;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Tools\SchemaTool;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

/**
 * Migrazione una-tantum per il punto 12: gli allegati passano dall'elenco piatto sotto
 * la pratica alle righe documentali per tipo (eb_s_practice_document).
 *
 * DA LANCIARE PRIMA di `app:sync-slave-schema`, che rimuove le vecchie colonne di
 * eb_s_document (practice_id, requested, status, document_type_id).
 *
 * Cosa fa, per ogni agenzia:
 *  - crea la tabella eb_s_practice_document e la colonna practice_document_id se mancano;
 *  - per ogni allegato crea (o riusa) la riga documentale della pratica, agganciandola al
 *    tipo di catalogo se l'allegato ne aveva uno, altrimenti a un tipo "fuori catalogo"
 *    identificato dal nome dell'allegato;
 *  - riporta sulla riga lo stato del vecchio allegato (verificato → verificato, altrimenti
 *    da verificare se il file c'è, da caricare se manca) e `visible` dal flag "richiesto";
 *  - converte il vecchio tipo pratica testuale nel flag mutuo (il testo "Mutuo" → con mutuo).
 */
#[AsCommand(
    name: 'app:migrate-practice-documents',
    description: 'Converte gli allegati piatti in righe documentali per tipo (una tantum, prima di app:sync-slave-schema)'
)]
class MigratePracticeDocumentsCommand extends Command
{
    public function __construct(
        private readonly ManagerRegistry $registry,
        private readonly CompanyService $companyService,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addOption('dry-run', null, InputOption::VALUE_NONE, 'Mostra cosa farebbe senza scrivere nulla');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $dryRun = (bool) $input->getOption('dry-run');

        $companies = $this->registry->getManager('master')->getRepository(Company::class)->findAll();
        if ($companies === []) {
            $io->warning('Nessuna agenzia registrata.');

            return Command::SUCCESS;
        }

        $errors = 0;
        foreach ($companies as $company) {
            $dbName = (string) $company->getDbName();
            $io->section(sprintf('%s (%s) → %s', $company->getName(), $company->getCode(), $dbName));

            try {
                $em = $this->companyService->pointSlaveToDbName($dbName);
                $this->migrateCompany($em, $io, $dryRun);
            } catch (\Throwable $e) {
                ++$errors;
                $io->error(sprintf('Errore su %s: %s', $dbName, $e->getMessage()));
            }
        }

        if ($errors > 0) {
            $io->warning(sprintf('Completato con %d errori.', $errors));

            return Command::FAILURE;
        }

        $io->success('Allegati convertiti. Ora lancia `app:sync-slave-schema`.');

        return Command::SUCCESS;
    }

    private function migrateCompany(EntityManagerInterface $em, SymfonyStyle $io, bool $dryRun): void
    {
        $conn = $em->getConnection();
        $schema = $conn->createSchemaManager();

        if (!$schema->tablesExist(['eb_s_document'])) {
            $io->text('Nessuna tabella allegati: niente da fare.');

            return;
        }

        $columns = array_map(static fn ($c) => $c->getName(), $schema->listTableColumns('eb_s_document'));
        if (!in_array('practice_id', $columns, true)) {
            $io->text('Allegati già collegati alle righe documentali: migrazione non necessaria.');

            return;
        }

        $rows = $conn->fetchAllAssociative('SELECT id, practice_id, document_type_id, name, requested, status, storage_path FROM eb_s_document ORDER BY id');
        $practiceRows = $conn->fetchAllAssociative('SELECT id, type FROM eb_s_practice');

        if ($dryRun) {
            $io->text(sprintf('%d allegati e %d pratiche da convertire (dry-run).', count($rows), count($practiceRows)));

            return;
        }

        if (!$schema->tablesExist(['eb_s_practice_document'])) {
            (new SchemaTool($em))->createSchema([$em->getClassMetadata(PracticeDocument::class)]);
            $io->text('Creata tabella eb_s_practice_document.');
        }
        if (!in_array('practice_document_id', $columns, true)) {
            $conn->executeStatement('ALTER TABLE eb_s_document ADD practice_document_id BIGINT DEFAULT NULL');
            $io->text('Aggiunta colonna practice_document_id.');
        }
        if (!in_array('mortgage', array_map(static fn ($c) => $c->getName(), $schema->listTableColumns('eb_s_practice')), true)) {
            $conn->executeStatement('ALTER TABLE eb_s_practice ADD mortgage TINYINT(1) DEFAULT 0 NOT NULL');
            $io->text('Aggiunta colonna mortgage su eb_s_practice.');
        }

        // 12.2.4: il vecchio tipo testuale "Mutuo" diventa il flag con mutuo.
        $withMortgage = 0;
        foreach ($practiceRows as $practiceRow) {
            if (stripos((string) $practiceRow['type'], 'mutuo') !== false) {
                $conn->executeStatement('UPDATE eb_s_practice SET mortgage = 1 WHERE id = ?', [$practiceRow['id']]);
                ++$withMortgage;
            }
        }

        /** @var array<string, int> $created chiave "praticaId:tipoId|nome" => id riga documentale */
        $created = [];
        $rowsCreated = 0;
        $linked = 0;

        foreach ($rows as $row) {
            $practiceId = (int) $row['practice_id'];
            $typeId = $row['document_type_id'] !== null ? (int) $row['document_type_id'] : null;
            $label = trim((string) $row['name']) ?: 'Documento';
            $key = $practiceId . ':' . ($typeId !== null ? 'T' . $typeId : 'N' . mb_strtolower($label));

            if (!isset($created[$key])) {
                // Stato della riga dedotto dal vecchio allegato. Il letterale 'verificato'
                // è lo stato nella vecchia colonna eb_s_document.status, scritta quando gli
                // stati erano in italiano: qui si legge dati pre-migrazione, non va tradotto.
                $hasFile = trim((string) $row['storage_path']) !== '';
                $status = match (true) {
                    (string) $row['status'] === 'verificato' => PracticeDocument::STATUS_VERIFIED,
                    $hasFile => PracticeDocument::STATUS_TO_VERIFY,
                    default => PracticeDocument::STATUS_TO_UPLOAD,
                };

                // visible = 1: la riga esiste perché il documento era richiesto o già caricato.
                $conn->executeStatement(
                    'INSERT INTO eb_s_practice_document (practice_id, document_type_id, label, visible, status, priority, created_at)
                     VALUES (?, ?, ?, 1, ?, 0, NOW())',
                    [$practiceId, $typeId, $label, $status]
                );
                $created[$key] = (int) $conn->lastInsertId();
                ++$rowsCreated;
            }

            $conn->executeStatement('UPDATE eb_s_document SET practice_document_id = ? WHERE id = ?', [$created[$key], $row['id']]);
            ++$linked;
        }

        $io->text(sprintf(
            '%d righe documentali create, %d allegati collegati, %d pratiche marcate con mutuo.',
            $rowsCreated,
            $linked,
            $withMortgage
        ));
    }
}
