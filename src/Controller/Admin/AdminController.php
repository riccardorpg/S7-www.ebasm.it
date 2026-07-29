<?php

namespace App\Controller\Admin;

use App\Entity\Master\AgencyUserIndex;
use App\Repository\Master\CompanyRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/amministratore')]
#[IsGranted('ROLE_ADMIN')]
class AdminController extends AbstractController
{
    #[Route('', name: 'admin_index', methods: ['GET'])]
    public function index(CompanyRepository $companyRepository): Response
    {
        return $this->render('role/admin/index.html.twig', [
            'companies' => $companyRepository->findBy([], ['name' => 'ASC']),
        ]);
    }

    /**
     * Elenco agenzie con relativi utenti impersonabili.
     */
    #[Route('/agenzie', name: 'admin_agencies', methods: ['GET'])]
    public function agencies(CompanyRepository $companyRepository, ManagerRegistry $registry): Response
    {
        $companies = $companyRepository->findBy([], ['name' => 'ASC']);

        // Utenti agenzia impersonabili, raggruppati per company (dall'indice cross-tenant).
        $indexByCompany = [];
        /** @var AgencyUserIndex[] $entries */
        $entries = $registry->getManager('master')->getRepository(AgencyUserIndex::class)->findBy([], ['email' => 'ASC']);
        foreach ($entries as $entry) {
            $indexByCompany[$entry->getCompany()->getId()][] = $entry->getEmail();
        }

        return $this->render('role/admin/agencies.html.twig', [
            'companies' => $companies,
            'usersByCompany' => $indexByCompany,
        ]);
    }
}
