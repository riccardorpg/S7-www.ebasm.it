<?php

namespace App\Controller\Admin;

use App\Entity\Master\DemoRequest;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * 6.1.1 Gestione delle richieste demo in arrivo (allarme della scrivania admin).
 * La conversione in cliente vive in ClientController::new (?from=<id>): qui restano
 * lo scarto e il recupero dall'archivio.
 */
#[Route('/amministratore/richieste')]
#[IsGranted('ROLE_ADMIN')]
class DemoRequestController extends AbstractController
{
    public function __construct(private readonly ManagerRegistry $registry)
    {
    }

    #[Route('/{id}/scarta', name: 'admin_demo_request_reject', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function reject(DemoRequest $demoRequest, Request $request): Response
    {
        if ($this->isCsrfTokenValid('demoRequest', (string) $request->request->get('_csrf_token'))) {
            if (!$demoRequest->isNew()) {
                $this->addFlash('danger', 'La richiesta è già stata evasa: non può essere scartata.');

                return $this->redirectToRoute('admin_index');
            }

            $demoRequest->markRejected($this->getUser()?->getUserIdentifier());
            $this->registry->getManager('master')->flush();
            $this->addFlash('success', 'Richiesta scartata: la trovi nel tab "Richieste scartate".');
        }

        return $this->redirectToRoute('admin_index');
    }

    #[Route('/{id}/ripristina', name: 'admin_demo_request_restore', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function restore(DemoRequest $demoRequest, Request $request): Response
    {
        if ($this->isCsrfTokenValid('demoRequest', (string) $request->request->get('_csrf_token'))) {
            if ($demoRequest->getStatus() !== DemoRequest::STATUS_REJECTED) {
                $this->addFlash('danger', 'Solo una richiesta scartata può essere ripristinata.');

                return $this->redirectToRoute('admin_index');
            }

            $demoRequest->markNew();
            $this->registry->getManager('master')->flush();
            $this->addFlash('success', 'Richiesta ripristinata tra quelle da evadere.');
        }

        return $this->redirectToRoute('admin_index');
    }
}
