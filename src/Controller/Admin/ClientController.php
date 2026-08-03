<?php

namespace App\Controller\Admin;

use App\Entity\Master\City;
use App\Entity\Master\Company;
use App\Entity\Master\Zip;
use App\Entity\Slave\User as AgencyUser;
use App\Repository\Master\CompanyRepository;
use App\Service\CompanyService;
use Doctrine\ORM\Tools\SchemaTool;
use Doctrine\Persistence\ManagerRegistry;
use Knp\Component\Pager\PaginatorInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * 7. Gestione clienti (= agenzie/studi). Il cliente è una Company sul master con DB slave dedicato.
 */
#[Route('/amministratore/clienti')]
#[IsGranted('ROLE_ADMIN')]
class ClientController extends AbstractController
{
    public function __construct(
        private readonly ManagerRegistry $registry,
        private readonly CompanyService $companyService,
        private readonly UserPasswordHasherInterface $hasher,
        private readonly ParameterBagInterface $params,
    ) {
    }

    // ================= 7.1 ELENCO =================

    #[Route('', name: 'admin_clients', methods: ['GET'])]
    public function index(CompanyRepository $companies, PaginatorInterface $paginator, Request $request): Response
    {
        $filters = [
            'code' => trim((string) $request->query->get('f_code', '')),
            'name' => trim((string) $request->query->get('f_name', '')),
            'type' => trim((string) $request->query->get('f_type', '')),       // id multipli, comma-separated
            'license' => trim((string) $request->query->get('f_license', '')), // id multipli, comma-separated
            'status' => trim((string) $request->query->get('f_status', '')),   // id multipli, comma-separated
            'expiry' => trim((string) $request->query->get('f_expiry', '')),   // "DD-MM-YYYY/DD-MM-YYYY"
        ];

        $qb = $companies->createQueryBuilder('c');
        if ($filters['code'] !== '') {
            $qb->andWhere('c.code LIKE :code')->setParameter('code', '%' . $filters['code'] . '%');
        }
        if ($filters['name'] !== '') {
            $qb->andWhere('c.name LIKE :n')->setParameter('n', '%' . $filters['name'] . '%');
        }
        $types = array_values(array_filter(explode(',', $filters['type'])));
        if ($types !== []) {
            $qb->andWhere('c.clientType IN (:types)')->setParameter('types', $types);
        }
        $licenses = array_values(array_filter(explode(',', $filters['license'])));
        if ($licenses !== []) {
            $qb->andWhere('c.licenseType IN (:licenses)')->setParameter('licenses', $licenses);
        }
        $this->applyStatusFilter($qb, array_values(array_filter(explode(',', $filters['status']))));
        $this->applyExpiryRangeFilter($qb, $filters['expiry']);

        $records = $paginator->paginate($qb->getQuery(), $request->query->getInt('page', 1), 20, [
            'defaultSortFieldName' => 'c.name',
            'defaultSortDirection' => 'asc',
            'sortFieldAllowList' => ['c.name', 'c.code', 'c.clientType', 'c.licenseType', 'c.licenseExpiresAt', 'c.active'],
        ]);

        return $this->render('role/admin/clients/index.html.twig', [
            'records' => $records,
            'filters' => $filters,
        ]);
    }

    /**
     * Filtro stato multi-valore: OR delle condizioni derivate (stato non è una colonna).
     *
     * @param string[] $statuses
     */
    private function applyStatusFilter(\Doctrine\ORM\QueryBuilder $qb, array $statuses): void
    {
        if ($statuses === []) {
            return;
        }

        $orX = $qb->expr()->orX();
        foreach ($statuses as $s) {
            switch ($s) {
                case 'sospeso':
                    $orX->add('c.active = false');
                    break;
                case 'scaduto':
                    $orX->add('(c.active = true AND c.licenseExpiresAt < :today)');
                    break;
                case 'demo':
                    $orX->add('(c.active = true AND c.licenseType = :demo AND (c.licenseExpiresAt IS NULL OR c.licenseExpiresAt >= :today))');
                    break;
                case 'attivo':
                    $orX->add('(c.active = true AND c.licenseType != :demo AND (c.licenseExpiresAt IS NULL OR c.licenseExpiresAt >= :today))');
                    break;
            }
        }
        if ($orX->count() === 0) {
            return;
        }

        $qb->andWhere($orX);
        if (array_intersect($statuses, ['scaduto', 'demo', 'attivo']) !== []) {
            $qb->setParameter('today', new \DateTimeImmutable('today'));
        }
        if (array_intersect($statuses, ['demo', 'attivo']) !== []) {
            $qb->setParameter('demo', Company::LICENSE_DEMO);
        }
    }

