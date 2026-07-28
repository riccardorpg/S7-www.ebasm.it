<?php

namespace App\Entity\Master;

use App\Entity\Trait\ActiveTrait;
use App\Entity\Trait\IdTrait;
use App\Entity\Trait\TimestampsTrait;
use App\Repository\Master\CompanyRepository;
use Doctrine\ORM\Mapping as ORM;

/**
 * Cliente (= agenzia/studio) sul DB master.
 * $dbName è il database slave dedicato, verso cui DynamicConnection ri-punta la
 * connessione 'slave' a runtime.
 */
#[ORM\Entity(repositoryClass: CompanyRepository::class)]
#[ORM\Table(name: 'eb_m_company')]
#[ORM\HasLifecycleCallbacks]
class Company
{
    use IdTrait;
    use ActiveTrait;
    use TimestampsTrait;

    public const TYPE_COMPANY = 'aziendale';
    public const TYPE_PROFESSIONAL = 'professionista';

    public const LICENSE_DEMO = 'demo';
    public const LICENSE_BASE = 'base';
    public const LICENSE_PRO = 'pro';
    public const LICENSE_ENTERPRISE = 'enterprise';

    #[ORM\Column(type: 'string', length: 64, unique: true)]
    private ?string $code = null;

    /** Ragione sociale oppure Nome e cognome (7.1.4). */
    #[ORM\Column(type: 'string', length: 191)]
    private ?string $name = null;

    #[ORM\Column(name: 'db_name', type: 'string', length: 191, unique: true)]
    private ?string $dbName = null;

    /** 7.1.3 Tipo cliente. */
    #[ORM\Column(type: 'string', length: 20, options: ['default' => self::TYPE_COMPANY])]
    private string $clientType = self::TYPE_COMPANY;

    // --- 7.1.9.1 Dati fiscali studio ---
    #[ORM\Column(name: 'vat_number', type: 'string', length: 16, nullable: true)]
    private ?string $vatNumber = null;

    #[ORM\Column(name: 'tax_code', type: 'string', length: 32, nullable: true)]
    private ?string $taxCode = null;

    #[ORM\Column(type: 'string', length: 191, nullable: true)]
    private ?string $address = null;

    #[ORM\Column(type: 'string', length: 16, nullable: true)]
    private ?string $civic = null;

    // Città e CAP normalizzati (FK verso il sottosistema geo Master).
    #[ORM\ManyToOne(targetEntity: City::class)]
    #[ORM\JoinColumn(name: 'city_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?City $city = null;

    #[ORM\ManyToOne(targetEntity: Zip::class)]
    #[ORM\JoinColumn(name: 'zip_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?Zip $zip = null;

    #[ORM\Column(type: 'string', length: 7, nullable: true)]
    private ?string $sdi = null;

    #[ORM\Column(type: 'string', length: 191, nullable: true)]
    private ?string $pec = null;

    // --- 7.1.7 / 7.1.2 Licenza ---
    #[ORM\Column(name: 'license_type', type: 'string', length: 20, options: ['default' => self::LICENSE_DEMO])]
    private string $licenseType = self::LICENSE_DEMO;

    #[ORM\Column(name: 'license_expires_at', type: 'date_immutable', nullable: true)]
    private ?\DateTimeImmutable $licenseExpiresAt = null;

    // --- 7.1.8 Spazio (quota in MB; occupato calcolato a runtime da information_schema) ---
    #[ORM\Column(name: 'storage_quota_mb', type: 'integer', options: ['default' => 5120])]
    private int $storageQuotaMb = 5120;

    // --- 7.1.9.7 Contratto termini e condizioni ---
    #[ORM\Column(name: 'terms_accepted_at', type: 'datetime_immutable', nullable: true)]
    private ?\DateTimeImmutable $termsAcceptedAt = null;

    public function getCode(): ?string
    {
        return $this->code;
    }

