<?php

namespace App\Controller\Agency;

use App\Entity\Master\City;
use App\Entity\Master\Company;
use App\Entity\Master\Zip;
use App\Service\CompanyLogoStorage;
use App\Service\CompanyService;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\ExpressionLanguage\Expression;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * 7.1.9 Anagrafica della propria agenzia, vista dall'agenzia stessa.
 *
 * I dati vivono su Company, nel DB master: qui l'agenzia può correggere i propri dati
 * anagrafici e fiscali e caricare il logo. Restano all'amministrazione della
 * piattaforma le cose che non la riguardano — codice cliente, database, licenza,
 * quota di spazio e stato — che infatti nemmeno arrivano nei form.
 */
#[Route('/agenzia/anagrafica')]
#[IsGranted('ROLE_AGENCY')]
#[IsGranted(new Expression("is_granted('view', 'company')"), message: 'Non hai accesso all\'anagrafica dell\'agenzia.')]
class CompanyController extends AbstractController
{
    public function __construct(
        private readonly ManagerRegistry $registry,
        private readonly CompanyService $companyService,
        private readonly CompanyLogoStorage $logos,
    ) {
    }

    /** 7.1.9 Scheda dell'agenzia. */
    #[Route('', name: 'agency_company', methods: ['GET'])]
    public function show(): Response
    {
        $company = $this->requireCompany();

        return $this->render('role/agency/company/show.html.twig', [
            'company' => $company,
            'storageUsedMb' => $this->companyService->getStorageUsedMb((string) $company->getDbName()),
        ]);
    }

    /** 7.1.9.1 Dati anagrafici: denominazione, tipo e sede. */
    #[Route('/anagrafici', name: 'agency_company_profile', methods: ['POST'])]
    #[IsGranted(new Expression("is_granted('edit', 'company')"))]
    public function profile(Request $request): RedirectResponse
    {
        $company = $this->requireCompany();
        if (!$this->isCsrfTokenValid('companyProfile', (string) $request->request->get('_csrf_token'))) {
            return $this->redirectToRoute('agency_company', [], Response::HTTP_SEE_OTHER);
        }

        $name = trim((string) $request->request->get('name'));
        if ($name === '') {
            $this->addFlash('danger', 'La ragione sociale / nome è obbligatoria.');

            return $this->redirectToRoute('agency_company', [], Response::HTTP_SEE_OTHER);
        }

        [$city, $zip] = $this->resolveGeo($request);

        $company->setName($name)
            ->setClientType($request->request->get('client_type') === Company::TYPE_PROFESSIONAL ? Company::TYPE_PROFESSIONAL : Company::TYPE_COMPANY)
            ->setAddress(trim((string) $request->request->get('address')) ?: null)
            ->setCivic(trim((string) $request->request->get('civic')) ?: null)
            ->setCity($city)
            ->setZip($zip);

        $this->master()->flush();
        $this->addFlash('success', 'Dati anagrafici aggiornati.');

        return $this->redirectToRoute('agency_company', [], Response::HTTP_SEE_OTHER);
    }

    /** 7.1.9.1 Dati fiscali: P.IVA, codice fiscale, SDI e PEC. */
    #[Route('/fiscali', name: 'agency_company_tax', methods: ['POST'])]
    #[IsGranted(new Expression("is_granted('edit', 'company')"))]
    public function tax(Request $request): RedirectResponse
    {
        $company = $this->requireCompany();
        if (!$this->isCsrfTokenValid('companyTax', (string) $request->request->get('_csrf_token'))) {
            return $this->redirectToRoute('agency_company', [], Response::HTTP_SEE_OTHER);
        }

        $pec = trim((string) $request->request->get('pec'));
        if ($pec !== '' && !filter_var($pec, FILTER_VALIDATE_EMAIL)) {
            $this->addFlash('danger', 'La PEC non è un indirizzo valido.');

            return $this->redirectToRoute('agency_company', [], Response::HTTP_SEE_OTHER);
        }

        $company->setVatNumber(trim((string) $request->request->get('vat_number')) ?: null)
            ->setTaxCode(mb_strtoupper(trim((string) $request->request->get('tax_code'))) ?: null)
            ->setSdi(mb_strtoupper(trim((string) $request->request->get('sdi'))) ?: null)
            ->setPec($pec ?: null);

        $this->master()->flush();
        $this->addFlash('success', 'Dati fiscali aggiornati.');

        return $this->redirectToRoute('agency_company', [], Response::HTTP_SEE_OTHER);
    }

