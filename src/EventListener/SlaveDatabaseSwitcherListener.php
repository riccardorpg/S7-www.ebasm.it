<?php

namespace App\EventListener;

use App\Service\CompanyService;
use Symfony\Component\HttpKernel\Event\RequestEvent;

/**
 * Ad ogni request principale ri-punta la connessione 'slave' al DB dell'agenzia
 * memorizzato in sessione, PRIMA che il firewall (priority 8) provi a ricaricare
 * l'utente ROLE_AGENCY dal user_provider entity 'slave'.
 *
 * Gestisce anche l'inizio dell'impersonazione (?_switch_user=<email agenzia>):
 * risolve il tenant dell'utente target e punta lo slave così che il firewall possa
 * caricare l'utente impersonato dal DB corretto.
 *
 * Registrato con priority 100 su kernel.request in config/services.yaml.
 */
class SlaveDatabaseSwitcherListener
{
    private const SWITCH_USER_PARAM = '_switch_user';
    private const SWITCH_USER_EXIT = '_exit';

    /** Prefissi che non richiedono contesto tenant. */
    private const SKIP_PATH_PREFIXES = [
        '/script',   // firewall http_basic
        '/_',        // profiler / wdt
        '/css',
        '/js',
        '/assets',
        '/build',
        '/images',
    ];

    public function __construct(private readonly CompanyService $companyService)
    {
    }

    public function onKernelRequest(RequestEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $request = $event->getRequest();
        $path = $request->getPathInfo();
        foreach (self::SKIP_PATH_PREFIXES as $prefix) {
            if ($path === $prefix || str_starts_with($path, $prefix . '/')) {
                return;
            }
        }

        if (!$request->hasSession()) {
            return;
        }

        try {
            // Inizio impersonazione di un'agenzia: il codice azienda (`c`) identifica il DB.
            // Punta lo slave prima che il firewall carichi l'utente impersonato.
            $switchTarget = $request->query->get(self::SWITCH_USER_PARAM);
            if (is_string($switchTarget) && $switchTarget !== '' && $switchTarget !== self::SWITCH_USER_EXIT) {
                $code = trim((string) $request->query->get('c', ''));
                if ($code !== '') {
                    $company = $this->companyService->getCompanyByCode($code);
                    if ($company !== null) {
                        $this->companyService->switchToCompany($company);
                    }
                }

                return;
            }

            $this->companyService->syncSlaveFromSession();
        } catch (\Throwable) {
            // Contesto tenant non determinabile: si prosegue con lo stato di default;
            // il flusso di login/redirect gestirà l'assenza di contesto.
        }
    }
}
