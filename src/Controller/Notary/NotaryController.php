<?php

namespace App\Controller\Notary;

use App\Entity\Master\Company;
use App\Entity\Slave\Document;
use App\Entity\Slave\Practice;
use App\Entity\Slave\PracticeDocument;
use App\Service\CompanyService;
use App\Service\DocumentStorage;
use Doctrine\Persistence\ManagerRegistry;
use Knp\Component\Pager\PaginatorInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\HeaderUtils;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * 17. Area staff notaio. Il notaio è un utente master; seleziona un'agenzia
 * (Company) che ripunta lo slave sul suo DB e opera sulle pratiche di quel tenant.
 */
#[Route('/notaio')]
#[IsGranted('ROLE_NOTARY')]
class NotaryController extends AbstractController
{
    public function __construct(
        private readonly ManagerRegistry $registry,
        private readonly CompanyService $companyService,
    ) {
    }

    /** 17. Scrivania: 17.1 selezione agenzia (solo quelle abbinate al notaio). */
    #[Route('', name: 'notary_index', methods: ['GET'])]
    public function index(): Response
    {
        return $this->render('role/notary/index.html.twig', [
            'companies' => $this->allowedCompanies(),
            'current' => $this->companyService->getCurrentCompany(),
        ]);
    }

    /** 17.1 Seleziona agenzia: ripunta lo slave e prosegue alle pratiche. */
    #[Route('/seleziona-agenzia', name: 'notary_select_agency', methods: ['POST'])]
    public function selectAgency(Request $request): RedirectResponse
    {
        if (!$this->isCsrfTokenValid('notarySelectAgency', (string) $request->request->get('_csrf_token'))) {
            $this->addFlash('danger', 'Token non valido, riprova.');

            return $this->redirectToRoute('notary_index');
        }

        $id = $request->request->get('company_id');
        $company = $id ? $this->registry->getManager('master')->getRepository(Company::class)->find($id) : null;
        // Deve essere attiva E tra le agenzie abbinate al notaio.
        if ($company === null || !$company->isActive() || !$this->getUser()->hasCompany($company)) {
            $this->addFlash('danger', 'Agenzia non valida o non autorizzata.');

            return $this->redirectToRoute('notary_index');
        }

        $this->companyService->switchToCompany($company);

        return $this->redirectToRoute('notary_practices');
    }

    /** Deseleziona l'agenzia corrente. */
    #[Route('/cambia-agenzia', name: 'notary_deselect_agency', methods: ['GET'])]
    public function deselectAgency(): RedirectResponse
    {
        $this->companyService->clearSession();

        return $this->redirectToRoute('notary_index');
    }

    /** 17.1.1 Gestione pratiche: 17.1.1.1 elenco pratiche accessibili. */
    #[Route('/pratiche', name: 'notary_practices', methods: ['GET'])]
    public function practices(Request $request, PaginatorInterface $paginator): Response
    {
        $company = $this->currentAllowedCompany();
        if ($company === null) {
            $this->addFlash('danger', 'Seleziona prima un\'agenzia.');

            return $this->redirectToRoute('notary_index');
        }

        $filters = [
            'q' => trim((string) $request->query->get('f_q', '')),
            'buyer' => trim((string) $request->query->get('f_buyer', '')),
            'seller' => trim((string) $request->query->get('f_seller', '')),
            'status' => trim((string) $request->query->get('f_status', '')),
        ];

        // L'accesso è già garantito a livello di agenzia (relazione notaio↔Company):
        // dentro l'agenzia autorizzata il notaio vede tutte le pratiche.
        /** @var \App\Repository\Slave\PracticeRepository $repo */
        $repo = $this->registry->getManager('slave')->getRepository(Practice::class);
        $qb = $repo->accessibleQueryBuilder(null);

        if ($filters['q'] !== '') {
            $qb->andWhere('p.number LIKE :q OR p.subject LIKE :q')
                ->setParameter('q', '%' . $filters['q'] . '%');
        }
        // Le parti sono clienti dell'agenzia (11): il filtro cerca su nome e cognome.
        if ($filters['buyer'] !== '') {
            $qb->leftJoin('p.buyer', 'bc')
                ->andWhere("CONCAT(COALESCE(bc.name, ''), ' ', COALESCE(bc.surname, '')) LIKE :b")
                ->setParameter('b', '%' . $filters['buyer'] . '%');
        }
        if ($filters['seller'] !== '') {
            $qb->leftJoin('p.seller', 'sc')
                ->andWhere("CONCAT(COALESCE(sc.name, ''), ' ', COALESCE(sc.surname, '')) LIKE :s")
                ->setParameter('s', '%' . $filters['seller'] . '%');
        }
        if ($filters['status'] !== '') {
            $qb->andWhere('p.status = :st')->setParameter('st', $filters['status']);
        }

        $records = $paginator->paginate(
            $qb->getQuery(),
            $request->query->getInt('page', 1),
            20,
            [
                'defaultSortFieldName' => 'p.createdAt',
                'defaultSortDirection' => 'desc',
                'sortFieldAllowList' => ['p.number', 'p.mortgage', 'p.status', 'p.createdAt'],
            ]
        );

        return $this->render('role/notary/practices/index.html.twig', [
            'company' => $company,
            'records' => $records,
            'filters' => $filters,
        ]);
    }