    /** 7.1.9.8 Carica (o sostituisce) il logo. */
    #[Route('/logo', name: 'agency_company_logo_upload', methods: ['POST'])]
    #[IsGranted(new Expression("is_granted('edit', 'company')"))]
    public function logoUpload(Request $request): RedirectResponse
    {
        $company = $this->requireCompany();
        if (!$this->isCsrfTokenValid('companyLogo', (string) $request->request->get('_csrf_token'))) {
            return $this->redirectToRoute('agency_company', [], Response::HTTP_SEE_OTHER);
        }

        /** @var UploadedFile|null $file */
        $file = $request->files->get('logo');
        $error = $this->logos->validationError($file);
        if ($error !== null) {
            $this->addFlash('danger', $error);

            return $this->redirectToRoute('agency_company', [], Response::HTTP_SEE_OTHER);
        }

        try {
            $company->setLogo($this->logos->store($company, $file));
            $this->master()->flush();
            $this->addFlash('success', 'Logo aggiornato.');
        } catch (\Throwable $e) {
            $this->addFlash('danger', 'Caricamento del logo non riuscito: ' . $e->getMessage());
        }

        return $this->redirectToRoute('agency_company', [], Response::HTTP_SEE_OTHER);
    }

    /** 7.1.9.8 Rimuove il logo. */
    #[Route('/logo/elimina', name: 'agency_company_logo_delete', methods: ['POST'])]
    #[IsGranted(new Expression("is_granted('edit', 'company')"))]
    public function logoDelete(Request $request): RedirectResponse
    {
        $company = $this->requireCompany();
        if ($this->isCsrfTokenValid('delete', (string) $request->request->get('_csrf_token'))) {
            $this->logos->delete($company);
            $company->setLogo(null);
            $this->master()->flush();
            $this->addFlash('success', 'Logo rimosso.');
        }

        return $this->redirectToRoute('agency_company', [], Response::HTTP_SEE_OTHER);
    }

    /** Il file del logo: sta fuori dalla webroot, quindi passa da qui. */
    #[Route('/logo/file', name: 'agency_company_logo', methods: ['GET'])]
    public function logoFile(): Response
    {
        $path = $this->logos->absolutePath($this->requireCompany());
        if ($path === null) {
            throw $this->createNotFoundException('Logo non presente.');
        }

        $response = new BinaryFileResponse($path);
        $response->setContentDisposition('inline', basename($path));

        return $response;
    }

    // ===================== SUPPORTO =====================

    private function master(): \Doctrine\ORM\EntityManagerInterface
    {
        /** @var \Doctrine\ORM\EntityManagerInterface $em */
        $em = $this->registry->getManager('master');

        return $em;
    }

    /** L'agenzia del contesto corrente: senza di essa non c'è anagrafica da mostrare. */
    private function requireCompany(): Company
    {
        $company = $this->companyService->getCurrentCompany();
        if ($company === null) {
            throw $this->createAccessDeniedException('Contesto agenzia non disponibile.');
        }

        return $company;
    }

    /**
     * Città e CAP dal catalogo geografico del master (picker Città/CAP).
     *
     * @return array{0: City|null, 1: Zip|null}
     */
    private function resolveGeo(Request $request): array
    {
        $master = $this->master();
        $cityId = (int) $request->request->get('city_id');
        $zipId = (int) $request->request->get('zip_id');

        return [
            $cityId > 0 ? $master->getRepository(City::class)->find($cityId) : null,
            $zipId > 0 ? $master->getRepository(Zip::class)->find($zipId) : null,
        ];
    }
}
