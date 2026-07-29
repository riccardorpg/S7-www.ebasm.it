<?php

namespace App\Twig;

use App\Entity\Master\Company;
use App\Service\CompanyService;
use Twig\Extension\AbstractExtension;
use Twig\TwigFunction;

/**
 * Funzioni Twig applicative.
 * current_company(): l'agenzia (Company) selezionata in sessione, per mostrarla
 * nel menu laterale del notaio (stile "azienda attiva" di venanzieffe).
 */
class AppExtension extends AbstractExtension
{
    public function __construct(private readonly CompanyService $companyService)
    {
    }

    public function getFunctions(): array
    {
        return [
            new TwigFunction('current_company', $this->currentCompany(...)),
        ];
    }

    public function currentCompany(): ?Company
    {
        return $this->companyService->getCurrentCompany();
    }
}
