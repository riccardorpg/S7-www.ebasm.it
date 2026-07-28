<?php

namespace App\Controller\Admin;

use App\Repository\Master\CompanyRepository;
use App\Repository\Master\DemoRequestRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * 6. Scrivania admin: allarmi in tab.
 */
#[Route('/amministratore')]
#[IsGranted('ROLE_ADMIN')]
class AdminController extends AbstractController
{
    #[Route('', name: 'admin_index', methods: ['GET'])]
    public function index(DemoRequestRepository $demoRequests, CompanyRepository $companies): Response
    {
        return $this->render('admin/index.html.twig', [
            // 6.1.1 Nuove richieste in arrivo
            'newRequests' => $demoRequests->findPending(),
            // 6.1.2 Demo in scadenza (entro 30 giorni)
            'expiringDemos' => $companies->findExpiring(true, 30),
            // 6.1.3 Licenze in scadenza (entro 30 giorni)
            'expiringLicenses' => $companies->findExpiring(false, 30),
        ]);
    }

    /**
     * Salva in sessione la tab attiva di una pagina (stile Tillomeditalia).
     * La chiave è "{route}_tab"; il ripristino avviene lato Twig al load.
     */
    #[Route('/aggiorna-sessione-tab', name: 'admin_update_tab_session', methods: ['POST'])]
    public function updateTabSession(Request $request): JsonResponse
    {
        $path = (string) $request->request->get('path');
        $tab = (string) $request->request->get('tab');
        if ($path !== '') {
            $request->getSession()->set($path . '_tab', $tab);
        }

        return new JsonResponse(['success' => true]);
    }
}
