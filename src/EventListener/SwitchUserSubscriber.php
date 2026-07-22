<?php

namespace App\EventListener;

use App\Entity\Slave\User as SlaveUser;
use App\Service\CompanyService;
use Symfony\Component\Security\Http\Event\SwitchUserEvent;

/**
 * Rende l'impersonazione tenant-aware.
 *
 * Quando un ROLE_ADMIN impersona un utente ROLE_AGENCY, memorizza in sessione il tenant
 * dell'utente impersonato così che lo slave resti puntato al DB corretto anche nelle
 * request successive. Uscendo dall'impersonazione (torna al ROLE_ADMIN sul master) il
 * contesto tenant viene azzerato.
 *
 * Registrato su security.switch_user in config/services.yaml.
 */
class SwitchUserSubscriber
{
    public function __construct(private readonly CompanyService $companyService)
    {
    }

    public function onSwitchUser(SwitchUserEvent $event): void
    {
        $target = $event->getTargetUser();

        if ($target instanceof SlaveUser) {
            $company = $this->companyService->resolveAgencyCompanyByEmail($target->getUserIdentifier());
            if ($company !== null) {
                $this->companyService->switchToCompany($company);

                return;
            }
        }

        // Uscita dall'impersonazione o switch verso un utente master: nessun tenant attivo.
        $this->companyService->clearSession();
    }
}