    public function setCode(?string $code): static
    {
        $this->code = $code;

        return $this;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(?string $name): static
    {
        $this->name = $name;

        return $this;
    }

    public function getDbName(): ?string
    {
        return $this->dbName;
    }

    public function setDbName(?string $dbName): static
    {
        $this->dbName = $dbName;

        return $this;
    }

    public function getClientType(): string
    {
        return $this->clientType;
    }

    public function setClientType(string $clientType): static
    {
        $this->clientType = $clientType;

        return $this;
    }

    public function getClientTypeLabel(): string
    {
        return $this->clientType === self::TYPE_PROFESSIONAL ? 'Privato' : 'Azienda';
    }

    public function getVatNumber(): ?string
    {
        return $this->vatNumber;
    }

    public function setVatNumber(?string $vatNumber): static
    {
        $this->vatNumber = $vatNumber;

        return $this;
    }

    public function getTaxCode(): ?string
    {
        return $this->taxCode;
    }

    public function setTaxCode(?string $taxCode): static
    {
        $this->taxCode = $taxCode;

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

    public function getCity(): ?City
    {
        return $this->city;
    }

    public function setCity(?City $city): static
    {
        $this->city = $city;

        return $this;
    }

    public function getZip(): ?Zip
    {
        return $this->zip;
    }

    public function setZip(?Zip $zip): static
    {
        $this->zip = $zip;

        return $this;
    }

    /** Provincia derivata dalla città (come DualMoto). */
    public function getProvince(): ?Province
    {
        return $this->city?->getProvince();
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

    public function getLicenseType(): string
    {
        return $this->licenseType;
    }

    public function setLicenseType(string $licenseType): static
    {
        $this->licenseType = $licenseType;

        return $this;
    }

    public function getLicenseTypeLabel(): string
    {
        return match ($this->licenseType) {
            self::LICENSE_BASE => 'Base',
            self::LICENSE_PRO => 'Pro',
            self::LICENSE_ENTERPRISE => 'Enterprise',
            default => 'Demo',
        };
    }

    public function getLicenseExpiresAt(): ?\DateTimeImmutable
    {
        return $this->licenseExpiresAt;
    }

    public function setLicenseExpiresAt(?\DateTimeImmutable $licenseExpiresAt): static
    {
        $this->licenseExpiresAt = $licenseExpiresAt;

        return $this;
    }

    public function getStorageQuotaMb(): int
    {
        return $this->storageQuotaMb;
    }

    public function setStorageQuotaMb(int $storageQuotaMb): static
    {
        $this->storageQuotaMb = $storageQuotaMb;

        return $this;
    }

    public function getTermsAcceptedAt(): ?\DateTimeImmutable
    {
        return $this->termsAcceptedAt;
    }

    public function setTermsAcceptedAt(?\DateTimeImmutable $termsAcceptedAt): static
    {
        $this->termsAcceptedAt = $termsAcceptedAt;

        return $this;
    }

    public function isTermsAccepted(): bool
    {
        return $this->termsAcceptedAt !== null;
    }

    public function isDemo(): bool
    {
        return $this->licenseType === self::LICENSE_DEMO;
    }

    /** Giorni residui alla scadenza licenza (null se senza scadenza, negativo se scaduta). */
    public function getDaysToExpiry(?\DateTimeImmutable $now = null): ?int
    {
        if ($this->licenseExpiresAt === null) {
            return null;
        }
        $now ??= new \DateTimeImmutable('today');

        return (int) $now->diff($this->licenseExpiresAt)->format('%r%a');
    }

    /** 7.1.1 Stato cliente derivato. */
    public function getStatusLabel(?\DateTimeImmutable $now = null): string
    {
        if (!$this->isActive()) {
            return 'Sospeso';
        }
        $days = $this->getDaysToExpiry($now);
        if ($days !== null && $days < 0) {
            return 'Scaduto';
        }
        if ($this->isDemo()) {
            return 'Demo';
        }

        return 'Attivo';
    }

    /**
     * Un cliente è eliminabile solo se sospeso (non attivo): va prima disattivato.
     * Evita la cancellazione accidentale di clienti operativi (con DB e dati).
     */
    public function canDelete(): bool
    {
        return !$this->isActive();
    }

    public function __toString(): string
    {
        return (string) $this->name;
    }
}