    private function applyExpiryRangeFilter(\Doctrine\ORM\QueryBuilder $qb, string $range): void
    {
        if (!str_contains($range, '/')) {
            return;
        }
        [$from, $to] = array_map('trim', explode('/', $range, 2));
        $df = \DateTimeImmutable::createFromFormat('d-m-Y', $from);
        $dt = \DateTimeImmutable::createFromFormat('d-m-Y', $to);
        if ($df === false || $dt === false) {
            return;
        }
        $qb->andWhere('c.licenseExpiresAt BETWEEN :ef AND :et')
            ->setParameter('ef', $df->setTime(0, 0))
            ->setParameter('et', $dt->setTime(23, 59, 59));
    }

    // ================= 7.1.10 NUOVO =================

    #[Route('/nuovo', name: 'admin_client_new', methods: ['GET', 'POST'])]
    public function new(Request $request, CompanyRepository $companies): Response
    {
        if ($request->isMethod('POST')) {
            if (!$this->isCsrfTokenValid('client_new', (string) $request->request->get('_csrf_token'))) {
                $this->addFlash('danger', 'Sessione scaduta, riprova.');

                return $this->redirectToRoute('admin_client_new');
            }

            $code = strtoupper(trim((string) $request->request->get('code')));
            $name = trim((string) $request->request->get('name'));
            $dbName = trim((string) $request->request->get('db_name'));

            $errors = [];
            if ($code === '' || !preg_match('/^[A-Z0-9._-]{2,64}$/', $code)) {
                $errors[] = 'Codice cliente obbligatorio (lettere/cifre, 2-64).';
            }
            if ($name === '') {
                $errors[] = 'Ragione sociale / nome obbligatori.';
            }
            if (!preg_match('/^[a-z0-9_]{3,}$/i', $dbName)) {
                $errors[] = 'Nome database non valido (lettere, cifre, underscore).';
            }
            if ($errors === [] && $companies->findOneBy(['code' => $code]) !== null) {
                $errors[] = 'Esiste già un cliente con questo codice.';
            }
            if ($errors === [] && $companies->findOneBy(['dbName' => $dbName]) !== null) {
                $errors[] = 'Database già assegnato a un altro cliente.';
            }

            if ($errors !== []) {
                $this->addFlash('danger', implode(' ', $errors));

                return $this->redirectToRoute('admin_client_new');
            }

            $master = $this->registry->getManager('master');

            // Provisiona il DB slave + schema
            $master->getConnection()->executeStatement(
                sprintf('CREATE DATABASE IF NOT EXISTS `%s` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci', $dbName)
            );
            $slaveEm = $this->companyService->pointSlaveToDbName($dbName);
            (new SchemaTool($slaveEm))->createSchema($slaveEm->getMetadataFactory()->getAllMetadata());

            $company = new Company();
            $company->setCode($code)->setName($name)->setDbName($dbName)->setActive(true)
                ->setClientType($request->request->get('client_type') === Company::TYPE_PROFESSIONAL ? Company::TYPE_PROFESSIONAL : Company::TYPE_COMPANY)
                ->setVatNumber(trim((string) $request->request->get('vat_number')) ?: null)
                ->setTaxCode(trim((string) $request->request->get('tax_code')) ?: null)
                ->setAddress(trim((string) $request->request->get('address')) ?: null)
                ->setCivic(trim((string) $request->request->get('civic')) ?: null)
                ->setSdi(trim((string) $request->request->get('sdi')) ?: null)
                ->setPec(trim((string) $request->request->get('pec')) ?: null);
            [$city, $zip] = $this->resolveGeo($request);
            $company->setCity($city)->setZip($zip);

            $master->persist($company);
            $master->flush();
            $this->companyService->clearSession();

            $this->addFlash('success', 'Cliente "' . $name . '" creato con database ' . $dbName . '.');

            return $this->redirectToRoute('admin_client_show', ['id' => $company->getId()]);
        }

        return $this->render('role/admin/clients/new.html.twig');
    }