    /** 17.1.1.1.5 Scheda pratica: dati, parti, elenco documenti, nuovo allegato. */
    #[Route('/pratiche/{id}', name: 'notary_practice_show', requirements: ['id' => '\d+'], methods: ['GET'])]
    public function show(int $id): Response
    {
        [$company, $practice] = $this->requirePractice($id);
        if ($company === null) {
            return $this->redirectToRoute('notary_index');
        }
        if ($practice === null) {
            throw $this->createNotFoundException('Pratica non trovata.');
        }

        return $this->render('role/notary/practices/show.html.twig', [
            'company' => $company,
            'practice' => $practice,
        ]);
    }

    /** 17.1.1.2 Cambio stato pratica: completata / archiviabile / riapri (aperta). */
    #[Route('/pratiche/{id}/stato', name: 'notary_practice_status', requirements: ['id' => '\d+'], methods: ['POST'])]
    public function practiceStatus(int $id, Request $request): RedirectResponse
    {
        [$company, $practice] = $this->requirePractice($id);
        if ($practice === null) {
            return $this->redirectToRoute($company ? 'notary_practice_show' : 'notary_index', $company ? ['id' => $id] : []);
        }
        if (!$this->isCsrfTokenValid('practice_status_' . $practice->getId(), (string) $request->request->get('_csrf_token'))) {
            return $this->redirectToRoute('notary_practice_show', ['id' => $id]);
        }

        $target = (string) $request->request->get('status', '');
        $allowed = [Practice::STATUS_OPEN, Practice::STATUS_COMPLETED, Practice::STATUS_ARCHIVABLE];
        if (!in_array($target, $allowed, true)) {
            $this->addFlash('danger', 'Stato non valido.');

            return $this->redirectToRoute('notary_practice_show', ['id' => $id]);
        }

        // 17.1.1 "Completata" solo a documenti richiesti tutti verificati.
        if ($target === Practice::STATUS_COMPLETED && !$practice->canBeCompleted()) {
            $pending = $practice->getDocumentsPendingVerification();
            $labels = array_map(static fn ($row) => $row->getLabel(), $pending->toArray());
            $this->addFlash('danger', sprintf(
                'Non puoi completare la pratica: %d document%s da verificare (%s).',
                count($labels),
                count($labels) === 1 ? 'o' : 'i',
                implode(', ', $labels)
            ));

            return $this->redirectToRoute('notary_practice_show', ['id' => $id]);
        }

        $practice->setStatus($target);
        $this->registry->getManager('slave')->flush();
        $this->addFlash('success', 'Stato pratica aggiornato: ' . $practice->getStatusLabel() . '.');

        return $this->redirectToRoute('notary_practice_show', ['id' => $id]);
    }

    /** 17.1.1.1.5.2.3 Scarica file allegato. */
    #[Route('/pratiche/{id}/documenti/{did}/scarica', name: 'notary_doc_download', requirements: ['id' => '\d+', 'did' => '\d+'], methods: ['GET'])]
    public function docDownload(int $id, int $did, DocumentStorage $storage): Response
    {
        [$company, $practice, $doc] = $this->requireDocument($id, $did);
        if ($doc === null) {
            if ($company === null) {
                return $this->redirectToRoute('notary_index');
            }
            throw $this->createNotFoundException('Documento non trovato.');
        }
        if (!$doc->hasFile()) {
            $this->addFlash('danger', 'Nessun file caricato per questo documento.');

            return $this->redirectToRoute('notary_practice_show', ['id' => $id]);
        }

        $abs = $storage->absolutePath((string) $company->getDbName(), (string) $doc->getStoragePath());
        if (!is_file($abs)) {
            $this->addFlash('danger', 'File non presente sul server.');

            return $this->redirectToRoute('notary_practice_show', ['id' => $id]);
        }

        $response = new BinaryFileResponse($abs);
        $response->setContentDisposition(
            HeaderUtils::DISPOSITION_ATTACHMENT,
            $doc->getOriginalFilename() ?: ($doc->getName() . '.dat')
        );

        return $response;
    }

