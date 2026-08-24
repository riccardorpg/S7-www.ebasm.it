<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * Preferenze d'interfaccia salvate in sessione, condivise da tutte le aree (stile
 * Tillomeditalia). Sta fuori da /amministratore, /notaio e /agenzia perché la usano
 * tutti i ruoli: basta essere autenticati.
 */
#[Route('/sessione')]
#[IsGranted('IS_AUTHENTICATED_FULLY')]
class SessionController extends AbstractController
{
    /**
     * Salva la tab attiva di una pagina. La chiave è "{route}_tab"; il ripristino
     * avviene lato Twig al load (components/js/tab_session_js.html.twig).
     */
    #[Route('/tab', name: 'session_update_tab', methods: ['POST'])]
    public function updateTab(Request $request): JsonResponse
    {
        $path = (string) $request->request->get('path');
        $tab = (string) $request->request->get('tab');
        if ($path !== '') {
            $request->getSession()->set($path . '_tab', $tab);
        }

        return new JsonResponse(['success' => true]);
    }
}