    // ================= MODIFICA (pagina dedicata, senza campo database) =================

    #[Route('/{id}/modifica', name: 'admin_client_edit', methods: ['GET', 'POST'], requirements: ['id' => '\d+'])]
    public function edit(Company $company, Request $request): Response
    {
        if ($request->isMethod('POST')) {
            if (!$this->isCsrfTokenValid('clientEdit', (string) $request->request->get('_csrf_token'))) {
                return $this->redirectToRoute('admin_client_edit', ['id' => $company->getId()]);
            }

            $name = trim((string) $request->request->get('name'));
            if ($name === '') {
                $this->addFlash('danger', 'La ragione sociale / nome è obbligatoria.');

                return $this->redirectToRoute('admin_client_edit', ['id' => $company->getId()]);
            }

            $company->setName($name)
                ->setClientType($request->request->get('client_type') === Company::TYPE_PROFESSIONAL ? Company::TYPE_PROFESSIONAL : Company::TYPE_COMPANY)
                ->setVatNumber(trim((string) $request->request->get('vat_number')) ?: null)
                ->setTaxCode(trim((string) $request->request->get('tax_code')) ?: null)
                ->setAddress(trim((string) $request->request->get('address')) ?: null)
                ->setCivic(trim((string) $request->request->get('civic')) ?: null)
                ->setSdi(trim((string) $request->request->get('sdi')) ?: null)
                ->setPec(trim((string) $request->request->get('pec')) ?: null);
            [$city, $zip] = $this->resolveGeo($request);
            $company->setCity($city)->setZip($zip);

            $this->registry->getManager('master')->flush();
            $this->addFlash('success', 'Cliente aggiornato.');

            return $this->redirectToRoute('admin_client_show', ['id' => $company->getId()]);
        }

        // La modifica dati fiscali è ora nel tab "Dati fiscali" della scheda.
        return $this->redirectToRoute('admin_client_show', ['id' => $company->getId()]);
    }

    // ================= SOSPENDI / RIATTIVA =================

    #[Route('/{id}/stato', name: 'admin_client_toggle_active', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function toggleActive(Company $company, Request $request): Response
    {
        if ($this->isCsrfTokenValid('client_active_' . $company->getId(), (string) $request->request->get('_csrf_token'))) {
            $company->setActive(!$company->isActive());
            $this->registry->getManager('master')->flush();
            $this->addFlash('success', $company->isActive() ? 'Cliente riattivato.' : 'Cliente sospeso.');
        }

        return $this->redirectToRoute('admin_client_show', ['id' => $company->getId()]);
    }

    // ================= ELIMINA =================

    #[Route('/{id}/elimina', name: 'admin_client_delete', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function delete(Company $company, Request $request): Response
    {
        if (!$this->isCsrfTokenValid('delete', (string) $request->request->get('_csrf_token'))) {
            return $this->redirectToRoute('admin_clients');
        }

        if (!$company->canDelete()) {
            $this->addFlash('danger', 'Cliente non eliminabile: prima sospendilo.');

            return $this->redirectToRoute('admin_client_show', ['id' => $company->getId()]);
        }

        $master = $this->registry->getManager('master');
        $dbName = (string) $company->getDbName();
        $master->remove($company);
        $master->flush();

        // Rimuove il database dedicato (orfano dopo la cancellazione del cliente).
        if ($dbName !== '') {
            try {
                $master->getConnection()->executeStatement(sprintf('DROP DATABASE IF EXISTS `%s`', $dbName));
            } catch (\Throwable) {
                // ignora: il record è già rimosso, il DB può essere ripulito a mano.
            }
        }

        $this->addFlash('success', 'Cliente eliminato.');

        return $this->redirectToRoute('admin_clients');
    }

