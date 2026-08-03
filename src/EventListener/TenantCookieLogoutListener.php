<?php

namespace App\EventListener;

use App\Service\CompanyService;
use Symfony\Component\Security\Http\Event\LogoutEvent;

/**
 * Al logout rimuove il cookie del tenant (vedi CompanyService::COOKIE_TENANT), che
 * altrimenti resterebbe fino alla sua scadenza a puntare la connessione slave
 * sull'ultima agenzia usata.
 */
class TenantCookieLogoutListener
{
    public function onLogout(LogoutEvent $event): void
    {
        $response = $event->getResponse();
        if ($response === null) {
            return;
        }

        $request = $event->getRequest();
        $response->headers->clearCookie(
            CompanyService::COOKIE_TENANT,
            $request->getBasePath() ?: '/',
            null,
            $request->isSecure(),
            true
        );
    }
}
