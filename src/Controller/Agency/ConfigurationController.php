<?php

namespace App\Controller\Agency;

use App\Entity\Slave\Document;
use App\Entity\Slave\DocumentType;
use App\Entity\Slave\PracticeMark;
use App\Entity\Slave\PracticeTag;
use App\Repository\Slave\DocumentTypeRepository;
use App\Repository\Slave\PracticeMarkRepository;
use App\Repository\Slave\PracticeTagRepository;
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
 * 13. Configurazioni dell'agenzia: tipi di documento (13.1), contrassegni (13.2)
 * e tag (13.3) delle pratiche. Tutto vive nel DB dell'agenzia (slave), quindi ogni
 * agenzia ha il proprio catalogo.
 *
 * Una pagina per configurazione, raggiungibili dal sottomenu "Configurazioni";
 * nuovo/modifica passano dai modali e ogni eliminazione da un modale di conferma.
 */
#[Route('/agenzia/configurazioni')]
#[IsGranted('ROLE_AGENCY')]
#[IsGranted(new Expression("is_granted('view', 'configurations')"), message: 'Non hai accesso alle configurazioni.')]
class ConfigurationController extends AbstractController
{
    private const PER_PAGE = 20;

    public function __construct(private readonly ManagerRegistry $registry)
    {
    }

    // ===================== 13.1 TIPI DI DOCUMENTO =====================

    /** 13.1.1 Elenco dei tipi di documento, nell'ordine impostato col drag & drop. */
    #[Route('/tipi-documento', name: 'agency_document_types', methods: ['GET'])]
    public function documentTypes(Request $request, PaginatorInterface $paginator): Response
    {
        $filter = trim((string) $request->query->get('f_value', ''));

        $qb = $this->slave()->getRepository(DocumentType::class)->createQueryBuilder('t');
        if ($filter !== '') {
            $qb->andWhere('t.value LIKE :v')->setParameter('v', '%' . $filter . '%');
        }

        $sort = (string) $request->query->get('sort', '');
        $page = $request->query->getInt('page', 1);
        $records = $paginator->paginate($qb->getQuery(), $page, self::PER_PAGE, [
            'defaultSortFieldName' => 't.priority',
            'defaultSortDirection' => 'asc',
            'sortFieldAllowList' => ['t.priority', 't.value'],
        ]);

        return $this->render('role/agency/config/document_types.html.twig', [
            'records' => $records,
            'filter' => $filter,
            // 13.1.3 Il drag & drop riscrive le priorità in base alla posizione in tabella:
            // ha senso solo se le righe sono nell'ordine di priorità e non filtrate, altrimenti
            // trascinare dentro un sottoinsieme produrrebbe priorità sbagliate.
            'sortable' => $filter === '' && ($sort === '' || $sort === 't.priority'),
            // Con la paginazione le priorità della pagina partono dall'offset, non da zero.
            'priorityOffset' => max(0, ($page - 1) * self::PER_PAGE),
            // 13.1.5 Un tipo già usato in una pratica non è eliminabile.
            'usedTypeIds' => $this->usedDocumentTypeIds(),
        ]);
    }

    #[Route('/tipi-documento/nuovo', name: 'agency_document_type_new', methods: ['POST'])]
    public function documentTypeNew(Request $request): RedirectResponse
    {
        if (!$this->isCsrfTokenValid('docTypeNew', (string) $request->request->get('_csrf_token'))) {
            return $this->backTo('agency_document_types');
        }

        $em = $this->slave();
        /** @var DocumentTypeRepository $repo */
        $repo = $em->getRepository(DocumentType::class);

        $type = new DocumentType();
        if (!$this->fillDocumentType($type, $request, $repo)) {
            return $this->backTo('agency_document_types');
        }

        // 13.1.1.1 I nuovi tipi si accodano in fondo; l'ordine si cambia trascinando.
        $type->setPriority($repo->nextPriority());
        $em->persist($type);
        $em->flush();
        $this->addFlash('success', 'Tipo di documento "' . $type->getValue() . '" creato.');

        return $this->backTo('agency_document_types');
    }

    /** 13.1.4 Modifica. */
    #[Route('/tipi-documento/{id}/modifica', name: 'agency_document_type_edit', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function documentTypeEdit(int $id, Request $request): RedirectResponse
    {
        if (!$this->isCsrfTokenValid('docTypeEdit', (string) $request->request->get('_csrf_token'))) {
            return $this->backTo('agency_document_types');
        }

        $em = $this->slave();
        /** @var DocumentTypeRepository $repo */
        $repo = $em->getRepository(DocumentType::class);
        $type = $repo->find($id);
        if ($type === null) {
            throw $this->createNotFoundException('Tipo di documento non trovato.');
        }

        if ($this->fillDocumentType($type, $request, $repo)) {
            $em->flush();
            $this->addFlash('success', 'Tipo di documento aggiornato.');
        }

        return $this->backTo('agency_document_types');
    }

