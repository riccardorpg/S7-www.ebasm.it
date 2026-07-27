<?php

namespace App\Controller\Admin;

use App\Entity\Master\ExternalAccount;
use App\Repository\Master\CompanyRepository;
use App\Repository\Master\ExternalAccountRepository;
use Doctrine\ORM\EntityManagerInterface;
use Knp\Component\Pager\PaginatorInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * 8. Gestione account esterni. Ogni account è collegato a un cliente-studio (Company).
 * Nuovo e modifica avvengono in modale sulla lista.
 */
#[Route('/amministratore/account-esterni')]
#[IsGranted('ROLE_ADMIN')]
class ExternalAccountController extends AbstractController
{
    #[Route('', name: 'admin_external_accounts', methods: ['GET'])]
    public function index(ExternalAccountRepository $accounts, CompanyRepository $companies, PaginatorInterface $paginator, Request $request): Response
    {
        $filters = [
            'name' => trim((string) $request->query->get('f_name', '')),
            'surname' => trim((string) $request->query->get('f_surname', '')),
            'email' => trim((string) $request->query->get('f_email', '')),
            'phone' => trim((string) $request->query->get('f_phone', '')),
            'company' => trim((string) $request->query->get('f_company', '')),
        ];

        $qb = $accounts->createQueryBuilder('a')->leftJoin('a.company', 'co')->addSelect('co');
        if ($filters['name'] !== '') {
            $qb->andWhere('a.name LIKE :n')->setParameter('n', '%' . $filters['name'] . '%');
        }
        if ($filters['surname'] !== '') {
            $qb->andWhere('a.surname LIKE :s')->setParameter('s', '%' . $filters['surname'] . '%');
        }
        if ($filters['email'] !== '') {
            $qb->andWhere('a.email LIKE :e')->setParameter('e', '%' . $filters['email'] . '%');
        }
        if ($filters['phone'] !== '') {
            $qb->andWhere('a.phone LIKE :p')->setParameter('p', '%' . $filters['phone'] . '%');
        }
        $companyIds = array_values(array_filter(explode(',', $filters['company'])));
        if ($companyIds !== []) {
            $qb->andWhere('co.id IN (:cids)')->setParameter('cids', $companyIds);
        }

        $records = $paginator->paginate($qb->getQuery(), $request->query->getInt('page', 1), 20, [
            'defaultSortFieldName' => 'a.surname',
            'defaultSortDirection' => 'asc',
            'sortFieldAllowList' => ['a.name', 'a.surname', 'a.email', 'a.phone', 'co.name'],
        ]);

        return $this->render('admin/external/index.html.twig', [
            'records' => $records,
            'filters' => $filters,
            'companies' => $companies->findBy([], ['name' => 'ASC']),
        ]);
    }

    #[Route('/nuovo', name: 'admin_external_account_new', methods: ['POST'])]
    public function new(Request $request, CompanyRepository $companies, EntityManagerInterface $em): Response
    {
        if (!$this->isCsrfTokenValid('externalNew', (string) $request->request->get('_csrf_token'))) {
            return $this->redirectToRoute('admin_external_accounts');
        }

        $account = new ExternalAccount();
        if (!$this->fill($account, $request, $companies)) {
            return $this->redirectToRoute('admin_external_accounts');
        }

        $em->persist($account);
        $em->flush();
        $this->addFlash('success', 'Account esterno "' . $account->getFullName() . '" creato.');

        return $this->redirectToRoute('admin_external_accounts');
    }

    #[Route('/{id}/modifica', name: 'admin_external_account_edit', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function edit(ExternalAccount $account, Request $request, CompanyRepository $companies, EntityManagerInterface $em): Response
    {
        if (!$this->isCsrfTokenValid('externalEdit', (string) $request->request->get('_csrf_token'))) {
            return $this->redirectToRoute('admin_external_accounts');
        }

        if ($this->fill($account, $request, $companies)) {
            $em->flush();
            $this->addFlash('success', 'Account esterno aggiornato.');
        }

        return $this->redirectToRoute('admin_external_accounts');
    }

    #[Route('/{id}/elimina', name: 'admin_external_account_delete', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function delete(ExternalAccount $account, Request $request, EntityManagerInterface $em): Response
    {
        if ($this->isCsrfTokenValid('delete', (string) $request->request->get('_csrf_token')) && $account->canDelete()) {
            $em->remove($account);
            $em->flush();
            $this->addFlash('success', 'Account esterno eliminato.');
        }

        return $this->redirectToRoute('admin_external_accounts');
    }

    private function fill(ExternalAccount $account, Request $request, CompanyRepository $companies): bool
    {
        $name = trim((string) $request->request->get('name'));
        $surname = trim((string) $request->request->get('surname'));
        $email = mb_strtolower(trim((string) $request->request->get('email')));

        if ($name === '' || $surname === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->addFlash('danger', 'Nome, cognome ed e-mail valida sono obbligatori.');

            return false;
        }

        $companyId = (int) $request->request->get('company_id');
        $account->setName($name)
            ->setSurname($surname)
            ->setEmail($email)
            ->setPhone(trim((string) $request->request->get('phone')) ?: null)
            ->setActive(true)
            ->setCompany($companyId > 0 ? $companies->find($companyId) : null);

        return true;
    }
}
