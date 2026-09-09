<?php

namespace App\Controller\Agency;

use App\Controller\Trait\ParsesDatesTrait;
use App\Entity\Slave\Customer;
use App\Entity\Slave\Practice;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\Persistence\ManagerRegistry;
use Knp\Component\Pager\PaginatorInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\ExpressionLanguage\Expression;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * 11. Clienti dell'agenzia: anagrafica di chi compra o vende nelle pratiche.
 * Elenco (11.1) e scheda con dati anagrafici, dati fiscali ed elenco pratiche (11.2).
 */
#[Route('/agenzia/clienti')]
#[IsGranted('ROLE_AGENCY')]
#[IsGranted(new Expression("is_granted('view', 'customers')"), message: 'Non hai accesso all\'anagrafica clienti.')]
class CustomerController extends AbstractController
{
    use ParsesDatesTrait;

    private const PER_PAGE = 20;

    public function __construct(private readonly ManagerRegistry $registry)
    {
    }

    /** 11.1 Elenco dei clienti. */
    #[Route('', name: 'agency_customers', methods: ['GET'])]
    public function index(Request $request, PaginatorInterface $paginator): Response
    {
        $filters = [
            'name' => trim((string) $request->query->get('f_name', '')),
            'surname' => trim((string) $request->query->get('f_surname', '')),
            'fiscal' => trim((string) $request->query->get('f_fiscal', '')),
            'address' => trim((string) $request->query->get('f_address', '')),
        ];

        $qb = $this->slave()->getRepository(Customer::class)->createQueryBuilder('c');
        if ($filters['name'] !== '') {
            $qb->andWhere('c.name LIKE :n')->setParameter('n', '%' . $filters['name'] . '%');
        }
        if ($filters['surname'] !== '') {
            $qb->andWhere('c.surname LIKE :s')->setParameter('s', '%' . $filters['surname'] . '%');
        }
        if ($filters['fiscal'] !== '') {
            $qb->andWhere('c.fiscalCode LIKE :f OR c.vatNumber LIKE :f')->setParameter('f', '%' . $filters['fiscal'] . '%');
        }
        if ($filters['address'] !== '') {
            $qb->andWhere('c.address LIKE :a OR c.city LIKE :a OR c.zip LIKE :a')->setParameter('a', '%' . $filters['address'] . '%');
        }

        $records = $paginator->paginate($qb->getQuery(), $request->query->getInt('page', 1), self::PER_PAGE, [
            'defaultSortFieldName' => 'c.surname',
            'defaultSortDirection' => 'asc',
            'sortFieldAllowList' => ['c.name', 'c.surname', 'c.fiscalCode', 'c.city'],
        ]);

        return $this->render('role/agency/customers/index.html.twig', [
            'records' => $records,
            'filters' => $filters,
        ]);
    }

    /** 11.2 Scheda cliente: anagrafica, dati fiscali ed elenco pratiche. */
    #[Route('/{id}', name: 'agency_customer_show', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function show(int $id): Response
    {
        $em = $this->slave();
        $customer = $em->getRepository(Customer::class)->find($id);
        if ($customer === null) {
            throw $this->createNotFoundException('Cliente non trovato.');
        }

        // 11.2.3 Le pratiche in cui il cliente è acquirente o venditore.
        $practices = $em->getRepository(Practice::class)->createQueryBuilder('p')
            ->leftJoin('p.buyer', 'b')->addSelect('b')
            ->leftJoin('p.seller', 's')->addSelect('s')
            ->andWhere('p.buyer = :c OR p.seller = :c')
            ->setParameter('c', $customer)
            ->orderBy('p.createdAt', 'DESC')
            ->getQuery()
            ->getResult();

        return $this->render('role/agency/customers/show.html.twig', [
            'customer' => $customer,
            'practices' => $practices,
            // 11.2.3 Voci del filtro stato a scelta multipla.
            'statuses' => Practice::STATUSES,
        ]);
    }

    /** Nuovo cliente. */
    #[Route('/nuovo', name: 'agency_customer_new', methods: ['POST'])]
    #[IsGranted(new Expression("is_granted('edit', 'customers')"))]
    public function new(Request $request): RedirectResponse
    {
        if (!$this->isCsrfTokenValid('customerNew', (string) $request->request->get('_csrf_token'))) {
            return $this->redirectToRoute('agency_customers', [], Response::HTTP_SEE_OTHER);
        }

        $em = $this->slave();
        $customer = new Customer();
        $error = $this->fill($customer, $request, $em);
        if ($error !== null) {
            $this->addFlash('danger', $error);

            return $this->redirectToRoute('agency_customers', [], Response::HTTP_SEE_OTHER);
        }

        $em->persist($customer);
        $em->flush();
        $this->addFlash('success', 'Cliente "' . $customer->getFullName() . '" creato.');

        return $this->redirectToRoute('agency_customer_show', ['id' => $customer->getId()], Response::HTTP_SEE_OTHER);
    }

