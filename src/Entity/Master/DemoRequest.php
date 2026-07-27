<?php

namespace App\Entity\Master;

use App\Entity\Trait\IdTrait;
use App\Entity\Trait\TimestampsTrait;
use App\Repository\Master\DemoRequestRepository;
use Doctrine\ORM\Mapping as ORM;

/**
 * Richiesta demo inviata dal form pubblico "Richiedi la demo per 30 giorni".
 * Le richieste non ancora evase (processed=false) sono gli allarmi "Nuove richieste in
 * arrivo" della scrivania admin (6.1.1).
 */
#[ORM\Entity(repositoryClass: DemoRequestRepository::class)]
#[ORM\Table(name: 'eb_m_demo_request')]
#[ORM\HasLifecycleCallbacks]
class DemoRequest
{
    use IdTrait;
    use TimestampsTrait;

    #[ORM\Column(name: 'account_type', type: 'string', length: 20)]
    private string $accountType = Company::TYPE_COMPANY;

    #[ORM\Column(type: 'string', length: 191)]
    private ?string $email = null;

    /** Ragione sociale oppure nome e cognome. */
    #[ORM\Column(name: 'business_name', type: 'string', length: 191, nullable: true)]
    private ?string $businessName = null;

    #[ORM\Column(type: 'string', length: 191, nullable: true)]
    private ?string $address = null;

    #[ORM\Column(type: 'string', length: 16, nullable: true)]
    private ?string $civic = null;

    #[ORM\Column(type: 'string', length: 128, nullable: true)]
    private ?string $city = null;

    #[ORM\Column(type: 'string', length: 5, nullable: true)]
    private ?string $zip = null;

    #[ORM\Column(type: 'string', length: 7, nullable: true)]
    private ?string $sdi = null;

    #[ORM\Column(type: 'string', length: 191, nullable: true)]
    private ?string $pec = null;

    #[ORM\Column(type: 'boolean', options: ['default' => false])]
    private bool $processed = false;

    public function getAccountType(): string
    {
        return $this->accountType;
    }

    public function setAccountType(string $accountType): static
    {
        $this->accountType = $accountType;

        return $this;
    }

    public function getAccountTypeLabel(): string
    {
        return $this->accountType === Company::TYPE_PROFESSIONAL ? 'Professionista' : 'Aziendale';
    }

    public function getEmail(): ?string
    {
        return $this->email;
    }

    public function setEmail(?string $email): static
    {
        $this->email = $email;

        return $this;
    }

    public function getBusinessName(): ?string
    {
        return $this->businessName;
    }

    public function setBusinessName(?string $businessName): static
    {
        $this->businessName = $businessName;

        return $this;
    }

    public function getAddress(): ?string
    {
        return $this->address;
    }

    public function setAddress(?string $address): static
    {
        $this->address = $address;

        return $this;
    }

    public function getCivic(): ?string
    {
        return $this->civic;
    }

    public function setCivic(?string $civic): static
    {
        $this->civic = $civic;

        return $this;
    }

    public function getCity(): ?string
    {
        return $this->city;
    }

    public function setCity(?string $city): static
    {
        $this->city = $city;

        return $this;
    }

    public function getZip(): ?string
    {
        return $this->zip;
    }

    public function setZip(?string $zip): static
    {
        $this->zip = $zip;

        return $this;
    }

    public function getSdi(): ?string
    {
        return $this->sdi;
    }

    public function setSdi(?string $sdi): static
    {
        $this->sdi = $sdi;

        return $this;
    }

    public function getPec(): ?string
    {
        return $this->pec;
    }

    public function setPec(?string $pec): static
    {
        $this->pec = $pec;

        return $this;
    }

    public function isProcessed(): bool
    {
        return $this->processed;
    }

    public function setProcessed(bool $processed): static
    {
        $this->processed = $processed;

        return $this;
    }
}
