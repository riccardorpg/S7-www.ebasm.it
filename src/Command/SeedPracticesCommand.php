<?php

namespace App\Command;

use App\Entity\Slave\Document;
use App\Entity\Slave\Practice;
use App\Service\CompanyService;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;

/**
 * Popola il DB di un'agenzia con pratiche demo (finché l'inserimento lato agenzia
 * non è disponibile). Le pratiche servono a testare l'area notaio.
 *
 *   php bin/console app:seed-practices AG001 --notary=notaio@ebasm.it
 */
#[AsCommand(name: 'app:seed-practices', description: 'Crea pratiche demo nel DB di un\'agenzia (per testare l\'area notaio)')]
class SeedPracticesCommand extends Command
{
    public function __construct(
        private readonly CompanyService $companyService,
        private readonly ParameterBagInterface $params,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addArgument('code', InputArgument::REQUIRED, 'Codice agenzia (Company.code)')
            ->addOption('notary', null, InputOption::VALUE_REQUIRED, 'Email notaio con accesso (default: tutte le pratiche accessibili)')
            ->addOption('count', null, InputOption::VALUE_REQUIRED, 'Numero di pratiche da creare', '4');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $code = trim((string) $input->getArgument('code'));
        $notaryEmail = $input->getOption('notary') ? mb_strtolower(trim((string) $input->getOption('notary'))) : null;
        $count = max(1, (int) $input->getOption('count'));

        $company = $this->companyService->getCompanyByCode($code);
        if ($company === null) {
            $io->error(sprintf('Nessuna agenzia con codice "%s".', $code));

            return Command::FAILURE;
        }

        $em = $this->companyService->pointSlaveToDbName((string) $company->getDbName());
        $baseDir = $this->uploadsBaseDir((string) $company->getDbName());

        $types = ['Compravendita', 'Successione', 'Donazione', 'Mutuo'];
        $buyers = [
            ['Rossi Mario', 'RSSMRA80A01H501U', 'mario.rossi@example.com', '3401112223', 'Via Roma 1, Milano'],
            ['Bianchi Srl', '01234567890', 'info@bianchisrl.example', '025556677', 'Corso Italia 22, Milano'],
            ['Verdi Anna', 'VRDNNA85M41F205X', 'anna.verdi@example.com', '3487778889', 'Via Dante 9, Torino'],
            ['Neri Luca', 'NRELCU78T10L219K', 'luca.neri@example.com', '3391234567', 'Via Po 4, Torino'],
        ];
        $sellers = [
            ['Immobiliare Sole Spa', '09876543210', 'vendite@sole.example', '0287654321', 'Viale Europa 100, Milano'],
            ['Gialli Giuseppe', 'GLLGPP60E05H501Z', 'g.gialli@example.com', '3405550001', 'Via Verdi 3, Monza'],
            ['Costruzioni Alfa Srl', '05555512345', 'alfa@costruzioni.example', '0311122334', 'Via Milano 50, Como'],
            ['Ferrari Paola', 'FRRPLA72C48A794T', 'paola.ferrari@example.com', '3399998887', 'Via Torino 12, Bergamo'],
        ];

        $created = 0;
        for ($i = 0; $i < $count; ++$i) {
            $practice = new Practice();
            $practice->setNumber(sprintf('P-%04d/%d', $i + 1, 2026))
                ->setType($types[$i % count($types)])
                ->setSubject('Immobile sito in Via Esempio ' . ($i + 1) . ' — foglio ' . (10 + $i) . ', particella ' . (100 + $i))
                ->setStatus(Practice::STATUS_APERTA)
                ->setNotaryEmail($notaryEmail);

            [$bn, $bf, $be, $bp, $ba] = $buyers[$i % count($buyers)];
            $practice->getBuyer()->setName($bn)->setFiscalCode($bf)->setEmail($be)->setPhone($bp)->setAddress($ba);
            [$sn, $sf, $se, $sp, $sa] = $sellers[$i % count($sellers)];
            $practice->getSeller()->setName($sn)->setFiscalCode($sf)->setEmail($se)->setPhone($sp)->setAddress($sa);

            $em->persist($practice);
            $em->flush(); // serve l'id per il percorso file

            // Documenti demo: alcuni caricati, alcuni solo richiesti.
            $docSpecs = [
                ['Atto di provenienza', true, true, 'Copia conforme fornita dall\'agente.'],
                ['Visura catastale', true, false, 'Aggiornata al mese corrente.'],
                ['Planimetria', true, false, null],
                ['Documento identità acquirente', false, true, 'Da caricare a cura del cliente.'],
                ['APE', false, true, null],
            ];
            foreach ($docSpecs as $idx => [$name, $uploaded, $requested, $agentNote]) {
                $doc = new Document();
                $doc->setName($name)
                    ->setRequested($requested)
                    ->setStatus($idx % 3 === 0 ? Document::STATUS_VERIFICATO : Document::STATUS_DA_VERIFICARE)
                    ->setAgentNote($agentNote);

                if ($uploaded) {
                    $safe = preg_replace('/[^a-zA-Z0-9._-]+/', '_', strtolower($name)) . '.txt';
                    $rel = $practice->getId() . '/' . uniqid('', false) . '_' . $safe;
                    $abs = $baseDir . '/' . $rel;
                    @mkdir(dirname($abs), 0775, true);
                    file_put_contents($abs, "Documento demo: {$name}\nPratica: {$practice->getNumber()}\n");
                    $doc->setOriginalFilename($safe)
                        ->setStoragePath($rel)
                        ->setMimeType('text/plain')
                        ->setSizeBytes(filesize($abs) ?: null);
                }

                $practice->addDocument($doc);
                $em->persist($doc);
            }
            $em->flush();
            ++$created;
        }

        $io->success(sprintf('Create %d pratiche demo nel DB "%s" (agenzia %s).', $created, $company->getDbName(), $code));

        return Command::SUCCESS;
    }

    private function uploadsBaseDir(string $dbName): string
    {
        return rtrim((string) $this->params->get('kernel.project_dir'), '/\\') . '/var/uploads/practices/' . $dbName;
    }
}
