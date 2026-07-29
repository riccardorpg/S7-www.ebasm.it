<?php

namespace App\Controller\Admin;

use App\Entity\Master\User;
use App\Repository\Master\CompanyRepository;
use App\Repository\Master\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Knp\Component\Pager\PaginatorInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * Gestione notai (ROLE_NOTARY): elenco, creazione, modifica dati, invio credenziali
 * e assegnazione delle agenzie (clienti) che ciascun notaio può vedere (notaio↔Company).
 */
#[Route('/amministratore/notai')]
#[IsGranted('ROLE_ADMIN')]
class NotaryUserController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly UserPasswordHasherInterface $hasher,
    ) {
    }

    #[Route('', name: 'admin_notaries', methods: ['GET'])]
    public function index(Request $request, UserRepository $users, CompanyRepository $companies, PaginatorInterface $paginator): Response
    {
        $filters = [
            'q' => trim((string) $request->query->get('f_q', '')),
            'email' => trim((string) $request->query->get('f_email', '')),
            'agency' => trim((string) $request->query->get('f_agency', '')),
        ];

        $qb = $users->createQueryBuilder('u')
            ->andWhere('u.role = :role')->setParameter('role', 'ROLE_NOTARY');

        if ($filters['q'] !== '') {
            $qb->andWhere('u.name LIKE :q OR u.surname LIKE :q')
                ->setParameter('q', '%' . $filters['q'] . '%');
        }
        if ($filters['email'] !== '') {
            $qb->andWhere('u.email LIKE :em')->setParameter('em', '%' . $filters['email'] . '%');
        }
        if ($filters['agency'] !== '') {
            $qb->innerJoin('u.companies', 'c')->andWhere('c.id = :aid')->setParameter('aid', (int) $filters['agency']);
        }

        $records = $paginator->paginate(
            $qb->getQuery(),
            $request->query->getInt('page', 1),
            20,
            [
                'defaultSortFieldName' => 'u.surname',
                'defaultSortDirection' => 'asc',
                'sortFieldAllowList' => ['u.surname', 'u.email'],
                'distinct' => true,
            ]
        );

        return $this->render('admin/notaries/index.html.twig', [
            'records' => $records,
            'filters' => $filters,
            'companies' => $companies->findBy(['active' => true], ['name' => 'ASC']),
        ]);
    }

    /** Nuovo notaio (utente master ROLE_NOTARY). */
    #[Route('/nuovo', name: 'admin_notary_new', methods: ['POST'])]
    public function new(Request $request, UserRepository $users): RedirectResponse
    {
        if (!$this->isCsrfTokenValid('notaryNew', (string) $request->request->get('_csrf_token'))) {
            $this->addFlash('danger', 'Token non valido, riprova.');

            return $this->redirectToRoute('admin_notaries');
        }

        $name = trim((string) $request->request->get('name'));
        $surname = trim((string) $request->request->get('surname'));
        $email = mb_strtolower(trim((string) $request->request->get('email')));

        if ($name === '' || $surname === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->addFlash('danger', 'Nome, cognome ed e-mail valida sono obbligatori.');

            return $this->redirectToRoute('admin_notaries');
        }
        if ($users->findOneByEmail($email) !== null) {
            $this->addFlash('danger', 'Esiste già un utente master con questa e-mail.');

            return $this->redirectToRoute('admin_notaries');
        }

        $user = new User();
        $user->setName($name)->setSurname($surname)->setEmail($email)->setRole('ROLE_NOTARY')->setActive(true);
        // Password provvisoria casuale: verrà impostata dall'utente via "invia credenziali".
        $user->setPassword($this->hasher->hashPassword($user, bin2hex(random_bytes(8))));
        $this->em->persist($user);
        $this->em->flush();

        $this->addFlash('success', 'Notaio ' . $email . ' creato. Usa "Invia credenziali" per l\'attivazione.');

        return $this->redirectToRoute('admin_notaries');
    }

    /** Modifica dati del notaio. */
    #[Route('/{id}/modifica', name: 'admin_notary_edit', requirements: ['id' => '\d+'], methods: ['POST'])]
    public function edit(int $id, Request $request, UserRepository $users): RedirectResponse
    {
        $notary = $this->findNotary($id, $users);
        if ($notary === null) {
            return $this->redirectToRoute('admin_notaries');
        }
        if (!$this->isCsrfTokenValid('notaryEdit', (string) $request->request->get('_csrf_token'))) {
            $this->addFlash('danger', 'Token non valido, riprova.');

            return $this->redirectToRoute('admin_notaries');
        }

        $name = trim((string) $request->request->get('name'));
        $surname = trim((string) $request->request->get('surname'));
        $email = mb_strtolower(trim((string) $request->request->get('email')));

        if ($name === '' || $surname === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->addFlash('danger', 'Nome, cognome ed e-mail valida sono obbligatori.');

            return $this->redirectToRoute('admin_notaries');
        }
        $existing = $users->findOneByEmail($email);
        if ($existing !== null && $existing->getId() !== $notary->getId()) {
            $this->addFlash('danger', 'E-mail già usata da un altro utente master.');

            return $this->redirectToRoute('admin_notaries');
        }

        $notary->setName($name)->setSurname($surname)->setEmail($email);
        $this->em->flush();

        $this->addFlash('success', 'Dati del notaio aggiornati.');

        return $this->redirectToRoute('admin_notaries');
    }

    /** Invia (genera) le credenziali di attivazione. */
    #[Route('/{id}/credenziali', name: 'admin_notary_credentials', requirements: ['id' => '\d+'], methods: ['POST'])]
    public function credentials(int $id, Request $request, UserRepository $users): RedirectResponse
    {
        $notary = $this->findNotary($id, $users);
        if ($notary === null) {
            return $this->redirectToRoute('admin_notaries');
        }
        if (!$this->isCsrfTokenValid('notaryCredentials', (string) $request->request->get('_csrf_token'))) {
            $this->addFlash('danger', 'Token non valido, riprova.');

            return $this->redirectToRoute('admin_notaries');
        }

        $notary->setOneTimeCode(bin2hex(random_bytes(16)));
        $notary->setExpirationOneTimeCode(new \DateTimeImmutable('+72 hours'));
        $this->em->flush();
        // TODO: inviare email con link path('password_create', {code: ...}) per il master.
        $this->addFlash('success', 'Credenziali generate per ' . $notary->getEmail() . ' (invio email da configurare).');

        return $this->redirectToRoute('admin_notaries');
    }

    /** Salva le agenzie abbinate al notaio. */
    #[Route('/{id}/agenzie', name: 'admin_notary_agencies', requirements: ['id' => '\d+'], methods: ['POST'])]
    public function saveAgencies(int $id, Request $request, UserRepository $users, CompanyRepository $companies): RedirectResponse
    {
        $notary = $this->findNotary($id, $users);
        if ($notary === null) {
            return $this->redirectToRoute('admin_notaries');
        }
        if (!$this->isCsrfTokenValid('notaryAgencies', (string) $request->request->get('_csrf_token'))) {
            $this->addFlash('danger', 'Token non valido, riprova.');

            return $this->redirectToRoute('admin_notaries');
        }

        $ids = array_map('intval', (array) $request->request->all('company_ids'));
        $selected = $ids !== [] ? $companies->findBy(['id' => $ids]) : [];

        // Sincronizza la collezione: rimuove le non selezionate, aggiunge le nuove.
        foreach ($notary->getCompanies()->toArray() as $existing) {
            if (!in_array($existing, $selected, true)) {
                $notary->removeCompany($existing);
            }
        }
        foreach ($selected as $company) {
            $notary->addCompany($company);
        }
        $this->em->flush();

        $this->addFlash('success', sprintf('Agenzie di %s aggiornate (%d).', $notary->getFullName(), count($selected)));

        return $this->redirectToRoute('admin_notaries');
    }

    private function findNotary(int $id, UserRepository $users): ?User
    {
        $notary = $users->find($id);
        if ($notary === null || !$notary->isNotary()) {
            $this->addFlash('danger', 'Notaio non trovato.');

            return null;
        }

        return $notary;
    }
}