    /**
     * Anteprima dell'allegato: lo stesso file servito inline, per l'iframe del modale.
     * Gli allegati sono solo PDF, quindi il browser lo mostra col suo viewer.
     */
    #[Route('/pratiche/{id}/documenti/{did}/anteprima', name: 'notary_doc_preview', requirements: ['id' => '\d+', 'did' => '\d+'], methods: ['GET'])]
    public function docPreview(int $id, int $did, DocumentStorage $storage): Response
    {
        [$company, $practice, $doc] = $this->requireDocument($id, $did);
        if ($doc === null || $company === null) {
            throw $this->createNotFoundException('Documento non trovato.');
        }
        if (!$doc->hasFile()) {
            throw $this->createNotFoundException('Nessun file caricato per questo documento.');
        }

        $abs = $storage->absolutePath((string) $company->getDbName(), (string) $doc->getStoragePath());
        if (!is_file($abs)) {
            throw $this->createNotFoundException('File non presente sul server.');
        }

        $response = new BinaryFileResponse($abs);
        $response->headers->set('Content-Type', $doc->getMimeType() ?: DocumentStorage::ALLOWED_MIME);
        $response->setContentDisposition(
            HeaderUtils::DISPOSITION_INLINE,
            $doc->getOriginalFilename() ?: ($doc->getName() . '.pdf')
        );

        return $response;
    }

    /**
     * 17.1.1.1.5.2.4 Richiesto / non richiesto: dal punto 12 è la riga documentale
     * (il tipo previsto per la pratica) a essere richiesta, non il singolo allegato.
     */
    #[Route('/pratiche/{id}/righe/{rid}/richiesto', name: 'notary_row_toggle_visible', requirements: ['id' => '\d+', 'rid' => '\d+'], methods: ['POST'])]
    public function rowToggleVisible(int $id, int $rid, Request $request): RedirectResponse
    {
        [$company, $practice, $row] = $this->requireRow($id, $rid);
        if ($row === null) {
            return $this->redirectToRoute($company ? 'notary_practice_show' : 'notary_index', $company ? ['id' => $id] : []);
        }
        if ($this->documentsLocked($practice)) {
            return $this->redirectToRoute('notary_practice_show', ['id' => $id]);
        }
        if ($this->isCsrfTokenValid('practice_doc_' . $practice->getId(), (string) $request->request->get('_csrf_token'))) {
            $row->setVisible(!$row->isVisible());
            $this->registry->getManager('slave')->flush();
        }

        return $this->redirectToRoute('notary_practice_show', ['id' => $id]);
    }

    /** 17.1.1.1.5.2.5 Modifica stato della riga documentale: Da verificare / Verificato. */
    #[Route('/pratiche/{id}/righe/{rid}/stato', name: 'notary_row_status', requirements: ['id' => '\d+', 'rid' => '\d+'], methods: ['POST'])]
    public function rowStatus(int $id, int $rid, Request $request): RedirectResponse
    {
        [$company, $practice, $row] = $this->requireRow($id, $rid);
        if ($row === null) {
            return $this->redirectToRoute($company ? 'notary_practice_show' : 'notary_index', $company ? ['id' => $id] : []);
        }
        if ($this->documentsLocked($practice)) {
            return $this->redirectToRoute('notary_practice_show', ['id' => $id]);
        }
        if ($this->isCsrfTokenValid('practice_doc_' . $practice->getId(), (string) $request->request->get('_csrf_token'))) {
            // Senza allegato non c'è nulla da verificare: lo stato non si tocca. Resta
            // possibile riaprire una riga già verificata (es. dopo aver eliminato il file).
            if (!$row->hasFiles() && $row->getStatus() !== PracticeDocument::STATUS_VERIFIED) {
                $this->addFlash('danger', 'Nessun allegato caricato per «' . $row->getLabel() . '»: lo stato non è modificabile.');

                return $this->redirectToRoute('notary_practice_show', ['id' => $id]);
            }

            $row->setStatus(
                $row->getStatus() === PracticeDocument::STATUS_VERIFIED
                    ? PracticeDocument::STATUS_TO_VERIFY
                    : PracticeDocument::STATUS_VERIFIED
            );
            $this->registry->getManager('slave')->flush();
        }

        return $this->redirectToRoute('notary_practice_show', ['id' => $id]);
    }

