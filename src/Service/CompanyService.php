<?php

namespace App\Service;

use App\Bundle\DynamicConnection;
use App\Entity\Master\Company;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;
use Symfony\Component\HttpFoundation\RequestStack;

/**
 * Gestione dello switch multi-tenant della connessione "slave".
 *
 * Il master è fisso; lo slave viene ri-puntato al database dell'agenzia (Company)
 * corrente. Il tenant è determinato dal CODICE agenzia (Company.code), che identifica
 * il database: la stessa email può esistere in agenzie diverse.
 */
class CompanyService
{
    public const SESSION_COMPANY_ID = 'companyId';
    public const SESSION_COMPANY_DB = 'companyDbName';

    public function __construct(
        private readonly ManagerRegistry $registry,
        private readonly ParameterBagInterface $params,
        private readonly RequestStack $requestStack,
    ) {
    }

    /**
     * Risolve la Company (agenzia) dal suo codice. Il codice identifica il database:
     * la stessa email può esistere in agenzie diverse, quindi è il codice a disambiguare.
     */
    public function getCompanyByCode(string $code): ?Company
    {
        return $this->registry->getManager('master')
            ->getRepository(Company::class)
            ->findOneBy(['code' => trim($code)]);
    }

    /**
     * Punta la connessione slave al database dell'agenzia indicata e la memorizza in sessione.
     */
    public function switchToCompany(Company $company): EntityManagerInterface
    {
        $em = $this->pointSlaveToDbName((string) $company->getDbName());
        $this->storeInSession($company);

        return $em;
    }

    /**
     * Ri-punta fisicamente la connessione slave al database $dbName (idempotente).
     */
    public function pointSlaveToDbName(string $dbName): EntityManagerInterface
    {
        /** @var DynamicConnection $conn */
        $conn = $this->registry->getConnection('slave');
        $current = $conn instanceof DynamicConnection ? $conn->getCurrentDatabaseName() : ($conn->getParams()['dbname'] ?? null);

        if ($current !== $dbName && $conn instanceof DynamicConnection) {
            $conn->changeDatabase(
                (string) $this->params->get('slave_database_host'),
                (string) $this->params->get('slave_database_port'),
                (string) $this->params->get('slave_database_user'),
                (string) $this->params->get('slave_database_password'),
                $dbName,
            );
            $this->registry->getManager('slave')->clear();
        }

        return $this->registry->getManager('slave');
    }

    /**
     * Allinea la connessione slave allo stato di sessione (usato dal listener di request).
     */
    public function syncSlaveFromSession(): void
    {
        $request = $this->requestStack->getCurrentRequest();
        if ($request === null || !$request->hasSession()) {
            return;
        }

        $session = $request->getSession();
        $dbName = $session->get(self::SESSION_COMPANY_DB);
        if (is_string($dbName) && $dbName !== '') {
            $this->pointSlaveToDbName($dbName);
        }
    }

    /**
     * 7.1.8 Spazio occupato reale (MB) dal database dell'agenzia, letto da information_schema.
     */
    public function getStorageUsedMb(string $dbName): float
    {
        if ($dbName === '') {
            return 0.0;
        }

        $conn = $this->registry->getConnection('master');
        $bytes = (int) $conn->executeQuery(
            'SELECT COALESCE(SUM(data_length + index_length), 0) FROM information_schema.tables WHERE table_schema = :db',
            ['db' => $dbName],
        )->fetchOne();

        return round($bytes / 1048576, 1);
    }

    public function getCurrentCompany(): ?Company
    {
        $request = $this->requestStack->getCurrentRequest();
        if ($request === null || !$request->hasSession()) {
            return null;
        }

        $companyId = $request->getSession()->get(self::SESSION_COMPANY_ID);
        if ($companyId === null) {
            return null;
        }

        return $this->registry->getManager('master')->getRepository(Company::class)->find($companyId);
    }

    public function clearSession(): void
    {
        $request = $this->requestStack->getCurrentRequest();
        if ($request === null || !$request->hasSession()) {
            return;
        }

        $session = $request->getSession();
        $session->remove(self::SESSION_COMPANY_ID);
        $session->remove(self::SESSION_COMPANY_DB);
    }

    private function storeInSession(Company $company): void
    {
        $request = $this->requestStack->getCurrentRequest();
        if ($request === null || !$request->hasSession()) {
            return;
        }

        $session = $request->getSession();
        $session->set(self::SESSION_COMPANY_ID, $company->getId());
        $session->set(self::SESSION_COMPANY_DB, $company->getDbName());
    }
}
