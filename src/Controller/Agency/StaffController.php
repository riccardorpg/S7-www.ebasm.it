<?php

namespace App\Controller\Agency;

use App\Entity\Slave\Permission;
use App\Entity\Slave\User as StaffUser;
use App\Entity\Slave\UserPermission;
use App\Repository\Slave\PermissionRepository;
use App\Service\AppMailer;
use App\Service\CompanyService;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\Persistence\ManagerRegistry;
use Knp\Component\Pager\PaginatorInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\ExpressionLanguage\Expression;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * 10. Staff dell'agenzia: chi ha accesso alla piattaforma, con ruolo (10.2.4),
 * permessi per sezione (10.1.5), invio credenziali (10.1.7) e attiva/sospendi (10.1.8).
 *
 * I membri dello staff sono gli utenti del DB agenzia (slave), gli stessi che l'admin
 * vede nella scheda cliente. Nuovo e modifica passano dai modali.
 */
#[Route('/agenzia/staff')]
#[IsGranted('ROLE_AGENCY')]
#[IsGranted(new Expression("is_granted('view', 'staff')"), message: 'Non hai accesso alla gestione dello staff.')]
class StaffController extends AbstractController
{
    private const PER_PAGE = 20;

    public function __construct(private readonly ManagerRegistry $registry)
    {
    }

    /** 10.1 Elenco delle persone che hanno accesso alla piattaforma. */
    #[Route('', name: 'agency_staff', methods: ['GET'])]
    public function index(Request $request, PaginatorInterface $paginator): Response
    {
        $em = $this->slave();
        $filters = [
            'name' => trim((string) $request->query->get('f_name', '')),
            'surname' => trim((string) $request->query->get('f_surname', '')),
            'email' => trim((string) $request->query->get('f_email', '')),
            // 10.1.6 Stato: '' tutti, '1' attivi, '0' sospesi.
            'active' => trim((string) $request->query->get('f_active', '')),
            // 10.1.4 Ruolo: elenco di valori separati da virgola (filtro a scelta multipla).
            'role' => trim((string) $request->query->get('f_role', '')),
        ];

        $qb = $em->getRepository(StaffUser::class)->createQueryBuilder('u');
        foreach (['name' => 'n', 'surname' => 's', 'email' => 'e'] as $field => $param) {
            if ($filters[$field] !== '') {
                $qb->andWhere(sprintf('u.%s LIKE :%s', $field, $param))
                    ->setParameter($param, '%' . $filters[$field] . '%');
            }
        }
        if ($filters['active'] !== '') {
            $qb->andWhere('u.active = :act')->setParameter('act', $filters['active'] === '1');
        }
        $roles = array_values(array_intersect(
            array_filter(explode(',', $filters['role'])),
            array_keys(StaffUser::STAFF_ROLES)
        ));
        if ($roles !== []) {
            $qb->andWhere('u.staffRole IN (:roles)')->setParameter('roles', $roles);
        }

        $records = $paginator->paginate($qb->getQuery(), $request->query->getInt('page', 1), self::PER_PAGE, [
            'defaultSortFieldName' => 'u.surname',
            'defaultSortDirection' => 'asc',
            'sortFieldAllowList' => ['u.name', 'u.surname', 'u.email', 'u.staffRole'],
        ]);

        /** @var PermissionRepository $permissions */
        $permissions = $em->getRepository(Permission::class);

        return $this->render('role/agency/staff/index.html.twig', [
            'records' => $records,
            'filters' => $filters,
            'permissions' => $permissions->findOrdered(),
            'roles' => StaffUser::STAFF_ROLES,
        ]);
    }