    // ================= 7.1.9 SCHEDA =================

    #[Route('/{id}', name: 'admin_client_show', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function show(Company $company): Response
    {
        // Staff caricato tutto (filtro lato JS nel tab); lo slave è puntato solo per la query.
        $staff = [];
        try {
            $slaveEm = $this->companyService->switchToCompany($company);
            $staff = $slaveEm->getRepository(AgencyUser::class)->findBy([], ['email' => 'ASC']);
        } catch (\Throwable) {
            $staff = [];
        }
        $this->companyService->clearSession();

        return $this->render('role/admin/clients/show.html.twig', [
            'company' => $company,
            'staff' => $staff,
            'storageUsedMb' => $this->safeStorage($company),
        ]);
    }

    // ---- 7.1.9.4 Rinnova licenza / 7.1.9.5 Modifica tipo licenza ----

    #[Route('/{id}/licenza', name: 'admin_client_license', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function license(Company $company, Request $request): Response
    {
        if ($this->isCsrfTokenValid('clientLicense', (string) $request->request->get('_csrf_token'))) {
            $type = (string) $request->request->get('license_type');
            if (in_array($type, [Company::LICENSE_DEMO, Company::LICENSE_BASE, Company::LICENSE_PRO, Company::LICENSE_ENTERPRISE], true)) {
                $company->setLicenseType($type);
            }

            $months = (int) $request->request->get('renew_months', 0);
            if ($months > 0) {
                $base = $company->getLicenseExpiresAt();
                if ($base === null || $base < new \DateTimeImmutable('today')) {
                    $base = new \DateTimeImmutable('today');
                }
                $company->setLicenseExpiresAt($base->modify('+' . $months . ' months'));
            }

            $quota = (int) $request->request->get('storage_quota_mb', 0);
            if ($quota > 0) {
                $company->setStorageQuotaMb($quota);
            }

            $this->registry->getManager('master')->flush();
            $this->addFlash('success', 'Licenza aggiornata.');
        }

        return $this->redirectToRoute('admin_client_show', ['id' => $company->getId()]);
    }

    // ---- 7.1.9.7 Contratto termini e condizioni ----

    #[Route('/{id}/termini', name: 'admin_client_terms', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function terms(Company $company, Request $request): Response
    {
        if ($this->isCsrfTokenValid('client_terms_' . $company->getId(), (string) $request->request->get('_csrf_token'))) {
            $company->setTermsAcceptedAt($company->isTermsAccepted() ? null : new \DateTimeImmutable());
            $this->registry->getManager('master')->flush();
            $this->addFlash('success', 'Stato contratto aggiornato.');
        }

        return $this->redirectToRoute('admin_client_show', ['id' => $company->getId()]);
    }

    // ================= 7.1.9.6 GESTIONE STAFF (sul DB dell'agenzia) =================

    #[Route('/{id}/staff/nuovo', name: 'admin_client_staff_new', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function staffNew(Company $company, Request $request): Response
    {
        if ($this->isCsrfTokenValid('staffNew', (string) $request->request->get('_csrf_token'))) {
            $name = trim((string) $request->request->get('name'));
            $surname = trim((string) $request->request->get('surname'));
            $email = mb_strtolower(trim((string) $request->request->get('email')));

            if ($name === '' || $surname === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $this->addFlash('danger', 'Nome, cognome ed e-mail valida sono obbligatori.');

                return $this->redirectToRoute('admin_client_show', ['id' => $company->getId()]);
            }

            $slaveEm = $this->companyService->switchToCompany($company);
            if ($slaveEm->getRepository(AgencyUser::class)->findOneBy(['email' => $email]) !== null) {
                $this->companyService->clearSession();
                $this->addFlash('danger', 'Esiste già un utente con questa e-mail in questo cliente.');

                return $this->redirectToRoute('admin_client_show', ['id' => $company->getId()]);
            }

            $user = new AgencyUser();
            $user->setName($name)->setSurname($surname)->setEmail($email)->setActive(true);
            // Password provvisoria casuale: verrà impostata dall'utente via "invia credenziali".
            $user->setPassword($this->hasher->hashPassword($user, bin2hex(random_bytes(8))));
            $slaveEm->persist($user);
            $slaveEm->flush();
            $this->companyService->clearSession();

            $this->addFlash('success', 'Utente ' . $email . ' aggiunto. Usa "Invia credenziali" per l\'attivazione.');
        }

        return $this->redirectToRoute('admin_client_show', ['id' => $company->getId()]);
    }

