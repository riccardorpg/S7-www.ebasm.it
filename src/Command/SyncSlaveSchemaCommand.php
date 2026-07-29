<?php

namespace App\Command;

use App\Entity\Master\Company;
use App\Service\CompanyService;
use Doctrine\ORM\Tools\SchemaTool;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

/**
 * Allinea lo schema di TUTTI i database slave (agenzie) alle entità Slave correnti.
 * Da lanciare dopo aver aggiunto/modificato entità in src/Entity/Slave.
 * Update non distruttivo (SchemaTool::updateSchema, safe mode di ORM 3).
 */
#[AsCommand(name: 'app:sync-slave-schema', description: 'Aggiorna lo schema di tutti i DB agenzia alle entità Slave correnti')]
class SyncSlaveSchemaCommand extends Command
{
    public function __construct(
        private readonly ManagerRegistry $registry,
        private readonly CompanyService $companyService,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addOption('dump-sql', null, InputOption::VALUE_NONE, 'Mostra solo le query SQL senza eseguirle');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $dumpOnly = (bool) $input->getOption('dump-sql');

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
                $metadata = $slaveEm->getMetadataFactory()->getAllMetadata();
                $schemaTool = new SchemaTool($slaveEm);

                $sql = $schemaTool->getUpdateSchemaSql($metadata);
                if ($sql === []) {
                    $io->text('Schema già allineato.');
                    continue;
                }

                if ($dumpOnly) {
                    foreach ($sql as $line) {
                        $io->writeln('  ' . $line . ';');
                    }
                    continue;
                }

                $schemaTool->updateSchema($metadata);
                $io->text(sprintf('Applicate %d modifiche.', count($sql)));
            } catch (\Throwable $e) {
                ++$errors;
                $io->error(sprintf('Errore su %s: %s', $dbName, $e->getMessage()));
            }
        }

        if ($errors > 0) {
            $io->warning(sprintf('Completato con %d errori.', $errors));

            return Command::FAILURE;
        }

        $io->success('Schema di tutti i DB agenzia allineato.');

        return Command::SUCCESS;
    }
}