    /** 17.1.1.1.5.2.6 Inserisci/aggiorna le note del notaio. */
    #[Route('/pratiche/{id}/documenti/{did}/note', name: 'notary_doc_note', requirements: ['id' => '\d+', 'did' => '\d+'], methods: ['POST'])]
    public function docNote(int $id, int $did, Request $request): RedirectResponse
    {
        [$company, $practice, $doc] = $this->requireDocument($id, $did);
        if ($doc === null) {
            return $this->redirectToRoute($company ? 'notary_practice_show' : 'notary_index', $company ? ['id' => $id] : []);
        }
        if ($this->documentsLocked($practice)) {
            return $this->redirectToRoute('notary_practice_show', ['id' => $id]);
        }
        if ($this->isCsrfTokenValid('docNote', (string) $request->request->get('_csrf_token'))) {
            $note = trim((string) $request->request->get('notary_note', ''));
            $doc->setNotaryNote($note !== '' ? $note : null);
            $this->registry->getManager('slave')->flush();
            $this->addFlash('success', 'Note aggiornate.');
        }

        return $this->redirectToRoute('notary_practice_show', ['id' => $id]);
    }

    /** 17.1.1.1.5.3 Nuovo allegato: File + Note. */
    #[Route('/pratiche/{id}/documenti/nuovo', name: 'notary_doc_new', requirements: ['id' => '\d+'], methods: ['POST'])]
    public function docNew(int $id, Request $request, DocumentStorage $storage): RedirectResponse
    {
        [$company, $practice] = $this->requirePractice($id);
        if ($practice === null) {
            return $this->redirectToRoute($company ? 'notary_practice_show' : 'notary_index', $company ? ['id' => $id] : []);
        }
        if ($this->documentsLocked($practice)) {
            return $this->redirectToRoute('notary_practice_show', ['id' => $id]);
        }
        if (!$this->isCsrfTokenValid('docNew', (string) $request->request->get('_csrf_token'))) {
            return $this->redirectToRoute('notary_practice_show', ['id' => $id]);
        }

        /** @var UploadedFile|null $file */
        $file = $request->files->get('file');
        $name = trim((string) $request->request->get('name', ''));
        // Sono ammessi solo PDF (controllo sul contenuto, non sull'estensione dichiarata).
        $fileError = $storage->validationError($file);
        if ($fileError !== null) {
            $this->addFlash('danger', $fileError);

            return $this->redirectToRoute('notary_practice_show', ['id' => $id]);
        }

        // L'allegato va appeso a una riga documentale della pratica (12.3.2.5).
        $row = $this->findRow($practice, (int) $request->request->get('practice_document_id'));
        if ($row === null) {
            $this->addFlash('danger', 'Seleziona il documento a cui allegare il file.');

            return $this->redirectToRoute('notary_practice_show', ['id' => $id]);
        }

        if ($name === '') {
            $this->addFlash('danger', 'Indica il nome dell\'allegato: è il nome con cui il file viene salvato.');

            return $this->redirectToRoute('notary_practice_show', ['id' => $id]);
        }

        $doc = new Document();
        $doc->setName($name)
            ->setNotaryNote(trim((string) $request->request->get('note', '')) ?: null);
        $row->addDocument($doc);
        if ($row->getStatus() === PracticeDocument::STATUS_TO_UPLOAD) {
            $row->setStatus(PracticeDocument::STATUS_TO_VERIFY);
        }

        $em = $this->registry->getManager('slave');
        $em->persist($doc);
        $em->flush(); // id pratica già presente; serve per il percorso file

        try {
            // Il file non conserva il nome originale: prende il "nome allegato" del form.
            $meta = $storage->store((string) $company->getDbName(), $practice, $file, $name);
            $doc->setOriginalFilename($meta['name'])
                ->setStoragePath($meta['path'])
                ->setMimeType($meta['mime'])
                ->setSizeBytes($meta['size']);
            $em->flush();
            $this->addFlash('success', 'Allegato caricato.');
        } catch (\Throwable $e) {
            $em->remove($doc);
            $em->flush();
            $this->addFlash('danger', 'Caricamento non riuscito: ' . $e->getMessage());
        }

        return $this->redirectToRoute('notary_practice_show', ['id' => $id]);
    }