    /** 13.1.2 Attiva/disattiva. */
    #[Route('/tipi-documento/{id}/stato', name: 'agency_document_type_toggle', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function documentTypeToggle(int $id, Request $request): RedirectResponse
    {
        if (!$this->isCsrfTokenValid('docTypeToggle', (string) $request->request->get('_csrf_token'))) {
            return $this->backTo('agency_document_types');
        }

        $em = $this->slave();
        $type = $em->getRepository(DocumentType::class)->find($id);
        if ($type === null) {
            throw $this->createNotFoundException('Tipo di documento non trovato.');
        }

        $type->setActive(!$type->isActive());
        $em->flush();
        $this->addFlash('success', sprintf(
            'Tipo di documento "%s" %s.',
            $type->getValue(),
            $type->isActive() ? 'attivato' : 'disattivato'
        ));

        return $this->backTo('agency_document_types');
    }

    /**
     * 13.1.3 Drag & drop: riceve gli id nel nuovo ordine e riscrive le priorità.
     * Stessa meccanica del riordino mansionari di DualMoto (fetch JSON, nessun reload).
     */
    #[Route('/tipi-documento/ordina', name: 'agency_document_type_reorder', methods: ['POST'])]
    public function documentTypeReorder(Request $request): JsonResponse
    {
        $payload = $request->toArray();
        if (!$this->isCsrfTokenValid('docTypeReorder', (string) ($payload['_csrf_token'] ?? ''))) {
            return new JsonResponse(['ok' => false, 'error' => 'Token non valido.'], Response::HTTP_BAD_REQUEST);
        }

        $order = array_map('intval', $payload['order'] ?? []);
        if ($order === []) {
            return new JsonResponse(['ok' => false, 'error' => 'Ordine vuoto.'], Response::HTTP_BAD_REQUEST);
        }

        // Offset della pagina: le righe visibili occupano le priorità da $offset in poi,
        // così trascinare in pagina 2 non le rinumera a partire da zero.
        $offset = max(0, (int) ($payload['offset'] ?? 0));

        $em = $this->slave();
        $positions = array_flip($order); // id => posizione nella pagina
        foreach ($em->getRepository(DocumentType::class)->findAll() as $type) {
            $id = (int) $type->getId();
            if (isset($positions[$id])) {
                $type->setPriority($offset + $positions[$id]);
            }
        }
        $em->flush();

        return new JsonResponse(['ok' => true]);
    }

    /** 13.1.5 Elimina, solo se il tipo non è mai stato usato in una pratica. */
    #[Route('/tipi-documento/{id}/elimina', name: 'agency_document_type_delete', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function documentTypeDelete(int $id, Request $request): RedirectResponse
    {
        if (!$this->isCsrfTokenValid('delete', (string) $request->request->get('_csrf_token'))) {
            return $this->backTo('agency_document_types');
        }

        $em = $this->slave();
        $type = $em->getRepository(DocumentType::class)->find($id);
        if ($type === null) {
            throw $this->createNotFoundException('Tipo di documento non trovato.');
        }

        if (in_array((int) $type->getId(), $this->usedDocumentTypeIds(), true)) {
            $this->addFlash('danger', 'Il tipo di documento "' . $type->getValue() . '" è già stato usato in una pratica: puoi solo disattivarlo.');

            return $this->backTo('agency_document_types');
        }

        $value = $type->getValue();
        $em->remove($type);
        $em->flush();
        $this->addFlash('success', 'Tipo di documento "' . $value . '" eliminato.');

        return $this->backTo('agency_document_types');
    }

    // ===================== 13.2 CONTRASSEGNI PRATICHE =====================

    /** 13.2.1 Elenco dei contrassegni inseriti. */
    #[Route('/contrassegni', name: 'agency_practice_marks', methods: ['GET'])]
    public function marks(Request $request, PaginatorInterface $paginator): Response
    {
        [$records, $filter] = $this->paginateColorValues(PracticeMark::class, 'm', $request, $paginator);

        return $this->render('role/agency/config/marks.html.twig', [
            'records' => $records,
            'filter' => $filter,
        ]);
    }

