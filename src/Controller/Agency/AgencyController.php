<?php

namespace App\Controller\Agency;

use App\Service\CompanyService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/agenzia')]
#[IsGranted('ROLE_AGENCY')]
class AgencyController extends AbstractController
{
    #[Route('', name: 'agency_index', methods: ['GET'])]
    public function index(CompanyService $companyService): Response
    {
        return $this->render('role/agency/index.html.twig', [
            'company' => $companyService->getCurrentCompany(),
        ]);
    }
}