    /** 10.2 Nuovo membro dello staff. */
    #[Route('/nuovo', name: 'agency_staff_new', methods: ['POST'])]
    #[IsGranted(new Expression("is_granted('edit', 'staff')"))]
    public function new(Request $request): RedirectResponse
    {
        if (!$this->isCsrfTokenValid('staffNew', (string) $request->request->get('_csrf_token'))) {
            return $this->back();
        }

        $em = $this->slave();
        $email = mb_strtolower(trim((string) $request->request->get('email')));
        if ($em->getRepository(StaffUser::class)->findOneBy(['email' => $email]) !== null) {
            $this->addFlash('danger', 'Esiste già un membro dello staff con l\'e-mail ' . $email . '.');

            return $this->back();
        }

        $member = new StaffUser();
        if (!$this->fill($member, $request)) {
            return $this->back();
        }

        $em->persist($member);
        $em->flush();
        $this->addFlash('success', 'Membro dello staff "' . $member->getFullName() . '" creato. Ora puoi inviargli le credenziali.');

        return $this->back();
    }

    /** Modifica dei dati anagrafici e del ruolo. */
    #[Route('/{id}/modifica', name: 'agency_staff_edit', methods: ['POST'], requirements: ['id' => '\d+'])]
    #[IsGranted(new Expression("is_granted('edit', 'staff')"))]
    public function edit(int $id, Request $request): RedirectResponse
    {
        if (!$this->isCsrfTokenValid('staffEdit', (string) $request->request->get('_csrf_token'))) {
            return $this->back();
        }

        $em = $this->slave();
        $member = $this->findMember($em, $id);

        $email = mb_strtolower(trim((string) $request->request->get('email')));
        $duplicate = $em->getRepository(StaffUser::class)->findOneBy(['email' => $email]);
        if ($duplicate !== null && $duplicate->getId() !== $member->getId()) {
            $this->addFlash('danger', 'L\'e-mail ' . $email . ' è già usata da un altro membro dello staff.');

            return $this->back();
        }

        if ($this->fill($member, $request)) {
            $em->flush();
            $this->addFlash('success', 'Membro dello staff aggiornato.');
        }

        return $this->back();
    }

    /** 10.1.5 Gestione permessi piattaforma: un livello per sezione. */
    #[Route('/{id}/permessi', name: 'agency_staff_permissions', methods: ['POST'], requirements: ['id' => '\d+'])]
    #[IsGranted(new Expression("is_granted('edit', 'staff')"))]
    public function permissions(int $id, Request $request): RedirectResponse
    {
        if (!$this->isCsrfTokenValid('staffPermissions', (string) $request->request->get('_csrf_token'))) {
            return $this->back();
        }

        $em = $this->slave();
        $member = $this->findMember($em, $id);

        /** @var array<string, string> $submitted slug => ''|'r'|'rw' */
        $submitted = (array) $request->request->all('permissions');

        // Livelli già assegnati, per slug: così aggiorniamo invece di cancellare e ricreare.
        $current = [];
        foreach ($member->getUserPermissions() as $up) {
            $current[(string) $up->getPermission()?->getSlug()] = $up;
        }

        foreach ($em->getRepository(Permission::class)->findAll() as $permission) {
            $slug = $permission->getSlug();
            $value = (string) ($submitted[$slug] ?? '');
            if (!in_array($value, ['', UserPermission::READ, UserPermission::READ_WRITE], true)) {
                $value = '';
            }

            $existing = $current[$slug] ?? null;
            if ($value === '') {
                // 10.1.5.3 "Nessuno" = nessuna riga.
                if ($existing !== null) {
                    $member->getUserPermissions()->removeElement($existing);
                    $em->remove($existing);
                }
                continue;
            }

            if ($existing === null) {
                $existing = (new UserPermission())->setUser($member)->setPermission($permission);
                $member->getUserPermissions()->add($existing);
                $em->persist($existing);
            }
            $existing->setValue($value);
        }

        $em->flush();
        $this->addFlash('success', 'Permessi di "' . $member->getFullName() . '" aggiornati.');

        return $this->back();
    }

