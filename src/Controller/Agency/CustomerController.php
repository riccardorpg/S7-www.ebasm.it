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
        if (!$this->fill($customer, $request, $em)) {
            return $this->redirectToRoute('agency_customers', [], Response::HTTP_SEE_OTHER);
        }

        $em->persist($customer);
        $em->flush();
        $this->addFlash('success', 'Cliente "' . $customer->getFullName() . '" creato.');

        return $this->redirectToRoute('agency_customer_show', ['id' => $customer->getId()], Response::HTTP_SEE_OTHER);
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

        if ($this->fill($customer, $request, $em, $id)) {
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

    /** 11.2.1 / 11.2.2 Dati anagrafici e fiscali. */
    private function fill(Customer $customer, Request $request, EntityManagerInterface $em, ?int $exceptId = null): bool
    {
        $name = trim((string) $request->request->get('name'));
        $surname = trim((string) $request->request->get('surname'));
        if ($surname === '') {
            $this->addFlash('danger', 'Il cognome (o la ragione sociale) è obbligatorio.');

            return false;
        }

        $fiscalCode = mb_strtoupper(trim((string) $request->request->get('fiscal_code')));
        if ($fiscalCode !== '') {
            /** @var \App\Repository\Slave\CustomerRepository $repo */
            $repo = $em->getRepository(Customer::class);
            $duplicate = $repo->findOneByFiscalCode($fiscalCode);
            if ($duplicate !== null && $duplicate->getId() !== $exceptId) {
                $this->addFlash('danger', 'Esiste già un cliente con codice fiscale ' . $fiscalCode . '.');

                return false;
            }
        }

        $birthDate = $this->parseDate(trim((string) $request->request->get('birth_date')));
        if ($birthDate === false) {
            $this->addFlash('danger', 'La data di nascita non è valida: usa il formato gg-mm-aaaa.');

            return false;
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

        return true;
    }
}