    /** 13.2.2 Nuovo. */
    #[Route('/contrassegni/nuovo', name: 'agency_practice_mark_new', methods: ['POST'])]
    public function markNew(Request $request): RedirectResponse
    {
        if (!$this->isCsrfTokenValid('markNew', (string) $request->request->get('_csrf_token'))) {
            return $this->backTo('agency_practice_marks');
        }

        $em = $this->slave();
        /** @var PracticeMarkRepository $repo */
        $repo = $em->getRepository(PracticeMark::class);

        $mark = new PracticeMark();
        if (!$this->fillColorValue($mark, $request, fn (string $v) => $repo->valueExists($v), 'contrassegno')) {
            return $this->backTo('agency_practice_marks');
        }

        $em->persist($mark);
        $em->flush();
        $this->addFlash('success', 'Contrassegno "' . $mark->getValue() . '" creato.');

        return $this->backTo('agency_practice_marks');
    }

    /** 13.2.1.1 Modifica. */
    #[Route('/contrassegni/{id}/modifica', name: 'agency_practice_mark_edit', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function markEdit(int $id, Request $request): RedirectResponse
    {
        if (!$this->isCsrfTokenValid('markEdit', (string) $request->request->get('_csrf_token'))) {
            return $this->backTo('agency_practice_marks');
        }

        $em = $this->slave();
        /** @var PracticeMarkRepository $repo */
        $repo = $em->getRepository(PracticeMark::class);
        $mark = $repo->find($id);
        if ($mark === null) {
            throw $this->createNotFoundException('Contrassegno non trovato.');
        }

        if ($this->fillColorValue($mark, $request, fn (string $v) => $repo->valueExists($v, $id), 'contrassegno')) {
            $em->flush();
            $this->addFlash('success', 'Contrassegno aggiornato.');
        }

        return $this->backTo('agency_practice_marks');
    }

    /** 13.2.1.2 Elimina. */
    #[Route('/contrassegni/{id}/elimina', name: 'agency_practice_mark_delete', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function markDelete(int $id, Request $request): RedirectResponse
    {
        if (!$this->isCsrfTokenValid('delete', (string) $request->request->get('_csrf_token'))) {
            return $this->backTo('agency_practice_marks');
        }

        $em = $this->slave();
        $mark = $em->getRepository(PracticeMark::class)->find($id);
        if ($mark === null) {
            throw $this->createNotFoundException('Contrassegno non trovato.');
        }

        $value = $mark->getValue();
        $em->remove($mark);
        $em->flush();
        $this->addFlash('success', 'Contrassegno "' . $value . '" eliminato.');

        return $this->backTo('agency_practice_marks');
    }

    // ===================== 13.3 TAG PRATICHE =====================

    /** 13.3.1 Elenco dei tag inseriti. */
    #[Route('/tag', name: 'agency_practice_tags', methods: ['GET'])]
    public function tags(Request $request, PaginatorInterface $paginator): Response
    {
        [$records, $filter] = $this->paginateColorValues(PracticeTag::class, 't', $request, $paginator);

        return $this->render('role/agency/config/tags.html.twig', [
            'records' => $records,
            'filter' => $filter,
        ]);
    }

    /** 13.3.2 Nuovo. */
    #[Route('/tag/nuovo', name: 'agency_practice_tag_new', methods: ['POST'])]
    public function tagNew(Request $request): RedirectResponse
    {
        if (!$this->isCsrfTokenValid('tagNew', (string) $request->request->get('_csrf_token'))) {
            return $this->backTo('agency_practice_tags');
        }

        $em = $this->slave();
        /** @var PracticeTagRepository $repo */
        $repo = $em->getRepository(PracticeTag::class);

        $tag = new PracticeTag();
        if (!$this->fillColorValue($tag, $request, fn (string $v) => $repo->valueExists($v), 'tag')) {
            return $this->backTo('agency_practice_tags');
        }

        $em->persist($tag);
        $em->flush();
        $this->addFlash('success', 'Tag "' . $tag->getValue() . '" creato.');

        return $this->backTo('agency_practice_tags');
    }

    /** 13.3.1.1 Modifica. */
    #[Route('/tag/{id}/modifica', name: 'agency_practice_tag_edit', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function tagEdit(int $id, Request $request): RedirectResponse
    {
        if (!$this->isCsrfTokenValid('tagEdit', (string) $request->request->get('_csrf_token'))) {
            return $this->backTo('agency_practice_tags');
        }

        $em = $this->slave();
        /** @var PracticeTagRepository $repo */
        $repo = $em->getRepository(PracticeTag::class);
        $tag = $repo->find($id);
        if ($tag === null) {
            throw $this->createNotFoundException('Tag non trovato.');
        }

        if ($this->fillColorValue($tag, $request, fn (string $v) => $repo->valueExists($v, $id), 'tag')) {
            $em->flush();
            $this->addFlash('success', 'Tag aggiornato.');
        }

        return $this->backTo('agency_practice_tags');
    }