    /**
     * 12.2.1 / 12.2.2 Nuovo cliente "al volo" dal form della pratica: stessi campi e
     * stessi controlli del form completo, ma risposta JSON, così la pratica in
     * compilazione non si perde e l'autocomplete può selezionarlo subito.
     */
    #[Route('/api/nuovo', name: 'agency_customer_quick_new', methods: ['POST'])]
    #[IsGranted(new Expression("is_granted('edit', 'customers')"))]
    public function quickNew(Request $request): JsonResponse
    {
        if (!$this->isCsrfTokenValid('customerQuickNew', (string) $request->request->get('_csrf_token'))) {
            return $this->json(['ok' => false, 'error' => 'Sessione scaduta: ricarica la pagina.'], Response::HTTP_BAD_REQUEST);
        }

        $em = $this->slave();
        $customer = new Customer();
        $error = $this->fill($customer, $request, $em);
        if ($error !== null) {
            return $this->json(['ok' => false, 'error' => $error], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $em->persist($customer);
        $em->flush();

        return $this->json([
            'ok' => true,
            'id' => $customer->getId(),
            // Stessa etichetta di agency_customer_search: la tendina e il campo coincidono.
            'label' => $customer->getFullName() . ($customer->getFiscalCode() ? ' — ' . $customer->getFiscalCode() : ''),
        ]);
    }

    /** Modifica dei dati anagrafici e fiscali dalla scheda. */
    #[Route('/{id}/modifica', name: 'agency_customer_edit', methods: ['POST'], requirements: ['id' => '\d+'])]
    #[IsGranted(new Expression("is_granted('edit', 'customers')"))]
    public function edit(int $id, Request $request): RedirectResponse
    {
        if (!$this->isCsrfTokenValid('customerEdit', (string) $request->request->get('_csrf_token'))) {
            return $this->redirectToRoute('agency_customer_show', ['id' => $id], Response::HTTP_SEE_OTHER);
        }

        $em = $this->slave();
        $customer = $em->getRepository(Customer::class)->find($id);
        if ($customer === null) {
            throw $this->createNotFoundException('Cliente non trovato.');
        }

        $error = $this->fill($customer, $request, $em, $id);
        if ($error !== null) {
            $this->addFlash('danger', $error);
        } else {
            $em->flush();
            $this->addFlash('success', 'Cliente aggiornato.');
        }

        return $this->redirectToRoute('agency_customer_show', ['id' => $id], Response::HTTP_SEE_OTHER);
    }

    // ===================== SUPPORTO =====================

    private function slave(): EntityManagerInterface
    {
        /** @var EntityManagerInterface $em */
        $em = $this->registry->getManager('slave');

        return $em;
    }

    /**
     * 11.2.1 / 11.2.2 Dati anagrafici e fiscali.
     *
     * Ritorna il messaggio d'errore, null se i dati sono validi: così lo stesso codice
     * serve i form (che lo mostrano come flash) e l'endpoint JSON (che lo restituisce).
     */
    private function fill(Customer $customer, Request $request, EntityManagerInterface $em, ?int $exceptId = null): ?string
    {
        $name = trim((string) $request->request->get('name'));
        $surname = trim((string) $request->request->get('surname'));
        if ($surname === '') {
            return 'Il cognome (o la ragione sociale) è obbligatorio.';
        }

        $fiscalCode = mb_strtoupper(trim((string) $request->request->get('fiscal_code')));
        if ($fiscalCode !== '') {
            /** @var \App\Repository\Slave\CustomerRepository $repo */
            $repo = $em->getRepository(Customer::class);
            $duplicate = $repo->findOneByFiscalCode($fiscalCode);
            if ($duplicate !== null && $duplicate->getId() !== $exceptId) {
                return 'Esiste già un cliente con codice fiscale ' . $fiscalCode . '.';
            }
        }

        $birthDate = $this->parseDate(trim((string) $request->request->get('birth_date')));
        if ($birthDate === false) {
            return 'La data di nascita non è valida: usa il formato gg-mm-aaaa.';
        }

        $customer->setName($name)
            ->setSurname($surname)
            ->setBirthPlace(trim((string) $request->request->get('birth_place')) ?: null)
            ->setBirthDate($birthDate)
            ->setAddress(trim((string) $request->request->get('address')) ?: null)
            ->setCity(trim((string) $request->request->get('city')) ?: null)
            ->setZip(trim((string) $request->request->get('zip')) ?: null)
            ->setEmail(trim((string) $request->request->get('email')) ?: null)
            ->setPhone(trim((string) $request->request->get('phone')) ?: null)
            ->setFiscalCode($fiscalCode ?: null)
            ->setVatNumber(trim((string) $request->request->get('vat_number')) ?: null)
            ->setPec(trim((string) $request->request->get('pec')) ?: null)
            ->setSdi(trim((string) $request->request->get('sdi')) ?: null)
            ->setNotes(trim((string) $request->request->get('notes')) ?: null);

        return null;
    }
}