    /** Elimina un allegato (record + file). */
    #[Route('/pratiche/{id}/documenti/{did}/elimina', name: 'notary_doc_delete', requirements: ['id' => '\d+', 'did' => '\d+'], methods: ['POST'])]
    public function docDelete(int $id, int $did, Request $request, DocumentStorage $storage): RedirectResponse
    {
        [$company, $practice, $doc] = $this->requireDocument($id, $did);
        if ($doc === null) {
            return $this->redirectToRoute($company ? 'notary_practice_show' : 'notary_index', $company ? ['id' => $id] : []);
        }
        if ($this->documentsLocked($practice)) {
            return $this->redirectToRoute('notary_practice_show', ['id' => $id]);
        }
        if ($this->isCsrfTokenValid('practice_doc_' . $practice->getId(), (string) $request->request->get('_csrf_token'))) {
            $storage->delete((string) $company->getDbName(), $doc->getStoragePath());
            $em = $this->registry->getManager('slave');
            // Se la riga resta senza allegati torna "da caricare": non c'è più nulla da verificare.
            $row = $doc->getPracticeDocument();
            $row?->removeDocument($doc)->resetStatusIfEmpty();
            $em->remove($doc);
            $em->flush();
            $this->addFlash('success', 'Allegato eliminato.');
        }

        return $this->redirectToRoute('notary_practice_show', ['id' => $id]);
    }

    /**
     * 12.3.2 Da "completata" in poi i documenti sono in sola lettura anche per il
     * notaio: qui si blocca la POST, nel template spariscono i pulsanti. Per
     * intervenire di nuovo bisogna riaprire la pratica.
     */
    private function documentsLocked(Practice $practice): bool
    {
        if ($practice->areDocumentsEditable()) {
            return false;
        }

        $this->addFlash('danger', sprintf(
            'La pratica è %s: i documenti non sono più modificabili. Riaprila per intervenire.',
            mb_strtolower($practice->getStatusLabel())
        ));

        return true;
    }

    /**
     * Carica la pratica dell'agenzia corrente.
     *
     * @return array{0: Company|null, 1: Practice|null}
     */
    private function requirePractice(int $id): array
    {
        $company = $this->currentAllowedCompany();
        if ($company === null) {
            $this->addFlash('danger', 'Seleziona prima un\'agenzia.');

            return [null, null];
        }

        $practice = $this->registry->getManager('slave')->getRepository(Practice::class)->find($id);

        return [$company, $practice];
    }

    /**
     * Agenzie (attive) abbinate al notaio corrente, ordinate per nome.
     *
     * @return Company[]
     */
    private function allowedCompanies(): array
    {
        $companies = $this->getUser()->getCompanies()->filter(fn (Company $c) => $c->isActive())->toArray();
        usort($companies, fn (Company $a, Company $b) => strcasecmp((string) $a->getName(), (string) $b->getName()));

        return $companies;
    }

    /**
     * Company selezionata in sessione, ma solo se è ancora tra quelle autorizzate
     * (difesa in profondità: la selezione passa già da selectAgency()).
     */
    private function currentAllowedCompany(): ?Company
    {
        $company = $this->companyService->getCurrentCompany();
        if ($company === null || !$this->getUser()->hasCompany($company)) {
            return null;
        }

        return $company;
    }

    /**
     * Carica pratica + documento (verificando che il documento appartenga alla pratica).
     *
     * @return array{0: Company|null, 1: Practice|null, 2: Document|null}
     */
    private function requireDocument(int $id, int $did): array
    {
        [$company, $practice] = $this->requirePractice($id);
        if ($practice === null) {
            return [$company, null, null];
        }

        $doc = $this->registry->getManager('slave')->getRepository(Document::class)->find($did);
        if ($doc === null || $doc->getPractice()?->getId() !== $practice->getId()) {
            return [$company, $practice, null];
        }

        return [$company, $practice, $doc];
    }

    /**
     * Carica pratica + riga documentale (12.3.2.1), verificando l'appartenenza.
     *
     * @return array{0: Company|null, 1: Practice|null, 2: PracticeDocument|null}
     */
    private function requireRow(int $id, int $rid): array
    {
        [$company, $practice] = $this->requirePractice($id);
        if ($practice === null) {
            return [$company, null, null];
        }

        return [$company, $practice, $this->findRow($practice, $rid)];
    }

    private function findRow(Practice $practice, int $rid): ?PracticeDocument
    {
        foreach ($practice->getPracticeDocuments() as $row) {
            if ((int) $row->getId() === $rid) {
                return $row;
            }
        }

        return null;
    }
}
