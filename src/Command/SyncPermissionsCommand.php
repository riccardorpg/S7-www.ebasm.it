<?php

namespace App\Command;

use App\Entity\Master\Company;
use App\Entity\Slave\Permission;
use App\Service\CompanyService;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

/**
 * 10.1.5 Allinea il catalogo permessi in TUTTI i DB agenzia.
 * Da lanciare dopo aver aggiunto/rinominato una voce in {@see self::CATALOG}.
 * Idempotente: aggiorna etichetta e ordine delle voci esistenti (match sullo slug),
 * inserisce quelle nuove e rimuove quelle non più in catalogo (con i livelli collegati).
 */
#[AsCommand(name: 'app:sync-permissions', description: 'Allinea il catalogo permessi di tutti i DB agenzia')]
class SyncPermissionsCommand extends Command
{
    /**
     * Sezioni della piattaforma su cui si assegnano i livelli.
     * Gli slug sono quelli usati in is_granted('view'|'edit', '<slug>').
     *
     * @var array<string, array{label: string, priority: int}>
     */
    public const CATALOG = [
        'practices' => ['label' => 'Pratiche', 'priority' => 10],
        'customers' => ['label' => 'Clienti', 'priority' => 20],
        'staff' => ['label' => 'Staff', 'priority' => 30],
        'configurations' => ['label' => 'Configurazioni', 'priority' => 40],
    ];

    public function __construct(
        private readonly ManagerRegistry $registry,
        private readonly CompanyService $companyService,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

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
                $repo = $slaveEm->getRepository(Permission::class);

                $existing = [];
                foreach ($repo->findAll() as $permission) {
                    $existing[$permission->getSlug()] = $permission;
                }

                $added = $updated = $removed = 0;
                foreach (self::CATALOG as $slug => $meta) {
                    $permission = $existing[$slug] ?? null;
                    if ($permission === null) {
                        $permission = (new Permission())->setSlug($slug);
                        $slaveEm->persist($permission);
                        ++$added;
                    } else {
                        unset($existing[$slug]);
                        ++$updated;
                    }
                    $permission->setValue($meta['label'])->setPriority($meta['priority']);
                }

                // Voci non più in catalogo: via, insieme ai livelli assegnati (orphanRemoval).
                foreach ($existing as $obsolete) {
                    $slaveEm->remove($obsolete);
                    ++$removed;
                }

                $slaveEm->flush();
                $io->text(sprintf('%d nuove, %d aggiornate, %d rimosse.', $added, $updated, $removed));

                // Allineamento del ruolo (10.2.4) per gli utenti creati prima della colonna
                // staff_role: chi aveva il flag "amministratore" diventa di ruolo admin.
                $aligned = $slaveEm->getConnection()->executeStatement(
                    "UPDATE eb_s_user SET staff_role = 'admin' WHERE is_admin = 1 AND staff_role <> 'admin'"
                );
                if ($aligned > 0) {
                    $io->text(sprintf('%d utenti allineati al ruolo "admin".', $aligned));
                }
            } catch (\Throwable $e) {
                ++$errors;
                $io->error(sprintf('Errore su %s: %s', $dbName, $e->getMessage()));
            }
        }

        if ($errors > 0) {
            $io->warning(sprintf('Completato con %d errori.', $errors));

            return Command::FAILURE;
        }

        $io->success('Catalogo permessi allineato su tutte le agenzie.');

        return Command::SUCCESS;
    }
}
