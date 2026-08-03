<?php

namespace App\Command;

use App\Entity\Master\Company;
use App\Entity\Slave\Customer;
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
 * Migrazione una-tantum: le parti della pratica passano dalle vecchie colonne
 * `buyer_…` e `seller_…` (embeddable Party) all'anagrafica clienti (11), con le FK
 * buyer_customer_id e seller_customer_id.
 *
 * DA LANCIARE PRIMA di `app:sync-slave-schema`, che elimina le vecchie colonne.
 * Il comando crea da sé la tabella eb_s_customer e le due colonne FK se mancano,
 * così i dati esistenti non si perdono. È idempotente: le pratiche già collegate
 * vengono saltate.
 *
 * Euristica sui nomi (le vecchie parti avevano un unico campo "name"):
 *  - codice fiscale di 11 cifre → è un'azienda: ragione sociale in `surname`, P. IVA valorizzata;
 *  - altrimenti persona con la forma "Cognome Nome": prima parola cognome, resto nome.
 * Va verificata a mano dopo la migrazione.
 */
#[AsCommand(
    name: 'app:migrate-parties-to-customers',
    description: 'Converte le parti embedded delle pratiche in clienti (una tantum, prima di app:sync-slave-schema)'
)]
class MigratePartiesToCustomersCommand extends Command
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
                $slaveEm = $this->companyService->pointSlaveToDbName($dbName);
                $errors += $this->migrateCompany($slaveEm, $io, $dryRun) ? 0 : 1;
            } catch (\Throwable $e) {
                ++$errors;
                $io->error(sprintf('Errore su %s: %s', $dbName, $e->getMessage()));
            }
        }

        if ($errors > 0) {
            $io->warning(sprintf('Completato con %d errori.', $errors));

            return Command::FAILURE;
        }

        $io->success('Parti convertite in clienti. Ora lancia `app:sync-slave-schema` per rimuovere le vecchie colonne.');

        return Command::SUCCESS;
    }

    private function migrateCompany(EntityManagerInterface $em, SymfonyStyle $io, bool $dryRun): bool
    {
        $conn = $em->getConnection();
        $schema = $conn->createSchemaManager();

        if (!$schema->tablesExist(['eb_s_practice'])) {
            $io->text('Nessuna tabella pratiche: niente da fare.');

            return true;
        }

        $columns = array_map(
            static fn ($c) => $c->getName(),
            $schema->listTableColumns('eb_s_practice')
        );
        if (!in_array('buyer_name', $columns, true)) {
            $io->text('Colonne buyer_*/seller_* già rimosse: migrazione non necessaria.');

            return true;
        }

        if ($dryRun) {
            $count = (int) $conn->fetchOne('SELECT COUNT(*) FROM eb_s_practice');
            $io->text(sprintf('%d pratiche da convertire (dry-run: nessuna scrittura).', $count));

            return true;
        }

        // La tabella clienti e le due FK potrebbero non esistere ancora: le creiamo qui,
        // perché app:sync-slave-schema andrà lanciato solo DOPO aver salvato i dati.
        if (!$schema->tablesExist(['eb_s_customer'])) {
            (new SchemaTool($em))->createSchema([$em->getClassMetadata(Customer::class)]);
            $io->text('Creata tabella eb_s_customer.');
        }
        foreach (['buyer_customer_id', 'seller_customer_id'] as $fkColumn) {
            if (!in_array($fkColumn, $columns, true)) {
                $conn->executeStatement(sprintf('ALTER TABLE eb_s_practice ADD %s BIGINT DEFAULT NULL', $fkColumn));
                $io->text('Aggiunta colonna ' . $fkColumn . '.');
            }
        }

        $rows = $conn->fetchAllAssociative(
            'SELECT id, buyer_name, buyer_fiscal_code, buyer_email, buyer_phone, buyer_address,
                    seller_name, seller_fiscal_code, seller_email, seller_phone, seller_address,
                    buyer_customer_id, seller_customer_id
             FROM eb_s_practice'
        );

        $created = 0;
        $linked = 0;
        /** @var array<string, Customer> $byKey anagrafiche già create in questo giro */
        $byKey = [];

        foreach ($rows as $row) {
            foreach (['buyer', 'seller'] as $side) {
                if ($row[$side . '_customer_id'] !== null) {
                    continue; // già collegata
                }
                $name = trim((string) $row[$side . '_name']);
                $fiscalCode = trim((string) $row[$side . '_fiscal_code']);
                if ($name === '' && $fiscalCode === '') {
                    continue;
                }

                $key = $fiscalCode !== '' ? 'cf:' . mb_strtoupper($fiscalCode) : 'nm:' . mb_strtolower($name);
                $customer = $byKey[$key] ?? null;

                if ($customer === null) {
                    $customer = $this->findExisting($em, $fiscalCode, $name);
                }

                if ($customer === null) {
                    $customer = $this->buildCustomer($name, $fiscalCode, $row, $side);
                    $em->persist($customer);
                    $em->flush(); // serve l'id subito per la UPDATE sotto
                    ++$created;
                }

                $byKey[$key] = $customer;
                $conn->executeStatement(
                    sprintf('UPDATE eb_s_practice SET %s_customer_id = ? WHERE id = ?', $side),
                    [$customer->getId(), $row['id']]
                );
                ++$linked;
            }
        }

        $io->text(sprintf('%d clienti creati, %d parti collegate.', $created, $linked));

        return true;
    }

    private function findExisting(EntityManagerInterface $em, string $fiscalCode, string $name): ?Customer
    {
        $repo = $em->getRepository(Customer::class);

        if ($fiscalCode !== '') {
            $found = $repo->findOneByFiscalCode($fiscalCode);
            if ($found !== null) {
                return $found;
            }
        }

        return null;
    }

    /**
     * @param array<string, mixed> $row
     */
    private function buildCustomer(string $name, string $fiscalCode, array $row, string $side): Customer
    {
        $customer = new Customer();
        $isCompany = preg_match('/^\d{11}$/', $fiscalCode) === 1;

        if ($isCompany) {
            // Ragione sociale: sta tutta nel cognome, il nome resta vuoto.
            $customer->setSurname($name)->setName('')->setVatNumber($fiscalCode);
        } else {
            // "Cognome Nome": la prima parola è il cognome.
            $parts = preg_split('/\s+/', $name, 2) ?: [$name];
            $customer->setSurname($parts[0] ?? '')->setName($parts[1] ?? '');
        }

        return $customer
            ->setFiscalCode($fiscalCode !== '' ? $fiscalCode : null)
            ->setEmail(($row[$side . '_email'] ?? null) ?: null)
            ->setPhone(($row[$side . '_phone'] ?? null) ?: null)
            ->setAddress(($row[$side . '_address'] ?? null) ?: null);
    }
}