    #[Route('/{id}/staff/{sid}/stato', name: 'admin_client_staff_toggle', methods: ['POST'], requirements: ['id' => '\d+', 'sid' => '\d+'])]
    public function staffToggle(Company $company, int $sid, Request $request): Response
    {
        if ($this->isCsrfTokenValid('client_staff_' . $company->getId(), (string) $request->request->get('_csrf_token'))) {
            $slaveEm = $this->companyService->switchToCompany($company);
            $user = $slaveEm->getRepository(AgencyUser::class)->find($sid);
            if ($user !== null) {
                $user->setActive(!$user->isActive());
                $slaveEm->flush();
            }
            $this->companyService->clearSession();
        }

        return $this->redirectToRoute('admin_client_show', ['id' => $company->getId()]);
    }

    #[Route('/{id}/staff/{sid}/admin', name: 'admin_client_staff_admin', methods: ['POST'], requirements: ['id' => '\d+', 'sid' => '\d+'])]
    public function staffAdmin(Company $company, int $sid, Request $request): Response
    {
        if ($this->isCsrfTokenValid('client_staff_' . $company->getId(), (string) $request->request->get('_csrf_token'))) {
            $slaveEm = $this->companyService->switchToCompany($company);
            $user = $slaveEm->getRepository(AgencyUser::class)->find($sid);
            if ($user !== null) {
                $user->setAdmin(!$user->isAdmin());
                $slaveEm->flush();
            }
            $this->companyService->clearSession();
        }

        return $this->redirectToRoute('admin_client_show', ['id' => $company->getId()]);
    }

    #[Route('/{id}/staff/{sid}/credenziali', name: 'admin_client_staff_credentials', methods: ['POST'], requirements: ['id' => '\d+', 'sid' => '\d+'])]
    public function staffCredentials(Company $company, int $sid, Request $request): Response
    {
        if ($this->isCsrfTokenValid('client_staff_' . $company->getId(), (string) $request->request->get('_csrf_token'))) {
            $slaveEm = $this->companyService->switchToCompany($company);
            $user = $slaveEm->getRepository(AgencyUser::class)->find($sid);
            if ($user !== null) {
                $user->setOneTimeCode(bin2hex(random_bytes(16)));
                $user->setExpirationOneTimeCode(new \DateTimeImmutable('+72 hours'));
                $slaveEm->flush();
                // TODO: inviare email con link path('password_create', {code: ..., c: company.code})
                $this->addFlash('success', 'Credenziali generate per ' . $user->getEmail() . ' (invio email da configurare).');
            }
            $this->companyService->clearSession();
        }

        return $this->redirectToRoute('admin_client_show', ['id' => $company->getId()]);
    }

    // ================= helper =================

    /**
     * Risolve city_id/zip_id (dal picker città/CAP) in entità City/Zip.
     *
     * @return array{0: ?City, 1: ?Zip}
     */
    private function resolveGeo(Request $request): array
    {
        $master = $this->registry->getManager('master');
        $cityId = (int) $request->request->get('city_id');
        $zipId = (int) $request->request->get('zip_id');

        return [
            $cityId ? $master->getRepository(City::class)->find($cityId) : null,
            $zipId ? $master->getRepository(Zip::class)->find($zipId) : null,
        ];
    }

    private function safeStorage(Company $company): float
    {
        try {
            return $this->companyService->getStorageUsedMb((string) $company->getDbName());
        } catch (\Throwable) {
            return 0.0;
        }
    }
}
