<?php

namespace App\Service;

use App\Bundle\DynamicConnection;
use App\Entity\Master\AgencyUserIndex;
use App\Entity\Master\Company;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;
use Symfony\Component\HttpFoundation\RequestStack;

/**
 * Gestione dello switch multi-tenant della connessione "slave".
 *
 * Il master è fisso; lo slave viene ri-puntato al database dell'agenzia (Company)
 * corrente. Il tenant è determinato dall'email dell'utente ROLE_AGENCY tramite
 * l'indice cross-tenant AgencyUserIndex sul master (nessun codice azienda da digitare).
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
     * Risolve la Company (agenzia) a partire dall'email di un utente ROLE_AGENCY.
     */
    public function resolveAgencyCompanyByEmail(string $email): ?Company
    {
        $entry = $this->registry->getManager('master')
            ->getRepository(AgencyUserIndex::class)
            ->findOneBy(['email' => mb_strtolower(trim($email))]);

        return $entry?->getCompany();
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