    /** 10.1.7 Invia credenziali: genera il codice usa-e-getta per creare la password. */
    #[Route('/{id}/credenziali', name: 'agency_staff_credentials', methods: ['POST'], requirements: ['id' => '\d+'])]
    #[IsGranted(new Expression("is_granted('edit', 'staff')"))]
    public function credentials(int $id, Request $request, AppMailer $mailer, CompanyService $companyService): RedirectResponse
    {
        if (!$this->isCsrfTokenValid('staffCredentials', (string) $request->request->get('_csrf_token'))) {
            return $this->back();
        }

        $em = $this->slave();
        $member = $this->findMember($em, $id);

        $member->setOneTimeCode(bin2hex(random_bytes(16)));
        $member->setExpirationOneTimeCode(new \DateTimeImmutable('+72 hours'));
        $em->flush();

        // 14.3 Il link porta il codice dell'agenzia corrente: dice a quale DB puntare.
        $sent = $mailer->passwordCreate(
            (string) $member->getEmail(),
            $member->getFullName(),
            (string) $member->getOneTimeCode(),
            $companyService->getCurrentCompany()?->getCode(),
            $member->getExpirationOneTimeCode(),
        );
        $this->addFlash(
            $sent ? 'success' : 'danger',
            $sent
                ? 'Credenziali inviate a ' . $member->getEmail() . '.'
                : 'Credenziali generate, ma l\'invio dell\'e-mail a ' . $member->getEmail() . ' non è riuscito.'
        );

        return $this->back();
    }

    /** 10.1.8 Attiva/sospendi l'account. */
    #[Route('/{id}/stato', name: 'agency_staff_toggle', methods: ['POST'], requirements: ['id' => '\d+'])]
    #[IsGranted(new Expression("is_granted('edit', 'staff')"))]
    public function toggle(int $id, Request $request): RedirectResponse
    {
        if (!$this->isCsrfTokenValid('staffToggle', (string) $request->request->get('_csrf_token'))) {
            return $this->back();
        }

        $em = $this->slave();
        $member = $this->findMember($em, $id);

        if ($member->getId() === $this->getUser()?->getId()) {
            $this->addFlash('danger', 'Non puoi sospendere il tuo stesso account.');

            return $this->back();
        }

        $member->setActive(!$member->isActive());
        $em->flush();
        $this->addFlash('success', sprintf(
            'Account di "%s" %s.',
            $member->getFullName(),
            $member->isActive() ? 'attivato' : 'sospeso'
        ));

        return $this->back();
    }

    // ===================== SUPPORTO =====================

    private function slave(): EntityManagerInterface
    {
        /** @var EntityManagerInterface $em */
        $em = $this->registry->getManager('slave');

        return $em;
    }

    private function findMember(EntityManagerInterface $em, int $id): StaffUser
    {
        $member = $em->getRepository(StaffUser::class)->find($id);
        if ($member === null) {
            throw $this->createNotFoundException('Membro dello staff non trovato.');
        }

        return $member;
    }

    private function back(): RedirectResponse
    {
        return $this->redirectToRoute('agency_staff', [], Response::HTTP_SEE_OTHER);
    }

    /** 10.2.1–10.2.4 Campi del membro dello staff. */
    private function fill(StaffUser $member, Request $request): bool
    {
        $name = trim((string) $request->request->get('name'));
        $surname = trim((string) $request->request->get('surname'));
        $email = mb_strtolower(trim((string) $request->request->get('email')));
        $role = (string) $request->request->get('staff_role');

        if ($name === '' || $surname === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->addFlash('danger', 'Nome, cognome ed e-mail valida sono obbligatori.');

            return false;
        }
        if (!isset(StaffUser::STAFF_ROLES[$role])) {
            $this->addFlash('danger', 'Seleziona un ruolo valido.');

            return false;
        }

        $member->setName($name)
            ->setSurname($surname)
            ->setEmail($email)
            ->setStaffRole($role);

        return true;
    }
}