    /** 13.3.1.2 Elimina. */
    #[Route('/tag/{id}/elimina', name: 'agency_practice_tag_delete', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function tagDelete(int $id, Request $request): RedirectResponse
    {
        if (!$this->isCsrfTokenValid('delete', (string) $request->request->get('_csrf_token'))) {
            return $this->backTo('agency_practice_tags');
        }

        $em = $this->slave();
        $tag = $em->getRepository(PracticeTag::class)->find($id);
        if ($tag === null) {
            throw $this->createNotFoundException('Tag non trovato.');
        }

        $value = $tag->getValue();
        $em->remove($tag);
        $em->flush();
        $this->addFlash('success', 'Tag "' . $value . '" eliminato.');

        return $this->backTo('agency_practice_tags');
    }

    // ===================== SUPPORTO =====================

    /**
     * Elenco filtrato/ordinato/paginato di un'etichetta colorata (13.2 e 13.3 sono identiche).
     * Filtro e ordinamento agiscono solo su "valore".
     *
     * @param class-string $entityClass
     *
     * @return array{0: mixed, 1: string} [pagina di risultati, filtro applicato]
     */
    private function paginateColorValues(string $entityClass, string $alias, Request $request, PaginatorInterface $paginator): array
    {
        $filter = trim((string) $request->query->get('f_value', ''));

        $qb = $this->slave()->getRepository($entityClass)->createQueryBuilder($alias);
        if ($filter !== '') {
            $qb->andWhere($alias . '.value LIKE :v')->setParameter('v', '%' . $filter . '%');
        }

        $records = $paginator->paginate($qb->getQuery(), $request->query->getInt('page', 1), self::PER_PAGE, [
            'defaultSortFieldName' => $alias . '.value',
            'defaultSortDirection' => 'asc',
            'sortFieldAllowList' => [$alias . '.value'],
        ]);

        return [$records, $filter];
    }

    private function slave(): EntityManagerInterface
    {
        /** @var EntityManagerInterface $em */
        $em = $this->registry->getManager('slave');

        return $em;
    }

    /** Torna all'elenco della configurazione su cui si stava lavorando. */
    private function backTo(string $route): RedirectResponse
    {
        return $this->redirectToRoute($route, [], Response::HTTP_SEE_OTHER);
    }

    /** Id dei tipi di documento già referenziati da almeno un documento di pratica. */
    private function usedDocumentTypeIds(): array
    {
        $rows = $this->slave()->createQueryBuilder()
            ->select('IDENTITY(d.documentType) AS tid')
            ->from(Document::class, 'd')
            ->andWhere('d.documentType IS NOT NULL')
            ->distinct()
            ->getQuery()
            ->getScalarResult();

        return array_map(static fn (array $r) => (int) $r['tid'], $rows);
    }

    /** Campi comuni 13.1.1.2 / 13.1.1.3. Ritorna false (con flash) se i dati non vanno. */
    private function fillDocumentType(DocumentType $type, Request $request, DocumentTypeRepository $repo): bool
    {
        $value = trim((string) $request->request->get('value'));
        if ($value === '') {
            $this->addFlash('danger', 'Il valore del tipo di documento è obbligatorio.');

            return false;
        }
        if ($repo->valueExists($value, $type->getId() !== null ? (int) $type->getId() : null)) {
            $this->addFlash('danger', 'Esiste già un tipo di documento con valore "' . $value . '".');

            return false;
        }

        // Lo stato non è nel form: i nuovi tipi nascono attivi (default dell'entità) e
        // sulla modifica va preservato quello corrente, che si cambia solo da 13.1.2.
        $type->setValue($value)
            ->setMortgage($request->request->getBoolean('mortgage'));

        return true;
    }

    /**
     * Campi comuni a contrassegni (13.2.2.1/13.2.2.2) e tag (13.3.2.1/13.3.2.2).
     *
     * @param PracticeMark|PracticeTag $entity
     * @param callable(string): bool   $duplicateCheck
     */
    private function fillColorValue(object $entity, Request $request, callable $duplicateCheck, string $label): bool
    {
        $value = trim((string) $request->request->get('value'));
        if ($value === '') {
            $this->addFlash('danger', 'Il valore del ' . $label . ' è obbligatorio.');

            return false;
        }
        if ($duplicateCheck($value)) {
            $this->addFlash('danger', 'Esiste già un ' . $label . ' con valore "' . $value . '".');

            return false;
        }

        $color = strtolower(trim((string) $request->request->get('color')));
        if (!preg_match('/^#[0-9a-f]{6}$/', $color)) {
            $this->addFlash('danger', 'Il colore del ' . $label . ' non è valido.');

            return false;
        }

        $entity->setValue($value)->setColor($color);

        return true;
    }
}
